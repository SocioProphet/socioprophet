# Prophet Mail — webmail spec (Gmail layout · Hey + Superhuman features)

Goal: the webmail front-end for `prophet-workspace` (Postfix + Dovecot backend). Looks like Gmail; behaves like
Hey + Superhuman combined. Lives in `app-vue` (Vue 3 + Pinia + vue-router), reachable at `/mail`.

## Feature matrix
**Gmail base (familiar layout):** 3-pane (rail · thread list · reading pane), threaded conversations, labels,
search, compose modal, attachments, contacts, density/keyboard parity.

**Hey:**
- **Imbox / The Feed / Paper Trail** — three destinations. Imbox = real mail from real people; Feed = newsletters/
  marketing (read like a feed, never "unread"); Paper Trail = receipts/confirmations.
- **The Screener** — first-time senders land in a queue; you approve once ("Yes/No"). No → never see them again.
- **Reply Later** — set aside a triaged stack; a focused "reply later" session clears it.
- **Set Aside** — pin a thread to a side shelf without archiving.
- **Spy blocker** — strip tracking pixels/beacons on render (sovereign default: nothing phones home).
- **Notes to self** on a thread.

**Superhuman:**
- **Command palette (⌘K)** — every action, fuzzy. **Keyboard-first** (j/k navigate, e archive, r reply, etc.).
- **Split inbox** — VIP / Team / custom sections.
- **Send later, snooze, follow-up reminders** ("remind me if no reply in 3d").
- **Snippets** (templates), **undo send**, **read statuses**, **instant search**.
- **AI (our choir)** — thread summary, draft reply, "summarize what changed", triage suggestions. This is the
  differentiator: AI runs on our sovereign choir, not a vendor.

## Screens
1. `Mail.vue` — the shell: rail (views + split inbox + screener badge) · ThreadList · ReadingPane.
2. `Compose.vue` — modal (send / send-later / snippets / AI draft).
3. `CommandPalette.vue` — ⌘K fuzzy actions + search.
4. `Screener.vue` — approve/deny first-time senders.
5. `ReplyLater.vue` — the focused reply-later session.

## Data model (client)
- `Thread { id, view: 'imbox'|'feed'|'papertrail', from, subject, snippet, ts, unread, replyLaterAt?, setAside, labels[], messages[] }`
- `ScreenerItem { id, from, subjectPreview, firstSeen }`
- `Account { email, displayName, signature }`

## Backend bridge (the connecting piece — to build)
The browser can't speak IMAP. `prophet-workspace` needs a thin **mail-API** service (REST/JSON, or JMAP) bridging
Dovecot IMAP + Postfix submission to the Vue app. Contract is in `src/services/mailApi.ts`. Endpoints:
`GET /views/:view/threads`, `GET /threads/:id`, `POST /send` (+ `sendAt`), `POST /threads/:id/{replyLater,setAside,done,snooze}`,
`GET /screener`, `POST /screener/:id/{approve,deny}`, `POST /ai/{summary,draft}` (→ choir). Auth via the existing
Firebase/app session → mapped to the Dovecot user. Candidate backend: a small Go/Node service in
`prophet-platform/services/workspace-mailapi` (JMAP via Dovecot, or node-imap + nodemailer). NOT built yet.

## Build phases
- **P1 (this commit):** the Vue foundation — `mailApi.ts` (contract, stubbed), `mail.ts` store, `Mail.vue` shell
  (3-pane, Hey views, reading pane, reply-later/set-aside/done), `CommandPalette.vue`, keyboard, router+nav. Runs
  against stub data until the bridge exists.
- **P2:** the `workspace-mailapi` bridge service (IMAP/JMAP ↔ REST) + wire mailApi to it.
- **P3:** Compose + send-later + snippets + Screener + AI (choir) actions.
- **P4:** spy-blocker, follow-up reminders, contacts, calendar (Radicale) tab.
