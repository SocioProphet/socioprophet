import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Reader from '../pages/Reader.vue';

describe('Feed Intelligence Reader', () => {
  it('renders fixture-backed reader boundary and canonical stream', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('Reader as replayable knowledge refinery');
    expect(wrapper.text()).toContain('fixture-backed');
    expect(wrapper.text()).toContain('does not implement live feed fetching');
    expect(wrapper.text()).toContain('Ticker proof-of-life event normalized into the reader stream');
  });

  it('renders disabled adapter boundary before live behavior is enabled', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('Adapter boundary');
    expect(wrapper.text()).toContain('All Feed Intelligence live adapters are disabled');
    expect(wrapper.text()).toContain('BearBrowser reader bridge');
    expect(wrapper.text()).toContain('SlashTopics scope resolver');
    expect(wrapper.text()).toContain('New Hope membrane adapter');
    expect(wrapper.text()).toContain('MemoryMesh posture adapter');
    expect(wrapper.text()).toContain('MeshRush graph-view adapter');
  });

  it('renders membrane, memory, graph, and integration surfaces', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('New Hope membrane');
    expect(wrapper.text()).toContain('MemoryMesh posture');
    expect(wrapper.text()).toContain('MeshRush graph');
    expect(wrapper.text()).toContain('BearBrowser');
  });
});
