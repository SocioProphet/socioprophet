// Delivery Excellence — sovereign Work Breakdown Structure (WBS).
//
// SOVEREIGN-CANONICAL. The project → WBS element → deliverable → task graph is a
// first-class governed object owned by the estate's own store (local-first,
// receipted), NOT by GitHub. GitHub issues, Taskwarrior tasks, and cowork threads
// are REMOVABLE sync mirrors (`WbsTask.mirrors`) — GitHub explicitly transitional
// (cutover to the sovereign stack), Taskwarrior the local task engine. Nothing here
// depends on a mirror as the source of truth: drop the adapter, keep the data.
//
// Estate bindings: a `WbsTask` maps to an executions-ledger `ExecutionRow`
// (`executionReceiptId` → receiptHash + verdict); a contributor `*Ref` binds to
// HolographMe via `reputationFor()`; a `Deliverable` carries a gate verdict.
// Task dependency order (`dependsOn`) is the run-tree handoff order.
//
// Populated from the **XSEDE 2.0** WBS (NSF #1548562) as the reference program — a
// real, published federated-program work breakdown (6 service areas, 19 partner
// institutions). Kept adapter-free so the fixture has no network import.

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type DeliverableGate = 'draft' | 'in_review' | 'accepted' | 'at_risk';
export type SyncState = 'sovereign_only' | 'mirrored' | 'drifted';

/** A REMOVABLE mirror of a sovereign task into an external surface. */
export interface SyncRef {
  target: 'github' | 'taskwarrior' | 'cowork';
  ref: string; // issue url / task uuid / cowork thread id
  state: SyncState;
}

export interface WbsTask {
  id: string;
  title: string;
  status: TaskStatus;
  /** Contributor handle → HolographMe `reputationFor()`. */
  assigneeRef?: string;
  /** WBS predecessors — the run-tree handoff order (executions-ledger). */
  dependsOn?: string[];
  /** Sovereign execution receipt (executions-ledger ExecutionRow). */
  executionReceiptId?: string;
  /** Removable sync mirrors. GitHub = transitional; sovereign store is canonical. */
  mirrors?: SyncRef[];
  estimateFte?: number;
}

export interface Deliverable {
  id: string;
  title: string;
  gate: DeliverableGate;
  tasks: WbsTask[];
}

export interface WbsElement {
  id: string; // '2.1'
  code: string; // 'WBS 2.1'
  name: string;
  /** Element lead handle → reputation. */
  leadRef?: string;
  fte?: number;
  deliverables: Deliverable[];
}

export interface Project {
  id: string;
  name: string;
  mission: string;
  institutions: string[];
  elements: WbsElement[];
}

// ---- pure live mappers (kept adapter-free) ----

/** Shape of a GitHub issue (structural subset), so the fixture stays network-free. */
export interface GithubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  assignee?: { login: string } | null;
  labels?: Array<{ name: string }>;
}

/**
 * Map GitHub issues → sovereign tasks, attaching a *removable* github mirror.
 * GitHub is a transitional surface: the sovereign task is canonical, the issue is
 * a mirror that can be revoked at cutover without losing the task.
 */
export function githubIssuesToTasks(issues: GithubIssue[]): WbsTask[] {
  return issues.map((i) => {
    const labels = (i.labels ?? []).map((l) => l.name.toLowerCase());
    const status: TaskStatus = i.state === 'closed'
      ? 'done'
      : labels.includes('blocked')
        ? 'blocked'
        : labels.includes('in progress') || labels.includes('in-progress')
          ? 'in_progress'
          : labels.includes('review')
            ? 'review'
            : 'todo';
    return {
      id: `gh-${i.number}`,
      title: i.title,
      status,
      assigneeRef: i.assignee?.login,
      mirrors: [{ target: 'github', ref: i.html_url, state: 'mirrored' }],
    };
  });
}

// ---- reference program: XSEDE 2.0 ----

const t = (
  id: string,
  title: string,
  status: TaskStatus,
  extra: Partial<WbsTask> = {},
): WbsTask => ({ id, title, status, ...extra });

export const XSEDE: Project = {
  id: 'xsede-2',
  name: 'XSEDE 2.0',
  mission:
    'Integrate, enable, and enhance national cyberinfrastructure — accelerate open scientific discovery by enhancing the productivity of researchers, engineers, and scholars and broadening their participation.',
  institutions: ['NCSA (Illinois)', 'NICS (Tennessee)', 'PSC', 'TACC', 'SDSC', 'Cornell', 'NCAR', 'Purdue', 'Indiana', 'Shodor', 'SURA', '+8 more'],
  elements: [
    {
      id: '2.1', code: 'WBS 2.1', name: 'Community Engagement & Enrichment (CEE)', leadRef: 'ada.newhope.social', fte: 17.73,
      deliverables: [
        {
          id: '2.1.2', title: 'Workforce Development — training, education & student preparation', gate: 'in_review',
          tasks: [
            t('t-cee-train', 'Ship the training certification program (Moodle LMS + Open Badges)', 'in_progress', { assigneeRef: 'ada.newhope.social', estimateFte: 2.0, executionReceiptId: 'aud_01JCEE7RAIN', mirrors: [{ target: 'github', ref: 'https://github.com/SocioProphet/delivery-excellence/issues/812', state: 'mirrored' }, { target: 'taskwarrior', ref: 'tw:9f1c-cee-train', state: 'mirrored' }] }),
            t('t-cee-spoc', 'Convert MOOCs → quarterly SPOCs with mentoring + credit', 'todo', { dependsOn: ['t-cee-train'], estimateFte: 1.5, mirrors: [{ target: 'cowork', ref: 'cowork://cee/spoc-planning', state: 'sovereign_only' }] }),
          ],
        },
        {
          id: '2.1.6', title: 'Campus Engagement — Champions network', gate: 'accepted',
          tasks: [
            t('t-cee-champ', 'Sustain 250+ Campus/Domain/Student Champions across 190 campuses', 'done', { assigneeRef: 'linus.dev', executionReceiptId: 'aud_01JCEECHAMP', mirrors: [{ target: 'github', ref: 'https://github.com/SocioProphet/delivery-excellence-boards/issues/44', state: 'mirrored' }] }),
          ],
        },
      ],
    },
    {
      id: '2.2', code: 'WBS 2.2', name: 'Extended Collaborative Support Services (ECSS)', leadRef: 'linus.dev', fte: 28.84,
      deliverables: [
        {
          id: '2.2.2', title: 'Extended Support for Research Teams (ESRT)', gate: 'in_review',
          tasks: [
            t('t-ecss-esrt', 'Staff ESRT engagements against XSEDE-prioritized use cases', 'in_progress', { assigneeRef: 'linus.dev', estimateFte: 9.8, mirrors: [{ target: 'taskwarrior', ref: 'tw:2a4-ecss-esrt', state: 'mirrored' }] }),
            t('t-ecss-nip', 'Novel & Innovative Projects — onboard non-traditional communities', 'todo', { dependsOn: ['t-ecss-esrt'], estimateFte: 4.95 }),
          ],
        },
      ],
    },
    {
      id: '2.3', code: 'WBS 2.3', name: 'XSEDE Community Infrastructure (XCI)', leadRef: 'linus.dev', fte: 8.89,
      deliverables: [
        {
          id: '2.3.3', title: 'XCSR — community software repository (service & tool catalog)', gate: 'at_risk',
          tasks: [
            t('t-xci-xcsr', 'Publish the XSEDE Community Software Repository catalog (SP install matrix + use cases)', 'blocked', { assigneeRef: 'linus.dev', estimateFte: 3.39, executionReceiptId: 'aud_01JXCIXCSR', mirrors: [{ target: 'github', ref: 'https://github.com/SocioProphet/delivery-excellence-innersource/issues/17', state: 'drifted' }] }),
            t('t-xci-xnit', 'Ship XNIT (National Integration Toolkit) + laptop suite', 'review', { dependsOn: ['t-xci-xcsr'], estimateFte: 2.52 }),
          ],
        },
      ],
    },
    {
      id: '2.4', code: 'WBS 2.4', name: 'XSEDE Operations', leadRef: 'linus.dev', fte: 15.58,
      deliverables: [
        {
          id: '2.4.2', title: 'Cybersecurity — confidentiality, integrity, availability', gate: 'accepted',
          tasks: [
            t('t-ops-cyber', 'Operate the XSEDE cybersecurity plan (risk-based, best-practice)', 'done', { assigneeRef: 'berners.policywatch.org', estimateFte: 3.84, executionReceiptId: 'aud_01JOPSCYBER', mirrors: [{ target: 'github', ref: 'https://github.com/SocioProphet/delivery-excellence/issues/905', state: 'mirrored' }] }),
          ],
        },
        {
          id: '2.4.5', title: 'Systems Operational Support (SysOps)', gate: 'in_review',
          tasks: [
            t('t-ops-sysops', 'Run the ops center + XDMoD operational dashboards', 'in_progress', { assigneeRef: 'linus.dev', estimateFte: 3.32 }),
          ],
        },
      ],
    },
    {
      id: '2.5', code: 'WBS 2.5', name: 'Resource Allocation Service (RAS)', leadRef: 'grace.marketsdesk.io', fte: 8.23,
      deliverables: [
        {
          id: '2.5.2', title: 'XSEDE Allocations Process & Policies (XRAC quarterly review)', gate: 'accepted',
          tasks: [
            t('t-ras-xrac', 'Support XRAC quarterly review of ~200 large-scale requests', 'done', { assigneeRef: 'grace.marketsdesk.io', estimateFte: 2.35, executionReceiptId: 'aud_01JRASXRAC', mirrors: [{ target: 'taskwarrior', ref: 'tw:7c2-ras-xrac', state: 'mirrored' }] }),
          ],
        },
        {
          id: '2.5.3', title: 'Allocations CI Enhancement & Maintenance (XRAS / A3M)', gate: 'in_review',
          tasks: [
            t('t-ras-xras', 'Enhance XRAS + Resource Description Repository → Resource Selector', 'in_progress', { dependsOn: ['t-ras-xrac'], assigneeRef: 'grace.marketsdesk.io', estimateFte: 5.38, mirrors: [{ target: 'github', ref: 'https://github.com/SocioProphet/delivery-excellence-automation/issues/61', state: 'mirrored' }] }),
          ],
        },
      ],
    },
    {
      id: '2.6', code: 'WBS 2.6', name: 'Program Office', leadRef: 'berners.policywatch.org', fte: 11.76,
      deliverables: [
        {
          id: '2.6.3', title: 'Project Management, Reporting & Risk Management (PM&R)', gate: 'in_review',
          tasks: [
            t('t-po-pep', 'Maintain the Project Execution Plan (living SOP on the staff wiki)', 'in_progress', { assigneeRef: 'berners.policywatch.org', estimateFte: 2.69, mirrors: [{ target: 'cowork', ref: 'cowork://program-office/pep', state: 'sovereign_only' }] }),
            t('t-po-reporting', 'File interim + annual reports (NSF 1030 format, per-WBS L2)', 'todo', { dependsOn: ['t-po-pep'], estimateFte: 1.25 }),
          ],
        },
        {
          id: '2.6.2', title: 'External Relations (ER)', gate: 'draft',
          tasks: [
            t('t-po-er', 'Science success stories + monthly newsletters + SC exhibit', 'todo', { assigneeRef: 'grace.marketsdesk.io', estimateFte: 2.70 }),
          ],
        },
      ],
    },
  ],
};

export const projects: Project[] = [XSEDE];
export const asOf = '2026-08-03T00:00:00-04:00';

export function projectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
export function elementById(id: string): WbsElement | undefined {
  return projects.flatMap((p) => p.elements).find((e) => e.id === id);
}
export function allTasks(p: Project): WbsTask[] {
  return p.elements.flatMap((e) => e.deliverables.flatMap((d) => d.tasks));
}
