// Fixture for the People & Society directory (/people/search). UI-only.
// A future identity/entity-resolution lane can populate the same Entity shape.
export type EntityKind = 'person' | 'org' | 'place' | 'gov';

export interface Relation { to: string; label: string }

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
}

export const entities: Entity[] = [
  { id: 'p-avery', name: 'Avery Sloan', kind: 'person', role: 'Chief Economist', affiliation: 'Meridian Institute', location: 'Washington, DC', tags: ['macro', 'policy', 'speaker'], confidence: 0.94, sources: 12, summary: 'Macro economist focused on labor and monetary policy; frequent commentator on rate-path and disinflation.', relations: [{ to: 'o-meridian', label: 'employed by' }, { to: 'p-rao', label: 'co-author' }, { to: 'g-fed', label: 'advises' }] },
  { id: 'p-rao', name: 'Devi Rao', kind: 'person', role: 'Portfolio Manager', affiliation: 'Northwind Capital', location: 'New York, NY', tags: ['markets', 'fixed-income'], confidence: 0.9, sources: 9, summary: 'Fixed-income PM; runs a rates-and-credit book. Known for curve-positioning commentary.', relations: [{ to: 'o-northwind', label: 'employed by' }, { to: 'p-avery', label: 'co-author' }] },
  { id: 'p-okafor', name: 'Tunde Okafor', kind: 'person', role: 'Regulatory Counsel', affiliation: 'Office of Data Governance', location: 'Brussels', tags: ['regulation', 'privacy', 'AI'], confidence: 0.88, sources: 7, summary: 'Regulatory counsel working on automated-decision provenance rules and cross-border data transfer.', relations: [{ to: 'g-odg', label: 'employed by' }, { to: 'o-meridian', label: 'testified before' }] },
  { id: 'p-lindqvist', name: 'Maja Lindqvist', kind: 'person', role: 'Grid Policy Lead', affiliation: 'Interconnect Council', location: 'Stockholm', tags: ['energy', 'infrastructure'], confidence: 0.85, sources: 6, summary: 'Leads shared-grid interconnect policy; drove the recent phased-timeline agreement.', relations: [{ to: 'o-interconnect', label: 'employed by' }, { to: 'pl-stockholm', label: 'based in' }] },
  { id: 'p-mercer', name: 'Jonah Mercer', kind: 'person', role: 'Field Coordinator', affiliation: 'Relief Corridor', location: 'Amman', tags: ['humanitarian', 'logistics'], confidence: 0.79, sources: 5, summary: 'Coordinates humanitarian logistics; involved in the corridor reopening agreement.', relations: [{ to: 'o-relief', label: 'employed by' }] },
  { id: 'o-meridian', name: 'Meridian Institute', kind: 'org', role: 'Policy think tank', affiliation: '—', location: 'Washington, DC', tags: ['policy', 'research'], confidence: 0.96, sources: 18, summary: 'Nonpartisan economic-policy institute; publishes macro research and testimony.', relations: [{ to: 'p-avery', label: 'employs' }, { to: 'g-fed', label: 'briefs' }] },
  { id: 'o-northwind', name: 'Northwind Capital', kind: 'org', role: 'Asset manager', affiliation: '—', location: 'New York, NY', tags: ['markets', 'fixed-income'], confidence: 0.93, sources: 14, summary: 'Fixed-income focused asset manager.', relations: [{ to: 'p-rao', label: 'employs' }] },
  { id: 'o-interconnect', name: 'Interconnect Council', kind: 'org', role: 'Standards body', affiliation: '—', location: 'Stockholm', tags: ['energy', 'grid'], confidence: 0.9, sources: 8, summary: 'Coordinates regional grid-interconnect standards and timelines.', relations: [{ to: 'p-lindqvist', label: 'employs' }] },
  { id: 'g-fed', name: 'Central Bank', kind: 'gov', role: 'Monetary authority', affiliation: '—', location: 'Washington, DC', tags: ['policy', 'rates'], confidence: 0.97, sources: 22, summary: 'Sets the policy rate; on hold with a data-dependent cut path.', relations: [{ to: 'o-meridian', label: 'briefed by' }, { to: 'p-avery', label: 'advised by' }] },
  { id: 'g-odg', name: 'Office of Data Governance', kind: 'gov', role: 'Regulator', affiliation: '—', location: 'Brussels', tags: ['regulation', 'AI', 'privacy'], confidence: 0.91, sources: 10, summary: 'Regulator issuing model-provenance disclosure and audit-trail guidance.', relations: [{ to: 'p-okafor', label: 'employs' }] },
];

export const asOf = '2026-07-03T14:00:00-04:00';
