// Sovereign-cutover reconciliation — the mechanism that makes GitHub/Taskwarrior
// mirrors REMOVABLE. The sovereign store is the single source of truth; mirrors are
// DERIVED projections. Reconciliation only ever converges the MIRROR toward the
// sovereign store — never the reverse — so dropping a mirror at cutover loses
// nothing. Orphan mirror records (no sovereign source) are FLAGGED, never
// auto-deleted (a mirror can't authorize destruction of sovereign truth).
//
// Pure + dependency-free so it validates under `node` type-stripping
// (test/delivery.reconcile.test.mjs) without the server's TS/express runtime.

export type SyncState = 'sovereign_only' | 'mirrored' | 'drifted';
export type MirrorTarget = 'github' | 'taskwarrior' | 'cowork';

export interface SovereignTask {
  id: string;
  title: string;
  status: string;
}

/** A record observed in an external mirror, claiming to reflect a sovereign task. */
export interface MirrorRecord {
  sovereignId: string;
  title: string;
  status: string;
  ref: string; // issue url / task uuid / thread id
}

export type MirrorOp =
  | { op: 'create'; target: MirrorTarget; sovereignId: string; title: string; status: string }
  | { op: 'update'; target: MirrorTarget; ref: string; sovereignId: string; fields: Partial<{ title: string; status: string }> }
  | { op: 'orphan'; target: MirrorTarget; ref: string };

export interface ReconcileResult {
  target: MirrorTarget;
  /** sovereignId → sync state. */
  states: Record<string, SyncState>;
  /** Convergence ops applied to the MIRROR to match sovereign (one-directional). */
  ops: MirrorOp[];
  drifted: string[];
  sovereignOnly: string[];
  /** Mirror refs with no sovereign source — flagged, never auto-deleted. */
  orphans: string[];
}

export function reconcile(
  target: MirrorTarget,
  sovereign: SovereignTask[],
  mirror: MirrorRecord[],
): ReconcileResult {
  const mirrorById = new Map<string, MirrorRecord>();
  for (const m of mirror) mirrorById.set(m.sovereignId, m);
  const sovereignIds = new Set(sovereign.map((s) => s.id));

  const states: Record<string, SyncState> = {};
  const ops: MirrorOp[] = [];
  const drifted: string[] = [];
  const sovereignOnly: string[] = [];

  for (const s of sovereign) {
    const m = mirrorById.get(s.id);
    if (!m) {
      states[s.id] = 'sovereign_only';
      sovereignOnly.push(s.id);
      ops.push({ op: 'create', target, sovereignId: s.id, title: s.title, status: s.status });
      continue;
    }
    const fields: Partial<{ title: string; status: string }> = {};
    if (m.title !== s.title) fields.title = s.title;
    if (m.status !== s.status) fields.status = s.status;
    if (Object.keys(fields).length > 0) {
      states[s.id] = 'drifted';
      drifted.push(s.id);
      ops.push({ op: 'update', target, ref: m.ref, sovereignId: s.id, fields });
    } else {
      states[s.id] = 'mirrored';
    }
  }

  const orphans: string[] = [];
  for (const m of mirror) {
    if (!sovereignIds.has(m.sovereignId)) {
      orphans.push(m.ref);
      ops.push({ op: 'orphan', target, ref: m.ref });
    }
  }

  return { target, states, ops, drifted, sovereignOnly, orphans };
}

/** True iff the mirror is a faithful projection of sovereign (nothing to converge). */
export function isFullyMirrored(r: ReconcileResult): boolean {
  return r.drifted.length === 0 && r.sovereignOnly.length === 0 && r.orphans.length === 0;
}
