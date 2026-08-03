// Durable KE-workbench store — the persistence backend behind `useKeWorkbench()`.
//
// This is the DROP-IN durable backend the KE-workbench contract
// (./keWorkbench.ts + ./KE_WORKBENCH_CONTRACT.md) hands off to. It satisfies the
// SAME `KeWorkbench` interface, so it swaps in behind `useKeWorkbench()` with NO
// caller change: the Reasoning Chain Inspector still writes through `ke.append`
// and Knowledge Studio still reads `ke.dictionaries` / `ke.ledger`.
//
// CONSUME-NOT-FORK: an authored asset IS a Knowledge Studio KE-contract shape
// (Dictionary | EntityType | RelationType). This store persists the SAME
// `AuthoredAsset` envelopes the reference impl produces — there is no parallel
// data model here. It owns only the durable client-side rows + the version chain.
//
// The five confirmed decisions (see KE_WORKBENCH_CONTRACT.md §"Decisions"):
//   1. Project-scoped. Rows are keyed by project/workspace id; a session/global
//      key is used when there is no active project context.
//   2. `id` stays opaque. A durable id (ULID) is minted on persist; the
//      consumer's `${target}-${seq}` id is retained UNCHANGED as a session-local
//      alias so callers are unaffected (`ledger.value[0].id === ev.id`).
//   3. Explicit version chain under the hood (`supersedes` links each row to the
//      prior latest for its (target, term)); the registry views return
//      LATEST-PER-TERM; `ledger` exposes the FULL history NEWEST-FIRST.
//   4. Unsigned-only at author time. The `gate` stays the sealing authority and
//      seals HONESTLY-UNSIGNED receipts; signing is a separate, later governance
//      step (never fabricated here).
//   5. Reactive refs. The ledger is a Vue `Ref`; the registries are `ComputedRef`s
//      derived from it; hydration from durable storage populates the SAME ref so
//      `KnowledgeStudio.vue` updates live on load and on every append.
//
// Client-side durable only — localStorage (what this app already uses for its
// stores; see src/stores/*.ts). NO live/shared backend writes.

import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { Dictionary, EntityType, RelationType } from './fixture';
import {
  createPromotionGate,
  type AuthoredAsset,
  type AuthoredShape,
  type AuthorshipTarget,
  type KeWorkbench,
  type PromotionGate,
} from './keWorkbench';
import { useProjects } from '../../stores/projects';

// ---------------------------------------------------------------------------
// Storage seam — a tiny synchronous key/value port. The default binds to the
// browser's localStorage DYNAMICALLY (re-reads `globalThis.localStorage` on every
// call) so it follows the ambient store even when a test harness swaps it per
// test; tests may also inject an in-memory store to exercise round-trips.
// ---------------------------------------------------------------------------
export interface KeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage, guarded for private-mode / SSR / node where it is absent. */
export const localStorageAdapter: KeStorage = {
  getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* quota / private mode — stay in-memory only */
    }
  },
  removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** An in-memory KeStorage — used by tests to simulate a durable backing store. */
export function memoryStorage(seed?: Record<string, string>): KeStorage {
  const m = new Map<string, string>(seed ? Object.entries(seed) : []);
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

// ---------------------------------------------------------------------------
// Durable id (ULID) — lexicographically sortable, collision-free, opaque to
// consumers. 48-bit ms timestamp + 80 bits of randomness, Crockford base32.
// ---------------------------------------------------------------------------
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function ulid(now = Date.now()): string {
  let ts = '';
  let t = now;
  for (let i = 0; i < 10; i++) {
    ts = B32[t % 32] + ts;
    t = Math.floor(t / 32);
  }
  let rand = '';
  const bytes = new Uint8Array(16);
  const c = globalThis.crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < 16; i++) rand += B32[bytes[i] % 32];
  return ts + rand;
}

// ---------------------------------------------------------------------------
// Persisted schema. A row wraps the contract's `AuthoredAsset` (unchanged) with
// the durable metadata the consumer never sees: a stable durable id, the version
// chain link, and the session-local alias the record arrived with.
// ---------------------------------------------------------------------------
const SCHEMA_VERSION = 1;
const KEY_PREFIX = 'sp-ke-workbench-v1';
const SESSION_SCOPE = '__session__';

interface DurableRow {
  /** Stable, collision-free id minted on persist. Opaque to consumers. */
  durableId: string;
  /** The consumer's `${target}-${seq}` id at author time — session-local alias. */
  alias: string;
  /** Explicit version chain: durableId of the row this one supersedes, if any. */
  supersedes: string | null;
  /** The unchanged KE-contract authorship envelope (with its asset). */
  record: AuthoredAsset;
}

interface DurableDoc {
  schema: number;
  scope: string;
  rows: DurableRow[]; // append order (oldest-first); the ledger view reverses it.
}

function storageKey(scope: string): string {
  return `${KEY_PREFIX}::${scope || SESSION_SCOPE}`;
}

function loadDoc(storage: KeStorage, scope: string): DurableDoc {
  try {
    const raw = storage.getItem(storageKey(scope));
    if (raw) {
      const doc = JSON.parse(raw) as DurableDoc;
      if (doc && Array.isArray(doc.rows)) return { schema: SCHEMA_VERSION, scope, rows: doc.rows };
    }
  } catch {
    /* corrupt / private mode — start empty, never throw at the seam */
  }
  return { schema: SCHEMA_VERSION, scope, rows: [] };
}

function saveDoc(storage: KeStorage, doc: DurableDoc): void {
  storage.setItem(storageKey(doc.scope), JSON.stringify(doc));
}

// ---------------------------------------------------------------------------
// Registry projection — LATEST asset per term for a target. Rows are scanned
// newest-first, so the first (newest) asset-bearing row per term wins; every
// older version is superseded in the view but retained in the ledger.
// ---------------------------------------------------------------------------
function latestPerTerm<T extends AuthoredShape>(ledger: AuthoredAsset[], target: AuthorshipTarget): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of ledger) {
    if (r.target !== target || !r.asset) continue;
    if (seen.has(r.term)) continue; // an older version — superseded in the view
    seen.add(r.term);
    out.push(r.asset as T);
  }
  return out;
}

export interface DurableKeWorkbenchOptions {
  /** Project/workspace id to scope rows by. Null/undefined → session scope. */
  projectId?: string | null;
  /** Durable backing store. Defaults to localStorage. */
  storage?: KeStorage;
}

/**
 * A `KeWorkbench` whose ledger is durably persisted (project-scoped) and hydrated
 * back into the SAME reactive refs on construction. Interface-identical to
 * `createKeWorkbench()` from ./keWorkbench.ts — it is a drop-in backend.
 */
export function createDurableKeWorkbench(options: DurableKeWorkbenchOptions = {}): KeWorkbench {
  const storage = options.storage ?? localStorageAdapter;
  const scope = options.projectId || SESSION_SCOPE;
  const gate: PromotionGate = createPromotionGate();

  // Hydrate durable rows into the reactive ledger (newest-first) on construction.
  const doc = loadDoc(storage, scope);
  const ledger: Ref<AuthoredAsset[]> = ref(doc.rows.map((r) => r.record).reverse());

  // Track the current-latest durableId per (target|term) so we can link the
  // explicit version chain when a later authorship supersedes it.
  const headByTerm = new Map<string, string>();
  for (const r of doc.rows) headByTerm.set(`${r.record.target} ${r.record.term}`, r.durableId);

  function persist(): void {
    saveDoc(storage, doc);
  }

  return {
    ledger,
    dictionaries: computed(() => latestPerTerm<Dictionary>(ledger.value, 'dictionary_term')),
    entityTypes: computed(() => latestPerTerm<EntityType>(ledger.value, 'entity_type')),
    relationTypes: computed(() => latestPerTerm<RelationType>(ledger.value, 'relation_type')),
    gate,
    append(record) {
      // id stays opaque + unchanged for the caller; mint a durable id underneath.
      const chainKey = `${record.target} ${record.term}`;
      const row: DurableRow = {
        durableId: ulid(),
        alias: record.id,
        supersedes: headByTerm.get(chainKey) ?? null,
        record,
      };
      headByTerm.set(chainKey, row.durableId);
      doc.rows.push(row); // oldest-first on disk
      persist();
      // Reactive: newest-first in the ledger ref so views + UI update live.
      ledger.value = [record, ...ledger.value];
      return record;
    },
    clear() {
      doc.rows = [];
      headByTerm.clear();
      persist();
      ledger.value = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Bind point — the single shared instance `useKeWorkbench()` returns. Cached per
// scope so the Inspector (writes) and Knowledge Studio (reads) share ONE durable
// instance for a given project, matching the reference singleton's semantics.
// ---------------------------------------------------------------------------
const instances = new Map<string, KeWorkbench>();

/**
 * Resolve the active project id from the client-side projects store, guarded so
 * it never throws where Pinia is inactive (returns null → session scope).
 */
function resolveProjectId(): string | null {
  try {
    // Guarded: throws where Pinia is inactive (SSR / bare unit tests) → session scope.
    return useProjects().currentProjectId ?? null;
  } catch {
    return null;
  }
}

/**
 * The durable backing of `useKeWorkbench()`. Returns the shared, project-scoped
 * durable instance — the exact seam the Inspector and Knowledge Studio bind to.
 */
export function resolveDurableKeWorkbench(projectId?: string | null): KeWorkbench {
  const scope = (projectId === undefined ? resolveProjectId() : projectId) || SESSION_SCOPE;
  let inst = instances.get(scope);
  if (!inst) {
    inst = createDurableKeWorkbench({ projectId: scope });
    instances.set(scope, inst);
  }
  return inst;
}

/** Test/teardown helper: drop cached instances so a fresh scope re-hydrates. */
export function __resetDurableInstances(): void {
  instances.clear();
}
