create table core.designation_event (
  designation_id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  authority text not null,
  authority_list_code text not null,
  authority_uid text,
  program_codes text[] not null default '{}',
  measure_codes text[] not null default '{}',
  legal_basis_refs jsonb not null default '[]'::jsonb,
  designation_date date,
  effective_from timestamptz,
  effective_to timestamptz,
  delisting_date date,
  status core.designation_status not null default 'unknown',
  remarks text,
  source_record_id uuid not null references core.source_record(source_record_id),
  rights_profile_id uuid not null references core.rights_profile(rights_profile_id),
  review_state core.review_state not null default 'raw',
  confidence numeric(6,5) not null default 0.50000 check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create unique index designation_event_uq on core.designation_event (authority, authority_list_code, coalesce(authority_uid, source_record_id::text));

create index designation_entity_idx on core.designation_event(entity_id, status, designation_date desc);
create index designation_codes_gin on core.designation_event using gin (program_codes, measure_codes, legal_basis_refs jsonb_path_ops);

create table core.evidence_object (
  evidence_id uuid primary key default gen_random_uuid(),
  source_record_id uuid not null references core.source_record(source_record_id),
  statement_id uuid references core.attribute_statement(statement_id) on delete cascade,
  relationship_id uuid references core.relationship_statement(relationship_id) on delete cascade,
  designation_id uuid references core.designation_event(designation_id) on delete cascade,
  evidence_type text not null,
  content_hash text not null,
  storage_uri text,
  mime_type text,
  locator text,
  extracted_text text,
  captured_at timestamptz not null default now(),
  check (num_nonnulls(statement_id, relationship_id, designation_id) >= 1)
);

create index evidence_source_idx on core.evidence_object(source_record_id, captured_at desc);
create index evidence_target_idx on core.evidence_object(statement_id, relationship_id, designation_id);

create table core.credential (
  credential_id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references core.entity_cluster(entity_id) on delete cascade,
  credential_type core.credential_type not null,
  issuer text not null,
  issuance_time timestamptz not null,
  expiry_time timestamptz,
  subject_binding jsonb not null,
  cryptographic_suite text,
  status core.credential_status not null default 'active',
  credential_payload jsonb not null,
  source_record_id uuid references core.source_record(source_record_id),
  created_at timestamptz not null default now(),
  unique (entity_id, credential_type, issuer, issuance_time)
);

create index credential_entity_idx on core.credential(entity_id, status, issuance_time desc);
create index credential_payload_gin on core.credential using gin (credential_payload jsonb_path_ops);

