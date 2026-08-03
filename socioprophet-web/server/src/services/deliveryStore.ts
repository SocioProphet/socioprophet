// Sovereign delivery store — the server-side CANONICAL source for the WBS/cowork
// graph. This is the thing GitHub issues / Taskwarrior mirror; the client's
// fail-closed adapters (deliveryExcellenceLive / coworkLive) read its wire
// projections. Seed matches the client fixture's XSEDE task ids so the loop closes.
//
// Local-first posture: this seed stands in for the durable sovereign store (the
// server already has a db/ + Supabase). Kept pure so it validates under type-strip.

import type { SovereignTask } from './mirrorReconcile.ts';

export const sovereignTasks: SovereignTask[] = [
  { id: 't-cee-train', title: 'Ship the training certification program (Moodle LMS + Open Badges)', status: 'in_progress' },
  { id: 't-cee-spoc', title: 'Convert MOOCs → quarterly SPOCs with mentoring + credit', status: 'todo' },
  { id: 't-ecss-esrt', title: 'Staff ESRT engagements against XSEDE-prioritized use cases', status: 'in_progress' },
  { id: 't-xci-xcsr', title: 'Publish the XSEDE Community Software Repository catalog', status: 'blocked' },
  { id: 't-ops-cyber', title: 'Operate the XSEDE cybersecurity plan', status: 'done' },
  { id: 't-ras-xrac', title: 'Support XRAC quarterly review of ~200 large-scale requests', status: 'done' },
  { id: 't-po-pep', title: 'Maintain the Project Execution Plan (living SOP)', status: 'in_progress' },
];

// ---- wire projections (canonical → mirror shapes the client reads) ----

const GH_STATE: Record<string, 'open' | 'closed'> = { done: 'closed' };
const GH_LABEL: Record<string, string> = { in_progress: 'in progress', blocked: 'blocked', review: 'review' };

/** Project sovereign tasks into the GitHub-issue wire shape (`{ issues }`). */
export function tasksAsIssues() {
  return sovereignTasks.map((t, i) => ({
    number: 1000 + i,
    title: t.title,
    state: GH_STATE[t.status] ?? 'open',
    html_url: `https://github.com/SocioProphet/delivery-excellence/issues/${1000 + i}`,
    labels: GH_LABEL[t.status] ? [{ name: GH_LABEL[t.status] }] : [],
    // Sovereign provenance carried alongside the mirror shape — the canonical id.
    sovereign_id: t.id,
  }));
}

export interface WireThread {
  id: string;
  title: string;
  subject_ref: string;
  subject_kind: 'task' | 'element';
  status: 'open' | 'proposed' | 'decided' | 'blocked';
  participants: string[];
  messages: Array<{ id: string; author: string; at: string; kind: string; body: string; evidence?: string }>;
  decision?: string;
}

export function threadsWire(): WireThread[] {
  return [
    {
      id: 'cw-spoc', title: 'SPOC conversion plan — mentoring + credit gating', subject_ref: 't-cee-spoc', subject_kind: 'task', status: 'decided',
      participants: ['ada.newhope.social', 'linus.dev'],
      messages: [
        { id: 'm1', author: 'ada.newhope.social', at: '2026-07-30T11:00:00Z', kind: 'decision', body: 'Pilot 2 mentor-gated SPOCs with a preregistered completion metric.', evidence: 'aud_01JCEE7RAIN' },
      ],
      decision: 'Pilot 2 mentor-gated SPOCs with a preregistered completion metric.',
    },
  ];
}
