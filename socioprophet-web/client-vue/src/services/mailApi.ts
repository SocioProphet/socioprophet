// mailApi — contract to the prophet-workspace mail bridge (Dovecot IMAP / Postfix ↔ REST; see MAIL_SPEC.md).
// VITE_MAIL_API unset → STUB mode so the webmail UI runs standalone until the bridge service exists (P1).

export type MailView = "imbox" | "feed" | "papertrail";

export interface Message {
  id: string;
  from: string;
  fromEmail: string;
  ts: string;
  bodyText: string;
  bodyHtml?: string;
}
export interface Thread {
  id: string;
  view: MailView;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  ts: string;
  unread: boolean;
  replyLaterAt?: string | null;
  setAside?: boolean;
  labels?: string[];
  messages?: Message[];
}
export interface ScreenerItem {
  id: string;
  from: string;
  fromEmail: string;
  subjectPreview: string;
  firstSeen: string;
}

import { resolveBase } from '../config/cockpitRuntime';
const BASE = resolveBase('mail', 'VITE_MAIL_API') ?? "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`mail-api ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const isStub = () => !BASE;

export async function listThreads(view: MailView): Promise<Thread[]> {
  if (!BASE) return stubThreads(view);
  return (await api<{ threads: Thread[] }>(`/views/${view}/threads`)).threads;
}
export async function getThread(id: string): Promise<Thread> {
  if (!BASE) return stubThread(id);
  return api<Thread>(`/threads/${id}`);
}
export async function sendMail(p: { to: string; subject: string; body: string; sendAt?: string; inReplyTo?: string }): Promise<void> {
  if (!BASE) return;
  await api(`/send`, { method: "POST", body: JSON.stringify(p) });
}
export type ThreadAction = "replyLater" | "setAside" | "done" | "snooze";
export async function threadAction(id: string, action: ThreadAction, opts?: { until?: string }): Promise<void> {
  if (!BASE) return;
  await api(`/threads/${id}/${action}`, { method: "POST", body: JSON.stringify(opts ?? {}) });
}
export async function listScreener(): Promise<ScreenerItem[]> {
  if (!BASE) return stubScreener();
  return (await api<{ items: ScreenerItem[] }>(`/screener`)).items;
}
export async function screenerDecision(id: string, decision: "approve" | "deny"): Promise<void> {
  if (!BASE) return;
  await api(`/screener/${id}/${decision}`, { method: "POST" });
}
// AI runs on our sovereign choir, not a vendor.
export async function aiSummary(threadId: string): Promise<string> {
  if (!BASE) return "Choir summary unavailable in stub mode — wire VITE_MAIL_API + the mail bridge.";
  return (await api<{ summary: string }>(`/ai/summary`, { method: "POST", body: JSON.stringify({ threadId }) })).summary;
}
export async function aiDraft(threadId: string, intent: string): Promise<string> {
  if (!BASE) return "";
  return (await api<{ draft: string }>(`/ai/draft`, { method: "POST", body: JSON.stringify({ threadId, intent }) })).draft;
}

// ── stub data (P1: UI runs without the backend) ──────────────────────────────────────────────────────────────
function stubThreads(view: MailView): Thread[] {
  const all: Thread[] = [
    { id: "t1", view: "imbox", from: "Mira Chen", fromEmail: "mira@socioprophet.ai", subject: "Q3 board deck — final pass", snippet: "Pushed the revenue slide; can you sanity-check…", ts: "9:42", unread: true, labels: ["VIP"] },
    { id: "t2", view: "imbox", from: "Stripe", fromEmail: "no-reply@stripe.com", subject: "Payout sent — $12,480", snippet: "reply later · tomorrow 9am", ts: "8:10", unread: false, replyLaterAt: "tomorrow 9am" },
    { id: "t3", view: "imbox", from: "Gus Romero", fromEmail: "gus@socioprophet.ai", subject: "Re: choir GPU sizing", snippet: "Let's go with the L4 for now and…", ts: "Yest", unread: false, labels: ["Team"] },
    { id: "f1", view: "feed", from: "Stratechery", fromEmail: "ben@stratechery.com", subject: "The sovereign-AI cost curve", snippet: "Why flat infra beats per-seat…", ts: "7:00", unread: false },
    { id: "p1", view: "papertrail", from: "Notion", fromEmail: "team@notion.so", subject: "3 pages shared with you", snippet: "Receipt #A-2291", ts: "Mon", unread: false },
  ];
  return all.filter((t) => t.view === view);
}
function stubThread(id: string): Thread {
  const t = (["imbox", "feed", "papertrail"] as MailView[]).flatMap(stubThreads).find((x) => x.id === id);
  return { ...(t as Thread), messages: [{ id: "m1", from: t?.from ?? "", fromEmail: t?.fromEmail ?? "", ts: t?.ts ?? "", bodyText: "Hey — pushed the revenue slide and the sovereign-vs-Google cost chart. Can you sanity-check the projection before 2pm? Want it airtight for the board. Also looped in Gus on the choir line item." }] };
}
function stubScreener(): ScreenerItem[] {
  return [
    { id: "s1", from: "Acme Sales", fromEmail: "sdr@acme.io", subjectPreview: "Quick question about your AI stack", firstSeen: "10:01" },
    { id: "s2", from: "Conference 2026", fromEmail: "cfp@conf.dev", subjectPreview: "Invitation to speak", firstSeen: "Yest" },
    { id: "s3", from: "Unknown", fromEmail: "hello@newsletter.xyz", subjectPreview: "Welcome!", firstSeen: "Mon" },
  ];
}
