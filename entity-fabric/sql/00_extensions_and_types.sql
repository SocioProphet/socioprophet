create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create schema if not exists core;
create schema if not exists priv;

create type core.entity_kind as enum (
  'legal_entity', 'person', 'organization', 'public_body', 'vessel', 'aircraft', 'unknown'
);

create type core.review_state as enum (
  'raw', 'normalized', 'analyst_confirmed', 'disputed', 'suppressed'
);

create type core.source_family as enum (
  'gleif', 'registry', 'sanctions', 'beneficial_ownership', 'commercial_open', 'tenant_private', 'manual'
);

create type core.trust_tier as enum (
  'authoritative', 'official_secondary', 'curated_open', 'tenant_asserted'
);

create type core.access_method as enum ('bulk', 'api', 'scrape', 'manual');
create type core.credential_type as enum ('vLEI', 'VC', 'internal_attestation');
create type core.credential_status as enum ('active', 'expired', 'revoked', 'suspended');
create type core.designation_status as enum ('active', 'inactive', 'superseded', 'removed', 'unknown');
create type core.directness as enum ('direct', 'indirect', 'unknown');

create type priv.deployment_mode as enum ('local', 'vpc', 'tee', 'federated');
create type priv.record_type as enum ('vendor', 'customer', 'counterparty', 'prospect', 'payment', 'kyc', 'case', 'watchlist', 'other');
create type priv.match_model_type as enum ('deterministic', 'probabilistic', 'hybrid');
create type priv.match_scope as enum ('local_to_core', 'local_to_local', 'federated');
create type priv.match_outcome as enum ('same', 'possible', 'different', 'superseded');
