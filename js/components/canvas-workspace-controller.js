const DRAG_THRESHOLD = 7;

function htmlToElement(markup) {
  const template = document.createElement('template');
  template.innerHTML = String(markup || '').trim();
  return template.content.firstElementChild;
}

function cardsInStack(stack, movingNoteId = '') {
  return [...stack.querySelectorAll(':scope > .canvas-note')]
    .filter(card => card.dataset.noteId !== movingNoteId);
}

function dropIndexForPointer(stack, pointerY, movingNoteId) {
  const cards = cardsInStack(stack, movingNoteId);
  const index = cards.findIndex(card => {
    const rect = card.getBoundingClientRect();
    return pointerY < rect.top + rect.height / 2;
  });
  return index < 0 ? cards.length : index;
}

function insertCardAt(stack, card, index) {
  const empty = stack.querySelector(':scope > .canvas-empty-section');
  empty?.remove();
  const cards = cardsInStack(stack, card.dataset.noteId);
  const reference = cards[Math.max(0, Math.min(index, cards.length))] || null;
  stack.insertBefore(card, reference);
}

function ensureEmptyStack(stack, canEdit, emptyMarkup) {
  if (stack.querySelector(':scope > .canvas-note')) {
    stack.querySelectorAll(':scope > .canvas-empty-section').forEach(node => node.remove());
    return;
  }
  if (!stack.querySelector(':scope > .canvas-empty-section')) {
    stack.insertAdjacentHTML('beforeend', emptyMarkup(canEdit));
  }
}

function findStack(workspace, sectionId) {
  return [...workspace.querySelectorAll('[data-drop-section]')]
    .find(stack => stack.dataset.dropSection === sectionId) || null;
}

function positionGhost(drag, x, y) {
  if (!drag.ghost) return;
  drag.ghost.style.left = `${Math.min(window.innerWidth - 24, Math.max(12, x + 14))}px`;
  drag.ghost.style.top = `${Math.min(window.innerHeight - 24, Math.max(12, y + 14))}px`;
}

export function createCanvasWorkspaceController({
  workspace,
  getInstance,
  getCanEdit,
  getViewMode,
  renderNote,
  emptyMarkup,
  onAddNote,
  onOpenNote,
  onMoveNote,
  onInteractionStart = () => {},
  onInteractionEnd = () => {},
  onMessage = () => {}
}) {
  if (!(workspace instanceof HTMLElement)) throw new Error('Canvas workspace inválido.');

  const abortController = new AbortController();
  const { signal } = abortController;
  let activeDrag = null;
  let destroyed = false;

  const cleanupDrag = () => {
    const drag = activeDrag;
    if (!drag) return;
    try { drag.handle.releasePointerCapture?.(drag.pointerId); } catch { /* noop */ }
    drag.targetStack?.classList.remove('drag-over');
    drag.card?.classList.remove('dragging-source');
    drag.ghost?.remove();
    activeDrag = null;
  };

  const rollbackDrag = drag => {
    if (!drag?.card?.isConnected || !drag.originalParent?.isConnected) return;
    if (drag.originalNext?.isConnected && drag.originalNext.parentElement === drag.originalParent) {
      drag.originalParent.insertBefore(drag.card, drag.originalNext);
    } else {
      drag.originalParent.appendChild(drag.card);
    }
    ensureEmptyStack(drag.originalParent, getCanEdit(), emptyMarkup);
    if (drag.targetStack && drag.targetStack !== drag.originalParent) {
      ensureEmptyStack(drag.targetStack, getCanEdit(), emptyMarkup);
    }
  };

  const pointerMove = event => {
    const drag = activeDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    const distance = Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY);
    if (!drag.moved && distance < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      const rect = drag.card.getBoundingClientRect();
      drag.ghost = drag.card.cloneNode(true);
      drag.ghost.removeAttribute('tabindex');
      drag.ghost.classList.add('canvas-drag-ghost');
      drag.ghost.style.width = `${rect.width}px`;
      drag.ghost.style.height = `${rect.height}px`;
      drag.host.appendChild(drag.ghost);
      drag.card.classList.add('dragging-source');
      onInteractionStart('drag');
    }

    positionGhost(drag, event.clientX, event.clientY);
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const nextStack = hit?.closest?.('[data-drop-section]');
    const validStack = nextStack && workspace.contains(nextStack) ? nextStack : null;
    if (validStack !== drag.targetStack) {
      drag.targetStack?.classList.remove('drag-over');
      drag.targetStack = validStack;
      drag.targetStack?.classList.add('drag-over');
    }
  };

  const pointerCancel = event => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    const wasMoved = activeDrag.moved;
    cleanupDrag();
    if (wasMoved) onInteractionEnd('drag');
  };

  const pointerUp = async event => {
    const drag = activeDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    event.stopPropagation();

    const targetStack = drag.targetStack;
    const targetSectionId = targetStack?.dataset.dropSection || '';
    const toIndex = targetStack ? dropIndexForPointer(targetStack, drag.lastY, drag.noteId) : 0;
    const shouldMove = drag.moved && Boolean(targetStack && targetSectionId);
    const dragSnapshot = { ...drag };
    cleanupDrag();

    if (!shouldMove) {
      if (dragSnapshot.moved) onInteractionEnd('drag');
      return;
    }

    insertCardAt(targetStack, dragSnapshot.card, toIndex);
    ensureEmptyStack(dragSnapshot.originalParent, getCanEdit(), emptyMarkup);

    try {
      const next = await onMoveNote({
        noteId: dragSnapshot.noteId,
        toSectionId: targetSectionId,
        toIndex,
        originalSectionId: dragSnapshot.originalSectionId
      });
      if (next) controller.sync(next, { preserveNoteId: dragSnapshot.noteId });
      onMessage('Nota movida.', 'success');
    } catch (error) {
      rollbackDrag(dragSnapshot);
      onMessage(error?.message || 'No se pudo mover la nota.', 'error');
    } finally {
      onInteractionEnd('drag');
    }
  };

  const pointerDown = event => {
    const handle = event.target.closest('[data-drag-note]');
    if (!handle || !workspace.contains(handle) || !getCanEdit() || getViewMode() !== 'board') return;
    if (event.button !== 0 || activeDrag) return;
    const card = handle.closest('.canvas-note');
    const originalParent = card?.closest('[data-drop-section]');
    if (!card || !originalParent) return;

    event.preventDefault();
    event.stopPropagation();
    activeDrag = {
      pointerId: event.pointerId,
      noteId: handle.dataset.dragNote,
      handle,
      card,
      originalParent,
      originalNext: card.nextElementSibling,
      originalSectionId: originalParent.dataset.dropSection,
      originX: event.clientX,
      originY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      targetStack: originalParent,
      host: document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : document.body,
      ghost: null
    };
    handle.setPointerCapture?.(event.pointerId);
  };

  const click = event => {
    const add = event.target.closest('[data-add-note]');
    if (add && workspace.contains(add)) {
      event.preventDefault();
      event.stopPropagation();
      onAddNote(add.dataset.addNote || '');
      return;
    }

    const open = event.target.closest('[data-open-note]');
    if (open && workspace.contains(open)) {
      event.preventDefault();
      event.stopPropagation();
      onOpenNote(open.dataset.openNote || '');
      return;
    }

    if (event.target.closest('[data-drag-note]')) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const doubleClick = event => {
    if (!getCanEdit() || event.target.closest('[data-drag-note], [data-open-note]')) return;
    const card = event.target.closest('.canvas-note');
    if (!card || !workspace.contains(card)) return;
    event.preventDefault();
    event.stopPropagation();
    onOpenNote(card.dataset.noteId || '');
  };

  const keydown = event => {
    const handle = event.target.closest('[data-drag-note]');
    if (handle && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      onMessage('Para mover con teclado, abre el lápiz y cambia la sección.', 'info');
      return;
    }

    const card = event.target.closest('.canvas-note');
    if (!card || !workspace.contains(card) || !getCanEdit()) return;
    if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button, [role="button"]')) {
      event.preventDefault();
      onOpenNote(card.dataset.noteId || '');
    }
  };

  workspace.addEventListener('click', click, { signal });
  workspace.addEventListener('dblclick', doubleClick, { signal });
  workspace.addEventListener('keydown', keydown, { signal });
  workspace.addEventListener('pointerdown', pointerDown, { signal });
  document.addEventListener('pointermove', pointerMove, { capture: true, signal });
  document.addEventListener('pointerup', pointerUp, { capture: true, signal });
  document.addEventListener('pointercancel', pointerCancel, { capture: true, signal });

  const controller = {
    sync(instance, { focusNoteId = '' } = {}) {
      if (destroyed || !instance || !workspace.isConnected) return;
      const canEdit = getCanEdit();
      const draggable = getViewMode() === 'board';
      const expectedIds = new Set(instance.notes.map(note => note.id));
      const existing = new Map(
        [...workspace.querySelectorAll('.canvas-note[data-note-id]')]
          .map(card => [card.dataset.noteId, card])
      );

      instance.template.sections.forEach(section => {
        const stack = findStack(workspace, section.id);
        if (!stack) return;
        const notes = instance.notes
          .filter(note => note.sectionId === section.id)
          .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

        notes.forEach((note, index) => {
          let card = existing.get(note.id) || null;
          const markup = renderNote(note, canEdit, draggable);
          const fresh = htmlToElement(markup);
          if (!fresh) return;

          if (!card) {
            card = fresh;
            existing.set(note.id, card);
          } else if (card.dataset.noteRenderKey !== fresh.dataset.noteRenderKey) {
            card.replaceWith(fresh);
            card = fresh;
            existing.set(note.id, card);
          }
          insertCardAt(stack, card, index);
        });
        ensureEmptyStack(stack, canEdit, emptyMarkup);
      });

      existing.forEach((card, noteId) => {
        if (!expectedIds.has(noteId)) card.remove();
      });
      workspace.querySelectorAll('[data-drop-section]').forEach(stack => ensureEmptyStack(stack, canEdit, emptyMarkup));

      if (focusNoteId) {
        requestAnimationFrame(() => workspace.querySelector(`.canvas-note[data-note-id="${CSS.escape(focusNoteId)}"]`)?.focus({ preventScroll: true }));
      }
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanupDrag();
      abortController.abort();
    },

    isDragging() {
      return Boolean(activeDrag?.moved);
    }
  };

  return controller;
}
