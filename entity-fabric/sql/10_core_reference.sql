create table core.rights_profile (
  rights_profile_id uuid primary key default gen_random_uuid(),
  license_name text not null,
  attribution_required boolean not null default false,
  share_alike boolean not null default false,
  redistribution_allowed boolean not null default false,
  commercial_use_allowed boolean not null default false,
  publication_constraints text,
  retention_constraints text,
  notes text,
  created_at timestamptz not null default now()
);

create table core.source_dataset (
  source_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  publisher text not null,
  official boolean not null default false,
  source_family core.source_family not null,
  jurisdiction_scope text,
  refresh_cadence text,
  access_method core.access_method not null,
  trust_tier core.trust_tier not null,
  schema_binding text not null,
  rights_profile_id uuid not null references core.rights_profile(rights_profile_id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table core.source_record (
  source_record_id uuid primary key default gen_random_uuid(),
  source_id uuid not null references core.source_dataset(source_id),
  ingest_key text not null unique,
  source_native_id text,
  source_url text,
  source_hash text,
  issue_date date,
  effective_from timestamptz,
  effective_to timestamptz,
  parse_version text,
  rights_profile_id uuid not null references core.rights_profile(rights_profile_id),
  raw_payload jsonb not null,
  retrieved_at timestamptz not null default now()
);

create table core.entity_cluster (
  entity_id uuid primary key default gen_random_uuid(),
  entity_kind core.entity_kind not null,
  canonical_name text not null,
  canonical_name_norm citext not null,
  display_name text,
  status text not null default 'unknown',
  primary_jurisdiction text,
  identity_confidence numeric(6,5) not null default 0.50000,
  structure_confidence numeric(6,5) not null default 0.50000,
  sanctions_confidence numeric(6,5) not null default 0.50000,
  merge_state text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.predicate_catalog (
  predicate_code text primary key,
  predicate_kind text not null,
  label text not null,
  value_type text not null,
  semantic_family text,
  description text,
  source_standard text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table core.identifier (
  identifier_id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  scheme text not null,
  value text not null,
  value_norm citext not null,
  jurisdiction text,
  issuing_authority text,
  status text not null default 'active',
  preferred boolean not null default false,
  valid_from timestamptz,
  valid_to timestamptz,
  source_record_id uuid not null references core.source_record(source_record_id),
  created_at timestamptz not null default now()
);
