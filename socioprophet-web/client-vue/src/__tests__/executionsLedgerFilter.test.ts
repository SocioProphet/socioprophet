import { describe, expect, it } from 'vitest';
import { applyFilter, parseFilter, demoLedger } from '../features/executions-ledger/types';

describe('executions-ledger filter DSL', () => {
  it('parses attributes and bare keywords', () => {
    const f = parseFilter('status:verified input:external_alert|event receipt:present hybrid');
    expect(f.status).toEqual(['verified']);
    expect(f.input).toEqual(['external_alert', 'event']);
    expect(f.receipt).toEqual(['present']);
    expect(f.keywords).toEqual(['hybrid']);
  });

  it('status: filters to matching verdicts', () => {
    const verified = applyFilter(demoLedger, 'status:verified');
    expect(verified.length).toBe(demoLedger.filter((r) => r.verdict === 'verified').length);
    expect(verified.every((r) => r.verdict === 'verified')).toBe(true);
  });

  it('input: with | is an OR within the attribute', () => {
    const rows = applyFilter(demoLedger, 'input:external_alert|detection');
    expect(rows.every((r) => ['external_alert', 'detection'].includes(r.input.type))).toBe(true);
    expect(rows.length).toBe(demoLedger.filter((r) => ['external_alert', 'detection'].includes(r.input.type)).length);
  });

  it('multiple attributes AND together (narrow)', () => {
    const rows = applyFilter(demoLedger, 'status:verified input:event');
    expect(rows.every((r) => r.verdict === 'verified' && r.input.type === 'event')).toBe(true);
  });

  it('is case-insensitive and matches keywords across fields', () => {
    expect(applyFilter(demoLedger, 'HYBRID').length).toBe(1);
    expect(applyFilter(demoLedger, 'level:rejected').every((r) => r.epistemicLevel === 'rejected')).toBe(true);
  });

  it('empty query returns everything', () => {
    expect(applyFilter(demoLedger, '   ').length).toBe(demoLedger.length);
  });
});
