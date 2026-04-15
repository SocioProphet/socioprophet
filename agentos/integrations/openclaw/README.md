# OpenClaw integration pack (staging)

This directory stages the current SocioProphet OpenClaw integration pack under a subsystem-facing path rather than the public-surface root.

Why it lives here:

- `SocioProphet/socioprophet` already carries the AgentOS tool registry entry for `openclaw` as an `AssistantGateway`.
- The repo README explicitly says runtime/control-plane specifics should not be dumped into the public docs/marketing root, but subsystem-facing integration and staging material may live under `agentos/`, `agentplane/`, and related integration paths.
- No dedicated installed OpenClaw subsystem repo was visible through the current GitHub connector installation set, so this is the least-wrong landing zone for review.

What is included:

- live-host runbook and one-line command set
- acceptance gates and evidence-bundle expectations
- host preflight, config patching, and smoke scripts
- OpenClaw provenance plugin skeleton
- Hyperon CLI bridge candidate
- validation harness for the reference pack

What is *not* claimed here:

- this is not yet the canonical long-term subsystem home
- this branch does not claim a live OpenClaw runtime proof inside the repository
- this pack is staged for operator review and first-host execution

Suggested next move after merge:

- execute the runbook on a host with supported Node/OpenClaw/container prerequisites
- capture the first evidence bundle
- then decide whether to split this into a dedicated subsystem/runtime repo
