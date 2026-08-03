#!/usr/bin/env node
/**
 * verify-delivery-snapshot.mjs — the CI gate.
 *
 * TWO CLASSES OF GATE, deliberately separated:
 *
 *  INTEGRITY gates block publication. They ask "can this snapshot be trusted at
 *  all?" — was it computed from live evidence, does it carry a receipt, does any
 *  metric claim a 'measured' basis it cannot support. A snapshot failing these
 *  would misinform, so it must not ship.
 *
 *  HEALTH gates do NOT block publication. They ask "is delivery going well?" —
 *  aging WIP, WIP limits, whether the backlog is prioritized. These are the
 *  findings the dashboard exists to surface. Blocking on them would suppress the
 *  dashboard exactly when it is most needed, which is backwards.
 *
 * FAILS CLOSED on integrity. Reports loudly on health.
 */
import fs from 'node:fs';

const FILE = process.argv[2] || 'src/data/deliverySnapshot.ts';
const src = fs.readFileSync(FILE, 'utf8');
const start = src.indexOf('= {') + 2;
const end = src.lastIndexOf('} as const');
if (start < 2 || end < 0) { console.error('INTEGRITY FAIL: cannot parse the generated snapshot.'); process.exit(1); }
const snap = JSON.parse(src.slice(start, end + 1));

const INTEGRITY_GATES = new Set(['Evidence collected']);

const integrity = [];
const health = [];

if (snap.sourceMode !== 'live') integrity.push(`sourceMode is '${snap.sourceMode}' — live evidence was not collected.`);
if (!snap.commit || snap.commit === 'unknown') integrity.push('snapshot carries no commit receipt.');

for (const m of snap.metrics ?? []) {
  if (typeof m.value !== 'number' || Number.isNaN(m.value)) integrity.push(`metric '${m.id}' has a non-numeric value.`);
  if (m.basis === 'measured' && !String(m.evidence ?? '').trim()) integrity.push(`metric '${m.id}' claims 'measured' with no evidence ref — fabricated basis.`);
  if (m.basis !== 'measured' && !String(m.evidence ?? '').trim()) health.push(`metric '${m.id}' asserts a value with no evidence ref (unverified).`);
}
for (const g of snap.gates ?? []) {
  if (g.status !== 'fail') continue;
  (INTEGRITY_GATES.has(g.name) ? integrity : health).push(`gate '${g.name}': ${g.detail}`);
}

if (integrity.length) {
  console.error('DELIVERY SNAPSHOT — INTEGRITY GATE: FAIL (closed, not published)');
  for (const f of integrity) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`DELIVERY SNAPSHOT — INTEGRITY GATE: PASS (${snap.metrics.length} metrics, receipt ${snap.commit.slice(0, 7)})`);
if (health.length) {
  console.log(`DELIVERY HEALTH: ${health.length} finding(s) — published so they are visible, not suppressed:`);
  for (const f of health) console.log(`  ! ${f}`);
} else {
  console.log('DELIVERY HEALTH: no findings.');
}
