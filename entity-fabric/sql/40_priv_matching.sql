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

create table priv.match_run (
  match_run_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references priv.tenant(tenant_id) on delete cascade,
  model_type priv.match_model_type not null,
  model_version text not null,
  source_scope priv.match_scope not null,
  threshold_auto_accept numeric(6,5),
  threshold_review numeric(6,5),
  parameters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table priv.match_candidate (
  candidate_id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references priv.match_run(match_run_id) on delete cascade,
  local_record_id uuid not null references priv.local_record(local_record_id) on delete cascade,
  candidate_entity_id uuid references core.entity_cluster(entity_id) on delete cascade,
  candidate_local_record_id uuid references priv.local_record(local_record_id) on delete cascade,
  score numeric(6,5) not null,
  feature_vector jsonb not null default '{}'::jsonb,
  reasons text[] not null default '{}',
  generated_at timestamptz not null default now()
);

create table priv.match_decision (
  decision_id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references priv.match_run(match_run_id) on delete cascade,
  local_record_id uuid not null references priv.local_record(local_record_id) on delete cascade,
  candidate_entity_id uuid references core.entity_cluster(entity_id) on delete cascade,
  candidate_local_record_id uuid references priv.local_record(local_record_id) on delete cascade,
  outcome priv.match_outcome not null,
  score numeric(6,5) not null,
  reasons text[] not null default '{}',
  analyst_actor text,
  created_at timestamptz not null default now(),
  reversible boolean not null default true,
  supersedes_decision_id uuid references priv.match_decision(decision_id)
);
