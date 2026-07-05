# Workspace/one — Scoreboard (living: updated every turn)

Goal: **best in the world.** Legend: ✅ built+proven · 🟡 foundation/partial · ⬜ planned/backlog · ❌ absent (gap) · — n/a.
This is the running backlog + capabilities comparison. Each turn: log the delta, advance the backlog, never regress.

---

## ▶ This turn's delta (gaps bridged)
- **Firebase → Socbase (Supabase) — full swap, not just auth.** Scope turned out bigger than the shell login: `firebase-admin` was the primary *datastore* for this server (Firestore), not just a token verifier. Replaced end to end:
  - **Shell auth** (`app-vue`): `firebase.ts` → `socbase.ts` (`@supabase/supabase-js`); `stores/auth.ts` rewired to `signInWithOAuth`/`signInWithPassword`/`signUp`/`getSession`; `idToken()` now returns the Supabase `access_token`. Runtime config seam renamed `/firebase-config.js` → `/socbase-config.js` (`window.__SOCBASE_CONFIG__`). This is the app-vue shell's basic login (SourceOS builder + gates all routes including `/mail`) — **not** the sovereign-identity broker (`sovereign-id.ts` etc.) tracked elsewhere in this scoreboard; those are two different identity concerns.
  - **API auth middleware** (`server/src/middleware/auth.ts`): `admin.auth().verifyIdToken()` → `socbaseAdmin.auth.getUser(token)` (service-role client, no local JWT-secret handling).
  - **Firestore → Postgres**: designed `db/socbase-schema.sql` (profiles/builds/devices/device_claims/boot_proofs/notification_outbox) and rewrote every Firestore call-site (`events.ts`, `bootServer.ts`, `builds-route.ts`, `fleet-route.ts`) to `socbaseAdmin.from(...)`. Deliberately kept **quoted camelCase column names** to match existing JSON field names exactly — zero changes needed in `contracts.ts` validators, the Vue frontend, or the nlboot device wire contract. Added `.eq("uid", ...)` ownership filters everywhere Firestore's `users/{uid}/...` path used to provide that scoping implicitly (flat tables don't get it for free) — audited every route for this.
  - **GCS/GCP credential minting** (`buildOrchestrator.ts`, `bootServer.ts`): `admin.storage()`/`admin.app().options.credential` → `@google-cloud/storage` + `google-auth-library` directly. Storage itself stays on GCS (unrelated to Supabase) — only the SDK changed.
  - `firebase`/`firebase-admin` fully removed from both `package.json`s. OpenAPI security scheme renamed `firebaseIdToken` → `socbaseAccessToken`.
  - Typecheck clean on both sides (server baseline: 7 pre-existing errors, all in untouched files, unchanged); app-vue `npm run verify` (typecheck+test+build) green, 10/10 tests still passing.
  - **Not done / explicitly out of scope this turn:** `functions/index.js` (Firebase Cloud *Functions* — a hosting platform choice, not a client-library swap) and the legacy `client/` React app, per this README's own deprioritization. **Untested against a live Supabase project** — no `SUPABASE_URL`/keys were available in this environment; the schema and query rewrites are typecheck-clean and logically reviewed but need a real integration pass (daily-build-limit count query, tier gating, device-claim flow) before this ships to production.

### (prev) T-18 delta
- **Mail compose/reply wired off stub** — `mail.ts` store gained `replyToCurrent`, `sendNew`, `draftReply` actions over the existing `mailApi` contract (no backend contract changes needed — `sendMail`/`aiDraft` were already defined, just never called from the UI).
- Reply bar now sends on Enter (optimistic message append), AI-draft button pulls a real choir draft into the field, and a new Compose modal (`mail.composeOpen`) sends net-new mail; `Escape` closes any open overlay; `C` opens Compose (Gmail-style), joining the existing `j/k/e/r/s`/⌘K chords.
- **app-vue gets test coverage for the first time** — Vitest + `@vue/test-utils` + happy-dom wired in (`vite.config.ts`, mirroring `client-vue`'s setup); `npm test`/`verify` scripts added. 10/10 passing (6 store, 4 component-mount) covering send/reply/draft payload shape, optimistic append, error paths, and the Compose/Escape/AI-draft UI flow.
- Typecheck (`vue-tsc --noEmit`) and `npm run build` both clean.
- **Known gap, not closed this turn:** could not do a live-browser click-through — `/mail` sits behind the real Firebase auth guard in `router.ts` and there is no dev-mode bypass; declined to add one (even temporarily) since disabling auth checks is a real security-weakening change. Verification relied on full component-mount tests instead (same render tree/handlers a browser would exercise). (Resolved next turn — see T-19: Firebase auth is gone, replaced with Socbase, but the same live-browser gap applies until a Supabase project is configured.)

### (prev) T-15 delta
- **Mail bridge runs over HTTP** (`mail-bridge-server.ts`) matching the Vue `mailApi` contract — webmail works with zero client changes.
- **3-agent reassessment (robustness / UX / deploy) + hardened the top findings:**
  - 🔒 broker **enrollment now self-signed** (`verifyCredential`) + no silent overwrite → closes the impersonation hole
  - 🔒 OIDC verify pins **alg=EdDSA**, rejects future `iat`, enforces optional `nonce`
  - 🔒 `loadOrCreateRoot` only creates on **ENOENT + `wx`** → no more silent root-loss on a transient error
  - 🔒 HTTP **body caps + request timeouts** (both servers); mail **scoped CORS + OPTIONS**; broker **fail-closed** on missing signing key in prod
  - ✅ mail thread-id collision fixed (group by subject+sender); `mergeGraphs` prefers real nodes over stubs + dedupes edges
  - 🎨 choir error path no longer shows green "grounded"; Code iframe fallback banner; Market empty state
  - 📝 honest config: broker isn't an OIDC auth-code IdP yet → Gitea SSO marked TODO (local auth); broker replicas→1 (in-memory store)
- All green: **54/54 lib tests, TS 0, lint 0, vue-tsc 0, helm lint clean.** See "Reassessment" below for what's fixed vs tracked.

### (prev) T-14 delta
- Mail bridge core (`mail-bridge.ts`, 5/5) — IMAP↔REST, Hey model + Screener + IMAP-mutating actions.

### Turn log
| Turn | Shipped (proven) |
|---|---|
| T-1 | Sovereign identity architecture; broker core `sovereign-id.ts` — per-scope unlinkable facets + aliases (6/6) |
| T-2 | `provisionScopeAlias` (Senzing defeat deliverable via mail_aliases); 4-agent competitive audit + reframe |
| T-3 | Auth handshake `sovereign-broker.ts` — root never leaves edge, passkey-style (6/6); ONLYOFFICE decision |
| T-4 | OIDC issuance `sovereign-oidc.ts` (6/6); full login 18/18; this scoreboard |
| T-5 | Graph-native knowledge layer `knowledge-graph.ts` (7/7) — the Notion leapfrog; Wiki+Notes → foundation |
| T-6 | Compulsion-resistance vault `sovereign-vault.ts` (5/5); knowledge editor UI (live backlinks/rollups); DAO model. 30 tests |
| T-7 | Sealed HellGraph write-path `knowledge-persist.ts` (4/4) — durable + GDS-on-ciphertext + content sealed under root. 34 tests |
| T-8 | GDS live in editor: PageRank "central ideas" + pathBetween "what connects A↔B" (9/9); stub-node fix; sealed persist wired. 36 tests |
| T-9 | Broker HTTP service `sovereign-broker-service.ts` (5/5) — enroll→challenge→verify→token, public-only storage; Helm chart (lint clean). 41 tests |
| T-10 | Gitea Code app (OIDC'd, Helm); cross-vendor cloud broker services layer (12/12) + Cloud panel; deployment cloud-agnostic (one chart, any cloud) |
| T-11 | Broker container entrypoint (`sovereign-broker-server` + Dockerfile, 2/2 live-HTTP) — IdP boots & serves OIDC end-to-end. Identity suite 25 |
| T-12 | Linux-first marketplace core (`marketplace.ts`, 7/7) — Flatpak-native, sandbox-permission governance, Flathub federation + sovereign OSTree; Market panel + dev-program doc |
| T-13 | Choir AI woven in — graph-grounded + governed (`choir-grounding.ts`, 4/4): cites real nodes, scope-d gating, structural anti-hallucination; in-editor AI panel |
| T-14 | Mail bridge core (`mail-bridge.ts`, 5/5) — IMAP↔REST, Hey model (Imbox/Feed/Paper Trail) + Screener + actions mutating IMAP; gate on leaving Google |
| T-15 | Mail bridge runs (HTTP); 3-agent reassessment + hardening (impersonation/DoS/root-loss/OIDC/CORS fixes); 54/54 |
| T-16 | NeoCloud added to the broker (CoreWeave/Lambda/Nebius/Crusoe; H100 ~$2/hr, 14/14) + HYPERSCALER_STRATEGY.md (broker-not-build + Google-sheet coverage map) |
| T-17 | AI stack head-to-head — Azure/Google/AWS/IBM watsonx mapped vs us (AI_STACK_COMPARISON.md, 12 research agents); verdict + converged priorities |
| T-18 | Mail compose/reply off stub (`replyToCurrent`/`sendNew`/`draftReply`, Compose modal, Escape/C chords); first app-vue test suite (Vitest+VTU, 10/10) |
| T-19 | **Firebase → Socbase (Supabase): shell auth + full Firestore→Postgres datastore migration (5 backend files, new schema) + GCS/GCP creds off firebase-admin; `firebase`/`firebase-admin` fully removed. Untested against a live Supabase project — needs an integration pass before production.** |

## ▶ Reassessment (T-15) — fixed vs tracked
**Fixed this turn (security/correctness/UX):** broker impersonation (self-signed enroll), OIDC alg/iat/nonce, root-loss on transient error, HTTP body caps + timeouts, mail CORS+OPTIONS, broker fail-closed key, mail thread collisions, mergeGraphs stub/dedupe, choir error signal, Code iframe fallback, Market empty state.

**Tracked (not yet done) — before any real deploy:**
- **P0 deploy:** build/push the `workspace-broker` + a `workspace-mail-bridge` image (Dockerfiles/CI); Postgres-backed broker store (so >1 replica + durable enrollments); broker signing-key Secret created in-chart; TLS non-optional for the IdP; PVC backups.
- **P0 SSO:** broker OIDC authorization-code endpoints + Gitea OAuth2 auth source (real sovereign SSO into Gitea/Matrix).
- **P0 data plane:** real Dovecot `ImapStore` adapter + persisted Screener allow-list (replace the demo store).
- **P1 UX:** Knowledge editor render-in-place + autosave + block delete/reorder; Mail compose/reply wiring + keyboard (scroll-into-view, chords, `?` help); one shared Workspace shell; a11y pass (focus rings, aria, keyboard-activable chips).
- **P1:** wire `VITE_*` at web build time; knowledge-persist transactional write; marketplace signature verification + argv-not-shell install.

---

## ▶ Capabilities vs the world
### Identity & trust — OUR MOAT (we lead; nobody else is built this way)
| Capability | Us | Google | MS | Proton | Nextcloud | Notion |
|---|---|---|---|---|---|---|
| Sovereign root, user-held key | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Per-scope **unlinkable** pseudonyms | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Per-scope alias (defeat entity-resolution) | ✅ | ❌ | ❌ | 🟡 email-only | ❌ | ❌ |
| Root-never-leaves-edge auth (passkey-derived) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Standard OIDC issuance (RP-consumable) | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ |
| IdP deployed + fronting apps | 🟡 service+Helm+container boot, cluster pending | ✅ | ✅ | ✅ | ✅ | ✅ |
| Anonymous credentials (SD-JWT-VC/BBS+) | ⬜ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MDM compartmentalization | ⬜ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Trace-open governance (accountable anonymity) | ⬜ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Suite apps
| App | Us | Google | MS | Proton | Nextcloud | Notion |
|---|---|---|---|---|---|---|
| Mail | 🟡 compose/reply/draft wired (10/10) + bridge core (5/5); still stub data until `VITE_MAIL_API` points at a real bridge | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar / Contacts | ⬜ (Radicale/CardDAV) | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Office (Docs/Sheets/Slides) | ⬜ (ONLYOFFICE) | ✅ | ✅✅ desktop | ✅ | ✅ | 🟡 |
| Drive / Photos | ⬜ | ✅ | ✅ | ✅ | ✅ | — |
| Chat / Meet (Matrix) | ⬜ | ✅ | ✅ | 🟡 | ✅ | — |
| Groups + **federated Discussions** | ⬜ | 🟡 | ❌ | ❌ | 🟡 Talk-fed | ❌ |
| **Graph-native knowledge** (Notion leapfrog) | 🟡 core + editor | ❌ | ❌ | ❌ | ❌ | ✅ (fakes graph) |
| Work-mgmt / Wiki / Canvas / Flows | ⬜ | 🟡 | 🟡 | ❌ | 🟡 | ✅ |
| AI woven into apps (sovereign models) | 🟡 choir grounded+governed | ✅ Gemini | ✅ Copilot | ✅ Lumo | ✅ Assistant | ✅ |
| **AI grounded in a real graph + anti-hallucination + governed** | ✅ unique | ❌ vector RAG | ❌ | ❌ | ❌ | ❌ |
| **Code / Git + dev workspace** | 🟡 Gitea OIDC'd (Helm) | 🟡 (Cloud Source) | ✅ GitHub | ❌ | ❌ | ❌ |
| **Cloud console (cross-vendor)** | 🟡 broker panel | ✅ (own cloud) | ✅ (own) | ❌ | ❌ | ❌ |

### Platform / trust differentiators
| Capability | Us | Others |
|---|---|---|
| Self-host / data-never-leaves | ✅ | NC ✅ · Proton hosted-E2E · Google/MS/Notion ❌ |
| **Cloud-vendor agnostic / cross-vendor broker** | ✅ one chart any cloud + service broker | ❌ — they ARE the vendor (lock-in by design) |
| **Linux-first marketplace + dev program** | ✅ Flatpak-native, permission-governed (core) | app stores tied to their OS/cloud; none govern Flatpak perms by policy |
| **Compulsion resistance (operator *can't* decrypt/unlock)** | ✅ vault proven | ❌ all — even Proton can be served/forced; none are no-custody + DAO |
| Ontology-governed sharing (scope-d) | 🟡 estate | ❌ all |
| E2E encryption (content) | 🟡 vault proven, wiring pending | Proton ✅ · others ❌ |
| Admin console | ⬜ (orggov exists) | ✅ all |
| Compliance / eDiscovery / DLP | ❌ | Google/MS ✅ (our gap) |
| Mobile apps | ❌ (DAV interop only) | ✅ all |

---

## ▶ Backlog (prioritized; world-class bar)
**P0 — Socbase live (the shell's login is blocking EVERYTHING else below — nothing in this app is reachable in prod until this works):**
0. ⬜ Deploy `charts/socbase-schema` + `deploy/values/socbase-{auth,rest}.yaml` (prophet-platform, socioprophet-platform GCP project) to a real cluster OR smoke-test `infra/local/docker-compose.socbase.yml` with podman — **neither has been run once**, both are only `helm template`/lint-verified. Then wire `SUPABASE_URL`/keys into `server/.env` + `app-vue/public/socbase-config.js` for real.
0a. ⬜ **Nothing is committed yet** — 29 files uncommitted on socioprophet's `master`, 7 on prophet-platform's `main` (T-18/T-19 + the ArgoCD registration). Needs a branch+PR decision before anyone else can build on this.

**P0 — Identity moat (the lead; finish it):**
1. 🟡 IdP deploy — broker service + Helm + **container entrypoint (boots, serves OIDC) DONE**; remaining: build/push the
   `workspace-broker` image (Dockerfile.broker) + apply to a cluster + front Gitea/Matrix/mail/DAV on it.
2. ⬜ External-IdP relay (consume Google/corp/passkey → bind to root, strip correlation) + wire `scopeAlias`→`mail_aliases` live.
3. ⬜ Anonymous credentials (SD-JWT-VC) + `AnonymousReputationReceipt` runtime.
4. ⬜ MDM work-facet compartmentalization.
4a. ✅ Compulsion-resistance vault (`sovereign-vault.ts`) — E2E seal under root keys.
4b. ⬜ **Wire the vault into app data** (mail/drive/docs/knowledge sealed under root keys) — make "we can't read it" true end-to-end.
4c. ⬜ **User-gated trace-open** (threshold guardians; operator/DAO hold none) + social/threshold recovery.
4d. ⬜ **DAO transition** — threshold (k-of-n) IdP signing key across independent operators; no single compellable party.

**P0 — Mail to real (the cutover gate):**
5. 🟡 `workspace-mailapi` IMAP/JMAP↔REST bridge exists (`mail-bridge-server.ts` in noetica, 5/5); Vue Mail compose/reply/draft now wired to the `mailApi` contract (10/10) — remaining: point `VITE_MAIL_API` at a real deployed bridge instance and confirm end-to-end against live IMAP.

**P1 — The offensive leapfrog + suite breadth:**
6. ⬜ Graph-native knowledge layer (block editor on HellGraph; docs/db/entities = nodes; choir-native; CRDT-synced).
7. ⬜ ONLYOFFICE (WOPI) + LibreOffice-headless conv · Matrix deploy · object-store Drive/Photos · Radicale Calendar/Contacts UIs.

**P2 — Glue + new categories:**
8. ⬜ Unified search (wire sherlock) · Admin console (surface orggov) · Notifications (Matrix push).
9. ⬜ Work-mgmt (Projects) · Wiki · Canvas (Excalidraw/tldraw) · Flows (choir agents).
10. ⬜ E2E encryption posture decision (vs Proton) · governed sharing UI (scope-d).

**P3 — Reach:**
11. ⬜ Mobile (native DAV/IMAP first) · Linux-first developer program + app marketplace · compliance/DLP.
