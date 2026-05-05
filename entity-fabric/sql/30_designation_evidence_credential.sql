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
  confidence numeric(6,5) not null default 0.50000,
  created_at timestamptz not null default now()
);

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
  captured_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);
