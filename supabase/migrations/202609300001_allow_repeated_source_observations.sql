alter table public.source_records
  drop constraint if exists source_records_source_system_source_type_source_record_id_key;

create unique index if not exists source_records_import_identity_idx
  on public.source_records (
    import_id,
    source_system,
    source_type,
    source_record_id
  );

create index if not exists source_records_identity_lookup_idx
  on public.source_records (
    source_system,
    source_type,
    source_record_id
  );

create index if not exists source_records_import_id_idx
  on public.source_records (import_id);