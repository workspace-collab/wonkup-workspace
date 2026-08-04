let stack;

function resolveToastHost() {
  const fullscreen = document.fullscreenElement;
  if (fullscreen instanceof HTMLElement) return fullscreen;
  return document.body;
}

export function ensureToastStack() {
  const host = resolveToastHost();
  stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'true');
  }
  if (stack.parentElement !== host) host.appendChild(stack);
  return stack;
}

export function showToast(message, { type = 'info', duration = null } = {}) {
  const root = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  const statusRegion = document.querySelector(type === 'error' ? '#alert-region' : '#status-region');
  if (statusRegion) {
    statusRegion.textContent = '';
    requestAnimationFrame(() => { statusRegion.textContent = message; });
  }

  const timeout = duration ?? Math.max(4200, Math.min(9000, String(message).length * 65));
  const remove = () => toast.remove();
  let timer = setTimeout(remove, timeout);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => { timer = setTimeout(remove, 1800); });
  toast.addEventListener('click', remove);
  return toast;
}
