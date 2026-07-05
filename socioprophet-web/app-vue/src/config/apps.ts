// Workspace/one app registry — drives the apps waffle launcher + routing. Each app maps to an existing backend
// (we embed/wire OSS rather than rebuild editors). status: 'live' wired | 'foundation' scaffolded | 'planned'.
export interface WorkspaceApp {
  id: string;
  name: string;
  icon: string;     // Tabler icon name (no ti- prefix)
  color: string;    // launcher tile color (Google-launcher feel)
  route: string;
  backend: string;  // what powers it
  status: "live" | "foundation" | "planned";
}

export const APPS: WorkspaceApp[] = [
  { id: "mail",     name: "Mail",      icon: "mail",         color: "#ea4335", route: "/mail",     backend: "prophet-workspace (Postfix/Dovecot)", status: "foundation" },
  { id: "calendar", name: "Calendar",  icon: "calendar",     color: "#1a73e8", route: "/calendar", backend: "Radicale CalDAV",                     status: "planned" },
  { id: "chat",     name: "Chat",      icon: "message",      color: "#0b8043", route: "/chat",     backend: "Matrix (Synapse) — the realtime substrate", status: "planned" },
  { id: "meet",     name: "Meet",      icon: "video",        color: "#00897b", route: "/meet",     backend: "Element Call / MatrixRTC (or Jitsi)", status: "planned" },
  { id: "drive",    name: "Drive",     icon: "folder",       color: "#1e8e3e", route: "/drive",    backend: "object storage",                      status: "planned" },
  { id: "docs",     name: "Docs",      icon: "file-text",    color: "#1a73e8", route: "/docs",     backend: "ONLYOFFICE (WOPI) + LibreOffice-headless conv", status: "planned" },
  { id: "sheets",   name: "Sheets",    icon: "table",        color: "#0f9d58", route: "/sheets",   backend: "ONLYOFFICE (WOPI) + LibreOffice-headless conv", status: "planned" },
  { id: "slides",   name: "Slides",    icon: "presentation", color: "#f4b400", route: "/slides",   backend: "ONLYOFFICE (WOPI) + LibreOffice-headless conv", status: "planned" },
  { id: "contacts", name: "Contacts",  icon: "users",        color: "#1a73e8", route: "/contacts", backend: "CardDAV",                             status: "planned" },
  { id: "photos",   name: "Photos",    icon: "photo",        color: "#ea4335", route: "/photos",   backend: "object storage + thumbs/EXIF",        status: "planned" },
  { id: "groups",   name: "Groups",    icon: "users-group",  color: "#1a73e8", route: "/groups",   backend: "mailing-list (mlmmj) + Matrix Space", status: "planned" },
  { id: "discuss",  name: "Discussions", icon: "news",       color: "#0b8043", route: "/discussions", backend: "Matrix federated rooms/threads (+ NNTP gateway)", status: "planned" },
  { id: "code",     name: "Code",      icon: "git-merge",    color: "#609926", route: "/code",     backend: "Gitea (sovereign git) — OIDC via broker", status: "planned" },
  { id: "cloud",    name: "Cloud",     icon: "cloud",        color: "#4285f4", route: "/cloud",    backend: "cross-vendor broker (cloud-broker.ts)", status: "foundation" },
  { id: "market",   name: "Marketplace", icon: "apps",       color: "#609926", route: "/market",   backend: "Linux-first marketplace (Flatpak-native, marketplace.ts)", status: "foundation" },
  { id: "forms",    name: "Forms",     icon: "forms",        color: "#7627bb", route: "/forms",    backend: "platform",                            status: "planned" },
  // Categories the 2026-H1 audit surfaced as real gaps (NOT thin embeds — see WORKSPACE_ONE_AUDIT_2026H1.md):
  { id: "wiki",     name: "Wiki",      icon: "book",         color: "#0b8043", route: "/wiki",     backend: "graph-native knowledge layer (knowledge-graph.ts → HellGraph)", status: "foundation" },
  { id: "notes",    name: "Notes",     icon: "notes",        color: "#f4b400", route: "/notes",    backend: "graph-native knowledge layer (knowledge-graph.ts)", status: "foundation" },
  { id: "projects", name: "Projects",  icon: "layout-kanban", color: "#1a73e8", route: "/projects", backend: "work-mgmt (graph-native or Plane/Focalboard)", status: "planned" },
  { id: "canvas",   name: "Canvas",    icon: "layout-board", color: "#00897b", route: "/canvas",   backend: "whiteboard (Excalidraw/tldraw)",      status: "planned" },
  { id: "flows",    name: "Flows",     icon: "circuit",      color: "#7627bb", route: "/flows",    backend: "automation + choir agents",           status: "planned" },
  { id: "aistudio", name: "AI Studio", icon: "sparkles",     color: "#7b3ff2", route: "/ai-studio", backend: "sovereign choir",                    status: "planned" },
];
