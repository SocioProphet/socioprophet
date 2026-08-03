// Two-way GitHub mirror sync. The sovereign store is CANONICAL; this reads the
// mirror repo's issues, reconciles (services/mirrorReconcile.ts), and applies the
// convergence ops (create/update issues) so the mirror tracks sovereign — never
// the reverse. Orphan issues (no sovereign source) are only labelled, never closed
// or deleted.
//
// The token is MINTED IN CI (a GitHub App installation token), never stored — it is
// passed in at call time via an injected `GhClient`, which also makes this
// unit-testable with a mock (test/githubMirror.test.mjs). Writes are gated behind
// an explicit `apply` flag: dry-run is the default and is always side-effect free.

import { reconcile, type MirrorRecord, type SovereignTask, type ReconcileResult } from './mirrorReconcile.ts';

export interface GhIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  body?: string;
  labels?: Array<{ name: string } | string>;
}

/** Minimal GitHub surface, injected so the sync is testable + CI-token agnostic. */
export interface GhClient {
  listIssues(repo: string): Promise<GhIssue[]>;
  createIssue(repo: string, title: string, body: string, labels: string[]): Promise<GhIssue>;
  updateIssue(repo: string, num: number, fields: { title?: string; state?: 'open' | 'closed'; addLabels?: string[] }): Promise<void>;
}

// The sovereign id travels in a hidden body marker so an issue round-trips to its
// canonical task without a fragile title match.
const MARKER = /<!--\s*sovereign:([\w.\-()]+)\s*-->/;
export function markerFor(sovereignId: string): string {
  return `<!-- sovereign:${sovereignId} -->`;
}
export function sovereignIdOf(issue: GhIssue): string | null {
  const m = (issue.body ?? '').match(MARKER);
  return m ? m[1] : null;
}

const labelNames = (issue: GhIssue): string[] =>
  (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));

// Sovereign status ⇄ GitHub issue state + label. `done` → closed; others open + a
// status label. Keep this the single source of the status projection.
const STATUS_LABEL: Record<string, string> = { in_progress: 'in progress', blocked: 'blocked', review: 'review', todo: 'todo' };
function issueStatus(issue: GhIssue): string {
  if (issue.state === 'closed') return 'done';
  const labels = new Set(labelNames(issue).map((n) => n.toLowerCase()));
  for (const [status, label] of Object.entries(STATUS_LABEL)) if (labels.has(label)) return status;
  return 'todo';
}

/** Map a mirror issue → a reconcile MirrorRecord (only issues carrying a marker). */
export function issueToRecord(issue: GhIssue): MirrorRecord | null {
  const sovereignId = sovereignIdOf(issue);
  if (!sovereignId) return null;
  return { sovereignId, title: issue.title, status: issueStatus(issue), ref: issue.html_url };
}

export interface SyncReport {
  repo: string;
  applied: boolean;
  result: ReconcileResult;
  created: string[]; // sovereign ids created on the mirror
  updated: string[]; // sovereign ids updated on the mirror
  flaggedOrphans: string[]; // orphan issue refs labelled (never closed/deleted)
}

/**
 * Reconcile the mirror repo against the sovereign store and (optionally) apply.
 * `apply=false` (default) is a pure dry run — zero writes.
 */
export async function syncMirror(
  client: GhClient,
  repo: string,
  sovereign: SovereignTask[],
  opts: { apply?: boolean } = {},
): Promise<SyncReport> {
  const apply = opts.apply === true;
  const issues = await client.listIssues(repo);
  const records = issues.map(issueToRecord).filter((r): r is MirrorRecord => r !== null);
  const result = reconcile('github', sovereign, records);

  const byId = new Map(sovereign.map((s) => [s.id, s]));
  const refToNumber = new Map(issues.map((i) => [i.html_url, i.number]));
  const created: string[] = [];
  const updated: string[] = [];
  const flaggedOrphans: string[] = [];

  for (const op of result.ops) {
    if (op.op === 'create') {
      const s = byId.get(op.sovereignId)!;
      const body = `${markerFor(op.sovereignId)}\nMirrored from the sovereign delivery store. Sovereign is canonical; edits here are reconciled.`;
      const labels = op.status === 'done' ? [] : [STATUS_LABEL[op.status] ?? 'todo'];
      if (apply) await client.createIssue(repo, s.title, body, labels);
      created.push(op.sovereignId);
    } else if (op.op === 'update') {
      const num = refToNumber.get(op.ref);
      if (num != null && apply) {
        const status = byId.get(op.sovereignId)?.status;
        await client.updateIssue(repo, num, {
          title: op.fields.title,
          state: status === 'done' ? 'closed' : 'open',
          addLabels: status && status !== 'done' && STATUS_LABEL[status] ? [STATUS_LABEL[status]] : undefined,
        });
      }
      updated.push(op.sovereignId);
    } else if (op.op === 'orphan') {
      // Never close/delete an orphan — only flag it for a human. Label-only.
      const num = refToNumber.get(op.ref);
      if (num != null && apply) await client.updateIssue(repo, num, { addLabels: ['sovereign:orphan'] });
      flaggedOrphans.push(op.ref);
    }
  }

  return { repo, applied: apply, result, created, updated, flaggedOrphans };
}
