create table if not exists public.timeline_records (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_type text not null default 'timeline',
  external_record_id text,
  fixture_source_key text,
  source_file text,
  import_id uuid references public.source_imports(id),
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timeline_records_identity_check
    check (
      external_record_id is not null
      or fixture_source_key is not null
    )
);

create unique index if not exists timeline_records_external_identity_idx
  on public.timeline_records (
    source_system,
    source_type,
    external_record_id
  )
  where external_record_id is not null;

create unique index if not exists timeline_records_fixture_identity_idx
  on public.timeline_records (
    source_system,
    source_type,
    fixture_source_key
  )
  where fixture_source_key is not null;

create index if not exists timeline_records_import_id_idx
  on public.timeline_records(import_id);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  timeline_record_id uuid not null
    references public.timeline_records(id)
    on delete cascade,
  source_event_id text not null,
  source_file text,
  occurred_at timestamptz not null,
  raw_type text not null,
  actor text not null default '',
  actor_type text not null default 'unknown',
  category text not null default 'other',
  channel text,
  direction text,
  details text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timeline_events_identity_unique
    unique (timeline_record_id, source_event_id)
);

create index if not exists timeline_events_record_id_idx
  on public.timeline_events(timeline_record_id);

create index if not exists timeline_events_occurred_at_idx
  on public.timeline_events(occurred_at);

create index if not exists timeline_events_source_event_id_idx
  on public.timeline_events(source_event_id);

alter table public.timeline_records enable row level security;
alter table public.timeline_events enable row level security;

create policy "authenticated users can insert timeline records"
  on public.timeline_records
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can read timeline records"
  on public.timeline_records
  for select
  to authenticated
  using (true);

create policy "authenticated users can update timeline records"
  on public.timeline_records
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete timeline records"
  on public.timeline_records
  for delete
  to authenticated
  using (true);

create policy "authenticated users can insert timeline events"
  on public.timeline_events
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can read timeline events"
  on public.timeline_events
  for select
  to authenticated
  using (true);

create policy "authenticated users can update timeline events"
  on public.timeline_events
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete timeline events"
  on public.timeline_events
  for delete
  to authenticated
  using (true);

create or replace function public.set_timeline_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists timeline_records_set_updated_at
  on public.timeline_records;

create trigger timeline_records_set_updated_at
before update on public.timeline_records
for each row
execute function public.set_timeline_updated_at();

drop trigger if exists timeline_events_set_updated_at
  on public.timeline_events;

create trigger timeline_events_set_updated_at
before update on public.timeline_events
for each row
execute function public.set_timeline_updated_at();
