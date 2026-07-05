/**
 * Smoke tests for the five genuinely-new capability surfaces. Each must mount
 * (setup uses useRoute/useRouter) and render its default title + a real value
 * from its fixture.
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createPinia } from 'pinia';
import AlgoTradingBoard from '../pages/AlgoTradingBoard.vue';
import NlpExtractionBench from '../pages/NlpExtractionBench.vue';
import ExperimentsBoard from '../pages/ExperimentsBoard.vue';
import BehavioralAnalytics from '../pages/BehavioralAnalytics.vue';
import AppBuildBoard from '../pages/AppBuildBoard.vue';

const stub = { template: '<div />' };
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });

const cases: Array<{ name: string; comp: unknown; title: string; value: string }> = [
  { name: 'AlgoTradingBoard', comp: AlgoTradingBoard, title: 'Strategies', value: 'Semis Momentum' },
  { name: 'NlpExtractionBench', comp: NlpExtractionBench, title: 'Extraction Bench', value: 'Open Data Governance Board' },
  { name: 'ExperimentsBoard', comp: ExperimentsBoard, title: 'Experiments', value: 'Verified-compute vs baseline (identical 7B)' },
  { name: 'BehavioralAnalytics', comp: BehavioralAnalytics, title: 'Behavioral Analytics', value: 'Operators (pro tier)' },
  { name: 'AppBuildBoard', comp: AppBuildBoard, title: 'App Builds', value: 'BearBrowser' },
];

describe('capability surfaces', () => {
  for (const c of cases) {
    it(`${c.name} mounts and renders its title + fixture data`, () => {
      const wrapper = mount(c.comp as never, { global: { plugins: [router, createPinia()] } });
      const text = wrapper.text();
      expect(text).toContain(c.title);
      expect(text).toContain(c.value);
    });
  }
});
