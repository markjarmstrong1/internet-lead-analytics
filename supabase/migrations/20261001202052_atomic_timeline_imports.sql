create or replace function public.apply_timeline_import(
  import_id uuid,
  record_operations jsonb,
  event_operations jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  operation jsonb;
  incoming jsonb;
  existing jsonb;
  operation_status text;
  record_identity text;
  persisted_record_id uuid;
  event_record_id uuid;
begin
  if import_id is null then
    raise exception 'Timeline import id is required.';
  end if;

  if not exists (
    select 1
    from public.source_imports
    where id = apply_timeline_import.import_id
  ) then
    raise exception 'Timeline import % does not exist.', import_id;
  end if;

  create temporary table tmp_timeline_import_records (
    identity text primary key,
    record_id uuid not null
  ) on commit drop;

  for operation in
    select value
    from jsonb_array_elements(
      coalesce(record_operations, '[]'::jsonb)
    )
  loop
    operation_status := operation ->> 'status';
    persisted_record_id := null;

    if operation_status = 'invalid' then
      continue;
    end if;

    incoming := operation -> 'incoming';

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

    if operation_status = 'new' then
      insert into public.timeline_records (
        source_system,
        source_type,
        external_record_id,
        fixture_source_key,
        source_file,
        import_id,
        raw_data
      )
      values (
        incoming ->> 'source_system',
        incoming ->> 'source_type',
        nullif(incoming ->> 'external_record_id', ''),
        nullif(incoming ->> 'fixture_source_key', ''),
        incoming ->> 'source_file',
        apply_timeline_import.import_id,
        coalesce(incoming -> 'raw_data', '{}'::jsonb)
      )
      returning id into persisted_record_id;

    elsif operation_status = 'updated' then
      existing := operation -> 'existing';

      if existing is null or existing ->> 'id' is null then
        raise exception
          'Updated timeline record is missing its existing id.';
      end if;

      update public.timeline_records
      set
        source_system = incoming ->> 'source_system',
        source_type = incoming ->> 'source_type',
        external_record_id =
          nullif(incoming ->> 'external_record_id', ''),
        fixture_source_key =
          nullif(incoming ->> 'fixture_source_key', ''),
        source_file = incoming ->> 'source_file',
        import_id = apply_timeline_import.import_id,
        raw_data =
          coalesce(incoming -> 'raw_data', '{}'::jsonb)
      where id = (existing ->> 'id')::uuid
      returning id into persisted_record_id;

      if persisted_record_id is null then
        raise exception
          'Updated timeline record % does not exist.',
          existing ->> 'id';
      end if;

    elsif operation_status = 'unchanged' then
      existing := operation -> 'existing';

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

    else
      raise exception
        'Unsupported timeline record operation status: %',
        operation_status;
    end if;

    insert into tmp_timeline_import_records (
      identity,
      record_id
    )
    values (
      record_identity,
      persisted_record_id
    )
    on conflict (identity)
    do update set record_id = excluded.record_id;
  end loop;

  for operation in
    select value
    from jsonb_array_elements(
      coalesce(event_operations, '[]'::jsonb)
    )
  loop
    operation_status := operation ->> 'status';

    if operation_status = 'invalid'
       or operation_status = 'unchanged' then
      continue;
    end if;

    if operation ->> 'recordIdentity' is null then
      raise exception
        'Timeline event is missing its record identity.';
    end if;

    select record_id
    into event_record_id
    from tmp_timeline_import_records
    where identity = operation ->> 'recordIdentity';

    if event_record_id is null then
      raise exception
        'Timeline event references a record that was not persisted.';
    end if;

    incoming := operation -> 'incoming';

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
      );

    elsif operation_status = 'updated' then
      existing := operation -> 'existing';

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
  where id = apply_timeline_import.import_id;
end;
$$;

grant execute on function public.apply_timeline_import(
  uuid,
  jsonb,
  jsonb
) to authenticated;

grant execute on function public.apply_timeline_import(
  uuid,
  jsonb,
  jsonb
) to service_role;
