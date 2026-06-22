import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GatedActionCard from '../components/GatedActionCard.vue';
import { professionalIntelligenceControlState } from '../features/professional-intelligence/state';

describe('professionalIntelligenceControlState', () => {
  it('keeps the dashboard fixture-backed and non-authoritative', () => {
    expect(professionalIntelligenceControlState.sourceMode).toBe('fixture');
    expect(professionalIntelligenceControlState.boundaryNotice).toContain('not live telemetry');
    expect(professionalIntelligenceControlState.boundaryNotice).toContain('does not authorize runtime');
    expect(professionalIntelligenceControlState.gatedActions.length).toBeGreaterThan(0);
  });

  it('keeps all action affordances explicitly blocked or gated', () => {
    expect(
      professionalIntelligenceControlState.gatedActions.every((action) =>
        ['blocked', 'gated', 'fixture-only'].includes(action.statusLabel),
      ),
    ).toBe(true);
    expect(professionalIntelligenceControlState.gatedActions.some((action) => action.blockedReason.includes('Blocked'))).toBe(true);
  });
});

describe('GatedActionCard', () => {
  it('renders a disabled action and blocked reason', () => {
    const wrapper = mount(GatedActionCard, {
      props: {
        title: 'Promote evidence',
        description: 'Promotion requires authority.',
        actionLabel: 'Promote',
        blockedReason: 'Blocked until signer and ledger write contract are wired.',
        statusLabel: 'blocked',
        tone: 'danger',
      },
    });

    expect(wrapper.text()).toContain('Promote evidence');
    expect(wrapper.text()).toContain('Blocked until signer');
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});
