import { afterEach, describe, expect, it, vi } from 'vitest';
import { askGraphWithFallback } from '../services/hellgraphApi';

afterEach(() => vi.unstubAllGlobals());

describe('hellgraphApi · askGraphWithFallback', () => {
  it('returns mode "live" with the GraphRAG result when the producer responds ok', async () => {
    const payload = { question: 'q', answer: 'a [1]', citations: [{ n: 1, fact: 'f', subject: 's', predicate: 'p', object: 'o', isIri: false, assertedAt: 't' }], synthesized: true, grounded: true };
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      return { ok: true, status: 200, statusText: 'OK', json: async () => payload };
    }));
    const result = await askGraphWithFallback('what wins on sovereignty?');
    expect(result.mode).toBe('live');
    expect(result.result?.answer).toBe('a [1]');
    expect(result.error).toBeUndefined();
  });

  it('passes through an honest grounded:false result as "live" (not an error)', async () => {
    const payload = { question: 'q', answer: '', citations: [], synthesized: false, grounded: false };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => payload })));
    const result = await askGraphWithFallback('nothing matches this');
    expect(result.mode).toBe('live');
    expect(result.result?.grounded).toBe(false);
  });

  it('fails CLOSED to "unreachable" (no fabricated result) on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({}) })));
    const result = await askGraphWithFallback('q');
    expect(result.mode).toBe('unreachable');
    expect(result.result).toBeNull();
    expect(result.error).toContain('503');
  });

  it('fails CLOSED to "unreachable" on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const result = await askGraphWithFallback('q');
    expect(result.mode).toBe('unreachable');
    expect(result.result).toBeNull();
    expect(result.error).toBe('network down');
  });
});
