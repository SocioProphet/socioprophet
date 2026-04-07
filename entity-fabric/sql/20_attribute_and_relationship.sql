create table core.attribute_statement (
  statement_id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  predicate_code text not null references core.predicate_catalog(predicate_code),
  value_text text,
  value_json jsonb,
  value_numeric numeric,
  value_date date,
  value_timestamp timestamptz,
  normalized_value text,
  language text,
  script text,
  confidence numeric(6,5) not null default 0.50000 check (confidence between 0 and 1),
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz,
  source_record_id uuid not null references core.source_record(source_record_id),
  rights_profile_id uuid not null references core.rights_profile(rights_profile_id),
  review_state core.review_state not null default 'raw',
  analyst_note text,
  created_at timestamptz not null default now(),
  check (num_nonnulls(value_text, value_json, value_numeric, value_date, value_timestamp) >= 1)
);

create index attr_stmt_entity_pred_idx on core.attribute_statement(entity_id, predicate_code, valid_to, observed_at desc);
create index attr_stmt_source_idx on core.attribute_statement(source_record_id);
create index attr_stmt_norm_trgm on core.attribute_statement using gin (normalized_value gin_trgm_ops);
create index attr_stmt_value_json_gin on core.attribute_statement using gin (value_json jsonb_path_ops);

create table core.relationship_statement (
  relationship_id uuid primary key default gen_random_uuid(),
  subject_entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  object_entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  predicate_code text not null references core.predicate_catalog(predicate_code),
  interest_type text,
  ownership_pct_min numeric(7,4),
  ownership_pct_max numeric(7,4),
  control_mechanism text,
  directness core.directness not null default 'unknown',
  negative_assertion boolean not null default false,
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz,
  confidence numeric(6,5) not null default 0.50000 check (confidence between 0 and 1),
  source_record_id uuid not null references core.source_record(source_record_id),
  rights_profile_id uuid not null references core.rights_profile(rights_profile_id),
  review_state core.review_state not null default 'raw',
  note text,
  created_at timestamptz not null default now(),
  check (subject_entity_id <> object_entity_id),
  check (
    ownership_pct_min is null or ownership_pct_max is null or ownership_pct_min <= ownership_pct_max
  )
);

create index rel_stmt_subject_idx on core.relationship_statement(subject_entity_id, predicate_code, valid_to, observed_at desc);
create index rel_stmt_object_idx on core.relationship_statement(object_entity_id, predicate_code, valid_to, observed_at desc);
create index rel_stmt_source_idx on core.relationship_statement(source_record_id);

