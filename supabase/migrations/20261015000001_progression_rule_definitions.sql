create table if not exists public.progression_rule_definitions (
  rule_key text primary key,
  stage_key text not null check (stage_key in (
    'new_lead', 'engaged', 'conversation', 'appointment', 'show', 'sold'
  )),
  version integer not null check (version > 0),
  label text not null,
  description text not null,
  qualification_basis text not null check (qualification_basis in (
    'source_record', 'observed_event', 'source_outcome'
  )),
  definition jsonb not null default '{}'::jsonb check (jsonb_typeof(definition) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_key, version)
);

create index if not exists progression_rule_definitions_active_stage_idx
  on public.progression_rule_definitions (stage_key, is_active);

insert into public.progression_rule_definitions
  (rule_key, stage_key, version, label, description, qualification_basis, definition)
values
  ('lead-created-v1', 'new_lead', 1, 'Lead created', 'Canonical lead has a valid creation timestamp.', 'source_record', '{"source":"leads.creation_time"}'::jsonb),
  ('customer-response-v1', 'engaged', 1, 'Customer engagement', 'Qualifying inbound customer communication or observed connected call.', 'observed_event', '{"event":"inbound_customer_communication_or_connected_call"}'::jsonb),
  ('two-way-interaction-v1', 'conversation', 1, 'Conversation', 'Observed customer reply or connected phone interaction; this rule does not infer intent from outbound attempts.', 'observed_event', '{"event":"inbound_customer_communication_or_connected_call"}'::jsonb),
  ('appointment-created-v1', 'appointment', 1, 'Appointment recorded', 'Timeline evidence records a qualifying appointment creation.', 'observed_event', '{"event":"appointment_created_not_deleted"}'::jsonb),
  ('show-attendance-v1', 'show', 1, 'Show attendance', 'Timeline evidence explicitly supports attendance or arrival.', 'observed_event', '{"event":"explicit_show_or_arrival"}'::jsonb),
  ('sale-outcome-v1', 'sold', 1, 'Sale outcome', 'A sold date or explicit sale outcome is present in the canonical lead/source evidence.', 'source_outcome', '{"source":"lead.sold_date_or_explicit_sale_event"}'::jsonb)
on conflict (rule_key) do update set
  stage_key = excluded.stage_key,
  version = excluded.version,
  label = excluded.label,
  description = excluded.description,
  qualification_basis = excluded.qualification_basis,
  definition = excluded.definition,
  updated_at = now();

alter table public.progression_rule_definitions enable row level security;
revoke all on public.progression_rule_definitions from anon, authenticated;
grant select, insert, update, delete on public.progression_rule_definitions to service_role;

create index if not exists leads_creation_time_progression_idx
  on public.leads (creation_time);
create index if not exists timeline_records_lead_id_progression_idx
  on public.timeline_records (lead_id);
create index if not exists timeline_events_record_time_progression_idx
  on public.timeline_events (timeline_record_id, occurred_at, id);
