# Acceptance Gates

This pack is not considered operationally proven until the first real-host evidence bundle satisfies these gates.

| Gate | Required proof | Pass condition |
|---|---|---|
| Host prerequisites | `scripts/preflight_host.py` | Node meets OpenClaw minimum, `openclaw` present, one container runtime present |
| Config validity | `openclaw config validate --json` | exit 0 and no schema errors |
| Gateway health | `openclaw gateway status --json` | runtime running and RPC probe healthy |
| Plugin load | `openclaw plugins list --json`, `inspect`, `plugins doctor` | provenance plugin loaded, inspectable, no blocking doctor errors |
| Plugin health route | `curl /sp/provenance/health` | returns 200 with plugin health payload |
| Distiller health | `curl http://127.0.0.1:8080/healthz` | returns `ok: true` |
| Reasoner health | `curl http://127.0.0.1:8090/healthz` | returns `ok: true` |
| Distiller write path | Follow-up automation: `scripts/smoke_distiller_commit.sh` (not yet included in-repo for this PR); validate manually for now | turn accepted and basic memory commit accepted |
| Reasoner write path | Follow-up automation: `scripts/smoke_reasoner_http.sh` (not yet included in-repo for this PR); validate manually for now | job accepted and at least one claim returned |
| Evidence capture | Follow-up automation: `scripts/capture_live_evidence.sh` (not yet included in-repo for this PR); capture the evidence bundle manually for now | timestamped evidence directory created with manifest and command outputs |

No broader rollout should happen before these gates pass on a real host.
