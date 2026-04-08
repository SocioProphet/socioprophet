# System Space Strategy (Enterprise-aligned)

This repo (agentplane) is designed to survive any Linux install and to evolve into an enterprise-grade, OpenShift-aligned architecture.

## Today (local-first development)
- Control plane host: developer workstation (currently macOS; later Fedora Silverblue workstation).
- Executor node: local VM (Lima) acting as the first "fleet node".
- Agent execution: `lima-process` backend for fast iteration; evidence artifacts sync back to control plane.

## Near-term workstation (Fedora Silverblue / Atomic Desktop)
- Immutable base OS for laptops/workstations with atomic rollback (rpm-ostree deployments).
- Minimal base layering; dev/tooling in containers (“build-a-box” user space).
- agentplane remains the control plane (bundle → validate → place → run → evidence → replay).

## Fleet nodes (Fedora CoreOS)
- Immutable container host OS with atomic updates + declarative provisioning (Ignition).
- Executor nodes become real machines/VMs, not Lima.
- agentplane "executor discovery" shifts from /etc/nix/machines → fleet inventory.

## Image-native future (bootc / OCI-based OS delivery)
- System space built and promoted as signed bootable container images.
- Promotion/rollback becomes digest/tag pointer swaps (mirrors our pointer model in agentplane).

## Non-negotiables
- Open-source only; no AGPL dependencies in this repo.
- Evidence-forward execution: every run emits Validation, Placement, Run, Replay artifacts.
- Timeouts are bundle-owned policy (`spec.policy.maxRunSeconds`).
