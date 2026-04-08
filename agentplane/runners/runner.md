Runner contract (backend-agnostic):
- run <bundle> --profile=staging|prod
- stop <bundle>
- status <bundle>
- logs <bundle>
- smoke <bundle>
- promote <bundle>
- rollback <bundle>

Backends:
- qemu-local (default)
- nixos-shell (optional staging)
- microvm (future single-host fleet posture)
- fleet (future mesh)
