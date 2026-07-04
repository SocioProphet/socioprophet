// Fixture for the People & Society directory (/people/search) + OSINT footprint.
// UI-only. A future identity/entity-resolution + OSINT collection lane can
// populate the same shapes (accounts / selectors / sources), scope-governed.
export type EntityKind = 'person' | 'org' | 'place' | 'gov';

export interface Relation { to: string; label: string }

export type Platform = 'x' | 'linkedin' | 'github' | 'mastodon' | 'telegram' | 'web';
export interface SocialAccount { platform: Platform; handle: string; url: string; followers?: number; verified?: boolean; lastActive?: string }

export type SelectorKind = 'email' | 'username' | 'domain' | 'phone';
export interface Selector { kind: SelectorKind; value: string; masked?: boolean }

export type SourceKind = 'news' | 'registry' | 'social' | 'leak' | 'domain' | 'filing';
export interface OsintSource { name: string; kind: SourceKind; confidence: number }

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  role: string;
  affiliation: string;
  location: string;
  tags: string[];
  confidence: number;      // 0..1 resolution confidence
  sources: number;         // corroborating sources
  summary: string;
  relations: Relation[];
  accounts: SocialAccount[];
  selectors: Selector[];
  osint: OsintSource[];
}

export const entities: Entity[] = [
  {
    id: 'p-avery', name: 'Avery Sloan', kind: 'person', role: 'Chief Economist', affiliation: 'Meridian Institute', location: 'Washington, DC', tags: ['macro', 'policy', 'speaker'], confidence: 0.94, sources: 12,
    summary: 'Macro economist focused on labor and monetary policy; frequent commentator on rate-path and disinflation.',
    relations: [{ to: 'o-meridian', label: 'employed by' }, { to: 'p-rao', label: 'co-author' }, { to: 'g-fed', label: 'advises' }],
    accounts: [
      { platform: 'x', handle: '@averysloan', url: 'https://x.com/averysloan', followers: 48200, verified: true, lastActive: '2h' },
      { platform: 'linkedin', handle: 'in/avery-sloan', url: 'https://linkedin.com/in/avery-sloan', followers: 15300, verified: true, lastActive: '3d' },
      { platform: 'web', handle: 'averysloan.econ', url: 'https://averysloan.econ', lastActive: '1w' },
    ],
    selectors: [{ kind: 'email', value: 'a.sloan@meridian.org' }, { kind: 'username', value: 'averysloan' }, { kind: 'email', value: 'a•••@proton.me', masked: true }],
    osint: [{ name: 'Meridian staff page', kind: 'registry', confidence: 0.98 }, { name: 'Conference panel bio', kind: 'news', confidence: 0.9 }, { name: 'X profile + posts', kind: 'social', confidence: 0.88 }],
  },
  {
    id: 'p-rao', name: 'Devi Rao', kind: 'person', role: 'Portfolio Manager', affiliation: 'Northwind Capital', location: 'New York, NY', tags: ['markets', 'fixed-income'], confidence: 0.9, sources: 9,
    summary: 'Fixed-income PM; runs a rates-and-credit book. Known for curve-positioning commentary.',
    relations: [{ to: 'o-northwind', label: 'employed by' }, { to: 'p-avery', label: 'co-author' }],
    accounts: [
      { platform: 'x', handle: '@devirao', url: 'https://x.com/devirao', followers: 22100, verified: false, lastActive: '5h' },
      { platform: 'linkedin', handle: 'in/devi-rao', url: 'https://linkedin.com/in/devi-rao', followers: 8700, verified: true, lastActive: '1d' },
    ],
    selectors: [{ kind: 'email', value: 'd.rao@northwind.com' }, { kind: 'username', value: 'devirao' }],
    osint: [{ name: 'Northwind team page', kind: 'registry', confidence: 0.95 }, { name: 'SEC ADV filing', kind: 'filing', confidence: 0.86 }, { name: 'Podcast appearance', kind: 'news', confidence: 0.78 }],
  },
  {
    id: 'p-okafor', name: 'Tunde Okafor', kind: 'person', role: 'Regulatory Counsel', affiliation: 'Office of Data Governance', location: 'Brussels', tags: ['regulation', 'privacy', 'AI'], confidence: 0.88, sources: 7,
    summary: 'Regulatory counsel working on automated-decision provenance rules and cross-border data transfer.',
    relations: [{ to: 'g-odg', label: 'employed by' }, { to: 'o-meridian', label: 'testified before' }],
    accounts: [
      { platform: 'mastodon', handle: '@tokafor@eupol.social', url: 'https://eupol.social/@tokafor', followers: 3400, lastActive: '1d' },
      { platform: 'linkedin', handle: 'in/tunde-okafor', url: 'https://linkedin.com/in/tunde-okafor', followers: 6100, verified: true, lastActive: '4d' },
    ],
    selectors: [{ kind: 'email', value: 't.okafor@odg.gov.eu' }, { kind: 'domain', value: 'odg.gov.eu' }, { kind: 'phone', value: '+32 •• ••• •••', masked: true }],
    osint: [{ name: 'ODG staff directory', kind: 'registry', confidence: 0.93 }, { name: 'Rule comment docket', kind: 'filing', confidence: 0.84 }],
  },
  {
    id: 'p-lindqvist', name: 'Maja Lindqvist', kind: 'person', role: 'Grid Policy Lead', affiliation: 'Interconnect Council', location: 'Stockholm', tags: ['energy', 'infrastructure'], confidence: 0.85, sources: 6,
    summary: 'Leads shared-grid interconnect policy; drove the recent phased-timeline agreement.',
    relations: [{ to: 'o-interconnect', label: 'employed by' }],
    accounts: [
      { platform: 'x', handle: '@mlindqvist', url: 'https://x.com/mlindqvist', followers: 9800, verified: false, lastActive: '2d' },
      { platform: 'web', handle: 'interconnect.eu/maja', url: 'https://interconnect.eu/maja', lastActive: '2w' },
    ],
    selectors: [{ kind: 'email', value: 'm.lindqvist@interconnect.eu' }, { kind: 'username', value: 'mlindqvist' }],
    osint: [{ name: 'Interconnect Council page', kind: 'registry', confidence: 0.9 }, { name: 'Grid directive coverage', kind: 'news', confidence: 0.8 }],
  },
  {
    id: 'p-mercer', name: 'Jonah Mercer', kind: 'person', role: 'Field Coordinator', affiliation: 'Relief Corridor', location: 'Amman', tags: ['humanitarian', 'logistics'], confidence: 0.79, sources: 5,
    summary: 'Coordinates humanitarian logistics; involved in the corridor reopening agreement.',
    relations: [{ to: 'o-relief', label: 'employed by' }],
    accounts: [
      { platform: 'telegram', handle: '@jmercer_field', url: 'https://t.me/jmercer_field', lastActive: '6h' },
      { platform: 'x', handle: '@jonahmercer', url: 'https://x.com/jonahmercer', followers: 4100, verified: false, lastActive: '1d' },
    ],
    selectors: [{ kind: 'email', value: 'j•••@relief.org', masked: true }, { kind: 'username', value: 'jonahmercer' }],
    osint: [{ name: 'Relief Corridor roster', kind: 'registry', confidence: 0.82 }, { name: 'Field dispatch (social)', kind: 'social', confidence: 0.7 }],
  },
  {
    id: 'o-meridian', name: 'Meridian Institute', kind: 'org', role: 'Policy think tank', affiliation: '—', location: 'Washington, DC', tags: ['policy', 'research'], confidence: 0.96, sources: 18,
    summary: 'Nonpartisan economic-policy institute; publishes macro research and testimony.',
    relations: [{ to: 'p-avery', label: 'employs' }, { to: 'g-fed', label: 'briefs' }],
    accounts: [
      { platform: 'x', handle: '@meridian_inst', url: 'https://x.com/meridian_inst', followers: 132000, verified: true, lastActive: '1h' },
      { platform: 'linkedin', handle: 'company/meridian-institute', url: 'https://linkedin.com/company/meridian-institute', followers: 54000, verified: true, lastActive: '2d' },
      { platform: 'web', handle: 'meridian.org', url: 'https://meridian.org' },
    ],
    selectors: [{ kind: 'domain', value: 'meridian.org' }, { kind: 'email', value: 'press@meridian.org' }],
    osint: [{ name: 'Corporate registry', kind: 'registry', confidence: 0.99 }, { name: 'Domain WHOIS', kind: 'domain', confidence: 0.94 }],
  },
  {
    id: 'o-northwind', name: 'Northwind Capital', kind: 'org', role: 'Asset manager', affiliation: '—', location: 'New York, NY', tags: ['markets', 'fixed-income'], confidence: 0.93, sources: 14,
    summary: 'Fixed-income focused asset manager.',
    relations: [{ to: 'p-rao', label: 'employs' }],
    accounts: [
      { platform: 'linkedin', handle: 'company/northwind-capital', url: 'https://linkedin.com/company/northwind-capital', followers: 21000, verified: true, lastActive: '3d' },
      { platform: 'web', handle: 'northwind.com', url: 'https://northwind.com' },
    ],
    selectors: [{ kind: 'domain', value: 'northwind.com' }],
    osint: [{ name: 'SEC IARD registration', kind: 'filing', confidence: 0.96 }, { name: 'Domain WHOIS', kind: 'domain', confidence: 0.9 }],
  },
  {
    id: 'o-interconnect', name: 'Interconnect Council', kind: 'org', role: 'Standards body', affiliation: '—', location: 'Stockholm', tags: ['energy', 'grid'], confidence: 0.9, sources: 8,
    summary: 'Coordinates regional grid-interconnect standards and timelines.',
    relations: [{ to: 'p-lindqvist', label: 'employs' }],
    accounts: [{ platform: 'web', handle: 'interconnect.eu', url: 'https://interconnect.eu' }],
    selectors: [{ kind: 'domain', value: 'interconnect.eu' }],
    osint: [{ name: 'EU transparency register', kind: 'registry', confidence: 0.92 }],
  },
  {
    id: 'g-fed', name: 'Central Bank', kind: 'gov', role: 'Monetary authority', affiliation: '—', location: 'Washington, DC', tags: ['policy', 'rates'], confidence: 0.97, sources: 22,
    summary: 'Sets the policy rate; on hold with a data-dependent cut path.',
    relations: [{ to: 'o-meridian', label: 'briefed by' }, { to: 'p-avery', label: 'advised by' }],
    accounts: [
      { platform: 'x', handle: '@centralbank', url: 'https://x.com/centralbank', followers: 890000, verified: true, lastActive: '30m' },
      { platform: 'web', handle: 'centralbank.gov', url: 'https://centralbank.gov' },
    ],
    selectors: [{ kind: 'domain', value: 'centralbank.gov' }],
    osint: [{ name: 'Official press releases', kind: 'registry', confidence: 0.99 }],
  },
  {
    id: 'g-odg', name: 'Office of Data Governance', kind: 'gov', role: 'Regulator', affiliation: '—', location: 'Brussels', tags: ['regulation', 'AI', 'privacy'], confidence: 0.91, sources: 10,
    summary: 'Regulator issuing model-provenance disclosure and audit-trail guidance.',
    relations: [{ to: 'p-okafor', label: 'employs' }],
    accounts: [
      { platform: 'mastodon', handle: '@odg@eupol.social', url: 'https://eupol.social/@odg', followers: 41000, verified: true, lastActive: '4h' },
      { platform: 'web', handle: 'odg.gov.eu', url: 'https://odg.gov.eu' },
    ],
    selectors: [{ kind: 'domain', value: 'odg.gov.eu' }],
    osint: [{ name: 'EU institutional registry', kind: 'registry', confidence: 0.95 }, { name: 'Rule dockets', kind: 'filing', confidence: 0.88 }],
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
