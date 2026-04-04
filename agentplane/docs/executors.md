# Executors (Selection and Inventory)

Executor selection precedence:
1) Bundle explicit executor: `spec.executor.ref`
2) Repo fleet inventory default: `fleet/inventory.json` → `defaultExecutor`
3) Host builder list fallback: `/etc/nix/machines` (legacy / host-specific)

Rationale:
- `/etc/nix/machines` is a host-local Nix builder mechanism.
- Fleet inventory is the repo-owned, future mesh source of truth.
- Bundles can pin an executor for reproducibility/testing.

Capabilities:
- `kvm=false` implies we avoid nested QEMU VM backends and prefer `lima-process`.
