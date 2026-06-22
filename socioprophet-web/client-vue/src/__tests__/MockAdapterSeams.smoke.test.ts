import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CodeSearch from '../pages/CodeSearch.vue';
import Journal from '../pages/Journal.vue';

describe('Journal mock adapter seam', () => {
  it('renders the mock-only Journal boundary and fixture event stream', async () => {
    const wrapper = mount(Journal);
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 60));
    await flushPromises();

    expect(wrapper.text()).toContain('Journal stream');
    expect(wrapper.text()).toContain('mock only');
    expect(wrapper.text()).toContain('No writeback, authorization, or backend stream is declared here');
  });
});

describe('Code Search mock adapter seam', () => {
  it('renders the mock-only Code Search boundary and fixture results', async () => {
    const wrapper = mount(CodeSearch);

    expect(wrapper.text()).toContain('Code Search');
    expect(wrapper.text()).toContain('mock only');
    expect(wrapper.text()).toContain('does not query GitHub, Sourcegraph, or any live code index');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('socioprophet:socioprophet-web/client-vue/src/main.ts');
    expect(wrapper.text()).toContain('Mock result only');
  });
});
