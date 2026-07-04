// Focus-scoped arrow-key navigation for in-screen row lists (watchlist, directory,
// dockets, …). Attach to the list container's @keydown; ArrowUp/Down move focus
// between the row elements matched by `sel` and "follow focus" by activating the
// row (click → select), so the detail pane tracks the keyboard. Non-wrapping.
// Focus-scoped (only fires when focus is inside the list), so it never clashes
// with the nav-menu arrow handlers or the content j/k shortcuts.
export function arrowRove(e: KeyboardEvent, container: HTMLElement | null, sel: string): void {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const els = container ? Array.from(container.querySelectorAll<HTMLElement>(sel)) : [];
  if (els.length === 0) return;
  const active = document.activeElement;
  const cur = els.findIndex((el) => el === active || el.contains(active));
  e.preventDefault();
  const nx = cur < 0 ? 0 : e.key === 'ArrowDown' ? Math.min(els.length - 1, cur + 1) : Math.max(0, cur - 1);
  const target = els[nx];
  if (target) { target.focus(); target.click(); }
}
