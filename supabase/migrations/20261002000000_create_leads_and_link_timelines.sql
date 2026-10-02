create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_type text not null default 'lead',
  external_record_id text not null,
  contact_name text not null default '',
  creation_time timestamptz,
  source text not null default '',
  vehicle_interest text not null default '',
  source_type_detailed text not null default '',
  lead_source_group text not null default '',
  email text not null default '',
  mobile_phone text not null default '',
  home_phone text not null default '',
  work_phone text not null default '',
  vehicle_year text not null default '',
  vehicle_make text not null default '',
  vehicle_model text not null default '',
  status text not null default '',
  stage text not null default '',
  department text not null default '',
  dealership text not null default '',
  deal_status text not null default '',
  sold_date timestamptz,
  closed_time timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leads_external_identity_unique
    unique (source_system, source_type, external_record_id)
);

create index if not exists leads_contact_name_idx
  on public.leads(contact_name);

create index if not exists leads_status_idx
  on public.leads(status);

create index if not exists leads_stage_idx
  on public.leads(stage);

alter table public.timeline_records
  add column if not exists lead_id uuid
    references public.leads(id)
    on delete set null;

create index if not exists timeline_records_lead_id_idx
  on public.timeline_records(lead_id);

alter table public.leads enable row level security;

create policy "authenticated users can insert leads"
  on public.leads
  for insert
  to authenticated
  with check (true);

create policy "authenticated users can read leads"
  on public.leads
  for select
  to authenticated
  using (true);

create policy "authenticated users can update leads"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete leads"
  on public.leads
  for delete
  to authenticated
  using (true);

create or replace function public.set_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at
  on public.leads;

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_leads_updated_at();
