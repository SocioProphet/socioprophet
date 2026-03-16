export type EventEnvelope = {
  ts: string;
  space: string;
  ns: string;
  actor: { id: string; pk: string };
  kind: string;
  body: Record<string, unknown>;
};

const MOCK = (import.meta as any).env.VITE_MOCK === "1";
const now = () => new Date().toISOString();

const mockEvents: EventEnvelope[] = [
  {
    ts: now(),
    space: "twin",
    ns: "default",
    actor: { id: "usr", pk: "ed25519:..." },
    kind: "ai.message",
    body: { role: "user", text: "Hello" },
  },
];

async function* stream<T>(items: T[], delayMs = 300) {
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield item;
  }
}

export const triRpc = {
  journal: {
    async append(event: EventEnvelope) {
      if (MOCK) {
        mockEvents.push(event);
        return { feed: "f0", offset: mockEvents.length, sig: "sig" };
      }
      throw new Error("wire real");
    },
    async snapshot(_query: unknown) {
      if (MOCK) {
        return { entries: mockEvents.slice(-50) };
      }
      throw new Error("wire real");
    },
    subscribe(_query: unknown) {
      if (MOCK) {
        return stream(mockEvents, 500);
      }
      throw new Error("wire real");
    },
  },
  code: {
    async search(_params: unknown) {
      if (MOCK) {
        return {
          results: [
            {
              repo: "core",
              path: "src/main.go",
              preview: "func main() { … }",
            },
          ],
        };
      }
      throw new Error("wire real");
    },
  },
};
