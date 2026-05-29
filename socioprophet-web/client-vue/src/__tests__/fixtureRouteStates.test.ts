import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ControlPlaneLifecycle from '../pages/ControlPlaneLifecycle.vue';
import NLBootEvidence from '../pages/NLBootEvidence.vue';
import ProfessionalIntelligence from '../pages/ProfessionalIntelligence.vue';
import Reader from '../pages/Reader.vue';

describe('fixture route state panels', () => {
  it('renders Professional Intelligence fixture route state', () => {
    const wrapper = mount(ProfessionalIntelligence);

    expect(wrapper.text()).toContain('Fixture control state');
    expect(wrapper.text()).toContain('No live telemetry, writeback, or execution authority is active');
  });

  it('renders SourceOS lifecycle fixture route state', () => {
    const wrapper = mount(ControlPlaneLifecycle);

    expect(wrapper.text()).toContain('Fixture lifecycle state');
    expect(wrapper.text()).toContain('No enrollment, assignment, disk write, reboot, or host mutation authority is active');
  });

  it('renders NLBoot evidence fixture route state', () => {
    const wrapper = mount(NLBootEvidence);

    expect(wrapper.text()).toContain('Fixture boot evidence');
    expect(wrapper.text()).toContain('No boot command, EFI mutation, disk write, reboot, or hardware access is active');
  });

  it('renders Reader fixture route state', () => {
    const wrapper = mount(Reader);

    expect(wrapper.text()).toContain('Fixture reader state');
    expect(wrapper.text()).toContain('No live feed, memory, graph, browser, or publication adapter is active');
  });
});
