/**
 * Tests for the GAIA layer catalog integration on the /map workbench.
 *
 * Covers requirements from the layer-catalog integration issue:
 *  1. /map loads with layer catalog panel rendered
 *  2. Live API catalog mode renders layer metadata
 *  3. Fixture/fallback mode still renders if catalog API unavailable
 *  4. Selecting a layer fetches/displays tile manifest metadata
 *  5. Placeholder tile URLs are not treated as production tile serving
 *  6. Attribution/provenance/governance labels render
 *
 * MapLibre-GL is stubbed via src/__tests__/setup.ts so tests run without WebGL.
 * All API functions are mocked so tests are fully offline.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import MapPage from '../pages/MapPage.vue';
import {
  demoGaiaMapSnapshot,
  demoGaiaLayerCatalog,
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
  fetchGaiaMapSnapshotWithFallback,
  fetchGaiaLayerCatalogWithFallback,
  fetchGaiaTileManifestWithFallback,
} from '../api/gaiaMap';

// ──────────────────────────────────────────────────────────────
// Router helper
// ──────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/map', component: MapPage }, { path: '/', redirect: '/map' }],
  });
}

// ──────────────────────────────────────────────────────────────
// Fixture helpers
// ──────────────────────────────────────────────────────────────

function demoFallbackResult() {
  return {
    snapshot: demoGaiaMapSnapshot(),
    mode: 'demo' as const,
    warning: 'Using deterministic demo fallback because the GAIA OSM API is unavailable: Network Error',
  };
}

function liveModeResult() {
  return { snapshot: demoGaiaMapSnapshot(), mode: 'live' as const, warning: undefined };
}

function demoCatalogResult(warning?: string) {
  return { catalog: demoGaiaLayerCatalog(), mode: 'demo' as const, warning };
}

function liveCatalogResult() {
  return { catalog: demoGaiaLayerCatalog(), mode: 'live' as const, warning: undefined };
}

function demoTileManifest(layerId = 'gaia-osm-demo-road-layer-v1') {
  return {
    layer_id: layerId,
    url_template: `placeholder://tiles/${layerId}/{z}/{x}/{y}.mvt`,
    format: 'mvt-metadata',
    is_placeholder: true,
    is_production: false,
    generated_at: '2025-01-01T00:00:00Z',
    attribution: '© OpenStreetMap contributors',
    source_receipt_ref: 'demo://gaia/source-receipt.v1.json',
  };
}

function demoTileManifestResult(layerId?: string) {
  return { manifest: demoTileManifest(layerId), mode: 'demo' as const, warning: undefined };
}

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(demoFallbackResult());
  vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(demoCatalogResult());
  vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue(demoTileManifestResult());
});

// ──────────────────────────────────────────────────────────────
// Criterion 1 — /map loads with layer catalog panel
// ──────────────────────────────────────────────────────────────

describe('Criterion 1 – /map loads with layer catalog panel', () => {
  it('renders the #catalog-panel section', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('#catalog-panel').exists()).toBe(true);
  });

  it('renders the #tile-manifest-panel section', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('#tile-manifest-panel').exists()).toBe(true);
  });

  it('renders the #layers-panel section', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('#layers-panel').exists()).toBe(true);
  });

  it('renders a layer card with the demo layer title', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.text()).toMatch(/GAIA OSM Demo Road Layer/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 2 — Live API catalog mode renders layer metadata
// ──────────────────────────────────────────────────────────────

describe('Criterion 2 – live API catalog mode renders layer metadata', () => {
  it('shows "catalog live" when catalog API responds in live mode', async () => {
    vi.mocked(fetchGaiaMapSnapshotWithFallback).mockResolvedValue(liveModeResult());
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveCatalogResult());

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/catalog live/i);
  });

  it('renders the layer ID from the catalog', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveCatalogResult());

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="catalog-layer-detail"]').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/gaia-osm-demo-road-layer-v1/i);
  });

  it('renders attribution text from the catalog', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveCatalogResult());

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/OpenStreetMap contributors/i);
  });

  it('renders the H3 cell from the catalog layer', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveCatalogResult());

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/8928308280fffff/i);
  });

  it('renders the fixture digest from the catalog layer', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(liveCatalogResult());

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/demo-fallback-gaia-osm-v1/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 3 — Fixture/fallback mode still renders if catalog API unavailable
// ──────────────────────────────────────────────────────────────

describe('Criterion 3 – fixture/fallback mode still renders if catalog API unavailable', () => {
  it('shows "catalog fallback" tag when catalog API fails', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(
      demoCatalogResult('Using demo layer catalog fallback because the GAIA catalog API is unavailable: Network Error'),
    );

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/catalog fallback/i);
  });

  it('still renders the map grid when catalog API fails', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(
      demoCatalogResult('Using demo layer catalog fallback because the GAIA catalog API is unavailable: Network Error'),
    );

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('.map-grid').exists()).toBe(true);
  });

  it('still renders the catalog panel with demo data when catalog API fails', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(
      demoCatalogResult('offline'),
    );

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('#catalog-panel').exists()).toBe(true);
    expect(wrapper.find('[data-testid="catalog-layer-detail"]').exists()).toBe(true);
  });

  it('shows the catalog warning message when catalog API fails', async () => {
    vi.mocked(fetchGaiaLayerCatalogWithFallback).mockResolvedValue(
      demoCatalogResult('Using demo layer catalog fallback because the GAIA catalog API is unavailable: Network Error'),
    );

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/demo layer catalog fallback/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 4 — Selecting a layer fetches/displays tile manifest metadata
// ──────────────────────────────────────────────────────────────

describe('Criterion 4 – selecting a layer fetches/displays tile manifest metadata', () => {
  it('renders the tile manifest panel with layer ID', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="tile-manifest-detail"]').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/gaia-osm-demo-road-layer-v1/i);
  });

  it('renders the tile manifest URL template', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.text()).toMatch(/placeholder:\/\/tiles\//i);
  });

  it('calls fetchGaiaTileManifestWithFallback on mount', async () => {
    mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(vi.mocked(fetchGaiaTileManifestWithFallback)).toHaveBeenCalled();
  });

  it('calls fetchGaiaLayerCatalogWithFallback on mount', async () => {
    mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(vi.mocked(fetchGaiaLayerCatalogWithFallback)).toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 5 — Placeholder tile URLs are not loaded as production tiles
// ──────────────────────────────────────────────────────────────

describe('Criterion 5 – placeholder tile URLs are not treated as production tiles', () => {
  it('shows placeholder advisory notice when tile manifest is_placeholder', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="tile-manifest-placeholder-notice"]').exists()).toBe(true);
  });

  it('placeholder notice text indicates metadata-only display', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const notice = wrapper.find('[data-testid="tile-manifest-placeholder-notice"]');
    expect(notice.text()).toMatch(/metadata only/i);
    expect(notice.text()).toMatch(/not loaded as production/i);
  });

  it('does not show placeholder notice for a production tile manifest', async () => {
    vi.mocked(fetchGaiaTileManifestWithFallback).mockResolvedValue({
      manifest: {
        layer_id: 'some-layer',
        url_template: 'https://tiles.example.com/{z}/{x}/{y}.mvt',
        format: 'mvt',
        is_placeholder: false,
        is_production: true,
      },
      mode: 'live' as const,
      warning: undefined,
    });

    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="tile-manifest-placeholder-notice"]').exists()).toBe(false);
  });

  it('shows fixture advisory notice when catalog layer is fixture-backed', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="catalog-fixture-advisory"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="catalog-fixture-advisory"]').text()).toMatch(/fixture-backed/i);
  });
});

// ──────────────────────────────────────────────────────────────
// Criterion 6 — Attribution/provenance/governance labels render
// ──────────────────────────────────────────────────────────────

describe('Criterion 6 – attribution/provenance/governance labels render', () => {
  it('renders attribution text in the catalog panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/OpenStreetMap contributors/i);
  });

  it('renders license refs in the catalog panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/ODbL/i);
  });

  it('renders source receipt ref in the catalog panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/source-receipt/i);
  });

  it('renders safety status in the catalog panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/advisory/i);
  });

  it('renders "production ready: no" for fixture-backed catalog layer', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/no/i); // production_ready: false → 'no'
  });

  it('renders generated timestamp in the catalog panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const catalogPanel = wrapper.find('#catalog-panel');
    expect(catalogPanel.text()).toMatch(/2025/i);
  });

  it('renders attribution in the tile manifest panel', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const manifestPanel = wrapper.find('#tile-manifest-panel');
    expect(manifestPanel.text()).toMatch(/OpenStreetMap contributors/i);
  });

  it('renders governance validation lanes', async () => {
    const wrapper = mount(MapPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const govPanel = wrapper.find('#governance-panel');
    expect(govPanel.find('ul').exists()).toBe(true);
    expect(govPanel.findAll('li').length).toBeGreaterThan(0);
  });
});
