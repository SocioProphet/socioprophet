// BearBrowser transport seam — where "the browser is used by our agentic ops by default" lands.
// For T3 (JS-rendered) and hard targets, instead of a headless Playwright we drive BearBrowser, our
// own sovereign browser, over a host-provided render hook. This is a real seam, not a stub: bind a
// BearBrowserHost (the CDP/embed bridge the BearBrowser process exposes) and this becomes a live
// DirectFetch the AcquisitionService uses in place of the plain Node transport. Until a host is
// bound it fails loudly rather than silently degrading — no pretend rendering.
import type { DirectFetch } from '../../client-vue/src/features/acquisition/transport';
import type { NetResponse } from '../../client-vue/src/features/acquisition/fetcher';

// What the BearBrowser process must provide (implemented on the BearBrowser side of the bridge):
// render a URL in a real, fingerprint-realistic browser context and return the resulting document.
export interface BearBrowserHost {
  render(url: string, opts: {
    headers: Record<string, string>;
    proxyUrl?: string;
    waitFor?: 'load' | 'networkidle' | string; // selector or lifecycle
    timeoutMs?: number;
  }): Promise<{ status: number; html: string; finalUrl: string }>;
}

// Turn a bound BearBrowser host into a DirectFetch the governed plane can use for T2/T3.
export function bearBrowserDirectFetch(host: BearBrowserHost, opts: { waitFor?: string; timeoutMs?: number } = {}): DirectFetch {
  return async (url, { headers, proxyUrl }) => {
    const r = await host.render(url, { headers, proxyUrl, waitFor: opts.waitFor ?? 'networkidle', timeoutMs: opts.timeoutMs });
    return { status: r.status, headers: { 'x-final-url': r.finalUrl }, body: r.html } satisfies NetResponse;
  };
}

// Placeholder host that makes the missing wiring explicit — bind the real one from BearBrowser.
export const unboundBearBrowserHost: BearBrowserHost = {
  async render() { throw new Error('BearBrowser host not bound — wire the CDP/embed bridge from the BearBrowser process'); },
};
