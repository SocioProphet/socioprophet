# BrowserOps Interface

## Purpose
Perform auditable actions in a real browser (forms, navigation, scraping).

## Required capabilities
- `open(url)`
- `observe(selectors|instructions)` -> structured DOM/visual state
- `act(action_spec)` -> click/type/scroll/download
- `extract(schema)` -> structured JSON extraction
- `record()` -> trace (screenshots/HTML snapshots/logs)

## Example providers
Stagehand (default), browser-use (alt).
