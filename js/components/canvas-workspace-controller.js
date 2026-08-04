const DRAG_THRESHOLD = 7;

function htmlToElement(markup) {
  const template = document.createElement('template');
  template.innerHTML = String(markup || '').trim();
  return template.content.firstElementChild;
}

function cardsInStack(stack, movingNoteId = '') {
  return [...stack.querySelectorAll(':scope > .canvas-note[data-note-id]')]
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
  stack.querySelector(':scope > .canvas-empty-section')?.remove();
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

function draftMarkup({ sectionId, color, colors }) {
  return `<article class="canvas-note canvas-note-draft" data-draft-note data-draft-section="${sectionId}" style="--note-bg:${color.background};--note-border:${color.border};--note-text:${color.text}">
    <div class="canvas-note-inline-tools" aria-label="Herramientas de nota rápida">
      <div class="canvas-note-color-dots">${colors.map(item => `<button type="button" class="note-color-dot ${item.id === color.id ? 'active' : ''}" data-draft-color="${item.id}" style="--dot:${item.background};--dot-border:${item.border}" aria-label="Usar color ${item.name}" title="${item.name}"></button>`).join('')}</div>
      <button type="button" class="note-quick-icon" data-cancel-draft aria-label="Cancelar nota" title="Cancelar">×</button>
    </div>
    <textarea class="canvas-inline-note-input" rows="3" maxlength="1200" placeholder="Escribe aquí…" aria-label="Contenido de la nueva nota"></textarea>
    <div class="canvas-inline-note-footer"><span>Se guarda automáticamente</span><button type="button" class="note-quick-save" data-save-draft>Guardar</button></div>
  </article>`;
}

export function createCanvasWorkspaceController({
  workspace,
  getInstance,
  getCanEdit,
  getViewMode,
  renderNote,
  emptyMarkup,
  colors = [],
  defaultColorForSection = () => colors[0]?.id || 'sky',
  onAddNote,
  onOpenNote,
  onMoveNote,
  onUpdateNote,
  onDeleteNote,
  onInteractionStart = () => {},
  onInteractionEnd = () => {},
  onMessage = () => {}
}) {
  if (!(workspace instanceof HTMLElement)) throw new Error('Canvas workspace inválido.');

  const abortController = new AbortController();
  const { signal } = abortController;
  let activeDrag = null;
  let destroyed = false;

  const colorById = colorId => colors.find(color => color.id === colorId) || colors[0] || {
    id: 'sky', name: 'Cielo', background: '#dff1ff', border: '#83c8ff', text: '#17324d'
  };

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

  const cancelDraft = card => {
    const stack = card?.closest('[data-drop-section]');
    card?.remove();
    if (stack) ensureEmptyStack(stack, getCanEdit(), emptyMarkup);
  };

  const saveDraft = async card => {
    if (!card?.isConnected || card.dataset.saving === 'true') return;
    const textarea = card.querySelector('.canvas-inline-note-input');
    const text = textarea?.value.trim() || '';
    if (!text) {
      cancelDraft(card);
      return;
    }
    card.dataset.saving = 'true';
    card.classList.add('is-saving');
    textarea.disabled = true;
    onInteractionStart('create');
    try {
      const next = await onAddNote({
        sectionId: card.dataset.draftSection || '',
        text,
        colorId: card.dataset.draftColor || defaultColorForSection(card.dataset.draftSection || '')
      });
      card.remove();
      if (next) controller.sync(next, { focusNoteId: next.notes?.at(-1)?.id || '' });
      onMessage('Nota agregada.', 'success');
    } catch (error) {
      card.dataset.saving = 'false';
      card.classList.remove('is-saving');
      textarea.disabled = false;
      textarea.focus();
      onMessage(error?.message || 'No se pudo guardar la nota.', 'error');
    } finally {
      onInteractionEnd('create');
    }
  };

  const createDraft = sectionId => {
    if (!getCanEdit()) return;
    const resolvedSectionId = sectionId || getInstance()?.template?.sections?.[0]?.id || '';
    const stack = findStack(workspace, resolvedSectionId);
    if (!stack) return;
    const existingDraft = stack.querySelector(':scope > [data-draft-note]');
    if (existingDraft) {
      existingDraft.querySelector('.canvas-inline-note-input')?.focus();
      return;
    }
    stack.querySelector(':scope > .canvas-empty-section')?.remove();
    const color = colorById(defaultColorForSection(resolvedSectionId));
    const card = htmlToElement(draftMarkup({ sectionId: resolvedSectionId, color, colors }));
    card.dataset.draftColor = color.id;
    stack.appendChild(card);
    const textarea = card.querySelector('.canvas-inline-note-input');
    requestAnimationFrame(() => textarea?.focus());
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
      document.body.appendChild(drag.ghost);
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
    const card = handle.closest('.canvas-note[data-note-id]');
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
      ghost: null
    };
    handle.setPointerCapture?.(event.pointerId);
  };

  const click = async event => {
    const add = event.target.closest('[data-add-note]');
    if (add && workspace.contains(add)) {
      event.preventDefault();
      event.stopPropagation();
      createDraft(add.dataset.addNote || '');
      return;
    }

    const save = event.target.closest('[data-save-draft]');
    if (save && workspace.contains(save)) {
      event.preventDefault();
      event.stopPropagation();
      await saveDraft(save.closest('[data-draft-note]'));
      return;
    }

    const cancel = event.target.closest('[data-cancel-draft]');
    if (cancel && workspace.contains(cancel)) {
      event.preventDefault();
      event.stopPropagation();
      cancelDraft(cancel.closest('[data-draft-note]'));
      return;
    }

    const draftColor = event.target.closest('[data-draft-color]');
    if (draftColor && workspace.contains(draftColor)) {
      event.preventDefault();
      event.stopPropagation();
      const card = draftColor.closest('[data-draft-note]');
      const color = colorById(draftColor.dataset.draftColor);
      card.dataset.draftColor = color.id;
      card.style.setProperty('--note-bg', color.background);
      card.style.setProperty('--note-border', color.border);
      card.style.setProperty('--note-text', color.text);
      card.querySelectorAll('[data-draft-color]').forEach(button => button.classList.toggle('active', button === draftColor));
      card.querySelector('.canvas-inline-note-input')?.focus();
      return;
    }

    const quickColor = event.target.closest('[data-note-color]');
    if (quickColor && workspace.contains(quickColor)) {
      event.preventDefault();
      event.stopPropagation();
      const card = quickColor.closest('.canvas-note[data-note-id]');
      const noteId = card?.dataset.noteId || '';
      const colorId = quickColor.dataset.noteColor || '';
      if (!noteId || !colorId) return;
      const previous = getInstance();
      const previousNote = previous?.notes?.find(note => note.id === noteId);
      const color = colorById(colorId);
      card.style.setProperty('--note-bg', color.background);
      card.style.setProperty('--note-border', color.border);
      card.style.setProperty('--note-text', color.text);
      card.querySelectorAll('[data-note-color]').forEach(button => button.classList.toggle('active', button === quickColor));
      onInteractionStart('update');
      try {
        const next = await onUpdateNote({ noteId, patch: { colorId, colorHex: '' } });
        if (next) controller.sync(next, { focusNoteId: noteId });
      } catch (error) {
        if (previousNote) controller.sync(previous, { focusNoteId: noteId });
        onMessage(error?.message || 'No se pudo cambiar el color.', 'error');
      } finally {
        onInteractionEnd('update');
      }
      return;
    }

    const remove = event.target.closest('[data-delete-note]');
    if (remove && workspace.contains(remove)) {
      event.preventDefault();
      event.stopPropagation();
      const card = remove.closest('.canvas-note[data-note-id]');
      const noteId = card?.dataset.noteId || '';
      if (!noteId) return;
      onInteractionStart('delete');
      try {
        const next = await onDeleteNote({ noteId });
        card.remove();
        if (next) controller.sync(next);
        onMessage('Nota eliminada.', 'success');
      } catch (error) {
        onMessage(error?.message || 'No se pudo eliminar la nota.', 'error');
      } finally {
        onInteractionEnd('delete');
      }
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

  const focusOut = event => {
    const draft = event.target.closest('[data-draft-note]');
    if (!draft || !workspace.contains(draft)) return;
    const next = event.relatedTarget;
    if (next && draft.contains(next)) return;
    setTimeout(() => {
      if (!draft.isConnected || draft.contains(document.activeElement)) return;
      saveDraft(draft);
    }, 80);
  };

  const doubleClick = event => {
    if (!getCanEdit() || event.target.closest('[data-drag-note], [data-open-note], .canvas-note-inline-tools, [data-draft-note]')) return;
    const card = event.target.closest('.canvas-note[data-note-id]');
    if (!card || !workspace.contains(card)) return;
    event.preventDefault();
    event.stopPropagation();
    onOpenNote(card.dataset.noteId || '');
  };

  const keydown = event => {
    const draft = event.target.closest('[data-draft-note]');
    if (draft) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelDraft(draft);
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        saveDraft(draft);
      }
      return;
    }

    const handle = event.target.closest('[data-drag-note]');
    if (handle && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      onMessage('Para mover con teclado, abre el menú de la nota y cambia la sección.', 'info');
      return;
    }

    const card = event.target.closest('.canvas-note[data-note-id]');
    if (!card || !workspace.contains(card) || !getCanEdit()) return;
    if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button, [role="button"]')) {
      event.preventDefault();
      onOpenNote(card.dataset.noteId || '');
    }
  };

  workspace.addEventListener('click', click, { signal });
  workspace.addEventListener('focusout', focusOut, { signal });
  workspace.addEventListener('dblclick', doubleClick, { signal });
  workspace.addEventListener('keydown', keydown, { signal });
  workspace.addEventListener('pointerdown', pointerDown, { signal });
  document.addEventListener('pointermove', pointerMove, { capture: true, signal });
  document.addEventListener('pointerup', pointerUp, { capture: true, signal });
  document.addEventListener('pointercancel', pointerCancel, { capture: true, signal });

  const controller = {
    createDraft,

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
