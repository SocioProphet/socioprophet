# Developer program + marketplace — Linux-first, Flatpak-native

The dev program and app marketplace are **Linux-first and local-first** by default, and integrate with the existing
**Flatpak** ecosystem rather than reinventing packaging.

## Flatpak ≠ LXC (the layer that matters)
- **Flatpak** = Linux *application* packaging + sandboxing: **OSTree** (content-addressed delta storage of app +
  shared runtimes) + **bubblewrap** (unprivileged-namespace sandbox) + **portals** (governed resource access),
  distributed via **remotes** (Flathub is the big public one). It sandboxes a desktop app.
- **LXC/LXD** = *system* containers — a whole OS userspace, VM-like. Different layer; not what app packaging uses.
- (Also in the field: Snap = squashfs + AppArmor; AppImage = single-file, no sandbox; OCI/Docker = server containers.)

So "integrate with Flatpak" = treat Flatpak refs as a first-class package kind, federate Flathub, host our own
sovereign OSTree remote, and **govern the sandbox** (the `finish-args` / portal permissions).

## What we built (proven — `noetica/agent-machine/lib/marketplace.ts`, 7/7)
- **Manifest** with `kind: flatpak | appimage | oci | mcp-plugin`. Flatpak spec = appId (reverse-DNS), runtime,
  remote, branch, `finishArgs` (sandbox perms).
- **Conformance validator** — reverse-DNS ids, runtime/remote present, publisher signature (verified against the
  **broker** identity), and the **local-first/sovereign bar** (non-local-first apps are flagged).
- **Permission governance** — `assessPermissions` classifies `finish-args` (e.g. `--filesystem=host` → HIGH, can
  escape the sandbox) and feeds the **scope-d** install gate. *This is the differentiator: Flathub shows you
  permissions; we govern them by policy.*
- **Refs + install commands** — `flatpakRef` (`remote:app-id//branch`) + `flatpak install …` / `podman pull` / etc.

## How it composes with the estate
- **Gitea** (sovereign source) is where developers publish; **the broker** is the sovereign publisher identity (signs
  manifests); the existing **MCP plugin-store** is the `mcp-plugin` kind; **scope-d** governs install-time permissions.
- **Distribution**: federate **Flathub** (the whole Linux desktop catalog) AND host a **sovereign OSTree remote**
  (`socioprophet`) for our own + enterprise-private apps — governed, signed, offline-mirrorable.
- **Cloud-agnostic + cross-vendor broker** (cloud-broker.ts) means the marketplace backend runs anywhere.

## Roadmap
- ✅ Manifest + conformance + permission governance + refs (core, proven).
- ⬜ Marketplace UI (catalog, Flatpak badge, permission/risk view, install). ← in progress (Marketplace.vue)
- ⬜ Sovereign OSTree remote (host + sign) + Flathub federation mirror.
- ⬜ scope-d install gate wired to `assessPermissions`; publisher-signature verification via the broker.
- ⬜ Gitea CI → build Flatpak + push to the remote (the developer pipeline).
