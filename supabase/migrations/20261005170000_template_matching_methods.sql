alter table public.templates
  add column if not exists description text not null default '',
  add column if not exists subject text,
  add column if not exists external_template_key text,
  add column if not exists source_path text,
  add column if not exists source_kind text,
  add column if not exists normalized_content text not null default '',
  add column if not exists normalized_subject text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists templates_external_template_key_unique
  on public.templates (lower(trim(external_template_key)))
  where external_template_key is not null
    and length(trim(external_template_key)) > 0;

create unique index if not exists templates_source_path_unique
  on public.templates (source_path)
  where source_path is not null;

create index if not exists templates_source_kind_idx
  on public.templates(source_kind);

create index if not exists templates_active_idx
  on public.templates(is_active);

alter table public.templates
  drop constraint if exists templates_name_length;

alter table public.templates
  add constraint templates_name_length
  check (char_length(trim(name)) between 1 and 160);

alter table public.templates
  drop constraint if exists templates_description_length;

alter table public.templates
  add constraint templates_description_length
  check (char_length(description) <= 1000);

alter table public.templates
  drop constraint if exists templates_content_length;

alter table public.templates
  add constraint templates_content_length
  check (char_length(content) <= 100000);

alter table public.templates
  drop constraint if exists templates_subject_length;

alter table public.templates
  add constraint templates_subject_length
  check (
    subject is null
    or char_length(subject) <= 1000
  );

grant select, insert, update, delete
  on public.templates
  to authenticated;

drop policy if exists "authenticated users can read templates"
  on public.templates;

drop policy if exists "authenticated users can insert templates"
  on public.templates;

drop policy if exists "authenticated users can update templates"
  on public.templates;

drop policy if exists "authenticated users can delete templates"
  on public.templates;

create policy "authenticated users can read templates"
  on public.templates
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert templates"
  on public.templates
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can update templates"
  on public.templates
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete templates"
  on public.templates
  for delete
  to authenticated
  using (true);


create table if not exists public.timeline_event_template_matches (
  timeline_event_id uuid primary key
    references public.timeline_events(id)
    on delete cascade,

  template_id uuid
    references public.templates(id)
    on delete set null,

  match_status text not null
    check (match_status in ('matched', 'review', 'unmatched')),

  match_score numeric(6,5)
    check (
      match_score is null
      or (match_score >= 0 and match_score <= 1)
    ),

  runner_up_score numeric(6,5)
    check (
      runner_up_score is null
      or (runner_up_score >= 0 and runner_up_score <= 1)
    ),

  match_method text not null,

  matched_fragment text,

  evidence jsonb not null default '{}'::jsonb,

  matcher_version text not null,

  matched_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists timeline_event_template_matches_template_idx
  on public.timeline_event_template_matches(template_id);

create index if not exists timeline_event_template_matches_status_idx
  on public.timeline_event_template_matches(match_status);

create index if not exists timeline_event_template_matches_score_idx
  on public.timeline_event_template_matches(match_score desc);

alter table public.timeline_event_template_matches enable row level security;

grant select, insert, update, delete
  on public.timeline_event_template_matches
  to authenticated;

drop policy if exists "authenticated users can read template matches"
  on public.timeline_event_template_matches;

drop policy if exists "authenticated users can insert template matches"
  on public.timeline_event_template_matches;

drop policy if exists "authenticated users can update template matches"
  on public.timeline_event_template_matches;

drop policy if exists "authenticated users can delete template matches"
  on public.timeline_event_template_matches;

create policy "authenticated users can read template matches"
  on public.timeline_event_template_matches
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert template matches"
  on public.timeline_event_template_matches
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can update template matches"
  on public.timeline_event_template_matches
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete template matches"
  on public.timeline_event_template_matches
  for delete
  to authenticated
  using (true);


create table if not exists public.method_runs (
  id uuid primary key default gen_random_uuid(),

  method_key text not null,

  status text not null
    check (status in ('running', 'completed', 'failed')),

  started_at timestamptz not null default now(),

  completed_at timestamptz,

  result jsonb not null default '{}'::jsonb,

  error_message text
);

create index if not exists method_runs_method_key_idx
  on public.method_runs(method_key, started_at desc);

alter table public.method_runs enable row level security;

grant select, insert, update
  on public.method_runs
  to authenticated;

drop policy if exists "authenticated users can read method runs"
  on public.method_runs;

drop policy if exists "authenticated users can insert method runs"
  on public.method_runs;

drop policy if exists "authenticated users can update method runs"
  on public.method_runs;

create policy "authenticated users can read method runs"
  on public.method_runs
  for select
  to authenticated
  using (true);

create policy "authenticated users can insert method runs"
  on public.method_runs
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can update method runs"
  on public.method_runs
  for update
  to authenticated
  using (true)
  with check (true);
