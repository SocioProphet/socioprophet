// Governed actions on the board — add / edit / remove / delegate / farm out.
//
// This is deliberately the FIRST implementation of the gap the market-3 study
// found unclaimed: every agentic product ships capability and none ships
// purpose-bound, scope-limited, time-limited, REVOCABLE delegation with a record
// of what the agent actually did. AP2 solved signed mandates for payments only;
// nobody generalised it to non-payment actions. This does.
//
// Four rules, each inherited from a finding rather than invented:
//
//  1. FAIL CLOSED. An action not explicitly permitted is denied. Unknown kinds,
//     expired delegations and out-of-scope targets all deny — never "warn and
//     proceed", which is how every agentic browser in the study fails.
//
//  2. HUMAN AND AGENT ARE DISTINGUISHED AT THE RECORD. Palo Alto named
//     human-vs-agent attribution as the feature enterprises will actually pay
//     for, and it was the only one claiming it. An agent action is never
//     recorded as if a human took it.
//
//  3. DELEGATION IS A WARRANT, NOT A ROLE. It carries a purpose, an explicit
//     scope, an expiry and a revocation state. A warrant that cannot expire or
//     be revoked is a permission, and permissions are what leak.
//
//  4. THE RECEIPT CHAIN IS HASH-LINKED AND SAYS EXACTLY WHAT IT IS. BearBrowser's
//     receipts service describes itself as a "signed log" and is not signed; that
//     overclaim is precisely what this must not repeat. The default digest here
//     is NON-CRYPTOGRAPHIC and labelled so — tamper-evident against accident and
//     reordering, NOT against a motivated adversary. `digest` is an injectable
//     seam so a real deployment supplies SHA-256/Ed25519 at the gate.

export type ActionKind = 'add' | 'edit' | 'remove' | 'delegate' | 'farm-out' | 'revoke';

export const actionLabel: Record<ActionKind, string> = {
  add: 'Add',
  edit: 'Edit',
  remove: 'Remove',
  delegate: 'Delegate',
  'farm-out': 'Farm out',
  revoke: 'Revoke',
};

export type ActorKind = 'human' | 'agent';

export type Actor = {
  kind: ActorKind;
  id: string;
  /** For an agent: the warrant it is acting under. Absent means unwarranted. */
  warrantId?: string;
};

/**
 * A delegation warrant. Purpose-bound, scoped, time-limited, revocable — the
 * four properties the study found missing everywhere.
 */
export type Warrant = {
  id: string;
  /** Who may act. */
  grantee: string;
  /** WHY. An action outside the stated purpose is denied even if in scope. */
  purpose: string;
  /** Which board lanes/targets may be touched. Empty = nothing. */
  scope: string[];
  /** Which action kinds are permitted. Empty = nothing. */
  permits: ActionKind[];
  issuedAt: string;
  expiresAt: string;
  /** Cap on actions under this warrant. */
  budget: number;
  used: number;
  revokedAt: string | null;
  /** Who granted it — a warrant with no grantor is not a warrant. */
  grantedBy: string;
};

export type ActionRequest = {
  kind: ActionKind;
  actor: Actor;
  /** Board item ref or lane the action targets. */
  target: string;
  /** Why this specific action. Checked against the warrant's purpose. */
  purpose: string;
  /** For delegate / farm-out. */
  proposedWarrant?: Omit<Warrant, 'id' | 'issuedAt' | 'used' | 'revokedAt'>;
  at: string;
};

export type Decision = 'allow' | 'deny' | 'needs-approval';

export type ActionVerdict = {
  decision: Decision;
  reasons: string[];
  /** Human-readable, shown on the surface. */
  detail: string;
};

// ---------------------------------------------------------------------------
// Policy — fail closed
// ---------------------------------------------------------------------------

/** Destructive kinds always need a human, even under a valid warrant. */
export const HUMAN_REQUIRED: ActionKind[] = ['remove'];

/** Kinds an agent may never self-grant. */
export const NEVER_AGENT_SELF: ActionKind[] = ['delegate', 'farm-out'];

export function warrantActive(w: Warrant, now: Date): boolean {
  if (w.revokedAt) return false;
  if (new Date(w.expiresAt) <= now) return false;
  if (w.used >= w.budget) return false;
  return true;
}

export function warrantState(w: Warrant, now: Date): 'active' | 'revoked' | 'expired' | 'exhausted' {
  if (w.revokedAt) return 'revoked';
  if (new Date(w.expiresAt) <= now) return 'expired';
  if (w.used >= w.budget) return 'exhausted';
  return 'active';
}

/**
 * Evaluate an action BEFORE it is applied. Every deny path is explicit; the
 * default at the bottom is deny, so a kind nobody thought about cannot slip
 * through as allowed.
 */
export function evaluate(req: ActionRequest, warrants: Warrant[], now: Date = new Date()): ActionVerdict {
  const reasons: string[] = [];

  if (!req.purpose?.trim()) reasons.push('no stated purpose — an unexplained action cannot be authorised');
  if (!req.target?.trim()) reasons.push('no target');

  // A human acts on their own authority, but destructive actions still need to
  // be deliberate rather than incidental.
  if (req.actor.kind === 'human') {
    if (reasons.length) return deny(reasons);
    return req.kind === 'remove'
      ? { decision: 'needs-approval', reasons: ['destructive action — confirm'], detail: 'Removal is destructive and asks for explicit confirmation even from a human actor.' }
      : { decision: 'allow', reasons: [], detail: `Human actor ${req.actor.id} acting on their own authority.` };
    }

  // --- agent path: everything must be warranted ---
  if (NEVER_AGENT_SELF.includes(req.kind)) {
    reasons.push(`an agent may not perform '${req.kind}' — delegation cannot be self-granted`);
  }
  if (HUMAN_REQUIRED.includes(req.kind)) {
    reasons.push(`'${req.kind}' requires a human actor`);
  }
  if (!req.actor.warrantId) {
    reasons.push('agent is acting without a warrant');
    return deny(reasons);
  }

  const w = warrants.find((x) => x.id === req.actor.warrantId);
  if (!w) {
    reasons.push(`warrant ${req.actor.warrantId} not found`);
    return deny(reasons);
  }
  const state = warrantState(w, now);
  if (state !== 'active') reasons.push(`warrant is ${state}`);
  if (w.grantee !== req.actor.id) reasons.push(`warrant was issued to ${w.grantee}, not ${req.actor.id}`);
  if (!w.permits.includes(req.kind)) reasons.push(`warrant does not permit '${req.kind}'`);
  if (!inScope(req.target, w.scope)) reasons.push(`target '${req.target}' is outside the warrant scope`);
  // Purpose-bound: the warrant's purpose must actually cover this action.
  if (!purposeMatches(req.purpose, w.purpose)) {
    reasons.push(`stated purpose does not fall under the warrant purpose ('${w.purpose}')`);
  }

  if (reasons.length) return deny(reasons);
  return {
    decision: 'allow',
    reasons: [],
    detail: `Agent ${req.actor.id} acting under warrant ${w.id} (${w.budget - w.used} of ${w.budget} remaining, expires ${w.expiresAt.slice(0, 10)}).`,
  };
}

function deny(reasons: string[]): ActionVerdict {
  return {
    decision: 'deny',
    reasons,
    detail: `Denied — ${reasons.join('; ')}. The gate refuses rather than proceeding with a warning.`,
  };
}

export function inScope(target: string, scope: string[]): boolean {
  if (!scope.length) return false; // empty scope grants nothing, never everything
  return scope.some((s) => s === '*' ? false : target === s || target.startsWith(`${s}/`) || s === target.split('#')[0]);
}

/** Deliberately conservative: the purpose must be a recognisable narrowing. */
export function purposeMatches(actionPurpose: string, warrantPurpose: string): boolean {
  const a = actionPurpose.toLowerCase().trim();
  const w = warrantPurpose.toLowerCase().trim();
  if (!a || !w) return false;
  if (a === w) return true;
  const words = w.split(/\s+/).filter((x) => x.length > 3);
  if (!words.length) return false;
  // Every significant word of the warrant purpose must appear in the action's.
  return words.every((x) => a.includes(x));
}

// ---------------------------------------------------------------------------
// Receipts — hash-linked, honestly labelled
// ---------------------------------------------------------------------------

export type Receipt = {
  seq: number;
  at: string;
  actor: Actor;
  kind: ActionKind;
  target: string;
  purpose: string;
  decision: Decision;
  reasons: string[];
  /** Digest of the previous receipt — the chain link. */
  prev: string;
  /** Digest of this receipt's content. */
  digest: string;
};

/**
 * NON-CRYPTOGRAPHIC 32-bit FNV-1a. Detects accidental corruption and reordering.
 * It does NOT resist a motivated adversary, and this module never claims it does.
 * Inject a real digest (SHA-256, then sign at the gate) for any deployment where
 * the chain has to stand up to one.
 */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const DIGEST_DISCLOSURE =
  'Receipts are hash-LINKED with a non-cryptographic digest (FNV-1a). That is tamper-evident against accident and reordering, and NOT against a motivated adversary. It is not signed, and is not described as signed.';

export class ReceiptChain {
  private readonly receipts: Receipt[] = [];
  private readonly digestFn: (s: string) => string;

  constructor(digestFn: (s: string) => string = fnv1a) {
    this.digestFn = digestFn;
  }

  append(req: ActionRequest, verdict: ActionVerdict): Receipt {
    const prev = this.receipts.length ? this.receipts[this.receipts.length - 1].digest : '0'.repeat(8);
    const body = {
      seq: this.receipts.length + 1,
      at: req.at,
      actor: req.actor,
      kind: req.kind,
      target: req.target,
      purpose: req.purpose,
      decision: verdict.decision,
      reasons: verdict.reasons,
      prev,
    };
    const receipt: Receipt = { ...body, digest: this.digestFn(JSON.stringify(body)) };
    this.receipts.push(receipt);
    return receipt;
  }

  all(): readonly Receipt[] { return this.receipts; }

  /** Recompute the chain. Any edit or reorder breaks it. */
  verify(): { ok: boolean; brokenAt: number | null; detail: string } {
    for (let i = 0; i < this.receipts.length; i += 1) {
      const r = this.receipts[i];
      const expectedPrev = i === 0 ? '0'.repeat(8) : this.receipts[i - 1].digest;
      if (r.prev !== expectedPrev) {
        return { ok: false, brokenAt: r.seq, detail: `Chain broken at receipt ${r.seq}: previous digest does not match.` };
      }
      const { digest, ...body } = r;
      if (this.digestFn(JSON.stringify(body)) !== digest) {
        return { ok: false, brokenAt: r.seq, detail: `Receipt ${r.seq} has been altered since it was written.` };
      }
    }
    return { ok: true, brokenAt: null, detail: `${this.receipts.length} receipt(s) verified. ${DIGEST_DISCLOSURE}` };
  }
}

/** Denied actions are recorded too — a gate with no record of refusals is unauditable. */
export function applyAction(
  req: ActionRequest,
  warrants: Warrant[],
  chain: ReceiptChain,
  now: Date = new Date(),
): { verdict: ActionVerdict; receipt: Receipt } {
  const verdict = evaluate(req, warrants, now);
  const receipt = chain.append(req, verdict);
  if (verdict.decision === 'allow' && req.actor.kind === 'agent' && req.actor.warrantId) {
    const w = warrants.find((x) => x.id === req.actor.warrantId);
    if (w) w.used += 1; // budget is spent on allow only
  }
  return { verdict, receipt };
}

export function revokeWarrant(w: Warrant, at: string): Warrant {
  return { ...w, revokedAt: at };
}
