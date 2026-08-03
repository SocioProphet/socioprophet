#!/usr/bin/env node
/**
 * verify-delivery-snapshot.mjs — the CI gate.
 *
 * FAILS CLOSED. A snapshot may only be published as delivery status when it was
 * computed from live evidence and every asserted value carries an evidence ref.
 * This is what stops the dashboard reporting a number nobody can reproduce.
 */
import fs from 'node:fs';

const FILE = process.argv[2] || 'src/data/deliverySnapshot.ts';
const src = fs.readFileSync(FILE, 'utf8');
const start = src.indexOf('= {') + 2;
const end = src.lastIndexOf('} as const');
if (start < 2 || end < 0) {
  console.error('FAIL: could not parse the generated snapshot.');
  process.exit(1);
}
const snap = JSON.parse(src.slice(start, end + 1));

const failures = [];

if (snap.sourceMode !== 'live') {
  failures.push(`sourceMode is '${snap.sourceMode}' — live merge evidence was not collected.`);
}
if (!snap.commit || snap.commit === 'unknown') {
  failures.push('snapshot carries no commit receipt.');
}
for (const m of snap.metrics ?? []) {
  if (m.basis !== 'measured' && !String(m.evidence ?? '').trim()) {
    failures.push(`metric '${m.id}' has basis '${m.basis}' and no evidence ref.`);
  }
  if (typeof m.value !== 'number' || Number.isNaN(m.value)) {
    failures.push(`metric '${m.id}' has a non-numeric value.`);
  }
}
for (const g of snap.gates ?? []) {
  if (g.status === 'fail') failures.push(`gate '${g.name}' is failing: ${g.detail}`);
}
// A live snapshot must not claim a measured basis with an empty evidence ref.
const bogus = (snap.metrics ?? []).filter((m) => m.basis === 'measured' && !String(m.evidence ?? '').trim());
if (bogus.length) failures.push(`${bogus.length} metric(s) claim 'measured' with no evidence — fabricated basis.`);

if (failures.length) {
  console.error('DELIVERY SNAPSHOT GATE: FAIL (closed)');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`DELIVERY SNAPSHOT GATE: PASS — ${snap.metrics.length} measured metrics at ${snap.commit.slice(0, 7)}.`);
