# socioprophet workspace controller (sociosphere)

This workspace controller focuses on the **control plane / ops** side of the ecosystem.

In practice, this is where you’d define:

- How agentplane is deployed (local dev, staging, prod)
- How fleet executors register / are discovered
- How evidence artifacts are collected, indexed, and replayed

Today this directory is a stub. The goal is to make the eventual transition:

`local-first → workstation → fleet nodes → cluster`

feel like a **smooth promotion pipeline**, not a rewrite.
