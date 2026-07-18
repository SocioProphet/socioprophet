import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

// Chat projects — a client-side store (localStorage), matching Noetica's model. A project
// groups a knowledge base; the chat scopes retrieval to the active project's collection.
// The collection id is a DERIVED string both this Vue app and Noetica compute identically,
// so uploads/retrieval bind to the same agent-machine collection with no shared store.
export interface Project { id: string; title: string; createdAt: number }

const LS_KEY = 'noetica-projects-v1';

// mirrors Noetica's projectCollectionId(): proj-<id, dashes stripped, 12 chars>
export function projectCollectionId(id: string): string {
  return `proj-${id.replace(/-/g, '').slice(0, 12)}`;
}

function load(): { projects: Project[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* private mode / bad json */ }
  return { projects: [], activeId: null };
}

export const useProjects = defineStore('projects', () => {
  const persisted = load();
  const projects = ref<Project[]>(persisted.projects);
  const activeId = ref<string | null>(persisted.activeId);

  watch([projects, activeId], () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ projects: projects.value, activeId: activeId.value })); }
    catch { /* quota / private mode */ }
  }, { deep: true });

  const active = computed<Project | null>(() => projects.value.find((p) => p.id === activeId.value) ?? null);

  function create(title: string): Project {
    const p: Project = {
      id: globalThis.crypto?.randomUUID?.() ?? `proj-${Date.now()}`,
      title: title.trim() || 'Untitled project', createdAt: Date.now(),
    };
    projects.value.push(p);
    activeId.value = p.id;
    return p;
  }
  function rename(id: string, title: string) {
    const p = projects.value.find((x) => x.id === id);
    if (p) p.title = title.trim() || p.title;
  }
  function remove(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id);
    if (activeId.value === id) activeId.value = null;
  }
  function setActive(id: string | null) { activeId.value = id; }

  return { projects, activeId, active, create, rename, remove, setActive };
});
