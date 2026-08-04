let activePopover = null;
let initialized = false;

export function closePopovers(except = null) {
  document.querySelectorAll('[data-popover-panel]').forEach(panel => {
    if (panel === except) return;
    panel.classList.add('hidden');
    const triggerId = panel.dataset.triggerId;
    if (triggerId) document.getElementById(triggerId)?.setAttribute('aria-expanded', 'false');
  });
  activePopover = except || null;
}

export function togglePopover(trigger, panel) {
  const shouldOpen = panel.classList.contains('hidden');
  closePopovers(shouldOpen ? panel : null);
  panel.classList.toggle('hidden', !shouldOpen);
  trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  activePopover = shouldOpen ? panel : null;
}

export function initializePopoverManager() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('click', event => {
    if (!activePopover) return;
    if (activePopover.contains(event.target)) return;
    const triggerId = activePopover.dataset.triggerId;
    if (triggerId && document.getElementById(triggerId)?.contains(event.target)) return;
    closePopovers();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePopovers();
  });
  window.addEventListener('hashchange', () => closePopovers());
  window.addEventListener('resize', () => closePopovers());
}
