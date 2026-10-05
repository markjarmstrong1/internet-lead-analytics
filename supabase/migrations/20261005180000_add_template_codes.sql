alter table public.templates
  add column if not exists template_code text;

with ranked as (
  select
    id,
    case
      when source_kind = 'email' then
        'e' || row_number() over (
          partition by source_kind
          order by source_path, id
        )
      when source_kind = 'text' then
        't' || row_number() over (
          partition by source_kind
          order by source_path, id
        )
      else
        null
    end as generated_code
  from public.templates
  where template_code is null
)
update public.templates t
set template_code = ranked.generated_code
from ranked
where t.id = ranked.id
  and ranked.generated_code is not null;

create unique index if not exists templates_template_code_unique
  on public.templates(template_code);

create index if not exists templates_template_code_idx
  on public.templates(template_code);

create or replace function public.assign_template_code()
returns trigger
language plpgsql
as $$
declare
  prefix text;
  next_number bigint;
begin
  if new.template_code is not null
     and length(trim(new.template_code)) > 0 then
    return new;
  end if;

  prefix := case
    when new.source_kind = 'email' then 'e'
    when new.source_kind = 'text' then 't'
    else null
  end;

  if prefix is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtext('templates:' || prefix)
  );

  select coalesce(
    max(
      substring(template_code from 2)::bigint
    ),
    0
  ) + 1
  into next_number
  from public.templates
  where template_code like prefix || '%'
    and substring(template_code from 2) ~ '^[0-9]+$';

  new.template_code := prefix || next_number::text;

  return new;
end;
$$;

drop trigger if exists templates_assign_code on public.templates;

create trigger templates_assign_code
before insert on public.templates
for each row
execute function public.assign_template_code();

alter table public.templates
  alter column template_code set not null;

alter table public.templates
  drop constraint if exists templates_template_code_format;

alter table public.templates
  add constraint templates_template_code_format
  check (
    template_code ~ '^[et][1-9][0-9]*$'
  );
