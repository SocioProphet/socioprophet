/**
 * Community derivation for the News reader (Lobsters × Feedly).
 *
 * The canonical FeedItem carries the Feedly half (source, title, provenance,
 * membrane decision). The Lobsters half — score, tags, submitter, hats, comment
 * count, and a truth/quality signal — is derived here as a PRESENTATION layer so
 * the shared feed-intelligence contract stays untouched. Everything is
 * deterministic (seeded off the item id) so fixtures render identically across
 * runs, and the two signals that CAN be grounded in real data are:
 *   - tags        ← topicScope path + first entity (the real slashtag lens)
 *   - quality     ← membraneDecision (admit/hold/quarantine/reject)
 * A live intake lane can later replace this module with real vote/comment state
 * without touching the page.
 */
import type { FeedItem, MembraneDecision } from './types';

export type HatKind = 'mod' | 'sme' | 'source';
export type Hat = { label: string; kind: HatKind };

export type StoryMeta = {
  score: number;
  tags: string[];
  submitter: string;
  hat: Hat | null;
  comments: number;
  quality: number; // 0..1 truth/quality signal
  qualityBand: 'high' | 'medium' | 'low';
};

/** The Lobsters downvote taxonomy — a downvote on a COMMENT must pick a reason. */
export const DOWNVOTE_REASONS = ['off-topic', 'incorrect', 'me-too', 'troll', 'spam'] as const;
export type DownvoteReason = (typeof DOWNVOTE_REASONS)[number];

/** Stories are never downvoted (upvote/tag only) — they can be flagged with a reason. */
export const FLAG_REASONS = ['off-topic', 'incorrect', 'spam', 'already-posted', 'low-quality'] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];

const HANDLES = [
  'ada', 'grace', 'linus', 'margaret', 'dijkstra', 'hopper', 'turing', 'lovelace',
  'knuth', 'rossum', 'karpathy', 'norvig', 'stallman', 'torvalds', 'berners',
];
const HATS: Hat[] = [
  { label: 'moderator', kind: 'mod' },
  { label: 'domain expert', kind: 'sme' },
  { label: 'verified source', kind: 'source' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Real slashtags for a story: last segment(s) of the topic scope + first entity. */
export function tagsFor(it: FeedItem): string[] {
  const out: string[] = [];
  for (const seg of it.topicScope.split('/')) {
    const s = slug(seg);
    if (s && s !== 'news') out.push(s);
  }
  if (it.entities[0]) out.push(slug(it.entities[0]));
  return [...new Set(out)].slice(0, 3);
}

const QUALITY_BASE: Record<MembraneDecision, number> = {
  admit: 0.82,
  hold: 0.58,
  quarantine: 0.32,
  reject: 0.12,
};

/** Truth/quality signal grounded in the membrane decision + deterministic jitter. */
export function qualityFor(it: FeedItem): number {
  const base = QUALITY_BASE[it.membraneDecision];
  const jitter = ((hash(it.id) % 13) - 6) / 100; // ±0.06
  return Math.min(0.99, Math.max(0.02, +(base + jitter).toFixed(2)));
}

export function bandFor(quality: number): StoryMeta['qualityBand'] {
  if (quality >= 0.7) return 'high';
  if (quality >= 0.45) return 'medium';
  return 'low';
}

export function storyMeta(it: FeedItem): StoryMeta {
  const h = hash(it.id);
  const quality = qualityFor(it);
  // Score leans on quality so trusted stories rise — the Lobsters "hot" instinct.
  const score = Math.round(4 + (h % 90) + quality * 160);
  const submitter = HANDLES[h % HANDLES.length]!;
  const hat = h % 4 === 0 ? HATS[h % HATS.length]! : null;
  const comments = h % 5 === 0 ? 0 : (h >> 3) % 84;
  return { score, tags: tagsFor(it), submitter, hat, comments, quality, qualityBand: bandFor(quality) };
}
