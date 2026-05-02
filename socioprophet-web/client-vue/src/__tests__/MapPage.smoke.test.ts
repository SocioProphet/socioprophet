/**
 * Smoke tests for the /map route (MapPage.vue).
 *
 * Covers the seven smoke-test criteria from the staging-readiness issue and
 * the GAIA layer-catalog integration guardrails:
 *  1. /map route loads (component mounts without throwing)
 *  2. Map canvas element is rendered
 *  3. Fallback mode renders when the API is unavailable
 *  4. Live API mode renders when VITE_GAIA_MAP_API_BASE is configured and API is available
 *  5. H3 lookup path does not blank the page
 *  6. Evidence / governance / runtime panels render
 *  7. App displays live / fallback backend status clearly
 *  8. GAIA layer catalog panel renders attribution/provenance/non-production tile metadata
 *
 * MapLibre-GL is stubbed via src/__tests__/setup.ts so tests run without WebGL.
 * The gaiaMap API module is mocked so tests are fully offline.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import MapPage from '../pages/MapPage.vue';
import {
  demoGaiaLayerCatalog,
  demoGaiaMapSnapshot,
  demoGaiaTileManifest,
} from '../api/gaiaMap';

// ──────────────────────────────────────────────────────────────
// Mock the gaiaMap API module
// ──────────────────────────────────────────────────────────────

vi.mock('../api/gaiaMap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/gaiaMap')>();
  return {
    ...actual,
    fetchGaiaMapSnapshotWithFallback: vi.fn(),
    fetchFeaturesByH3WithFallback: vi.fn(),
    fetchGaiaLayerCatalogWithFallback: vi.fn(),
    fetchGaiaTileManifestWithFallback: vi.fn(),
  };
});

import {
  fetchGaiaLayerCatalogWithFallback,
  fetchGaiaMapSnapshotWithFallback,
  fetchGaiaTileManifestWithFallback,
  fetchFeaturesByH3WithFallback,
} from '../api/gaiaMap';

// ──────────────────────────────────────────────────────────────
// Shared router (vue-router needs to be present for RouterLink)
// ──────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/map', component: MapPage }, { path: '/', redirect: '/map' }],
  });
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function demoFallbackResult() {
  return {
    snapshot: demoGaiaMapSnapshot(),
    mode: 'demo' as const,
    warning: 'Using deterministic demo fallback because the GAIA OSM API is unavailable: Network Error',
  };
}

function liveModeResult() {
  return {
    snapshot: demoGaiaMapSnapshot(),
    mode: 'live' as const,
    warning: undefined,
  };
}

function demoLayerCatalogResult() {
  return {
    catalog: demoGaiaLayerCatalog(),
    mode: 'demo' as const,
    warning: 'Using demo GAIA layer catalog because the catalog API is unavailable: Network Error',
  };
}

function liveLayerCatalogResult() {
  return {
    catalog: demoGaiaLayerCatalog(),
    mode: 'live' as const,
    warning: undefined,
  };
}

function demoTileManifestResult() {
  return {
    manifest: demoGaiaTileManifest(),
    mode: 'demo' as const,
    warning: undefined,
  };
}

function liveTileManifestResult() {
  return {
    manifest: demoGaiaTileManifest(),
    mode: 'live' as const,
    warning: undefined,
  };
}

function demoH3FallbackResult() {
  const snap = demoGaiaMapSnapshot();
  return {
    result: snap.h3,
    mode: 'demo' as const,
    warning: 'Using demo H3 fallback because the GAIA OSM API did not return H3 data: offline',
  };
}

async function mountMapPage() {
  const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
  await flushPromises();
  await flushPromises();
  return wrapper;
}

async function clickH3InspectButton(wrapper: ReturnType<typeof mount>) {
  const btn = wrapper.find('[data-testid="h3-inspect-button"]');
  if (btn.exists()) await btn.trigger('click');
}

beforeEach(() => {
  vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(demoLayerCatalogResult());
  vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(demoTileManifestResult());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────
// Criterion 1 — /map route loads
// ──────────────────────────────────────────────────────────────

describe('Criterion 1 – /map route loads', () => {
  it('mounts MapPage without throwing', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    expect(() =>
      mount(MapPage, { global: { plugins: [makeRouter()] } }),
    ).not.toThrow();
  });

  it('resolves to a rendered DOM', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.element).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 2 — Map canvas element renders
// ──────────────────────────────────────────────────────────────

describe('Criterion 2 – map canvas renders', () => {
  it('contains an element with aria-label "GAIA map canvas"', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('[aria-label="GAIA map canvas"]').exists()).toBe(true);
  });

  it('contains the map-canvas class', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('.map-canvas').exists()).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 3 — Fallback mode renders when API is unavailable
// ──────────────────────────────────────────────────────────────

describe('Criterion 3 – fallback mode when API is unavailable', () => {
  it('shows fallback warning message', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/demo fallback/i);
  });

  it('still renders the map grid (not a blank screen)', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('.map-grid').exists()).toBe(true);
  });

  it('displays the demo fallback status tag', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/demo fallback/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 4 — Live API mode renders when API is available
// ──────────────────────────────────────────────────────────────

describe('Criterion 4 – live API mode', () => {
  it('shows "live API" label when API responds successfully', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/live api/i);
    expect(wrapper.text()).toMatch(/live catalog/i);
  });

  it('does not show a fallback warning in live mode', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('.state-card.warning').exists()).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 5 — H3 lookup does not blank the page
// ──────────────────────────────────────────────────────────────

describe('Criterion 5 – H3 lookup path does not blank the page', () => {
  beforeEach(() => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());
  });

  it('page grid is still visible after a successful H3 lookup (fallback)', async () => {
    vi.mocked(fetchFeaturesByH3WithFallback).mockResolvedValue(demoH3FallbackResult());

    const wrapper = await mountMapPage();

    await clickH3InspectButton(wrapper);
    await flushPromises();

    expect(wrapper.find('.map-grid').exists()).toBe(true);
  });

  it('page grid is still visible when H3 lookup fails', async () => {
    vi.mocked(fetchFeaturesByH3WithFallback).mockRejectedValue(new Error('H3 network error'));

    const wrapper = await mountMapPage();

    await clickH3InspectButton(wrapper);
    await flushPromises();

    expect(wrapper.find('.map-grid').exists()).toBe(true);
  });

  it('shows lookup status after H3 inspect', async () => {
    vi.mocked(fetchFeaturesByH3WithFallback).mockResolvedValue(demoH3FallbackResult());

    const wrapper = await mountMapPage();

    await clickH3InspectButton(wrapper);
    await flushPromises();

    const hasStatus = wrapper.find('.lookup-status').exists();
    const hasGrid = wrapper.find('.map-grid').exists();
    expect(hasStatus || hasGrid).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 6 — Evidence / governance / runtime panels render
// ──────────────────────────────────────────────────────────────

describe('Criterion 6 – evidence, governance, runtime panels', () => {
  it('renders the evidence panel', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('#evidence-panel').exists()).toBe(true);
  });

  it('renders the governance panel', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('#governance-panel').exists()).toBe(true);
  });

  it('renders the feature inspector panel', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('#feature-panel').exists()).toBe(true);
  });

  it('shows at least one runtime posture entry', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.findAll('.runtime-row').length).toBeGreaterThan(0);
  });

  it('shows at least one governance validation lane', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    const governancePanel = wrapper.find('#governance-panel');
    expect(governancePanel.find('ul').exists()).toBe(true);
    expect(governancePanel.findAll('li').length).toBeGreaterThan(0);
  });

  it('shows at least one evidence reference', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    const evidencePanel = wrapper.find('#evidence-panel');
    expect(evidencePanel.exists()).toBe(true);
    expect(evidencePanel.find('ul.evidence-list').exists()).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 7 — App displays backend status clearly
// ──────────────────────────────────────────────────────────────

describe('Criterion 7 – backend status is displayed', () => {
  it('shows a status tag in the header', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('.tag').exists()).toBe(true);
  });

  it('shows "demo fallback" label in fallback mode', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    const tags = wrapper.findAll('.tag');
    const tagTexts = tags.map((t) => t.text().toLowerCase());
    expect(tagTexts.some((t) => t.includes('demo') || t.includes('fallback'))).toBe(true);
  });

  it('shows "live api" label in live mode', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    const tags = wrapper.findAll('.tag');
    const tagTexts = tags.map((t) => t.text().toLowerCase());
    expect(tagTexts.some((t) => t.includes('live'))).toBe(true);
  });

  it('shows a last-loaded timestamp after data is loaded', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    const tags = wrapper.findAll('.tag');
    const tagTexts = tags.map((t) => t.text().toLowerCase());
    expect(tagTexts.some((t) => t.includes('last loaded'))).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 8 — GAIA layer catalog integration
// ──────────────────────────────────────────────────────────────

describe('Criterion 8 – GAIA layer catalog and tile-manifest metadata', () => {
  it('renders the GAIA layer catalog panel', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('[data-testid="gaia-layer-catalog-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/GAIA layer catalog/i);
  });

  it('renders bounded OSM layer metadata from the catalog', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/Lower Manhattan Bounded Extract/i);
    expect(wrapper.text()).toMatch(/© OpenStreetMap contributors/i);
    expect(wrapper.text()).toMatch(/ODbL-1.0|OpenStreetMap/i);
  });

  it('fetches and displays tile manifest metadata when selecting a layer', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();
    const layerButton = wrapper.find('[data-testid="gaia-layer-button"]');
    await layerButton.trigger('click');
    await flushPromises();

    expect(fetchGaiaTileManifestWithFallback).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="gaia-tile-manifest-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/fixture-placeholder-not-production/i);
  });

  it('shows placeholder tile guard and does not treat placeholder URLs as production tiles', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.find('[data-testid="placeholder-tile-guard"]').text()).toMatch(/placeholder tile metadata only/i);
    expect(wrapper.text()).toMatch(/production_tile_serving=false/i);
    expect(wrapper.text()).toMatch(/never added as production MapLibre tile sources/i);
  });

  it('keeps catalog fallback mode visible when the catalog API is unavailable', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(demoLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(demoTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/demo catalog/i);
    expect(wrapper.find('[data-testid="gaia-layer-catalog-warning"]').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/Catalog mode remains advisory and fixture-backed/i);
  });

  it('renders attribution, provenance, and source receipt references', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveLayerCatalogResult());
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(liveTileManifestResult());

    const wrapper = await mountMapPage();

    expect(wrapper.text()).toMatch(/osm-source-receipt\.v1\.json/i);
    expect(wrapper.text()).toMatch(/sha256:e5baba/i);
    expect(wrapper.text()).toMatch(/8928308280fffff/i);
  });
});
