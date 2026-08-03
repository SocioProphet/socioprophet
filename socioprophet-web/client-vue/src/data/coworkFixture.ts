// Cowork — sovereign collaboration over governed work.
//
// "Cowork" is the collaboration layer that sits ON the sovereign work graph, not a
// separate chat silo: every thread has a SUBJECT that is a real WBS task or element
// (`subjectRef` → wbsFixture), participants resolve through HolographMe, and a
// thread's DECISION can carry an execution receipt. Local-first + receipted; no
// external chat integration. This is what the WBS tasks' `cowork://` mirrors point at.
//
// Kept adapter-free (no network import) so the fixture is self-contained.

export type ThreadStatus = 'open' | 'proposed' | 'decided' | 'blocked';
export type MessageKind = 'message' | 'proposal' | 'decision' | 'evidence';

export interface CoworkMessage {
  id: string;
  authorRef: string; // reputation handle → reputationFor()
  at: string;
  kind: MessageKind;
  body: string;
  /** Grounding for evidence/decision messages — an execution receipt or source. */
  evidenceRef?: string;
}

export interface CoworkThread {
  id: string;
  title: string;
  /** The sovereign work object this thread is about — a WBS task or element id. */
  subjectRef: string;
  subjectKind: 'task' | 'element';
  status: ThreadStatus;
  participantRefs: string[];
  messages: CoworkMessage[];
  /** Recorded decision (present iff status === 'decided'). */
  decision?: string;
}

// Shape of a live cowork thread from the sovereign endpoint, kept structural so the
// fixture stays network-free. Maps a sovereign collaboration room → a CoworkThread.
export interface LiveThread {
  id: string;
  title: string;
  subject_ref: string;
  subject_kind?: 'task' | 'element';
  status?: ThreadStatus;
  participants?: string[];
  messages?: Array<{ id: string; author: string; at: string; kind?: MessageKind; body: string; evidence?: string }>;
  decision?: string;
}
export function liveToThreads(rooms: LiveThread[]): CoworkThread[] {
  return rooms.map((r) => ({
    id: r.id,
    title: r.title,
    subjectRef: r.subject_ref,
    subjectKind: r.subject_kind ?? 'task',
    status: r.status ?? 'open',
    participantRefs: r.participants ?? [],
    messages: (r.messages ?? []).map((m) => ({ id: m.id, authorRef: m.author, at: m.at, kind: m.kind ?? 'message', body: m.body, evidenceRef: m.evidence })),
    decision: r.decision,
  }));
}

export const threads: CoworkThread[] = [
  {
    id: 'cw-spoc', title: 'SPOC conversion plan — mentoring + credit gating', subjectRef: 't-cee-spoc', subjectKind: 'task', status: 'decided',
    participantRefs: ['ada.newhope.social', 'linus.dev', 'skeptic.reader.bsky.social'],
    messages: [
      { id: 'm1', authorRef: 'ada.newhope.social', at: '2026-07-28T14:02:00Z', kind: 'proposal', body: 'Propose converting the two highest-drop MOOCs to quarterly SPOCs, gated on a mentor + a badge. Past data shows SPOC completion >> MOOC when mentored.' },
      { id: 'm2', authorRef: 'skeptic.reader.bsky.social', at: '2026-07-28T15:20:00Z', kind: 'message', body: 'Completion-rate lift could be selection bias — motivated learners self-select into SPOCs. What is the counterfactual?' },
      { id: 'm3', authorRef: 'linus.dev', at: '2026-07-29T09:10:00Z', kind: 'evidence', body: 'PY-eval shows lift holds within-cohort after controlling for prior completion. Small-N stamped; not a general claim yet.', evidenceRef: 'aud_01JCEE7RAIN' },
      { id: 'm4', authorRef: 'ada.newhope.social', at: '2026-07-30T11:00:00Z', kind: 'decision', body: 'Decision: pilot 2 SPOCs next quarter, mentor-gated, with a preregistered completion metric so the lift is falsifiable.', evidenceRef: 'aud_01JCEE7RAIN' },
    ],
    decision: 'Pilot 2 mentor-gated SPOCs with a preregistered completion metric.',
  },
  {
    id: 'cw-xcsr', title: 'XCSR catalog is blocked — SP install-matrix drift', subjectRef: 't-xci-xcsr', subjectKind: 'task', status: 'blocked',
    participantRefs: ['linus.dev', 'berners.policywatch.org'],
    messages: [
      { id: 'm1', authorRef: 'linus.dev', at: '2026-08-01T10:00:00Z', kind: 'message', body: 'XCSR is blocked: the GitHub mirror drifted from the sovereign install-matrix — three SPs report different installed versions than the sovereign store.' },
      { id: 'm2', authorRef: 'berners.policywatch.org', at: '2026-08-01T13:30:00Z', kind: 'proposal', body: 'Treat the sovereign store as canonical (it is), re-reconcile the github mirror, and hold XNIT until XCSR clears review.' },
    ],
  },
  {
    id: 'cw-pep', title: 'PEP living-doc cadence — align to reporting windows', subjectRef: 't-po-pep', subjectKind: 'task', status: 'open',
    participantRefs: ['berners.policywatch.org', 'grace.marketsdesk.io'],
    messages: [
      { id: 'm1', authorRef: 'berners.policywatch.org', at: '2026-08-02T16:45:00Z', kind: 'message', body: 'Proposing the PEP update cadence tracks the IPR/annual windows so PM&R reporting and the living doc never drift.' },
    ],
  },
];

export const asOf = '2026-08-03T00:00:00-04:00';

export function threadById(id: string): CoworkThread | undefined {
  return threads.find((t) => t.id === id);
}
export function threadsForSubject(subjectRef: string): CoworkThread[] {
  return threads.filter((t) => t.subjectRef === subjectRef);
}
