import { defineStore } from "pinia";
import {
  projectDoc, mergeGraphs, backlinks, related, rollup, query, centralEntities, pagerank, pathBetween,
  pageId, type Block, type GNode, type KGraph,
} from "../services/knowledgeGraph";
import * as knowledgeApi from "../services/knowledgeApi";
import * as choirApi from "../services/choirApi";
import { buildGroundedContext, assemblePrompt, gateAction, checkGrounding, type ChoirAction } from "../services/choirGrounding";

// Find a block anywhere in a page tree (for in-place edits).
function findBlock(root: Block, id: string): Block | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) { const f = findBlock(c, id); if (f) return f; }
  return null;
}

// Demo workspace that immediately shows the leapfrog (cross-doc backlinks, entity hubs, graph rollups).
function seed(): Block[] {
  return [
    { id: "p-meeting", type: "page", text: "Meeting Notes", children: [
      { id: "m1", type: "heading", text: "Decisions" },
      { id: "m2", type: "text", text: "Ship [[Sovereign Identity]] with @gus this week" },
      { id: "m3", type: "todo", text: "Wire [[Mail Bridge]]", props: { done: false } },
    ] },
    { id: "p-roadmap", type: "page", text: "Roadmap", children: [
      { id: "r1", type: "text", text: "Priority: [[Sovereign Identity]] led by @gus" },
      { id: "r2", type: "database", text: "Initiatives", children: [
        { id: "r3", type: "row", text: "Identity", props: { effort: 8, "rel:Sovereign Identity": "Sovereign Identity" } },
        { id: "r4", type: "row", text: "Knowledge", props: { effort: 5, "rel:Sovereign Identity": "Sovereign Identity" } },
      ] },
    ] },
    { id: "p-identity", type: "page", text: "Sovereign Identity", children: [
      { id: "i1", type: "text", text: "Unlinkable, compulsion-resistant identity. Owner @gus." },
    ] },
  ];
}

export const useKnowledge = defineStore("knowledge", {
  state: () => ({
    docs: seed() as Block[],
    currentId: "p-meeting" as string,
    persistMsg: "" as string,
    choir: { busy: false, answer: "", grounded: true, unknown: [] as string[], denied: "", error: "" },
    policy: { read: true, write: true, egress: false }, // owner default; scope-d supplies this per session
  }),
  getters: {
    graph(state): KGraph { return mergeGraphs(state.docs.map(projectDoc)); },
    current(state): Block | undefined { return state.docs.find((d) => d.id === state.currentId); },
    pageTitles(state): string[] { return state.docs.map((d) => d.text ?? d.id); },
    currentBacklinks(): GNode[] { return this.current ? backlinks(this.graph, this.current.text ?? "") : []; },
    currentRelated(): GNode[] { return this.current ? related(this.graph, pageId(this.current.text ?? ""), 1) : []; },
    allTodos(): GNode[] { return query(this.graph, (n) => n.kind === "todo"); },
    central(): Array<{ name: string; degree: number }> { return centralEntities(this.graph); },
    /** "Your most central ideas" — PageRank over the workspace graph (pages + entities). Notion can't compute this. */
    centralIdeas(): Array<{ id: string; label: string; score: number }> {
      const byId = new Map(this.graph.nodes.map((n) => [n.id, n]));
      return pagerank(this.graph)
        .map((r) => ({ id: r.id, label: byId.get(r.id)?.label ?? r.id, score: r.score }))
        .filter((r) => { const k = byId.get(r.id)?.kind; return k === "page" || k === "entity"; })
        .slice(0, 6);
    },
  },
  actions: {
    selectPage(id: string) { this.currentId = id; },
    updateBlockText(blockId: string, text: string) {
      if (this.current) { const b = findBlock(this.current, blockId); if (b) b.text = text; }
    },
    addBlock(type: Block["type"]) {
      if (!this.current) return;
      (this.current.children ??= []).push({ id: `b-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, type, text: "" });
    },
    addPage(title: string) {
      const id = `p-${Date.now()}`;
      this.docs.push({ id, type: "page", text: title || "Untitled", children: [{ id: `${id}-1`, type: "text", text: "" }] });
      this.currentId = id;
    },
    /** Graph-native rollup over a database block's rows (the thing Notion limits to one relation hop). */
    rollupSum(databaseBlockId: string, prop: string): number { return rollup(this.graph, databaseBlockId, "CONTAINS", prop, "sum"); },
    /** "What connects A and B?" — shortest path between two pages, as readable labels. */
    connection(aTitle: string, bTitle: string): string[] | null {
      const byId = new Map(this.graph.nodes.map((n) => [n.id, n]));
      const path = pathBetween(this.graph, pageId(aTitle), pageId(bTitle));
      return path && path.map((id) => byId.get(id)?.label ?? id);
    },
    /** Persist the sealed projection to HellGraph (stub/local-first until VITE_KNOWLEDGE_API is set). */
    async persist() {
      try {
        const r = await knowledgeApi.persist(this.graph);
        this.persistMsg = r.sealed ? `Saved ${r.nodes} nodes (content sealed under your key)` : `Local-first: ${r.nodes} nodes, ${r.edges} edges (backend not wired)`;
      } catch (e) { this.persistMsg = (e as Error).message; }
    },
    /** Ask the choir, grounded in the current page's subgraph and gated by scope-d policy. */
    async askChoir(action: ChoirAction, question: string) {
      if (!this.current) return;
      const gate = gateAction(action, this.policy);
      if (!gate.allowed) { this.choir.denied = gate.reason; this.choir.answer = ""; return; }
      this.choir = { busy: true, answer: "", grounded: true, unknown: [], denied: "", error: "" }; // reset every signal on entry
      try {
        const grounded = buildGroundedContext(this.graph, pageId(this.current.text ?? ""));
        const prompt = assemblePrompt(action, question, grounded);
        const answer = await choirApi.complete(prompt, grounded, action);
        const g = checkGrounding(answer, grounded);
        this.choir.answer = answer; this.choir.grounded = g.grounded; this.choir.unknown = g.unknownCitations;
      } catch (e) { this.choir.error = (e as Error).message; }
      finally { this.choir.busy = false; }
    },
  },
});
