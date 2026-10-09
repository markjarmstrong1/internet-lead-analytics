-- Make timeline-event inserts resilient to an event already persisted.
create or replace function public.apply_tekion_import_batch(
  p_import_id uuid,
  lead_rows jsonb,
  source_record_rows jsonb,
  timeline_record_operations jsonb,
  timeline_event_operations jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  item jsonb;
  incoming jsonb;
  existing jsonb;
  operation_status text;
  record_identity text;
  persisted_record_id uuid;
  event_record_id uuid;
  resolved_lead_id uuid;
begin
  if p_import_id is null then
    raise exception 'Tekion import id is required.';
  end if;

  if not exists (
    select 1
    from public.source_imports
    where id = p_import_id
  ) then
    raise exception 'Tekion import % does not exist.', p_import_id;
  end if;

  /*
   * Canonical leads.
   *
   * The unique identity is the authoritative Tekion identity:
   * source_system + source_type + external_record_id.
   */
  for item in
    select value
    from jsonb_array_elements(
      coalesce(lead_rows, '[]'::jsonb)
    )
  loop
    if nullif(trim(item ->> 'external_record_id'), '') is null then
      raise exception 'Lead row is missing external_record_id.';
    end if;

    insert into public.leads (
      source_system,
      source_type,
      external_record_id,
      contact_name,
      creation_time,
      source,
      vehicle_interest,
      source_type_detailed,
      lead_source_group,
      email,
      mobile_phone,
      home_phone,
      work_phone,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      status,
      stage,
      department,
      dealership,
      deal_status,
      sold_date,
      closed_time,
      raw_data
    )
    values (
      coalesce(item ->> 'source_system', 'tekion'),
      coalesce(item ->> 'source_type', 'lead'),
      trim(item ->> 'external_record_id'),
      coalesce(item ->> 'contact_name', ''),
      nullif(item ->> 'creation_time', '')::timestamptz,
      coalesce(item ->> 'source', ''),
      coalesce(item ->> 'vehicle_interest', ''),
      coalesce(item ->> 'source_type_detailed', ''),
      coalesce(item ->> 'lead_source_group', ''),
      coalesce(item ->> 'email', ''),
      coalesce(item ->> 'mobile_phone', ''),
      coalesce(item ->> 'home_phone', ''),
      coalesce(item ->> 'work_phone', ''),
      coalesce(item ->> 'vehicle_year', ''),
      coalesce(item ->> 'vehicle_make', ''),
      coalesce(item ->> 'vehicle_model', ''),
      coalesce(item ->> 'status', ''),
      coalesce(item ->> 'stage', ''),
      coalesce(item ->> 'department', ''),
      coalesce(item ->> 'dealership', ''),
      coalesce(item ->> 'deal_status', ''),
      nullif(item ->> 'sold_date', '')::timestamptz,
      nullif(item ->> 'closed_time', '')::timestamptz,
      coalesce(item -> 'raw_data', '{}'::jsonb)
    )
    on conflict (
      source_system,
      source_type,
      external_record_id
    )
    do update set
      contact_name = excluded.contact_name,
      creation_time = excluded.creation_time,
      source = excluded.source,
      vehicle_interest = excluded.vehicle_interest,
      source_type_detailed = excluded.source_type_detailed,
      lead_source_group = excluded.lead_source_group,
      email = excluded.email,
      mobile_phone = excluded.mobile_phone,
      home_phone = excluded.home_phone,
      work_phone = excluded.work_phone,
      vehicle_year = excluded.vehicle_year,
      vehicle_make = excluded.vehicle_make,
      vehicle_model = excluded.vehicle_model,
      status = excluded.status,
      stage = excluded.stage,
      department = excluded.department,
      dealership = excluded.dealership,
      deal_status = excluded.deal_status,
      sold_date = excluded.sold_date,
      closed_time = excluded.closed_time,
      raw_data = excluded.raw_data,
      updated_at = now();
  end loop;

  /*
   * Raw source observations.
   *
   * Tasks intentionally land here first. A task is workflow evidence,
   * not proof that an actual communication occurred.
   */
  for item in
    select value
    from jsonb_array_elements(
      coalesce(source_record_rows, '[]'::jsonb)
    )
  loop
    if nullif(trim(item ->> 'source_record_id'), '') is null then
      raise exception 'Source record is missing source_record_id.';
    end if;

    insert into public.source_records (
      import_id,
      source_system,
      source_type,
      source_record_id,
      raw_data,
      processed_at
    )
    values (
      p_import_id,
      coalesce(item ->> 'source_system', 'tekion'),
      coalesce(item ->> 'source_type', 'unknown'),
      trim(item ->> 'source_record_id'),
      coalesce(item -> 'raw_data', '{}'::jsonb),
      now()
    )
    on conflict (
      import_id,
      source_system,
      source_type,
      source_record_id
    )
    do update set
      raw_data = excluded.raw_data,
      processed_at = now(),
      updated_at = now();
  end loop;

  /*
   * Timeline records/events.
   */
  create temporary table tmp_tekion_import_records (
    identity text primary key,
    record_id uuid not null
  ) on commit drop;

  for item in
    select value
    from jsonb_array_elements(
      coalesce(timeline_record_operations, '[]'::jsonb)
    )
  loop
    operation_status := item ->> 'status';
    persisted_record_id := null;

    if operation_status = 'invalid' then
      continue;
    end if;

    incoming := item -> 'incoming';

    record_identity :=
      case
        when nullif(trim(incoming ->> 'external_record_id'), '') is not null
          then concat(
            incoming ->> 'source_system',
            ':',
            incoming ->> 'source_type',
            ':external:',
            trim(incoming ->> 'external_record_id')
          )
        when nullif(trim(incoming ->> 'fixture_source_key'), '') is not null
          then concat(
            incoming ->> 'source_system',
            ':',
            incoming ->> 'source_type',
            ':fixture:',
            trim(incoming ->> 'fixture_source_key')
          )
        else null
      end;

    if record_identity is null then
      raise exception 'Timeline record has no persistence identity.';
    end if;

    /*
     * Resolve the transient external lead identity after lead_rows
     * have been upserted. Never infer a link from the filename here.
     */
    resolved_lead_id := null;

    if nullif(trim(incoming ->> 'resolved_lead_external_record_id'), '') is not null then
      select l.id
      into resolved_lead_id
      from public.leads l
      where l.source_system =
        coalesce(nullif(trim(incoming ->> 'source_system'), ''), 'tekion')
        and l.source_type = 'lead'
        and l.external_record_id =
          trim(incoming ->> 'resolved_lead_external_record_id')
      limit 1;
    end if;

    if operation_status = 'new' then

      insert into public.timeline_records (
        source_system,
        source_type,
        external_record_id,
        fixture_source_key,
        source_file,
        import_id,
        raw_data,
        lead_id
      )
      values (
        incoming ->> 'source_system',
        incoming ->> 'source_type',
        nullif(trim(incoming ->> 'external_record_id'), ''),
        nullif(trim(incoming ->> 'fixture_source_key'), ''),
        incoming ->> 'source_file',
        p_import_id,
        coalesce(incoming -> 'raw_data', '{}'::jsonb),
        coalesce(nullif(incoming ->> 'lead_id', '')::uuid, resolved_lead_id)
      )
      returning id into persisted_record_id;

    elsif operation_status = 'updated' then

      existing := item -> 'existing';

      if existing is null or existing ->> 'id' is null then
        raise exception
          'Updated timeline record is missing its existing id.';
      end if;

      update public.timeline_records
      set
        source_system = incoming ->> 'source_system',
        source_type = incoming ->> 'source_type',
        external_record_id =
          nullif(trim(incoming ->> 'external_record_id'), ''),
        fixture_source_key =
          nullif(trim(incoming ->> 'fixture_source_key'), ''),
        source_file = incoming ->> 'source_file',
        import_id = p_import_id,
        raw_data =
          coalesce(incoming -> 'raw_data', '{}'::jsonb),

        /*
         * Do not erase an existing authoritative relationship merely
         * because a later source observation lacks the ID.
         */
        lead_id =
          coalesce(
            nullif(incoming ->> 'lead_id', '')::uuid,
            public.timeline_records.lead_id,
            resolved_lead_id
          )

      where id = (existing ->> 'id')::uuid
      returning id into persisted_record_id;

      if persisted_record_id is null then
        raise exception
          'Updated timeline record % does not exist.',
          existing ->> 'id';
      end if;

    elsif operation_status = 'unchanged' then

      existing := item -> 'existing';

      if existing is null or existing ->> 'id' is null then
        raise exception
          'Unchanged timeline record is missing its existing id.';
      end if;

      persisted_record_id := (existing ->> 'id')::uuid;

      if not exists (
        select 1
        from public.timeline_records
        where id = persisted_record_id
      ) then
        raise exception
          'Unchanged timeline record % does not exist.',
          existing ->> 'id';
      end if;

      if resolved_lead_id is not null then
        update public.timeline_records
        set lead_id = coalesce(lead_id, resolved_lead_id)
        where id = persisted_record_id;
      end if;

    else
      raise exception
        'Unsupported timeline record operation status: %',
        operation_status;
    end if;

    insert into tmp_tekion_import_records (
      identity,
      record_id
    )
    values (
      record_identity,
      persisted_record_id
    )
    on conflict (identity)
    do update set
      record_id = excluded.record_id;
  end loop;

  for item in
    select value
    from jsonb_array_elements(
      coalesce(timeline_event_operations, '[]'::jsonb)
    )
  loop
    operation_status := item ->> 'status';

    if operation_status = 'invalid'
       or operation_status = 'unchanged' then
      continue;
    end if;

    if item ->> 'recordIdentity' is null then
      raise exception
        'Timeline event is missing its record identity.';
    end if;

    select record_id
    into event_record_id
    from tmp_tekion_import_records
    where identity = item ->> 'recordIdentity';

    if event_record_id is null then
      raise exception
        'Timeline event references a record that was not persisted.';
    end if;

    incoming := item -> 'incoming';

    if operation_status = 'new' then

      insert into public.timeline_events (
        timeline_record_id,
        source_event_id,
        source_file,
        occurred_at,
        raw_type,
        actor,
        actor_type,
        category,
        channel,
        direction,
        details,
        metadata,
        raw_data
      )
      values (
        event_record_id,
        incoming ->> 'source_event_id',
        incoming ->> 'source_file',
        (incoming ->> 'occurred_at')::timestamptz,
        incoming ->> 'raw_type',
        coalesce(incoming ->> 'actor', ''),
        coalesce(incoming ->> 'actor_type', 'unknown'),
        coalesce(incoming ->> 'category', 'other'),
        nullif(incoming ->> 'channel', ''),
        nullif(incoming ->> 'direction', ''),
        coalesce(incoming ->> 'details', ''),
        coalesce(incoming -> 'metadata', '{}'::jsonb),
        coalesce(incoming -> 'raw_data', '{}'::jsonb)
      )
      on conflict (timeline_record_id, source_event_id)
      do update set
        source_file = excluded.source_file,
        occurred_at = excluded.occurred_at,
        raw_type = excluded.raw_type,
        actor = excluded.actor,
        actor_type = excluded.actor_type,
        category = excluded.category,
        channel = excluded.channel,
        direction = excluded.direction,
        details = excluded.details,
        metadata = excluded.metadata,
        raw_data = excluded.raw_data;

    elsif operation_status = 'updated' then

      existing := item -> 'existing';

      if existing is null or existing ->> 'id' is null then
        raise exception
          'Updated timeline event is missing its existing id.';
      end if;

      update public.timeline_events
      set
        timeline_record_id = event_record_id,
        source_event_id = incoming ->> 'source_event_id',
        source_file = incoming ->> 'source_file',
        occurred_at = (incoming ->> 'occurred_at')::timestamptz,
        raw_type = incoming ->> 'raw_type',
        actor = coalesce(incoming ->> 'actor', ''),
        actor_type = coalesce(incoming ->> 'actor_type', 'unknown'),
        category = coalesce(incoming ->> 'category', 'other'),
        channel = nullif(incoming ->> 'channel', ''),
        direction = nullif(incoming ->> 'direction', ''),
        details = coalesce(incoming ->> 'details', ''),
        metadata = coalesce(incoming -> 'metadata', '{}'::jsonb),
        raw_data = coalesce(incoming -> 'raw_data', '{}'::jsonb)
      where id = (existing ->> 'id')::uuid;

      if not found then
        raise exception
          'Updated timeline event % does not exist.',
          existing ->> 'id';
      end if;

    else
      raise exception
        'Unsupported timeline event operation status: %',
        operation_status;
    end if;
  end loop;

  update public.source_imports
  set
    status = 'completed',
    error_message = null,
    updated_at = now()
  where id = p_import_id;
end;
$$;
