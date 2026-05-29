import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProfessionalIntelligence from '../pages/ProfessionalIntelligence.vue';

describe('ProfessionalIntelligence', () => {
  it('renders the fixture-backed dashboard and boundary notice', () => {
    const wrapper = mount(ProfessionalIntelligence);

    expect(wrapper.text()).toContain('SocioProphet operating dashboard');
    expect(wrapper.text()).toContain('Professional Intelligence OS');
    expect(wrapper.text()).toContain('read-only evidence surface');
    expect(wrapper.text()).toContain('Fixture-backed dashboard state');
  });

  it('renders gate status, controls, and source references', () => {
    const wrapper = mount(ProfessionalIntelligence);

    expect(wrapper.text()).toContain('Gate 4 — integrated demo');
    expect(wrapper.text()).toContain('Cybernetic controls');
    expect(wrapper.text()).toContain('mdheller/socioprophet-web@67cff37b3da44395757c9095e1cbc081ca73333b');
  });
});
