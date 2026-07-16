# Sovereign hosting for app-vue (Firebase-Hosting replacement)

**Status: SCAFFOLD.** Staged now (parallel track), **not cut over** until the Firebase v0 of the `.ai` search
surface is validated on dev. This is the sovereign equivalent of Firebase Hosting — the same migration story as
auth moving off Firebase to socbase.

## What it is
- `Dockerfile` — multi-stage: `node` builds `socioprophet-web/app-vue` → `nginx:alpine` serves the static dist.
  `VITE_*` bases (incl. `VITE_SEARCH_API`) are baked per environment via `--build-arg`.
- `nginx.conf` — SPA fallback (`try_files … /index.html`, the Firebase `**→/index.html` equivalent), `/healthz`,
  immutable asset caching, security headers. The Firebase `/api/**→builder-api` Cloud Run rewrite has an nginx
  `proxy_pass` equivalent, held until cutover.
- `k8s/base` + `k8s/overlays/{dev,prod}` — kustomize; **dev/prod mirror the Firebase project aliases**
  (`dev`→`socioprophet-web-dev-env`, `prod`→`socioprophet-web`).

## Cutover checklist (do NOT do until Firebase v0 is validated)
1. Wire the image build (CI: build `Dockerfile`, push `registry.socioprophet.ai/app-vue-web:sha-<commit>`).
2. Pin that sha in `k8s/base/deployment.yaml` (no moving tags).
3. Add the Ingress + ManagedCertificate per overlay — **after** the DNS A record resolves (the cert's provisioning
   clock starts at DNS visibility; creating it early poisons it into `FailedNotVisible`).
4. Point `.ai` DNS at the sovereign ingress instead of Firebase, dev first.
