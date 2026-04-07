create table priv.tenant (
  tenant_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  deployment_mode priv.deployment_mode not null,
  created_at timestamptz not null default now()
);

create table priv.local_record (
  local_record_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references priv.tenant(tenant_id) on delete cascade,
  source_system text not null,
  external_ref text,
  record_type priv.record_type not null,
  raw_payload jsonb not null,
  normalized_name citext,
  country text,
  jurisdiction text,
  identifiers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index local_record_uq on priv.local_record (tenant_id, source_system, coalesce(external_ref, ''));

create index local_record_tenant_name_trgm on priv.local_record using gin (normalized_name gin_trgm_ops);
create index local_record_payload_gin on priv.local_record using gin (raw_payload jsonb_path_ops);

create table priv.match_run (
  match_run_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references priv.tenant(tenant_id) on delete cascade,
  model_type priv.match_model_type not null,
  model_version text not null,
  source_scope priv.match_scope not null,
  threshold_auto_accept numeric(6,5) check (threshold_auto_accept between 0 and 1),
  threshold_review numeric(6,5) check (threshold_review between 0 and 1),
  parameters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    threshold_auto_accept is null or threshold_review is null or threshold_review <= threshold_auto_accept
  )
);

create table priv.match_candidate (
  candidate_id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references priv.match_run(match_run_id) on delete cascade,
  local_record_id uuid not null references priv.local_record(local_record_id) on delete cascade,
  candidate_entity_id uuid references core.entity_cluster(entity_id) on delete cascade,
  candidate_local_record_id uuid references priv.local_record(local_record_id) on delete cascade,
  score numeric(6,5) not null check (score between 0 and 1),
  feature_vector jsonb not null default '{}'::jsonb,
  reasons text[] not null default '{}',
  generated_at timestamptz not null default now(),
  check (num_nonnulls(candidate_entity_id, candidate_local_record_id) = 1)
);

create index match_candidate_run_local_idx on priv.match_candidate(match_run_id, local_record_id, score desc);
create index match_candidate_entity_idx on priv.match_candidate(candidate_entity_id);

create table priv.match_decision (
  decision_id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references priv.match_run(match_run_id) on delete cascade,
  local_record_id uuid not null references priv.local_record(local_record_id) on delete cascade,
  candidate_entity_id uuid references core.entity_cluster(entity_id) on delete cascade,
  candidate_local_record_id uuid references priv.local_record(local_record_id) on delete cascade,
  outcome priv.match_outcome not null,
  score numeric(6,5) not null check (score between 0 and 1),
  reasons text[] not null default '{}',
  analyst_actor text,
  created_at timestamptz not null default now(),
  reversible boolean not null default true,
  supersedes_decision_id uuid references priv.match_decision(decision_id),
  check (num_nonnulls(candidate_entity_id, candidate_local_record_id) = 1)
);

create index match_decision_run_local_idx on priv.match_decision(match_run_id, local_record_id, created_at desc);
create index match_decision_entity_idx on priv.match_decision(candidate_entity_id, outcome);

create view core.v_entity_current_identifiers as
select distinct on (i.entity_id, i.scheme)
  i.entity_id,
  i.scheme,
  i.value,
  i.jurisdiction,
  i.issuing_authority,
  i.status,
  i.preferred,
  i.valid_from,
  i.valid_to,
  i.source_record_id
from core.identifier i
where i.valid_to is null or i.valid_to > now()
order by i.entity_id, i.scheme, i.preferred desc, i.created_at desc;

