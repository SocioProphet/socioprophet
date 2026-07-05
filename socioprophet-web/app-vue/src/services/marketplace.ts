// marketplace — client mirror of noetica's Linux-first marketplace core. Flatpak-first; federates Flathub + a
// sovereign OSTree remote; governs sandbox permissions via scope-d. See DEVELOPER_PROGRAM.md.
export type PackageKind = "flatpak" | "appimage" | "oci" | "mcp-plugin";
export type Risk = "low" | "elevated" | "high";

export interface FlatpakSpec { appId: string; runtime: string; remote: string; branch?: string; finishArgs: string[] }
export interface AppManifest {
  id: string; name: string; publisher: string; kind: PackageKind; localFirst: boolean;
  flatpak?: FlatpakSpec; oci?: { image: string }; appimage?: { url: string; sha256: string }; mcp?: { entry: string };
  signature?: string; homepage?: string; summary?: string;
}

const HIGH = new Set(["--filesystem=host", "--filesystem=host:rw", "--device=all", "--share=ipc"]);
const ELEVATED_PREFIX = ["--filesystem=", "--device=", "--socket=", "--talk-name="];

export function assessPermissions(finishArgs: string[]): { risk: Risk; flags: string[] } {
  const flags: string[] = [];
  let high = false, elevated = false;
  for (const a of finishArgs) {
    if (HIGH.has(a) || a.includes("org.freedesktop.Flatpak")) { high = true; flags.push(`HIGH: ${a}`); }
    else if (a === "--share=network") { elevated = true; flags.push(`elevated: ${a} (network)`); }
    else if (ELEVATED_PREFIX.some((p) => a.startsWith(p))) { elevated = true; flags.push(`elevated: ${a}`); }
  }
  return { risk: high ? "high" : elevated ? "elevated" : "low", flags };
}

const REVDNS = /^[a-z0-9]+(\.[a-z0-9][a-z0-9-]*)+$/i;
export function validateManifest(m: AppManifest): { ok: boolean; errors: string[]; warnings: string[]; risk: Risk } {
  const errors: string[] = []; const warnings: string[] = []; let risk: Risk = "low";
  if (!REVDNS.test(m.id)) errors.push("id must be reverse-DNS");
  if (!m.signature) warnings.push("unsigned");
  if (!m.localFirst) warnings.push("not local-first");
  if (m.kind === "flatpak" && m.flatpak) {
    if (!m.flatpak.runtime) errors.push("runtime required");
    const p = assessPermissions(m.flatpak.finishArgs ?? []); risk = p.risk; warnings.push(...p.flags);
  }
  return { ok: errors.length === 0, errors, warnings, risk };
}

export function installCommand(m: AppManifest): string {
  if (m.kind === "flatpak" && m.flatpak) return `flatpak install ${m.flatpak.remote} ${m.flatpak.appId}`;
  if (m.kind === "oci" && m.oci) return `podman pull ${m.oci.image}`;
  if (m.kind === "appimage" && m.appimage) return `curl -L ${m.appimage.url} -o app.AppImage && chmod +x app.AppImage`;
  if (m.kind === "mcp-plugin" && m.mcp) return `noetica plugin add ${m.mcp.entry}`;
  return "";
}

export function searchApps(catalog: AppManifest[], q: string, kind?: PackageKind): AppManifest[] {
  const n = q.trim().toLowerCase();
  return catalog.filter((m) => (!kind || m.kind === kind) && (!n || `${m.id} ${m.name} ${m.publisher} ${m.summary ?? ""}`.toLowerCase().includes(n)));
}

// Seed catalog: sovereign apps + federated Flathub + an MCP plugin — demonstrates the mixed, governed marketplace.
export const CATALOG: AppManifest[] = [
  { id: "ai.socioprophet.Notes", name: "Notes", publisher: "SocioProphet", kind: "flatpak", localFirst: true, signature: "sig", summary: "Graph-native notes (knowledge layer)", flatpak: { appId: "ai.socioprophet.Notes", runtime: "org.freedesktop.Platform//24.08", remote: "socioprophet", finishArgs: ["--socket=wayland"] } },
  { id: "ai.socioprophet.Mail", name: "Mail", publisher: "SocioProphet", kind: "flatpak", localFirst: true, signature: "sig", summary: "Hey+Superhuman sovereign mail", flatpak: { appId: "ai.socioprophet.Mail", runtime: "org.freedesktop.Platform//24.08", remote: "socioprophet", finishArgs: ["--share=network", "--socket=wayland"] } },
  { id: "org.gnome.gedit", name: "gedit", publisher: "GNOME (Flathub)", kind: "flatpak", localFirst: true, signature: "sig", summary: "Federated from Flathub", flatpak: { appId: "org.gnome.gedit", runtime: "org.gnome.Platform//46", remote: "flathub", finishArgs: ["--filesystem=home"] } },
  { id: "com.example.PowerTool", name: "PowerTool", publisher: "Example", kind: "flatpak", localFirst: true, summary: "Requests full host access", flatpak: { appId: "com.example.PowerTool", runtime: "org.freedesktop.Platform//24.08", remote: "flathub", finishArgs: ["--filesystem=host", "--share=network"] } },
  { id: "ai.socioprophet.GraphMCP", name: "Graph MCP", publisher: "SocioProphet", kind: "mcp-plugin", localFirst: true, signature: "sig", summary: "HellGraph tools for the choir", mcp: { entry: "@socioprophet/graph-mcp" } },
];
