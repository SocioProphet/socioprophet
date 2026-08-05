export {};
// Consent ledger — the enforcement side of the self-sovereign consent plane.
//
// The board (client-vue ConsentBoard) SHOWS consent; this is what makes a grant real. Three
// operations and one invariant:
//
//   grant(id)  → mints a CANONICAL mcp-a2a-zero-trust Grant (schemas/canonical/grant.schema.json,
//                vendored at ../contracts/schemas/Grant.json) and records its grant_id as the
//                surface's grantRef. Not a consent-specific token: a consent grant is verifiable
//                by the same verifier as any other capability grant in the estate, so consent
//                cannot be honoured by one verifier and ignored by another.
//   check(id)  → does consent STAND right now (granted, not revoked, not expired). FAIL-CLOSED:
//                every path that is not an affirmative, live, unrevoked grant returns false —
//                unknown id, malformed store, absent grant, clock skew, thrown error.
//   revoke(id) → revokes the grant. Revocation is terminal for that grant: re-granting mints a
//                NEW grant rather than resurrecting the old one, so a revocation can never be
//                undone by replaying an old token.
//
// INVARIANT — SUBJECT == GRANTEE. This plane is self-sovereign: the observed party and the
// record-holder are the same principal. A grant whose binding names a different principal than
// the consent subject is REFUSED, not recorded. That is the whole difference between consent and
// surveillance, so it is enforced at mint time and re-checked at check time — an attacker who
// writes straight into the store still cannot make a foreign-subject grant pass check().
//
// Default-deny: a surface absent from the ledger is DENIED, never "unknown, allow".

const crypto = require("crypto");

const SPIFFE_PREFIX = "spiffe://socioprophet/subject/";

// ── canonical helpers ────────────────────────────────────────────────────────
const _canon = (o: any): string => JSON.stringify(o, Object.keys(o).sort());
const _sha256 = (s: string): string => "sha256:" + crypto.createHash("sha256").update(s).digest("hex");

const _iso = (ms: number): string => new Date(ms).toISOString();

// Grant lifetimes by consent standard. per-use grants are deliberately short AND one-shot: the
// board promises "you are asked every single time", and a long-lived per-use grant would make
// that promise false.
const LIFETIME_MS: Record<string, number> = {
  "per-use": 5 * 60 * 1000,
  "standing-session": 24 * 60 * 60 * 1000,
  "standing-persistent": 365 * 24 * 60 * 60 * 1000,
};

// ── the registry: what CAN be consented to ───────────────────────────────────
// Mirrors the client's demoConsentSnapshot() exactly. The board renders this list whether it is
// live or on the fixture, so the two must not drift — consent.test.mjs asserts the ids match.
const TELEMETRY_SURFACES = [
  ["telemetry:model:tokens_used", "model", "benign", false, "LOSSLESS", "Track how many tokens you use.", "operate"],
  ["telemetry:model:inference_route", "model", "benign", false, "LOSSLESS", "See which model handled each request.", "operate"],
  ["telemetry:model:latency", "model", "benign", false, "LOSSLESS", "See how fast responses come back.", "operate"],
  ["telemetry:policy:gate_verdict", "policy", "benign", false, "LOSSLESS", "See every time the agent asked to use a tool, and what was decided.", "operate"],
  ["telemetry:policy:consent_change", "policy", "benign", false, "LOSSLESS", "Keep an audit trail of your own privacy choices.", "operate"],
  ["telemetry:app:session_lifecycle", "app", "personal", false, "LOSSY", "Know when sessions start, stop, or crash.", "operate"],
  ["telemetry:app:active_surface", "app", "personal", false, "LOSSY", "A coarse label of which kind of surface is active — never what is in it.", "operate"],
  ["telemetry:device:node_id", "device", "sensitive", true, "OPAQUE_HANDLE_ONLY", "A random ID for this install so your fleet view can tell your own devices apart. Not tied to your hardware.", "operate"],
  ["telemetry:device:os_release", "device", "benign", false, "LOSSLESS", "Which OS and version this device runs.", "operate"],
];

const CAPABILITIES = [
  ["microphone", "sensor", "standing-session", "Listen while you are talking to the agent. Audio stays on this device and is not kept.", false],
  ["camera", "sensor", "per-use", "Use the camera. You are asked every single time; there is no always-allow.", true],
  ["screen_capture", "sensor", "per-use", "Read your screen. Asked every single time.", true],
  ["control_my_computer", "high_actuator", "per-use", "Act on this computer for you. Every action asks first.", true],
  ["send_on_behalf", "outward_action", "per-use", "Send a message or post as you. Asked every time.", true],
];

// Effect the grant authorizes, per the canonical enum (read|write|compute|exec|egress).
// Telemetry LEAVES the device, so it is egress — never "read". Naming it read would understate
// what the person is agreeing to.
const _effectForCapability = (riskClass: string): string => {
  if (riskClass === "outward_action") return "egress";
  if (riskClass === "high_actuator") return "exec";
  return "read";
};

const registry = () => {
  const surfaces = TELEMETRY_SURFACES.map((s: any) => ({
    surfaceId: s[0], category: s[1], sensitivity: s[2], pii: s[3],
    projectionMode: s[4], explanation: s[5], purpose: s[6],
    defaultStandard: "standing-persistent",
    kind: "runner_action", effect: "egress",
  }));
  const capabilities = CAPABILITIES.map((c: any) => ({
    capabilityId: c[0], riskClass: c[1], defaultStandard: c[2],
    explanation: c[3], oneShot: c[4],
    kind: "mcp_tool", effect: _effectForCapability(c[1]),
  }));
  return { surfaces, capabilities };
};

const _findItem = (id: string): any | null => {
  if (typeof id !== "string" || !id) return null;
  const r = registry();
  return (
    r.surfaces.find((s: any) => s.surfaceId === id) ??
    r.capabilities.find((c: any) => c.capabilityId === id) ??
    null
  );
};

// The REGISTRY's own id string for a request id, or null if the id names nothing real.
//
// Every store key goes through this. The string that ends up as an object key is one this module
// authored, never the caller's, even though the two compare equal — so there is no data flow from
// the request to a property name at all. Two things follow: default-deny applied to the id space
// itself ("__proto__" and friends name nothing, so they are refused before any lookup), and the
// safety is provable to a taint analyser rather than merely true in practice.
const _canonicalId = (id: string): string | null => {
  const item = _findItem(id);
  if (!item) return null;
  return (item.surfaceId ?? item.capabilityId ?? null) as string | null;
};

// ── store ────────────────────────────────────────────────────────────────────
// A grant record per consented id. Deliberately a plain map so it can be swapped for durable
// storage without changing the logic below.
//
// grants uses a NULL-PROTOTYPE object. The ids that key it come from the URL path, and on an
// ordinary `{}` the keys "__proto__", "constructor" and "prototype" do not behave like data:
// `grants["__proto__"]` resolves to Object.prototype, so reading a "record" for it yields a
// truthy object and writing to that record mutates every object in the process. A null-prototype
// map has no such keys to inherit. This is belt-and-braces with `_canonicalId` below — either one
// alone would close it, and both are cheap.
const createStore = () => ({ subject: null as string | null, grants: Object.create(null) as Record<string, any> });

// Own-property lookup that cannot walk a prototype chain. `id` is expected to already be a
// canonical registry string (see _canonicalId); the hasOwnProperty guard is the second lock.
const _record = (store: any, id: string | null): any | null => {
  const g = store?.grants;
  if (!g || typeof id !== "string") return null;
  return Object.prototype.hasOwnProperty.call(g, id) ? g[id] : null;
};

const _spiffeFor = (subject: string): string => SPIFFE_PREFIX + encodeURIComponent(subject);

// ── mint ─────────────────────────────────────────────────────────────────────
// Builds an object that validates against the canonical Grant schema: grant_id, ISO
// issued_at/expires_at, binding{spiffe_id,aum_digest}, capability{kind,capability_ref,
// capability_digest,effect}, constraints{}, policy_hash, sig{issuer,sig}.
const mintGrant = (subject: string, item: any, opts?: { now?: number; sessionId?: string }): any => {
  const now = opts?.now ?? Date.now();
  const id = item.surfaceId ?? item.capabilityId;
  const standard = item.defaultStandard;
  const lifetime = LIFETIME_MS[standard] ?? LIFETIME_MS["per-use"];

  const capability: any = {
    kind: item.kind,
    capability_ref: id,
    capability_digest: _sha256(_canon({ id, effect: item.effect, standard })),
    effect: item.effect,
  };

  // constraints is a free-form object in the canonical schema — the place to carry the consent
  // semantics the person actually agreed to, so a verifier sees them without a second lookup.
  const constraints: any = {
    purpose: item.purpose ?? "operate",
    consent_standard: standard,
    self_sovereign: true,
  };
  if (item.oneShot) constraints.one_shot = true;
  if (item.pii) constraints.pii = true;
  if (item.projectionMode) constraints.projection_mode = item.projectionMode;

  const binding: any = {
    spiffe_id: _spiffeFor(subject),
    aum_digest: _sha256(_canon({ subject, id })),
  };
  if (opts?.sessionId) binding.session_id = opts.sessionId;

  const grant: any = {
    grant_id: "grant:" + crypto.randomUUID(),
    issued_at: _iso(now),
    expires_at: _iso(now + lifetime),
    binding,
    capability,
    constraints,
    policy_hash: _sha256(_canon({ policy: "policy-fabric:telemetry.emit", id, standard })),
  };
  // Signature over the canonical grant body. minLength 16 in the canonical schema.
  grant.sig = {
    issuer: _spiffeFor(subject),
    sig: crypto.createHmac("sha256", "consent-ledger-dev-key").update(_canon(grant)).digest("hex"),
  };
  return grant;
};

// ── operations ───────────────────────────────────────────────────────────────

/** Grant consent for one surface/capability. Refuses anything that would break self-sovereignty. */
const grant = (store: any, subject: string, id: string, opts?: { now?: number; sessionId?: string }) => {
  if (!store || typeof store !== "object") return { ok: false, reason: "no-store" };
  if (!subject) return { ok: false, reason: "no-subject" };
  if (store.subject && store.subject !== subject) {
    // The store belongs to someone else. Refuse rather than silently re-key it.
    return { ok: false, reason: "subject-mismatch" };
  }
  const item = _findItem(id);
  if (!item) return { ok: false, reason: "unknown-id" }; // default-deny: no such surface, no grant
  const key = _canonicalId(id);
  if (key === null) return { ok: false, reason: "unknown-id" };

  const g = mintGrant(subject, item, opts);
  store.subject = subject;
  // `key` is the registry's own string, not the caller's — no request value reaches a property name.
  store.grants[key] = {
    id: key,
    state: "granted",
    grantedAt: g.issued_at,
    revokedAt: null,
    grantRef: g.grant_id,
    grant: g,
  };
  return { ok: true, id, state: "granted", grantRef: g.grant_id, grant: g };
};

/**
 * Does consent stand right now? FAIL-CLOSED — anything other than a live, unrevoked,
 * unexpired, subject-bound grant is false.
 */
const check = (store: any, id: string, opts?: { now?: number; subject?: string }): boolean => {
  try {
    if (!store || typeof store !== "object" || !store.grants) return false;
    const key = _canonicalId(id); // an id outside the registry is denied, never looked up
    if (key === null) return false;
    const rec = _record(store, key);
    if (!rec || rec.state !== "granted") return false;
    if (rec.revokedAt) return false;

    const g = rec.grant;
    if (!g || !g.binding || !g.capability) return false;
    if (g.capability.capability_ref !== id) return false; // grant is for a different capability

    // Re-assert subject == grantee here, not only at mint. A grant written directly into the
    // store for another principal must still fail.
    const expected = _spiffeFor(opts?.subject ?? store.subject);
    if (g.binding.spiffe_id !== expected) return false;
    if (g.sig?.issuer !== expected) return false;

    const now = opts?.now ?? Date.now();
    const exp = Date.parse(g.expires_at);
    if (!Number.isFinite(exp) || now >= exp) return false;
    const iat = Date.parse(g.issued_at);
    if (!Number.isFinite(iat) || now < iat) return false; // not yet valid / clock skew

    return true;
  } catch {
    return false; // a thrown error is a denial, never an allow
  }
};

/** Revoke consent. Terminal for that grant — re-granting mints a new one. */
const revoke = (store: any, subject: string, id: string, opts?: { now?: number }) => {
  if (!store || typeof store !== "object") return { ok: false, reason: "no-store" };
  if (store.subject && subject && store.subject !== subject) {
    return { ok: false, reason: "subject-mismatch" };
  }
  // Gate on the registry BEFORE the id touches the store. Without this, revoking "__proto__"
  // read Object.prototype as a grant record and wrote the revocation onto it.
  const key = _canonicalId(id);
  if (key === null) return { ok: false, reason: "unknown-id" };
  const rec = _record(store, key);
  const now = opts?.now ?? Date.now();
  if (!rec) {
    // Revoking something never granted is not an error — the end state the person asked for
    // (not granted) is the state they get. Idempotent by design.
    return { ok: true, id, state: "revoked", noop: true };
  }
  rec.state = "revoked";
  rec.revokedAt = _iso(now);
  return { ok: true, id, state: "revoked", grantRef: rec.grantRef };
};

/** The board's view: every surface and capability with its live consent state. */
const snapshot = (store: any, subject: string, opts?: { now?: number }) => {
  const r = registry();
  const self = subject ?? store?.subject ?? "urn:srcos:principal:self";
  const stateOf = (id: string) => {
    const rec = _record(store, id);
    if (!rec) return { state: "denied" as const };
    const live = check(store, id, { now: opts?.now, subject: self });
    if (rec.state === "revoked") {
      return { state: "revoked" as const, grantedAt: rec.grantedAt, revokedAt: rec.revokedAt, grantRef: rec.grantRef };
    }
    // A granted-but-expired record reports denied: the board must never show consent that
    // check() would refuse.
    if (!live) return { state: "denied" as const, grantedAt: rec.grantedAt, grantRef: rec.grantRef };
    return { state: "granted" as const, grantedAt: rec.grantedAt, revokedAt: null, grantRef: rec.grantRef };
  };

  return {
    // Self-sovereign: the observed party and the record-holder are the same principal.
    subjectPrincipal: self,
    collectorPrincipal: self,
    surfaces: r.surfaces.map((s: any) => {
      const c = stateOf(s.surfaceId);
      const on = c.state === "granted";
      return {
        surfaceId: s.surfaceId, category: s.category, sensitivity: s.sensitivity, pii: s.pii,
        defaultStandard: "standing-persistent",
        effectiveMode: on ? s.defaultStandard : "off",
        userOverride: c.state !== "denied" || !!(c as any).grantRef,
        explanation: s.explanation, projectionMode: s.projectionMode, purpose: s.purpose,
        consent: c,
      };
    }),
    capabilities: r.capabilities.map((cap: any) => {
      const c = stateOf(cap.capabilityId);
      const on = c.state === "granted";
      return {
        capabilityId: cap.capabilityId, riskClass: cap.riskClass,
        defaultStandard: cap.defaultStandard,
        effectiveMode: on ? cap.defaultStandard : "off",
        userOverride: c.state !== "denied" || !!(c as any).grantRef,
        defaultState: "disabled",
        explanation: cap.explanation, oneShot: cap.oneShot,
        consent: { state: c.state },
      };
    }),
  };
};

module.exports = { createStore, registry, mintGrant, grant, check, revoke, snapshot, LIFETIME_MS };
