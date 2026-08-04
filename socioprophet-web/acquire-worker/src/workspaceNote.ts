// Workspace-note sink — lands acquired documents as prophet-workspace Notes, which is the capture
// surface GooseNotes (Rust/Tauri) renders. GooseNotes has no data model of its own; it's a thin shell
// over the prophet-workspace contracts, so the correct, no-Rust integration is to EMIT a conforming
// Note. An acquired page is a `clip` note with sourceType 'url'; SynapseIQ enrichment becomes the
// note's aiSummary + labels. Conforms to prophet-workspace/contracts/notes/note.schema.json (v0.1).
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sink, LandedRecord } from './sinks';

// The complete allowed key set from note.schema.v0.1 (additionalProperties:false). We only emit a
// subset, but the sink must never emit a key outside this set — the test enforces it.
export const NOTE_ALLOWED_KEYS = [
  'schemaVersion', 'noteId', 'accountRef', 'title', 'bodyText', 'bodyHtml', 'noteType', 'checklistItems',
  'status', 'isPinned', 'color', 'labels', 'attachments', 'reminder', 'collaborators', 'shareMode',
  'sourceRef', 'sourceType', 'eventRef', 'mailThreadRefs', 'taskRefs', 'noteRefs', 'workroomRef',
  'driveFileRef', 'aiSummary', 'memoryRef', 'createdAt', 'updatedAt', 'policyRefs',
] as const;

export interface Note {
  schemaVersion: 'v0.1';
  noteId: string;
  accountRef: string;
  title: string;
  status: 'active' | 'archived' | 'trashed';
  createdAt: string;
  bodyText?: string;
  bodyHtml?: string;
  noteType?: 'freeform' | 'checklist' | 'meeting_notes' | 'clip' | 'voice_transcript';
  labels?: string[];
  sourceRef?: string;
  sourceType?: 'mail' | 'calendar_event' | 'doc' | 'url' | 'voice' | 'manual';
  aiSummary?: string;
  memoryRef?: string;
}

export interface NoteSinkOptions {
  accountRef?: string;   // whose workspace these land in (default WORKSPACE_ACCOUNT_REF or 'sovereign')
  maxBody?: number;      // truncate stored body (default 200k chars)
}

const TITLE_RE = /<title[^>]*>([^<]{1,200})<\/title>/i;
const H1_RE = /<h1[^>]*>([^<]{1,200})<\/h1>/i;

function deriveTitle(body: string, url: string): string {
  const t = TITLE_RE.exec(body)?.[1] ?? H1_RE.exec(body)?.[1];
  if (t) return t.trim().replace(/\s+/g, ' ');
  try { const u = new URL(url); return `${u.host}${u.pathname}`.slice(0, 120); } catch { return url.slice(0, 120); }
}

function looksHtml(body: string): boolean { return /<\s*(html|body|div|p|h[1-6]|article)\b/i.test(body.slice(0, 2000)); }
function stripHtml(body: string): string {
  return body.replace(/<head[\s\S]*?<\/head>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Compose a human aiSummary from the SynapseIQ enrichment (entities + language), when present.
function summaryFromEnrichment(e: LandedRecord['enrichment']): string | undefined {
  if (!e) return undefined;
  const bits: string[] = [];
  if (e.language) bits.push(`lang ${e.language}`);
  if (e.entities?.length) bits.push(`${e.entities.length} entities: ${e.entities.slice(0, 8).map((x) => x.text).join(', ')}`);
  return bits.length ? `SynapseIQ · ${bits.join(' · ')}` : undefined;
}

// Map a governed LandedRecord → a conforming prophet-workspace Note (clip from a URL).
export function landedToNote(rec: LandedRecord, opts: NoteSinkOptions = {}): Note {
  const p = rec.provenance;
  const body = rec.body ?? '';
  const html = looksHtml(body);
  const max = opts.maxBody ?? 200_000;
  const note: Note = {
    schemaVersion: 'v0.1',
    noteId: `acq-${(p.contentHash || p.url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`,
    accountRef: opts.accountRef ?? process.env['WORKSPACE_ACCOUNT_REF'] ?? 'sovereign',
    title: deriveTitle(body, p.url),
    status: 'active',
    createdAt: p.fetchedAt,
    noteType: 'clip',
    sourceType: 'url',
    sourceRef: p.url,
    labels: ['acquired', `tier:${p.tier}`, `posture:${p.posture}`, `egress:${p.egress.class}`],
    memoryRef: p.contentHash || undefined,   // cross-links to the mesh evidence record (same hash)
  };
  if (body) {
    if (html) { note.bodyHtml = body.slice(0, max); note.bodyText = stripHtml(body).slice(0, max); }
    else { note.bodyText = body.slice(0, max); }
  }
  const summary = summaryFromEnrichment(rec.enrichment);
  if (summary) note.aiSummary = summary;
  return note;
}

// Lands each acquired record as a conforming Note JSON in an inbox directory the Office Plane /
// GooseNotes ingests. Content-addressed filename → idempotent re-landing.
export class WorkspaceNoteSink implements Sink {
  readonly name: string;
  constructor(private dir: string, private opts: NoteSinkOptions = {}) { this.name = `note:${dir}`; }
  async write(rec: LandedRecord): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const note = landedToNote(rec, this.opts);
    await writeFile(join(this.dir, `${note.noteId}.note.json`), JSON.stringify(note, null, 2));
  }
}
