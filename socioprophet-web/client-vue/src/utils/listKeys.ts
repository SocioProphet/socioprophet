// Focus-scoped arrow-key navigation for in-screen row/tile lists (watchlist,
// directory, dockets, region tiles, sector grid, …). Attach to the list
// container's @keydown; the matching arrow keys move focus between the elements
// matched by `sel` and "follow focus" by activating the element (click → select),
// so the detail pane tracks the keyboard. Non-wrapping.
//
// Focus-scoped (only fires when focus is inside the list), so it never clashes
// with the nav-menu arrow handlers or the content j/k shortcuts. Pass the
// container as an element ref OR just `$event.currentTarget`.
//
// axis: 'v' = ↑/↓ (vertical lists), 'h' = ←/→ (horizontal tile strips),
//       'both' = any arrow (2-D grids, roving in DOM order).
export function arrowRove(
  e: KeyboardEvent,
  container: EventTarget | HTMLElement | null,
  sel: string,
  axis: 'v' | 'h' | 'both' = 'v',
): void {
  const next = axis === 'h' ? ['ArrowRight'] : axis === 'both' ? ['ArrowDown', 'ArrowRight'] : ['ArrowDown'];
  const prev = axis === 'h' ? ['ArrowLeft'] : axis === 'both' ? ['ArrowUp', 'ArrowLeft'] : ['ArrowUp'];
  const isNext = next.includes(e.key);
  const isPrev = prev.includes(e.key);
  if (!isNext && !isPrev) return;

  const root = container instanceof HTMLElement ? container : null;
  const els = root ? Array.from(root.querySelectorAll<HTMLElement>(sel)) : [];
  if (els.length === 0) return;
  const active = document.activeElement;
  const cur = els.findIndex((el) => el === active || el.contains(active));
  e.preventDefault();
  const nx = cur < 0 ? 0 : isNext ? Math.min(els.length - 1, cur + 1) : Math.max(0, cur - 1);
  const target = els[nx];
  if (target) { target.focus(); target.click(); }
}
