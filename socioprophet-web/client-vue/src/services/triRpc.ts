export type EventEnvelope = {
  ts: string;
  space: string;
  ns: string;
  actor: { id: string; pk: string };
  kind: string;
  body: Record<string, unknown>;
};

export type CodeSearchResult = {
  repo: string;
  path: string;
  preview: string;
};

const mockEnabled = (import.meta as any).env.VITE_MOCK === '1' || (import.meta as any).env.MODE === 'test';
const now = () => new Date().toISOString();

const mockEvents: EventEnvelope[] = [
  {
    ts: now(),
    space: 'twin',
    ns: 'default',
    actor: { id: 'usr', pk: 'ed25519:fixture' },
    kind: 'ai.message',
    body: { role: 'user', text: 'Hello from fixture-backed TriRPC.' },
  },
  {
    ts: now(),
    space: 'control',
    ns: 'client-vue',
    actor: { id: 'system', pk: 'ed25519:fixture' },
    kind: 'boundary.notice',
    body: { text: 'Mock-only adapter seam. No live backend is wired here.' },
  },
];

async function* stream<T>(items: T[], delayMs = 25): AsyncGenerator<T> {
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield item;
  }
}

function requireMock() {
  if (!mockEnabled) {
    throw new Error('TriRPC live adapter is not wired. Set VITE_MOCK=1 for fixture mode.');
  }
}

export const triRpc = {
  journal: {
    async append(event: EventEnvelope) {
      requireMock();
      mockEvents.push(event);
      return { feed: 'fixture-feed-0', offset: mockEvents.length, sig: 'fixture-signature' };
    },
    async snapshot() {
      requireMock();
      return { entries: mockEvents.slice(-50) };
    },
    subscribe() {
      requireMock();
      return stream(mockEvents, 25);
    },
  },
  code: {
    async search(params: { query: string }) {
      requireMock();
      const query = params.query || 'main';
      const results: CodeSearchResult[] = [
        { repo: 'socioprophet', path: 'socioprophet-web/client-vue/src/main.ts', preview: `Route registry mention for ${query}` },
        { repo: 'prophet-platform', path: 'apps/osm-map-api/README.md', preview: 'Fixture-backed API contract reference.' },
        { repo: 'memory-mesh', path: 'docs/context-pack.md', preview: 'Mock result only; no live code index is queried.' },
      ];
      return { results };
    },
  },
};
