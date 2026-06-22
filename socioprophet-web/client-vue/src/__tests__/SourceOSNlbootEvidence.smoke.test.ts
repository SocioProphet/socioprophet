import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ControlPlaneLifecycle from '../pages/ControlPlaneLifecycle.vue';
import NLBootEvidence from '../pages/NLBootEvidence.vue';

describe('ControlPlaneLifecycle', () => {
  it('renders the SourceOS lifecycle dashboard and non-authority boundary', () => {
    const wrapper = mount(ControlPlaneLifecycle);

    expect(wrapper.text()).toContain('ReleaseSet and BootReleaseSet assignment');
    expect(wrapper.text()).toContain('read-only evidence surface');
    expect(wrapper.text()).toContain('does not issue enrollment tokens');
    expect(wrapper.text()).toContain('Real Apple boot mutation');
  });
});

describe('NLBootEvidence', () => {
  it('renders NLBoot evidence records and non-goal boundary', () => {
    const wrapper = mount(NLBootEvidence);

    expect(wrapper.text()).toContain('Boot evidence artifacts');
    expect(wrapper.text()).toContain('evidence only');
    expect(wrapper.text()).toContain('does not issue boot commands');
    expect(wrapper.text()).toContain('Artifact cache record');
  });
});
