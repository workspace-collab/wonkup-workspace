let activePopover = null;
let activeTrigger = null;
let initialized = false;

function setTriggerState(trigger, open) {
  if (!trigger) return;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  const openLabel = trigger.dataset.openLabel;
  const closeLabel = trigger.dataset.closeLabel;
  if (openLabel && closeLabel) trigger.setAttribute('aria-label', open ? closeLabel : openLabel);
}

export function closePopovers(except = null, { restoreFocus = false } = {}) {
  const previousTrigger = activeTrigger;
  document.querySelectorAll('[data-popover-panel]').forEach(panel => {
    if (panel === except) return;
    panel.classList.add('hidden');
    const triggerId = panel.dataset.triggerId;
    if (triggerId) setTriggerState(document.getElementById(triggerId), false);
  });
  activePopover = except || null;
  activeTrigger = except?.dataset.triggerId ? document.getElementById(except.dataset.triggerId) : null;
  if (restoreFocus && previousTrigger?.isConnected) previousTrigger.focus();
}

export function togglePopover(trigger, panel) {
  const shouldOpen = panel.classList.contains('hidden');
  closePopovers(shouldOpen ? panel : null);
  panel.classList.toggle('hidden', !shouldOpen);
  setTriggerState(trigger, shouldOpen);
  activePopover = shouldOpen ? panel : null;
  activeTrigger = shouldOpen ? trigger : null;

  if (shouldOpen) {
    requestAnimationFrame(() => {
      panel.querySelector('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')?.focus();
    });
  }
}

export function initializePopoverManager() {
  if (initialized) return;
  initialized = true;
  document.addEventListener('click', event => {
    if (!activePopover) return;
    if (activePopover.contains(event.target)) return;
    if (activeTrigger?.contains(event.target)) return;
    closePopovers();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activePopover) {
      event.preventDefault();
      closePopovers(null, { restoreFocus: true });
    }
  });
  window.addEventListener('hashchange', () => closePopovers());
  window.addEventListener('resize', () => closePopovers());
}
