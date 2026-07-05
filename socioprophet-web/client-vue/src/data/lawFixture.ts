// Fixture for the Law & Regulation docket (/law/*). UI-only. A future legal-intake
// lane can populate the same Docket shape. Redline = ordered diff segments.
export type DocketType = 'rule' | 'bill' | 'case';
export type DocketStatus = 'comment' | 'pending' | 'enacted' | 'open';

export interface RedlineSeg { type: 'ctx' | 'add' | 'del'; text: string }

export interface Docket {
  id: string;
  cite: string;
  title: string;
  type: DocketType;
  jurisdiction: string;
  status: DocketStatus;
  updated: string;
  summary: string;
  provenanceHash: string;
  redline: RedlineSeg[];
}

export const dockets: Docket[] = [
  {
    id: 'd-provenance', cite: 'ODG-2026-114', title: 'Model-Provenance Disclosure Rule', type: 'rule', jurisdiction: 'Federal', status: 'comment', updated: '2026-07-03T12:20:00-04:00',
    summary: 'Would require deployers to attach verifiable provenance to automated decisions above a risk threshold. Comment period open (60 days).',
    provenanceHash: 'sha256:odg114…9c2', redline: [
      { type: 'ctx', text: '§ 4. Automated decision systems.' },
      { type: 'ctx', text: '(a) A deployer of an automated decision system shall—' },
      { type: 'del', text: '  (1) maintain internal documentation of the system’s logic.' },
      { type: 'add', text: '  (1) attach a verifiable provenance record to each decision above the risk threshold defined in § 2(c).' },
      { type: 'add', text: '  (2) make the provenance record available to the subject on request within 30 days.' },
      { type: 'ctx', text: '(b) The threshold in § 2(c) applies only to high-impact determinations.' },
    ],
  },
  {
    id: 'd-audit', cite: 'WG-AUD-07', title: 'Audit-Trail Guidance (Cross-Jurisdiction)', type: 'rule', jurisdiction: 'International', status: 'pending', updated: '2026-07-03T09:45:00-04:00',
    summary: 'Recommends hash-sealed, replayable audit trails for high-stakes automation; aligns with existing evidence frameworks.',
    provenanceHash: 'sha256:wgaud07…41a', redline: [
      { type: 'ctx', text: 'Recommendation 3 — Evidentiary retention.' },
      { type: 'del', text: '  Systems should retain logs for a reasonable period.' },
      { type: 'add', text: '  Systems shall retain hash-sealed, replayable audit trails sufficient to reconstruct each high-stakes decision.' },
      { type: 'ctx', text: 'Recommendation 4 — Interoperability with existing evidence frameworks.' },
    ],
  },
  {
    id: 'd-data', cite: 'HR-2026-882', title: 'Cross-Border Data Flows Framework Act', type: 'bill', jurisdiction: 'Federal', status: 'pending', updated: '2026-07-03T13:40:00-04:00',
    summary: 'Establishes transfer safeguards and an adequacy-review process; provisional framework pending ratification.',
    provenanceHash: 'sha256:hr882…7be', redline: [
      { type: 'ctx', text: 'Sec. 2. Transfer safeguards.' },
      { type: 'add', text: '  (a) A transfer to a third country is permitted only where an adequacy determination is in force.' },
      { type: 'add', text: '  (b) The Commission shall review adequacy determinations every three years.' },
      { type: 'ctx', text: 'Sec. 3. Effective date — upon ratification.' },
    ],
  },
  {
    id: 'd-grid', cite: 'IC-DIR-19', title: 'Shared Grid Interconnect Directive', type: 'rule', jurisdiction: 'Regional', status: 'enacted', updated: '2026-07-03T11:30:00-04:00',
    summary: 'Sets a phased timeline for a shared interconnect; cites resilience and price stability.',
    provenanceHash: 'sha256:icdir19…0d5', redline: [
      { type: 'ctx', text: 'Article 5. Phased timeline.' },
      { type: 'del', text: '  Interconnection shall be completed as soon as practicable.' },
      { type: 'add', text: '  Phase I shall complete within 24 months; Phase II within 48 months of entry into force.' },
    ],
  },
  {
    id: 'd-corridor', cite: 'CASE-4471', title: 'In re Humanitarian Corridor Access', type: 'case', jurisdiction: 'International', status: 'open', updated: '2026-07-03T09:10:00-04:00',
    summary: 'Dispute over inspection and routing terms for aid convoys; corridor reopened under interim terms.',
    provenanceHash: 'sha256:case4471…8fa', redline: [
      { type: 'ctx', text: 'Interim order — routing and inspection.' },
      { type: 'add', text: '  Convoys may transit under the inspection protocol in Annex B pending final determination.' },
    ],
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
