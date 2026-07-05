-- Socbase — self-hosted Supabase (Postgres + GoTrue + PostgREST + Kong)
-- bootstrap for this server (SourceOS builder + nlboot fleet).
--
-- CANONICAL DEPLOYABLE COPY: prophet-platform's charts/socbase/files/socbase-schema.sql
-- (applied there by the chart's schema-job / infra/local/docker-compose.socbase.yml's
-- migrate step). This copy is kept byte-identical for reference from this repo —
-- if you change one, change both.
--
-- ORDERING REQUIREMENT: this file must run AFTER GoTrue has booted at least
-- once and created its "auth" schema (auth.users etc.) — GoTrue owns that
-- schema entirely and this file's tables have FKs into auth.users.
--
-- We run PLAIN postgres:16 (not the supabase/postgres image), so the roles
-- PostgREST needs are NOT pre-baked — part 1 of this file creates them.

-- ── Part 1: PostgREST role model ────────────────────────────────────────────
-- authenticator: the login role PostgREST itself connects as; can SET ROLE
-- into the other three based on the JWT's "role" claim. anon/authenticated
-- get NO grants below (default-deny) — the browser never talks to Postgres
-- directly in this app; only the Express backend does, via service_role.
--
-- :'authpw' is a psql variable (-v authpw=...) sourced from a k8s Secret at
-- apply time — never inline it here or it lands in a Helm-rendered ConfigMap.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;
select format('create role authenticator noinherit login password %L', :'authpw')
where not exists (select 1 from pg_roles where rolname = 'authenticator')
\gexec
alter role authenticator with password :'authpw';
grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;

-- ── Part 2: application tables ───────────────────────────────────────────────
-- Compatibility decision: column names are QUOTED CAMELCASE, matching the
-- prior Firestore field names exactly (createdAt, assignedBuildId, etc), so
-- contracts.ts validators / the Vue frontend / nlboot devices needed ZERO
-- field-name changes — only the persistence backend changed underneath.
--
-- RLS is enabled with NO policies (default-deny for anon/authenticated);
-- service_role has BYPASSRLS above and is the only caller (via the Express
-- backend's SUPABASE_SERVICE_ROLE_KEY), matching the old Firestore Admin-SDK
-- model where all access was server-only and enforced in application code
-- (tier gating, ownership checks, daily-build-limit, premium-fleet gating).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- One row per Supabase Auth user (auth.users.id), mirrors the old users/{uid} doc.
create table if not exists public.profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  "tier" text not null default 'free',
  "createdAt" timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- users/{uid}/builds/{id} → builds, owned by uid.
create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users(id) on delete cascade,
  "spec" jsonb not null,
  "tier" text not null,
  "status" text not null default 'queued',
  "lane" text,
  "error" text,
  "artifact" jsonb,
  "buildRequest" jsonb,
  "workOrder" jsonb,
  "osImage" jsonb,
  "catalogEntry" jsonb,
  "evidence" jsonb,
  "evidenceError" text,
  "usageReceipt" jsonb,
  "settlement" jsonb,
  "createdAt" timestamptz not null default now()
);
create index if not exists builds_uid_created_idx on public.builds (uid, "createdAt" desc);
alter table public.builds enable row level security;

-- users/{uid}/devices/{id} → devices, owned by uid. Client-generated uuid (the
-- old Firestore .doc() auto-id pattern) so the id is known before insert, since
-- contracts.deviceIdentity(...) embeds it.
create table if not exists public.devices (
  id uuid primary key,
  uid uuid not null references auth.users(id) on delete cascade,
  "name" text not null,
  "claimCode" text not null unique,
  "assignedBuildId" uuid references public.builds(id),
  "identity" jsonb not null,
  "lastSeen" timestamptz,
  "lastInventory" jsonb,
  "activeBootPlan" jsonb,
  "assignedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
create index if not exists devices_uid_created_idx on public.devices (uid, "createdAt" desc);
alter table public.devices enable row level security;

-- device_claims/{claim} → top-level, unauthenticated /boot/announce resolves
-- a claim code to (uid, deviceId) without a token.
create table if not exists public.device_claims (
  "claim" text primary key,
  uid uuid not null references auth.users(id) on delete cascade,
  "deviceId" uuid not null references public.devices(id) on delete cascade
);
alter table public.device_claims enable row level security;

-- users/{uid}/devices/{id}/bootProofs/{id} → boot_proofs, owned by deviceId.
create table if not exists public.boot_proofs (
  id uuid primary key default gen_random_uuid(),
  "deviceId" uuid not null references public.devices(id) on delete cascade,
  "proof" jsonb not null,
  "createdAt" timestamptz not null default now()
);
create index if not exists boot_proofs_device_idx on public.boot_proofs ("deviceId");
alter table public.boot_proofs enable row level security;

-- notification_outbox/{id} → top-level outbox the Kafka relay drains (was
-- functions/publishPendingOutbox; unchanged by this migration).
create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  "kind" text not null,
  "event" jsonb not null,
  "status" text not null default 'pending',
  "destination" jsonb not null,
  "createdAt" timestamptz not null default now()
);
alter table public.notification_outbox enable row level security;

-- service_role bypasses RLS but still needs table-level grants to touch these.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
