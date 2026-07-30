// Pure-function unit tests for the useNoeticaChat composable — pinning three
// adversarial-review defects so a regression trips CI instead of silently
// corrupting the compare / regenerate flow or ingesting a 500 MB file.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import {
  popTrailingAssistants,
  buildSharedHistory,
  validateAttachments,
  isAllowedAttachmentMime,
  MAX_ATTACH_BYTES,
  MAX_ATTACH_TOTAL_BYTES,
  persistState,
  createNoeticaChat,
  type ChatTurn,
} from '../composables/useNoeticaChat';

const u = (content: string): ChatTurn => ({ role: 'user', content });
const a = (content: string, extra: Partial<ChatTurn> = {}): ChatTurn => ({ role: 'assistant', content, ...extra });

describe('popTrailingAssistants — regenerate after fan-out', () => {
  it('pops every trailing assistant column back to the last user turn', () => {
    // fan-out of one prompt → 3 columns; regenerate must drop all 3
    const turns: ChatTurn[] = [
      u('what is verified compute?'),
      a('answer A', { fanoutModel: 'qwen' }),
      a('answer B', { fanoutModel: 'llama' }),
      a('answer C', { fanoutModel: 'gpt' }),
    ];
    const next = popTrailingAssistants(turns);
    expect(next.map((t) => t.role)).toEqual(['user']);
    expect(next[0].content).toBe('what is verified compute?');
  });

  it('preserves earlier user+assistant history — only trailing assistants go', () => {
    const turns: ChatTurn[] = [
      u('q1'), a('a1'),
      u('q2'), a('a2 column 1', { fanoutModel: 'x' }), a('a2 column 2', { fanoutModel: 'y' }),
    ];
    const next = popTrailingAssistants(turns);
    expect(next.map((t) => `${t.role}:${t.content}`)).toEqual(['user:q1', 'assistant:a1', 'user:q2']);
  });

  it('no-op when the last turn is already a user turn', () => {
    const turns: ChatTurn[] = [u('q1'), a('a1'), u('q2')];
    expect(popTrailingAssistants(turns)).toEqual(turns);
  });

  it('does not mutate the input array', () => {
    const turns: ChatTurn[] = [u('q'), a('a1'), a('a2')];
    const before = turns.slice();
    popTrailingAssistants(turns);
    expect(turns).toEqual(before);
  });
});

describe('buildSharedHistory — fan-out re-run after a prior fan-out', () => {
  it('includes prior assistant turns (not user-only)', () => {
    // The regression: the composable filtered to `role === 'user'`, so
    // every model in a fresh fan-out saw a memoryless chat.
    const turns: ChatTurn[] = [u('q1'), a('a1'), u('q2')];
    const h = buildSharedHistory(turns);
    expect(h).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' },
    ]);
  });

  it('takes only the FIRST assistant column per user turn when a prior fan-out produced N columns', () => {
    const turns: ChatTurn[] = [
      u('q1'),
      a('a1 qwen', { fanoutModel: 'qwen' }),
      a('a1 llama', { fanoutModel: 'llama' }),
      a('a1 gpt', { fanoutModel: 'gpt' }),
      u('q2'),
    ];
    const h = buildSharedHistory(turns);
    expect(h).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1 qwen' },   // FIRST column only
      { role: 'user', content: 'q2' },
    ]);
  });

  it('skips in-flight streaming assistant turns', () => {
    const turns: ChatTurn[] = [u('q1'), a('partial…', { streaming: true }), u('q2')];
    const h = buildSharedHistory(turns);
    expect(h).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'user', content: 'q2' },
    ]);
  });

  it('handles interleaved multi-turn fan-outs — one assistant per user, in order', () => {
    const turns: ChatTurn[] = [
      u('q1'), a('a1 A', { fanoutModel: 'A' }), a('a1 B', { fanoutModel: 'B' }),
      u('q2'), a('a2 A', { fanoutModel: 'A' }), a('a2 B', { fanoutModel: 'B' }),
      u('q3'),
    ];
    const h = buildSharedHistory(turns);
    expect(h).toEqual([
      { role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1 A' },
      { role: 'user', content: 'q2' }, { role: 'assistant', content: 'a2 A' },
      { role: 'user', content: 'q3' },
    ]);
  });

  it('drops orphan assistant turns with no preceding user turn', () => {
    const turns: ChatTurn[] = [a('stray'), u('q1'), a('a1')];
    const h = buildSharedHistory(turns);
    expect(h).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ]);
  });
});

describe('quota-legible persistence', () => {
  let origSetItem: (k: string, v: string) => void;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // reset the module-level state before each test — persistState leaks across
    // tests otherwise (it's shared by design so the UI sees one signal).
    persistState.value = 'ok';
    localStorage.clear();
    origSetItem = localStorage.setItem.bind(localStorage);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.setItem = origSetItem;
    warn.mockRestore();
  });

  it('flips persistState to "quota" on QuotaExceededError and stops persisting', async () => {
    const chat = createNoeticaChat();
    // First mutation persists cleanly.
    chat.turns.value.push({ role: 'user', content: 'q1' });
    await nextTick();
    expect(persistState.value).toBe('ok');
    expect(localStorage.getItem('noetica-chat-v1')).toBeTruthy();

    // Now every setItem throws — the next mutation should flip state to 'quota'
    // and log ONE warning. Subsequent mutations must not attempt setItem again.
    const setSpy = vi.fn((_k: string, _v: string) => {
      const e = new DOMException('quota', 'QuotaExceededError');
      throw e;
    });
    localStorage.setItem = setSpy as unknown as typeof localStorage.setItem;

    chat.turns.value.push({ role: 'assistant', content: 'a1' });
    await nextTick();
    expect(persistState.value).toBe('quota');
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/persistence disabled/);

    // Further mutations must NOT attempt setItem again (silent-drop regression).
    chat.turns.value.push({ role: 'user', content: 'q2' });
    await nextTick();
    chat.turns.value.push({ role: 'assistant', content: 'a2' });
    await nextTick();
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('reset() clears the store and puts persistence back to "ok"', async () => {
    const chat = createNoeticaChat();
    chat.turns.value.push({ role: 'user', content: 'q' });
    await nextTick();
    localStorage.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
    chat.turns.value.push({ role: 'assistant', content: 'a' });
    await nextTick();
    expect(persistState.value).toBe('quota');

    localStorage.setItem = origSetItem;
    chat.reset();
    expect(persistState.value).toBe('ok');
    expect(chat.turns.value).toEqual([]);
  });
});

describe('validateAttachments — per-file cap, aggregate cap, MIME allowlist', () => {
  const file = (name: string, size: number, type: string) => ({ name, size, type });

  it('accepts allowed MIME types under the cap', () => {
    const v = validateAttachments([
      file('a.pdf', 1_000_000, 'application/pdf'),
      file('b.txt', 500,       'text/plain'),
      file('c.png', 250_000,   'image/png'),
    ]);
    expect(v.errors).toEqual([]);
    expect(v.batchRejected).toBe(false);
    expect(v.accepted.map((f) => f.name)).toEqual(['a.pdf', 'b.txt', 'c.png']);
  });

  it('rejects files over the per-file cap with a visible error', () => {
    const oversized = file('big.pdf', MAX_ATTACH_BYTES + 1, 'application/pdf');
    const ok = file('ok.txt', 100, 'text/plain');
    const v = validateAttachments([oversized, ok]);
    expect(v.accepted.map((f) => f.name)).toEqual(['ok.txt']);
    expect(v.errors).toHaveLength(1);
    expect(v.errors[0]).toMatch(/big\.pdf/);
    expect(v.errors[0]).toMatch(/per-file cap/);
  });

  it('rejects the ENTIRE batch when aggregate exceeds the total cap', () => {
    // Three 19 MB files → 57 MB > 40 MB total cap → whole batch dropped, not
    // truncated (truncation would silently lose the tail).
    const nineteen = 19 * 1024 * 1024;
    const v = validateAttachments([
      file('a.pdf', nineteen, 'application/pdf'),
      file('b.pdf', nineteen, 'application/pdf'),
      file('c.pdf', nineteen, 'application/pdf'),
    ]);
    expect(v.batchRejected).toBe(true);
    expect(v.accepted).toEqual([]);
    expect(v.errors.at(-1)).toMatch(/batch total/);
    expect(v.errors.at(-1)).toMatch(String(MAX_ATTACH_TOTAL_BYTES / 1024 / 1024));
  });

  it('rejects disallowed MIME types', () => {
    const v = validateAttachments([
      file('a.exe', 1000, 'application/x-msdownload'),
      file('b.zip', 1000, 'application/zip'),
      file('c.txt', 1000, 'text/plain'),
    ]);
    expect(v.accepted.map((f) => f.name)).toEqual(['c.txt']);
    expect(v.errors).toHaveLength(2);
    expect(v.errors[0]).toMatch(/unsupported type/);
  });

  it('handles empty MIME strings — some browsers report "" for unknown types', () => {
    const v = validateAttachments([file('mystery', 1000, '')]);
    expect(v.accepted).toEqual([]);
    expect(v.errors[0]).toMatch(/unknown/);
  });

  it('isAllowedAttachmentMime allows the documented set only', () => {
    expect(isAllowedAttachmentMime('image/png')).toBe(true);
    expect(isAllowedAttachmentMime('image/svg+xml')).toBe(true);
    expect(isAllowedAttachmentMime('application/pdf')).toBe(true);
    expect(isAllowedAttachmentMime('text/plain')).toBe(true);
    expect(isAllowedAttachmentMime('text/markdown')).toBe(true);
    expect(isAllowedAttachmentMime('application/zip')).toBe(false);
    expect(isAllowedAttachmentMime('application/octet-stream')).toBe(false);
    expect(isAllowedAttachmentMime('')).toBe(false);
  });
});
