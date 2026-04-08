# socio-linux workspace controller

This workspace controller is the “Linux substrate” side of the ecosystem.

Goals:

- Provide a **reproducible dev/runtime environment** for the AgentOS + agentplane ecosystem.
- Make it easy to run the same workflows on:
  - developer workstations (local-first)
  - fleet nodes (immutable/atomic OS)

Today this is a stub, but the shape is intentional:

- `flake.nix` provides a devShell with the core toolchain.
- Future: add NixOS modules for executor nodes, hardening profiles, and service deployment.
