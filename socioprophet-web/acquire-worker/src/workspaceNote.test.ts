// Conformance tests for the workspace-note sink — an acquired LandedRecord must map to a Note that
// conforms to prophet-workspace/contracts/notes/note.schema.json (v0.1): required fields present,
// no key outside the allowed set (additionalProperties:false), valid enums.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landedToNote, NOTE_ALLOWED_KEYS, WorkspaceNoteSink } from './workspaceNote.ts';
import type { LandedRecord } from './sinks.ts';
import type { ProvenanceRecord } from '../../client-vue/src/features/acquisition/policy.ts';

const prov = (o: Partial<ProvenanceRecord> = {}): ProvenanceRecord => ({
  sourceId: 'src', url: 'https://ex.test/article', fetchedAt: '2026-08-04T00:00:00Z', httpStatus: 200,
  contentHash: 'sha256:abc123', tier: 'T1', renderMode: 'http', egress: { class: 'residential', geo: 'US' },
  posture: 'advisory', policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' },
  override: null, accountClass: 'sovereign', warnings: [], ...o,
});
const REQUIRED = ['schemaVersion', 'noteId', 'accountRef', 'title', 'status', 'createdAt'];

test('landedToNote emits a schema-conforming clip note', () => {
  const rec: LandedRecord = { provenance: prov(), body: '<html><head><title>Hello World</title></head><body><p>hi there</p></body></html>' };
  const note = landedToNote(rec, { accountRef: 'acct-1' });
  // required present
  for (const k of REQUIRED) assert.ok((note as Record<string, unknown>)[k] !== undefined, `missing required ${k}`);
  // no key outside the allowed set (additionalProperties:false)
  for (const k of Object.keys(note)) assert.ok((NOTE_ALLOWED_KEYS as readonly string[]).includes(k), `illegal key ${k}`);
  // valid enums + mapping
  assert.equal(note.schemaVersion, 'v0.1');
  assert.equal(note.noteType, 'clip');
  assert.equal(note.sourceType, 'url');
  assert.equal(note.sourceRef, 'https://ex.test/article');
  assert.equal(note.status, 'active');
  assert.equal(note.title, 'Hello World');           // pulled from <title>
  assert.equal(note.bodyText, 'hi there');           // HTML stripped for text body
  assert.ok(note.bodyHtml?.includes('<p>'));         // HTML preserved
  assert.equal(note.memoryRef, 'sha256:abc123');     // cross-links the mesh evidence record
  assert.equal(note.accountRef, 'acct-1');
  assert.ok(note.labels?.includes('acquired') && note.labels?.includes('tier:T1'));
});

test('SynapseIQ enrichment becomes the note aiSummary', () => {
  const rec: LandedRecord = {
    provenance: prov(), body: 'plain text body',
    enrichment: { enricher: 'synapseiq', enrichedAt: '2026-08-04T00:00:00Z', language: 'en', entities: [{ text: 'Acme', type: 'org' }, { text: 'Paris', type: 'place' }] },
  };
  const note = landedToNote(rec);
  assert.ok(note.aiSummary?.startsWith('SynapseIQ'));
  assert.ok(note.aiSummary?.includes('lang en'));
  assert.ok(note.aiSummary?.includes('Acme'));
  assert.equal(note.bodyText, 'plain text body');    // non-HTML body kept as text, no bodyHtml
  assert.equal(note.bodyHtml, undefined);
});

test('noteId is content-addressed (idempotent re-landing)', () => {
  const a = landedToNote({ provenance: prov(), body: 'x' });
  const b = landedToNote({ provenance: prov(), body: 'y' }); // same url+hash → same id
  assert.equal(a.noteId, b.noteId);
  assert.ok(a.noteId.startsWith('acq-'));
});

test('WorkspaceNoteSink names itself by its inbox dir', () => {
  assert.equal(new WorkspaceNoteSink('./inbox').name, 'note:./inbox');
});
