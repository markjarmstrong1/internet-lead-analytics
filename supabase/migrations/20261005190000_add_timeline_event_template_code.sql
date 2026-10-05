alter table public.timeline_events
  add column if not exists template_code text;

create index if not exists timeline_events_template_code_idx
  on public.timeline_events(template_code);

alter table public.timeline_events
  drop constraint if exists timeline_events_template_code_format;

alter table public.timeline_events
  add constraint timeline_events_template_code_format
  check (
    template_code is null
    or template_code ~ '^[et][1-9][0-9]*$'
  );

create or replace function public.sync_timeline_event_template_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.timeline_events
  set
    template_code = (
      select t.template_code
      from public.templates t
      where t.id = new.template_id
    ),
    updated_at = now()
  where id = new.timeline_event_id;

  return new;
end;
$$;

drop trigger if exists timeline_event_template_code_sync
  on public.timeline_event_template_matches;

create trigger timeline_event_template_code_sync
after insert or update of template_id on public.timeline_event_template_matches
for each row
execute function public.sync_timeline_event_template_code();

create or replace function public.clear_timeline_event_template_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.timeline_events
  set
    template_code = null,
    updated_at = now()
  where id = old.timeline_event_id;

  return old;
end;
$$;

drop trigger if exists timeline_event_template_code_clear
  on public.timeline_event_template_matches;

create trigger timeline_event_template_code_clear
after delete on public.timeline_event_template_matches
for each row
execute function public.clear_timeline_event_template_code();

update public.timeline_events e
set
  template_code = t.template_code,
  updated_at = now()
from public.timeline_event_template_matches m
join public.templates t
  on t.id = m.template_id
where m.timeline_event_id = e.id
  and m.template_id is not null
  and t.template_code is not null;
