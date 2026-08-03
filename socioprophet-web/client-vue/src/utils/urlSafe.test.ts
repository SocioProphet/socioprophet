/**
 * Pins the BoardTable evidence-link guard (client-vue mirror of app-vue's #477 fix).
 * A deny case that leaks through here re-opens the click-XSS surface on any evidence
 * link once the source producer stops being fully trusted.
 */
import { describe, it, expect } from 'vitest';
import { isSafeHttp } from './urlSafe';

describe('isSafeHttp — client-vue evidence-link guard', () => {
  it.each([
    'https://github.com/SocioProphet/prophet-platform',
    'http://example.com/',
    'HTTPS://Example.com',
  ])('allows %s', (u) => {
    expect(isSafeHttp(u)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:x',
    'file:///etc/passwd',
    '\tjavascript:alert(1)',
    '',
    '//evil.example/path',
  ])('rejects %s', (u) => {
    expect(isSafeHttp(u)).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isSafeHttp(null)).toBe(false);
    expect(isSafeHttp(undefined)).toBe(false);
    expect(isSafeHttp({ href: 'https://x' })).toBe(false);
  });

  it('extras cannot re-enable javascript:', () => {
    expect(isSafeHttp('javascript:x', ['mailto', 'javascript'])).toBe(false);
  });
});
