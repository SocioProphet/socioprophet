/**
 * Pins the token-storage decision made when the localStorage-lived bearer was flagged
 * in the adversarial-review pass: DOM-XSS anywhere in the app could exfil it forever.
 * Moved to sessionStorage; anything below is the contract that keeps it there.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset both stores between tests so migration behavior is legible.
beforeEach(() => {
  vi.resetModules();
  try { localStorage.clear(); } catch { /* jsdom always has it */ }
  try { sessionStorage.clear(); } catch { /* same */ }
});

describe('mesh bearer token — sessionStorage, not localStorage', () => {
  it('setMeshToken writes to sessionStorage and NOT localStorage', async () => {
    const m = await import('./mesh');
    m.setMeshToken('AUTH-abc');
    expect(sessionStorage.getItem('sp.conn.mesh-token')).toBe('AUTH-abc');
    expect(localStorage.getItem('sp.conn.mesh-token')).toBe(null);
  });

  it('meshToken reads back from sessionStorage', async () => {
    const m = await import('./mesh');
    m.setMeshToken('AUTH-xyz');
    expect(m.meshToken()).toBe('AUTH-xyz');
  });

  it('meshToken returns empty string when no token is set', async () => {
    const m = await import('./mesh');
    expect(m.meshToken()).toBe('');
  });

  it('trims whitespace on write', async () => {
    const m = await import('./mesh');
    m.setMeshToken('   AUTH-trimmed   ');
    expect(sessionStorage.getItem('sp.conn.mesh-token')).toBe('AUTH-trimmed');
  });
});

describe('legacy-localStorage migration', () => {
  it('migrates a token from localStorage to sessionStorage on first read', async () => {
    localStorage.setItem('sp.conn.mesh-token', 'LEGACY-token');
    const m = await import('./mesh');
    expect(m.meshToken()).toBe('LEGACY-token');
    // Migrated:
    expect(sessionStorage.getItem('sp.conn.mesh-token')).toBe('LEGACY-token');
    // And CLEARED from localStorage — the raw secret must not linger.
    expect(localStorage.getItem('sp.conn.mesh-token')).toBe(null);
  });

  it('is idempotent — second call is a no-op', async () => {
    localStorage.setItem('sp.conn.mesh-token', 'LEGACY');
    const m = await import('./mesh');
    m.meshToken(); // migrates
    // second call: localStorage empty, sessionStorage has it
    expect(m.meshToken()).toBe('LEGACY');
    expect(localStorage.getItem('sp.conn.mesh-token')).toBe(null);
  });

  it('does not migrate an empty legacy value', async () => {
    // A stale empty entry from a prior clear-attempt must not overwrite an in-use
    // sessionStorage value or shadow it with ''.
    localStorage.setItem('sp.conn.mesh-token', '');
    sessionStorage.setItem('sp.conn.mesh-token', 'IN-USE');
    const m = await import('./mesh');
    expect(m.meshToken()).toBe('IN-USE');
  });
});

describe('endpoint storage — localStorage is fine (not sensitive)', () => {
  it('setMeshBase writes to localStorage', async () => {
    const m = await import('./mesh');
    m.setMeshBase('https://mesh.example.test/');
    expect(localStorage.getItem('sp.conn.mesh')).toBe('https://mesh.example.test');
  });

  it('meshBase reads back the endpoint and strips a trailing slash', async () => {
    const m = await import('./mesh');
    m.setMeshBase('https://x.test/');
    expect(m.meshBase()).toBe('https://x.test');
  });
});
