/**
 * Unit tests for the ported Graph Explorer model — the DOM-free logic behind the panel.
 * Covers: the three graph modes produce distinct link sets, the similarity threshold filters
 * vector edges, the explore modes scope the neighbourhood, and the Kiali-style runtime overlay
 * marks a degraded / down node.
 */
import { describe, expect, it } from 'vitest';
import {
  applyRuntimeOverlay,
  buildVectorLinks,
  computeActiveGraph,
  neighborIds,
  runtimeSummary,
} from '../features/graph-explorer/model';
import { RUNTIME_TOPOLOGY_FIXTURE, SURFACE_GRAPH_FIXTURE } from '../features/graph-explorer/fixture';
import type { ExplorerState } from '../features/graph-explorer/types';

const baseState = (over: Partial<ExplorerState> = {}): ExplorerState => ({
  viewMode: 'topology',
  searchMode: 'global',
  threshold: 0.12,
  showTopics: false,
  showExternal: true,
  query: '',
  selectedId: null,
  expandedSurfaceId: null,
  ...over,
});

const surfaces = SURFACE_GRAPH_FIXTURE.nodes.filter((n) => n.type === 'surface');

describe('graph modes', () => {
  it('topology mode yields only curated links (no vector edges)', () => {
    const { links } = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ viewMode: 'topology' }));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((l) => l.type !== 'vector')).toBe(true);
  });

  it('vector mode yields vector links and no curated links', () => {
    const { links } = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ viewMode: 'vector' }));
    expect(links.some((l) => l.type === 'vector')).toBe(true);
    expect(links.some((l) => l.type === 'curated')).toBe(false);
  });

  it('hybrid mode combines curated and vector links', () => {
    const { links } = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ viewMode: 'hybrid' }));
    expect(links.some((l) => l.type === 'curated')).toBe(true);
    expect(links.some((l) => l.type === 'vector')).toBe(true);
  });
});

describe('similarity threshold', () => {
  it('a higher threshold produces fewer (or equal) vector edges', () => {
    const loose = buildVectorLinks(surfaces, 0.05);
    const strict = buildVectorLinks(surfaces, 0.4);
    expect(loose.length).toBeGreaterThan(0);
    expect(loose.length).toBeGreaterThanOrEqual(strict.length);
    expect(strict.length).toBeLessThan(loose.length);
  });

  it('every emitted vector edge meets the threshold', () => {
    const t = 0.2;
    for (const l of buildVectorLinks(surfaces, t)) expect(l.score ?? 0).toBeGreaterThanOrEqual(t);
  });

  it('the threshold flows through computeActiveGraph in vector mode', () => {
    const loose = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ viewMode: 'vector', threshold: 0.05 }));
    const strict = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ viewMode: 'vector', threshold: 0.4 }));
    expect(loose.links.length).toBeGreaterThan(strict.links.length);
  });
});

describe('explore modes', () => {
  it('local scoping keeps the selection and its immediate neighbours only', () => {
    const global = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ selectedId: 'ai' }));
    const local = computeActiveGraph(
      SURFACE_GRAPH_FIXTURE,
      baseState({ selectedId: 'ai', searchMode: 'local' }),
    );
    expect(local.nodes.length).toBeLessThan(global.nodes.length);
    expect(local.nodes.some((n) => n.id === 'ai')).toBe(true);
  });

  it('drift-like scoping is at least as wide as local', () => {
    const local = computeActiveGraph(
      SURFACE_GRAPH_FIXTURE,
      baseState({ selectedId: 'ai', searchMode: 'local' }),
    );
    const drift = computeActiveGraph(
      SURFACE_GRAPH_FIXTURE,
      baseState({ selectedId: 'ai', searchMode: 'drift' }),
    );
    expect(drift.nodes.length).toBeGreaterThanOrEqual(local.nodes.length);
  });

  it('neighborIds expands by depth', () => {
    const curated = SURFACE_GRAPH_FIXTURE.links!.curated!;
    const d1 = neighborIds(curated, 'academy', 1);
    const d2 = neighborIds(curated, 'academy', 2);
    expect(d1.has('academy')).toBe(true);
    expect(d2.size).toBeGreaterThanOrEqual(d1.size);
  });
});

describe('topic constituents', () => {
  it('showTopics introduces topic nodes and constituent links', () => {
    const off = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ showTopics: false }));
    const on = computeActiveGraph(SURFACE_GRAPH_FIXTURE, baseState({ showTopics: true }));
    expect(off.nodes.every((n) => n.type === 'surface')).toBe(true);
    expect(on.nodes.some((n) => n.type === 'topic')).toBe(true);
    expect(on.links.some((l) => l.type === 'constituent')).toBe(true);
  });
});

describe('runtime overlay', () => {
  it('marks a down node and a degraded node from the runtime topology', () => {
    const annotated = applyRuntimeOverlay(surfaces, RUNTIME_TOPOLOGY_FIXTURE);
    const cloud = annotated.find((n) => n.id === 'cloud');
    const investor = annotated.find((n) => n.id === 'investor');
    const academy = annotated.find((n) => n.id === 'academy');
    expect(cloud?.runtime.health).toBe('down');
    expect(investor?.runtime.health).toBe('degraded');
    expect(academy?.runtime.health).toBe('healthy');
    expect(cloud?.runtime.service).toBe('cloud-broker');
  });

  it('resolves to unknown when no runtime is supplied', () => {
    const annotated = applyRuntimeOverlay(surfaces, null);
    expect(annotated.every((n) => n.runtime.health === 'unknown')).toBe(true);
  });

  it('summarises health counts', () => {
    const s = runtimeSummary(RUNTIME_TOPOLOGY_FIXTURE);
    expect(s.down).toBeGreaterThanOrEqual(1);
    expect(s.degraded).toBeGreaterThanOrEqual(1);
    expect(s.healthy).toBeGreaterThanOrEqual(1);
  });
});
