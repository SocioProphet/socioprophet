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

  it('renders the local BearBrowser handoff fixture in the stream', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('BearBrowser local handoff fixture');
    expect(wrapper.text()).toContain('browser-handoff-is-local-fixture');
    expect(wrapper.text()).toContain('capture-is-not-publication');
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

  it('renders BearBrowser local-event resolver status as disabled by default', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('BearBrowser local-event resolver');
    expect(wrapper.text()).toContain('disabled');
    expect(wrapper.text()).toContain('BearBrowser local-event handoff adapter is disabled');
    expect(wrapper.text()).toContain('no native browser bridge');
  });

  it('renders SlashTopics read-only resolver status as disabled by default', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('SlashTopics read-only resolver');
    expect(wrapper.text()).toContain('SlashTopics read-only resolver is disabled');
    expect(wrapper.text()).toContain('no feed fetch');
    expect(wrapper.text()).toContain('scope mutation');
  });

  it('renders New Hope read-only membrane resolver status as disabled by default', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('New Hope read-only membrane resolver');
    expect(wrapper.text()).toContain('New Hope read-only membrane resolver is disabled');
    expect(wrapper.text()).toContain('no live policy mutation');
    expect(wrapper.text()).toContain('memory writeback');
  });

  it('renders MemoryMesh read-only posture resolver status as disabled by default', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('MemoryMesh read-only posture resolver');
    expect(wrapper.text()).toContain('MemoryMesh read-only posture resolver is disabled');
    expect(wrapper.text()).toContain('no live recall');
    expect(wrapper.text()).toContain('durable writeback');
    expect(wrapper.text()).toContain('raw payload storage');
  });

  it('renders MeshRush read-only graph-view resolver status as disabled by default', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('MeshRush read-only graph-view resolver');
    expect(wrapper.text()).toContain('MeshRush read-only graph-view resolver is disabled');
    expect(wrapper.text()).toContain('no live traversal');
    expect(wrapper.text()).toContain('graph persistence');
    expect(wrapper.text()).toContain('runtime execution');
  });

  it('renders fixture-chain resolver outputs for the selected item', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('Fixture chain');
    expect(wrapper.text()).toContain('feed-global-news');
    expect(wrapper.text()).toContain('source-normalized-and-scope-resolved');
    expect(wrapper.text()).toContain('memorymesh-feed-intelligence-profile');
    expect(wrapper.text()).toContain('graph-view-feed-intelligence-reader-0001');
    expect(wrapper.text()).toContain('advisoryOnly');
    expect(wrapper.text()).toContain('traversal disabled');
  });

  it('renders membrane, memory, graph, and integration surfaces', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('New Hope membrane');
    expect(wrapper.text()).toContain('MemoryMesh posture');
    expect(wrapper.text()).toContain('MeshRush graph');
    expect(wrapper.text()).toContain('BearBrowser');
  });
});
