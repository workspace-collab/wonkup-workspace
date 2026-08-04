import { icon } from '../utils/icons.js';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(',');

let lastTrigger = null;
let backgroundState = [];
let activeHost = null;

function getFocusable(root) {
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter(element => !element.hidden && element.getClientRects().length > 0);
}

function resolveOverlayHost() {
  const fullscreen = document.fullscreenElement;
  if (fullscreen instanceof HTMLElement) return fullscreen;
  return document.body;
}

function backgroundCandidates(host, modalRoot) {
  if (host === document.body) {
    return [...document.body.children]
      .filter(element => element !== modalRoot)
      .filter(element => element.tagName !== 'SCRIPT')
      .filter(element => !element.matches('#status-region, #alert-region, .toast-stack'));
  }
  return [...host.children].filter(element => element !== modalRoot && !element.matches('.toast-stack'));
}

function lockBackground(host, modalRoot) {
  backgroundState = backgroundCandidates(host, modalRoot).map(element => ({
    element,
    inert: Boolean(element.inert),
    ariaHidden: element.getAttribute('aria-hidden')
  }));

  backgroundState.forEach(({ element }) => {
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
  });
}

function unlockBackground() {
  backgroundState.forEach(({ element, inert, ariaHidden }) => {
    if (!element?.isConnected) return;
    element.inert = inert;
    if (ariaHidden === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', ariaHidden);
  });
  backgroundState = [];
  activeHost = null;
}

export function openModal({
  title,
  subtitle = '',
  body = '',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
  initialFocus = null,
  onClose = null
}) {
  closeModal({ restoreFocus: false });
  lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const host = resolveOverlayHost();
  activeHost = host;
  const root = document.createElement('div');
  root.className = 'modal-backdrop';
  root.id = 'wonkup-modal';
  root.setAttribute('role', 'presentation');
  root.dataset.overlayHost = host === document.body ? 'body' : 'fullscreen';
  root.innerHTML = `
    <section class="modal-card modal-${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title" ${subtitle ? 'aria-describedby="modal-description"' : ''} tabindex="-1">
      <header class="modal-header">
        <div><h2 id="modal-title" tabindex="-1">${title}</h2>${subtitle ? `<p id="modal-description">${subtitle}</p>` : ''}</div>
        ${showClose ? `<button class="icon-button modal-close-button" type="button" data-modal-close aria-label="Cerrar diálogo">${icon('x')}</button>` : ''}
      </header>
      <div class="modal-body">${body}</div>
    </section>`;

  host.appendChild(root);
  document.body.classList.add('modal-open');
  lockBackground(host, root);

  const close = options => closeModal(options);
  root.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', close));

  if (closeOnBackdrop) {
    root.addEventListener('click', event => {
      if (event.target === root) close();
    });
  }

  const onKeydown = event => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusable(root);
    if (!focusable.length) {
      event.preventDefault();
      root.querySelector('.modal-card')?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  root._keydownHandler = onKeydown;
  root._onClose = typeof onClose === 'function' ? onClose : null;
  document.addEventListener('keydown', onKeydown, true);

  requestAnimationFrame(() => {
    const preferred = initialFocus ? root.querySelector(initialFocus) : null;
    const firstMeaningful = preferred
      || root.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
      || getFocusable(root)[0]
      || root.querySelector('#modal-title');
    if (!root.isConnected) return;
    firstMeaningful?.focus();
  });

  return { root, close, host };
}

export function closeModal({ restoreFocus = true } = {}) {
  const root = document.querySelector('#wonkup-modal');
  if (!root) return;
  if (root._keydownHandler) document.removeEventListener('keydown', root._keydownHandler, true);
  const onClose = root._onClose;
  root.remove();
  document.body.classList.remove('modal-open');
  unlockBackground();

  const triggerToRestore = restoreFocus && lastTrigger?.isConnected ? lastTrigger : null;
  lastTrigger = null;
  if (triggerToRestore) {
    requestAnimationFrame(() => {
      if (triggerToRestore.isConnected) triggerToRestore.focus();
    });
  }
  onClose?.();
}

export function confirmModal({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      modal.close();
      resolve(value);
    };
    const modal = openModal({
      title,
      body: `<p class="modal-message">${message}</p><div class="modal-actions"><button class="button button-secondary" type="button" data-cancel>Cancelar</button><button class="button ${danger ? 'button-danger' : 'button-primary'}" type="button" data-confirm>${confirmLabel}</button></div>`,
      size: 'sm',
      closeOnBackdrop: false,
      closeOnEscape: true,
      showClose: false,
      initialFocus: '[data-cancel]',
      onClose: () => finish(false)
    });
    modal.root.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    modal.root.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
  });
}
