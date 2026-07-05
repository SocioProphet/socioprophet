# Keyboard & Shortcut Strategy

The SocioProphet cockpit is **keyboard-first**: every navigation surface and the
primary content lists are fully operable without a mouse. This document is the
canonical reference for the shortcut model — keep it in sync when adding keys.

> Design lineage: keyboard-first UX (Emvi / Vimium-style), Bloomberg terminal
> command line, and VS Code / Raycast command-palette conventions.

## Principles

1. **One global key per surface, no chords beyond a modifier.** Reserve global
   shortcuts for the few cross-app surfaces; everything else is focus-scoped.
2. **Focus-scoped arrows.** Arrow keys drive *whatever menu or list currently has
   focus* — they are attached to that container, never to `window`. This is what
   lets menus, lists, and the palette all use arrows without colliding.
3. **Follow-focus selection.** In data lists, moving with arrows also selects the
   row so the detail pane tracks the keyboard.
4. **Native first.** Links and controls are real `<a>`/`<button>`, so `Tab`,
   `Enter`/`Space`, and `Esc` work for free. We only *add* arrow roving.
5. **Content shortcuts are single letters** (`j`/`k` etc.), scoped to a screen,
   and must not overlap the modifier-based global keys.
6. **Visible focus, quiet mouse.** `:focus-visible` shows an accent ring for
   keyboard users; mouse clicks stay ring-free.

## Global shortcuts

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Command palette (universal search: screens, articles, people, markets, dockets, weather, economy, or "Ask Noetica"). |
| `Ctrl+`\` | Toggle the Noetica operator terminal (Quake drop-down). |
| `Esc` | Close the topmost overlay (palette → terminal → open menu). |

> `⌘Space` is intentionally **not** used — macOS reserves it for Spotlight and a
> browser cannot reliably intercept it.

## Navigation menus (focus-scoped)

**Top domain mega-menu** (ARIA menubar):
- `Tab` — move between top-level triggers
- `↓` — open the focused submenu (focus first item)
- `↑`/`↓` — move within a submenu
- `←`/`→` — jump between menus
- `Enter` — navigate; `Esc` — close; focus leaving the nav closes it

**Tab bar** — `←`/`→` rove. **Left rail** — `↑`/`↓` rove. **Capability panel
(☷)** — `↑`/`↓` rove, `Esc` closes. All also `Tab`-focusable.

## In-screen lists (focus-scoped, follow-focus)

Row/tile lists move with arrows and select on move:

| Screen | List | Keys |
| --- | --- | --- |
| Markets | watchlist (`.mk-row`) | `↑`/`↓` |
| People | directory (`.pd-row`) | `↑`/`↓` |
| Law | dockets (`.lw-row`) | `↑`/`↓` |
| Weather | region tiles (`.wx-tile`) | `←`/`→` |
| Weather | alerts (`.wx-alert`) | `↑`/`↓` |
| Economy | KPI tiles (`.ec-kpi`) | `←`/`→` |
| Economy | sector grid (`.ec-sector`) | any arrow |

## Content shortcuts (screen-scoped, single letter)

| Screen | Keys |
| --- | --- |
| News | `j`/`k` move · `o`/`Enter` open · `m` read/unread · `u` unread-only |
| Markets | `j`/`k` move the watchlist |

## Command palette

`↑`/`↓` move · `Enter` activate · `Esc` close. Results are grouped (Go to /
Articles / People / Markets / Dockets / Weather / Economy / Assistant) and
**deep-link** to a specific target via a query param the screen reads on mount:

`/news?item=` · `/people/search?id=` · `/markets/indices-funds?sym=` ·
`/law/international-law?d=` · `/weather/forecast?r=` ·
`/economy/macro-economics?k=&kind=`

## Implementation

- **Global keys** — `window` keydown in `App.vue` (`⌘K`, `Ctrl+`\`, `Esc`).
- **Menus** — controlled `openMenu` state + `onMenuTriggerKey` / `onMenuItemKey`
  and the shared `onRoveKey(e, container, 'h'|'v')` in `App.vue`.
- **Lists** — `utils/listKeys.ts` → `arrowRove(e, container, selector, axis)`,
  attached to the list container's `@keydown` (pass `$event.currentTarget`).
- **Palette** — `components/CommandPalette.vue` owns its own arrow/Enter/Esc.

### Adding a shortcut
1. Prefer **focus-scoped** (attach `@keydown` to the relevant container) over a
   new global key.
2. If a data list: rows must be `<button>`; add
   `@keydown="arrowRove($event, $event.currentTarget, '.your-row', 'v')"`.
3. Update the tables above.
