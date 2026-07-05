// choirGrounding — client mirror of noetica's graph-grounded, governed choir core. Builds a grounded subgraph,
// assembles the prompt, gates actions by scope-d policy, and structurally checks citations. See choir-grounding.ts.
import { related, type KGraph, type GNode } from "./knowledgeGraph";

export type ChoirAction = "ask" | "summarize" | "draft" | "restructure";
export interface GroundedContext { focus: string; context: string; citations: GNode[] }
export interface ChoirPolicy { read: boolean; write: boolean; egress: boolean }

export function buildGroundedContext(g: KGraph, focusNodeId: string, opts: { hops?: number; max?: number } = {}): GroundedContext {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const cites = new Map<string, GNode>();
  const focus = byId.get(focusNodeId);
  if (focus) cites.set(focus.id, focus);
  for (const n of related(g, focusNodeId, opts.hops ?? 1)) cites.set(n.id, n);
  const citations = [...cites.values()].slice(0, opts.max ?? 12);
  return { focus: focusNodeId, context: citations.map((n) => `- [${n.id}] (${n.kind}) ${n.label}`).join("\n"), citations };
}

const HEAD: Record<ChoirAction, string> = {
  ask: "Answer using ONLY the grounded context. Cite node ids in [brackets]. If not in context, say you don't know.",
  summarize: "Summarize the grounded context faithfully. Cite node ids in [brackets].",
  draft: "Draft new content consistent with the grounded context. Cite node ids you build on.",
  restructure: "Propose a restructuring using the grounded context. Cite node ids.",
};
export function assemblePrompt(action: ChoirAction, question: string, g: GroundedContext): string {
  return `${HEAD[action]}\n\n# Grounded context\n${g.context}\n\n# Task\n${question || action}`;
}
export function gateAction(action: ChoirAction, p: ChoirPolicy): { allowed: boolean; reason: string } {
  if (!p.read) return { allowed: false, reason: "read not permitted" };
  if ((action === "draft" || action === "restructure") && !p.write) return { allowed: false, reason: `${action} requires write policy (scope-d)` };
  return { allowed: true, reason: "permitted" };
}
export function checkGrounding(answer: string, g: GroundedContext): { grounded: boolean; unknownCitations: string[] } {
  const allowed = new Set(g.citations.map((c) => c.id));
  const cited = [...answer.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  const unknownCitations = [...new Set(cited.filter((id) => !allowed.has(id)))];
  return { grounded: unknownCitations.length === 0, unknownCitations };
}
