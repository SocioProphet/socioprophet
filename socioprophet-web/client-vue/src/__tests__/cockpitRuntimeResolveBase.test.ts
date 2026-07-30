// resolveBase — sovereign-mode egress-leak guard.
//
// A host in sovereign mode can inject `bases[key] = ''` to explicitly disable
// a service (nothing egresses off-device). The pre-fix `if (host)` truthiness
// check treated '' as absent, then fell through to VITE_* and the hosted
// default — exactly the egress the host was trying to prevent. The fix uses
// hasOwnProperty so PRESENCE wins over truthiness.
import { afterEach, describe, expect, it } from 'vitest';
import { resolveBase } from '../config/cockpitRuntime';

type Injected = { mode?: 'sovereign' | 'connected'; bases?: Record<string, string> };
function setInjected(cfg: Injected | undefined) {
  (window as unknown as { __COCKPIT_CONFIG__?: Injected }).__COCKPIT_CONFIG__ = cfg;
}

describe('resolveBase — presence beats truthiness for injected bases', () => {
  afterEach(() => { setInjected(undefined); });

  it('empty-string injected base is HONOURED, not treated as absent', () => {
    setInjected({ mode: 'sovereign', bases: { algo: '' } });
    // The build-time VITE_ALGO_BASE / code fallback must NOT be consulted —
    // the host declared: this service is off. Empty string is the answer.
    expect(resolveBase('algo', 'VITE_ALGO_BASE', '/svc/algo')).toBe('');
  });

  it('non-empty injected base wins as before', () => {
    setInjected({ mode: 'sovereign', bases: { algo: 'http://127.0.0.1:9090' } });
    expect(resolveBase('algo', 'VITE_ALGO_BASE', '/svc/algo')).toBe('http://127.0.0.1:9090');
  });

  it('key not injected falls through to the code fallback', () => {
    setInjected({ mode: 'connected', bases: {} });
    expect(resolveBase('algo', 'VITE_ALGO_BASE', '/svc/algo')).toBe('/svc/algo');
  });

  it('no config at all falls through to the code fallback', () => {
    setInjected(undefined);
    expect(resolveBase('algo', 'VITE_ALGO_BASE', '/svc/algo')).toBe('/svc/algo');
  });
});
