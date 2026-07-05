// Fixture for the Feedly-style News reader (/news). Conforms to the canonical
// feed-intelligence contracts (FeedSource / FeedItem) so it can be swapped for a
// live intake lane later without touching the UI. UI-only; no live adapter.
import type { FeedSource, FeedItem, FeedFormat, StoragePolicy, MembraneDecision } from '../features/feed-intelligence/types';

function src(id: string, title: string, format: FeedFormat, scope: string, storagePolicy: StoragePolicy = 'localFirstSync'): FeedSource {
  return { id, title, url: `https://feeds.local/${id}`, format, scope, storagePolicy, status: 'active', lastSeen: '2026-07-03T13:55:00-04:00' };
}

export const newsSources: FeedSource[] = [
  src('src-world', 'World Wire', 'rss', '/news/global'),
  src('src-tech', 'Tech & AI', 'atom', '/news/technology'),
  src('src-markets', 'Markets Desk', 'jsonFeed', '/economy/markets', 'hostedPrivate'),
  src('src-reg', 'Regulatory Watch', 'rss', '/law/regulatory-watch'),
  src('src-capture', 'BearBrowser Captures', 'htmlFallback', '/capture/browser', 'localOnly'),
];

let seq = 0;
function item(
  sourceId: string,
  title: string,
  summary: string,
  publishedAt: string,
  topicScope: string,
  entities: string[],
  opts: { membraneDecision?: MembraneDecision; claims?: string[] } = {},
): FeedItem {
  seq += 1;
  const id = `news-${String(seq).padStart(3, '0')}`;
  return {
    id,
    sourceId,
    title,
    summary,
    canonicalUrl: `https://source.local/${id}`,
    publishedAt,
    normalizedAt: publishedAt,
    topicScope,
    membraneDecision: opts.membraneDecision ?? 'admit',
    storagePolicy: 'localFirstSync',
    provenanceHash: `sha256:${id}${sourceId}`.padEnd(24, '0'),
    eventRefs: [`eventlog://item.normalized/${id}`],
    entities,
    claims: opts.claims ?? [],
  };
}

// Newest first. Times are relative to the 2026-07-03 afternoon "now".
export const newsItems: FeedItem[] = [
  item('src-world', 'Coalition reaches framework on cross-border data flows', 'Negotiators announced a provisional agreement covering transfer safeguards and adequacy review, with ratification expected before the autumn session.', '2026-07-03T13:40:00-04:00', '/news/global', ['EU', 'Data Transfer Pact', 'Commission'], { claims: ['Framework is provisional pending ratification.'] }),
  item('src-tech', 'On-device 3B models close the gap with server tiers on reasoning benchmarks', 'A new evaluation shows quantized on-device models matching larger hosted models on multi-step tasks when paired with verified-compute checks.', '2026-07-03T13:12:00-04:00', '/news/technology', ['On-device AI', 'Benchmarks', 'Quantization'], { claims: ['Verified-compute pairing drives the gain, not raw scale.'] }),
  item('src-markets', 'Equities drift as yields hold; energy leads on supply tightening', 'Broad indices were little changed into the afternoon while energy names outperformed on inventory data. Rate-path expectations were largely unchanged.', '2026-07-03T12:50:00-04:00', '/economy/markets', ['Equities', 'Energy', 'Rates']),
  item('src-reg', 'Agency opens comment period on model-provenance disclosure rule', 'The proposed rule would require deployers to attach verifiable provenance to automated decisions above a risk threshold. Comments close in 60 days.', '2026-07-02T12:20:00-04:00', '/law/regulatory-watch', ['Provenance Rule', 'Automated Decisions'], { membraneDecision: 'hold', claims: ['Applies only above the risk threshold.'] }),
  item('src-tech', 'Sovereign forge pattern gains traction for local-first teams', 'Self-hosted Git plus a thin control plane is emerging as a default for teams that want to keep source and CI on-premises without losing ergonomics.', '2026-07-02T11:55:00-04:00', '/news/technology', ['Gitea', 'Local-first', 'CI']),
  item('src-world', 'Regional summit sets timeline for shared grid interconnect', 'Member states agreed on a phased timeline for a shared interconnect, citing resilience and price stability as primary drivers.', '2026-07-02T11:30:00-04:00', '/news/global', ['Grid', 'Summit', 'Energy Policy']),
  item('src-capture', 'Captured: research thread on retrieval-augmented reasoning', 'Local BearBrowser capture of a long thread comparing graph retrieval to dense passage retrieval for multi-hop questions. Stored local-only.', '2026-07-01T11:05:00-04:00', '/capture/browser', ['RAG', 'GraphRAG', 'Retrieval'], { membraneDecision: 'quarantine', claims: ['Held local-only pending review.'] }),
  item('src-markets', 'Credit spreads narrow as issuance calendar clears', 'Investment-grade spreads tightened after a heavy week of supply was absorbed cleanly, signaling steady demand into quarter-end.', '2026-07-01T10:40:00-04:00', '/economy/markets', ['Credit', 'Spreads', 'Issuance']),
  item('src-tech', 'Terminal-in-browser tools converge on the Cloud Shell pattern', 'Vendors are standardizing on a dropdown terminal with pop-out, echoing the Quake-style console and Google Cloud Shell chrome.', '2026-06-30T10:15:00-04:00', '/news/technology', ['Cloud Shell', 'Terminal', 'DX']),
  item('src-reg', 'Cross-jurisdiction working group publishes audit-trail guidance', 'Guidance recommends hash-sealed, replayable audit trails for high-stakes automation, aligning with several existing evidence frameworks.', '2026-06-30T09:45:00-04:00', '/law/regulatory-watch', ['Audit Trail', 'Evidence', 'Compliance']),
  item('src-world', 'Humanitarian corridor reopens after logistics agreement', 'Aid convoys resumed after parties agreed on inspection and routing terms, according to coordinating agencies on the ground.', '2026-06-30T09:10:00-04:00', '/news/global', ['Humanitarian', 'Logistics']),
  item('src-markets', 'Commodities: metals firm on restocking, grains ease', 'Industrial metals rose on restocking demand while grain complexes softened on favorable weather forecasts across key growing regions.', '2026-06-29T08:30:00-04:00', '/economy/markets', ['Commodities', 'Metals', 'Grains']),
  item('src-tech', 'Open courseware corpora become a base layer for domain models', 'Teams are capturing openly licensed courseware to ground domain models, treating the commons as a knowledge base rather than training exhaust.', '2026-06-29T07:50:00-04:00', '/news/technology', ['Open Courseware', 'Knowledge Base', 'Domain Models']),
  item('src-capture', 'Captured: standards page on canonical event envelopes', 'Local capture of a specification page describing canonical event envelopes and derived RSS/Atom/JSON Feed views. Stored local-only.', '2026-06-29T07:05:00-04:00', '/capture/browser', ['Event Envelope', 'Standards'], { membraneDecision: 'admit' }),
];
