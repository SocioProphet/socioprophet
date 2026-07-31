// Executions Ledger — types, filter DSL, and fixtures.
//
// Mirrors prophet-core-contracts/schemas/execution-receipt.schema.json (the
// governed agent-execution envelope). Fixture-first: this surface renders against
// demoLedger until a live /svc/executions endpoint is wired via cockpitRuntime.
// The autonomy axis is `authorityBand` (ScopedCapability ladder); `epistemicLevel`
// is the distinct SCOPE-D proof-confidence axis — never conflated.

export type VerdictState = 'verified' | 'pending' | 'denied';
export type DecisionVerdict = 'allow' | 'block' | 'require_approval' | 'degrade' | 'transform';
export type InputType = 'external_alert' | 'reported_phish' | 'customization' | 'detection' | 'event';
export type EpistemicLevel = 'proved' | 'bounded' | 'empirical' | 'synthetic' | 'speculative' | 'rejected';

export interface ExecutionRow {
  executionReceiptId: string;
  executedAt: string; // ISO-8601 UTC
  agent: { name: string; version: string; category?: string };
  input: { type: InputType; ref?: string };
  decision: { verdict: DecisionVerdict; authorityBand: string; latencyMs?: number };
  verdict: VerdictState;
  epistemicLevel?: EpistemicLevel;
  capabilitiesHeld: string[];
  capabilitiesUsed: string[];
  proofReplayable: boolean;
  receiptHash: string; // ^sha256:
  blast?: { targetNode: string; reachableCount: number; hops: number };
}

// ---------------------------------------------------------------------------
// Filter DSL — `agent:`, `input:`, `status:`, `level:`, `receipt:`, plus bare
// keywords. `|` = OR within an attribute; multiple attributes AND together
// (each further narrows). Case-insensitive. Mirrors the contract's query grammar.
// ---------------------------------------------------------------------------

export interface ParsedFilter {
  agent?: string[];
  input?: string[];
  status?: string[];
  level?: string[];
  receipt?: string[]; // present | absent
  keywords: string[];
}

const ATTRS = ['agent', 'input', 'status', 'level', 'receipt'] as const;
type Attr = (typeof ATTRS)[number];

export function parseFilter(query: string): ParsedFilter {
  const out: ParsedFilter = { keywords: [] };
  for (const raw of query.trim().split(/\s+/).filter(Boolean)) {
    const colon = raw.indexOf(':');
    if (colon > 0) {
      const attr = raw.slice(0, colon).toLowerCase();
      const value = raw.slice(colon + 1).toLowerCase();
      if ((ATTRS as readonly string[]).includes(attr)) {
        (out[attr as Attr] as string[]) = value.split('|').filter(Boolean);
        continue;
      }
    }
    out.keywords.push(raw.toLowerCase());
  }
  return out;
}

function anyMatch(values: string[] | undefined, candidate: string): boolean {
  if (!values || values.length === 0) return true; // attribute not constrained
  return values.some((v) => candidate.includes(v));
}

export function rowMatches(row: ExecutionRow, f: ParsedFilter): boolean {
  if (!anyMatch(f.agent, row.agent.name.toLowerCase())) return false;
  if (!anyMatch(f.input, row.input.type.toLowerCase())) return false;
  if (!anyMatch(f.status, row.verdict.toLowerCase())) return false;
  if (!anyMatch(f.level, (row.epistemicLevel ?? '').toLowerCase())) return false;
  if (f.receipt && f.receipt.length) {
    const present = Boolean(row.receiptHash);
    const wantPresent = f.receipt.includes('present');
    const wantAbsent = f.receipt.includes('absent');
    if (wantPresent && !present) return false;
    if (wantAbsent && present) return false;
  }
  if (f.keywords.length) {
    const hay = [
      row.agent.name, row.agent.version, row.input.type, row.input.ref ?? '',
      row.verdict, row.epistemicLevel ?? '', row.receiptHash, row.blast?.targetNode ?? '',
    ].join(' ').toLowerCase();
    if (!f.keywords.every((k) => hay.includes(k))) return false;
  }
  return true;
}

export function applyFilter(rows: ExecutionRow[], query: string): ExecutionRow[] {
  const f = parseFilter(query);
  return rows.filter((r) => rowMatches(r, f));
}

// ---------------------------------------------------------------------------
// Fixture ledger — mirrors the contract's example receipts + the mockup rows.
// ---------------------------------------------------------------------------

export const demoLedger: ExecutionRow[] = [
  {
    executionReceiptId: 'exec_hybrid_investigation_wiz_verified_demo',
    executedAt: '2026-07-31T15:09:04Z',
    agent: { name: 'Hybrid Investigation Agent', version: '1.1.0', category: 'investigation' },
    input: { type: 'external_alert', ref: 'alert_wiz_372688' },
    decision: { verdict: 'allow', authorityBand: 'recommend', latencyMs: 12 },
    verdict: 'verified',
    epistemicLevel: 'bounded',
    capabilitiesHeld: ['cap_read_alerts_demo', 'cap_read_baseline_demo', 'cap_read_reputation_demo', 'cap_write_comment_demo'],
    capabilitiesUsed: ['cap_read_alerts_demo', 'cap_read_baseline_demo', 'cap_read_reputation_demo'],
    proofReplayable: true,
    receiptHash: 'sha256:4f8b0c11a2e7d9f0113c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    blast: { targetNode: 'endpoint://vvv-648e9d56f1a', reachableCount: 7, hops: 3 },
  },
  {
    executionReceiptId: 'exec_threat_response_recommendation_pending_demo',
    executedAt: '2026-07-31T15:08:48Z',
    agent: { name: 'Threat Response Recommendation Agent', version: '1.2.0', category: 'response' },
    input: { type: 'detection', ref: 'threat_591' },
    decision: { verdict: 'require_approval', authorityBand: 'queue', latencyMs: 41 },
    verdict: 'pending',
    capabilitiesHeld: ['cap_read_detections_demo', 'cap_isolate_endpoint_demo'],
    capabilitiesUsed: ['cap_read_detections_demo'],
    proofReplayable: true,
    receiptHash: 'sha256:7c025b1e0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071829a3b4c5',
    blast: { targetNode: 'endpoint://vvv-648e9d56f1a', reachableCount: 14, hops: 5 },
  },
  {
    executionReceiptId: 'exec_event_hide_comment_verified_demo',
    executedAt: '2026-07-31T14:20:07Z',
    agent: { name: 'Event Hide Comment Agent', version: '1.0.0', category: 'email_security' },
    input: { type: 'event', ref: 'event_16521' },
    decision: { verdict: 'allow', authorityBand: 'execute_local', latencyMs: 9 },
    verdict: 'verified',
    epistemicLevel: 'empirical',
    capabilitiesHeld: ['cap_write_comment_demo'],
    capabilitiesUsed: ['cap_write_comment_demo'],
    proofReplayable: true,
    receiptHash: 'sha256:15b6c9d0aa11223344556677889900aabbccddeeff00112233445566778899aa',
    blast: { targetNode: 'code://rust/src/lib.rs#hide', reachableCount: 0, hops: 0 },
  },
  {
    executionReceiptId: 'exec_investigation_agent_denied_demo',
    executedAt: '2026-07-31T13:38:49Z',
    agent: { name: 'Investigation Agent', version: '1.0.2', category: 'investigation' },
    input: { type: 'event', ref: 'event_16517' },
    decision: { verdict: 'block', authorityBand: 'observe', latencyMs: 8 },
    verdict: 'denied',
    epistemicLevel: 'rejected',
    capabilitiesHeld: ['cap_read_events_demo'],
    capabilitiesUsed: [],
    proofReplayable: true,
    receiptHash: 'sha256:a0f12277b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    blast: { targetNode: 'endpoint://wks-2970', reachableCount: 3, hops: 1 },
  },
  {
    executionReceiptId: 'exec_email_analyzer_verified_demo',
    executedAt: '2026-07-31T03:12:53Z',
    agent: { name: 'Email Analyzer Agent', version: '1.0.1', category: 'email_security' },
    input: { type: 'reported_phish', ref: 'phish_9' },
    decision: { verdict: 'allow', authorityBand: 'recommend', latencyMs: 17 },
    verdict: 'verified',
    epistemicLevel: 'bounded',
    capabilitiesHeld: ['cap_read_mailbox_demo'],
    capabilitiesUsed: ['cap_read_mailbox_demo'],
    proofReplayable: true,
    receiptHash: 'sha256:93aa0e4fbb1122334455667788990011223344556677889900aabbccddeeff00',
    blast: { targetNode: 'endpoint://mbx-42', reachableCount: 1, hops: 1 },
  },
];
