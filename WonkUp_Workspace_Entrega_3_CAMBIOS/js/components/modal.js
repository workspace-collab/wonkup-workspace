import { icon } from '../utils/icons.js';

export function openModal({
  title,
  subtitle = '',
  body = '',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true
}) {
  closeModal();
  const root = document.createElement('div');
  root.className = 'modal-backdrop';
  root.id = 'wonkup-modal';
  root.innerHTML = `
    <section class="modal-card modal-${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <div><h2 id="modal-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
        ${showClose ? `<button class="icon-button" type="button" data-modal-close aria-label="Cerrar">${icon('x')}</button>` : ''}
      </header>
      <div class="modal-body">${body}</div>
    </section>`;
  document.body.appendChild(root);
  document.body.classList.add('modal-open');

  const close = () => closeModal();
  root.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', close));
  if (closeOnBackdrop) {
    root.addEventListener('click', event => {
      if (event.target === root) close();
    });
  }
  if (closeOnEscape) {
    const onEscape = event => {
      if (event.key === 'Escape') close();
    };
    root._escapeHandler = onEscape;
    document.addEventListener('keydown', onEscape);
  }
  requestAnimationFrame(() => root.querySelector('input, select, textarea, button')?.focus());
  return { root, close };
}

export function closeModal() {
  const root = document.querySelector('#wonkup-modal');
  if (!root) return;
  if (root._escapeHandler) document.removeEventListener('keydown', root._escapeHandler);
  root.remove();
  document.body.classList.remove('modal-open');
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
      closeOnEscape: false,
      showClose: false
    });
    modal.root.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    modal.root.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
  });
}
