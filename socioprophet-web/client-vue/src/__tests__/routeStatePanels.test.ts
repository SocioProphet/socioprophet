import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CodeSearch from '../pages/CodeSearch.vue';
import Journal from '../pages/Journal.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';

describe('RouteStatePanel', () => {
  it('renders state title and message', () => {
    const wrapper = mount(RouteStatePanel, {
      props: {
        state: 'empty',
        title: 'No results',
        message: 'The fixture returned no rows.',
      },
    });

    expect(wrapper.text()).toContain('empty');
    expect(wrapper.text()).toContain('No results');
    expect(wrapper.text()).toContain('fixture returned no rows');
  });
});

describe('Journal route states', () => {
  it('renders mock stream state after fixture events load', async () => {
    const wrapper = mount(Journal);
    expect(wrapper.text()).toContain('Loading fixture stream');

    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 80));
    await flushPromises();

    expect(wrapper.text()).toContain('Mock journal stream');
    expect(wrapper.text()).toContain('fixture events loaded');
    expect(wrapper.text()).toContain('mock boundary');
  });
});

describe('Code Search route states', () => {
  it('renders idle and ready states around mock search', async () => {
    const wrapper = mount(CodeSearch);

    expect(wrapper.text()).toContain('Search not started');
    expect(wrapper.text()).toContain('No remote code index is contacted');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Mock results ready');
    expect(wrapper.text()).toContain('fixture results returned');
    expect(wrapper.text()).toContain('mock boundary');
  });
});
