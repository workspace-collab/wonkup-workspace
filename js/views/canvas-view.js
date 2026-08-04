import { CanvasService } from '../services/canvas-service.js';
import { ProjectService } from '../services/project-service.js';
import { KanbanService } from '../services/kanban-service.js';
import { CANVAS_NOTE_COLORS, getCanvasNoteColor } from '../../data/canvas-templates.js';
import { canEditCanvas, canManageCanvas } from '../utils/permissions.js';
import { calculateCanvasProgress } from '../utils/canvas-progress.js';
import { icon } from '../utils/icons.js';
import { escapeHtml, formatDate } from '../utils/format.js';
import { openModal, confirmModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let cleanupEditor = null;
let draggedNoteId = '';
const VIEW_KEY = 'wonkup.canvas.view';
const FOCUS_KEY = 'wonkup.canvas.focusMode';

export async function renderCanvas(container, params, session) {
  cleanupCanvasView();
  container.innerHTML = `<section class="page canvas-editor-page"><div class="panel"><div class="panel-body"><span class="spinner"></span> Cargando Canvas Engine...</div></div></section>`;
  try {
    const [instance, project] = await Promise.all([
      CanvasService.getInstance({ canvasId: params.canvasId, session }),
      ProjectService.getProject({ projectId: params.projectId, session })
    ]);
    if (instance.projectId !== params.projectId || instance.workspaceId !== params.workspaceId) throw new Error('El canvas no corresponde al proyecto solicitado.');
    renderCanvasEditor(container, { instance, project, session, readOnly: false });
  } catch (error) {
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h1>No se pudo abrir el canvas</h1><p>${escapeHtml(error.message || 'Ocurrió un error inesperado.')}</p><a class="button button-primary" href="#/">Volver al inicio</a></div></section>`;
  }
}

export async function renderSharedCanvas(container, token) {
  cleanupCanvasView();
  container.innerHTML = `<section class="shared-canvas-page"><div class="panel shared-canvas-loading"><div class="panel-body"><span class="spinner"></span> Abriendo canvas compartido...</div></div></section>`;
  try {
    const instance = await CanvasService.getSharedInstance({ token });
    const project = { id: instance.projectId, workspaceId: instance.workspaceId, name: 'Proyecto compartido', code: 'Consulta', brandColor: instance.template?.color || '#50a8f3' };
    renderCanvasEditor(container, { instance, project, session: null, readOnly: true, sharedToken: token });
  } catch (error) {
    container.innerHTML = `<section class="shared-canvas-page"><div class="empty-state"><div class="empty-state-icon">${icon('lock')}</div><h1>Enlace no disponible</h1><p>${escapeHtml(error.message || 'El enlace compartido no está disponible.')}</p><a class="button button-primary" href="#/access">Ir al acceso</a></div></section>`;
  }
}

function renderCanvasEditor(container, context) {
  cleanupEditor?.();
  cleanupEditor = null;
  const { instance, project, session, readOnly, sharedToken = '' } = context;
  const template = instance.template;
  const storedView = localStorage.getItem(`${VIEW_KEY}.${template.id}`) || localStorage.getItem(VIEW_KEY);
  const viewMode = storedView || (matchMedia('(max-width: 760px)').matches ? 'list' : 'board');
  const completion = calculateCanvasProgress(instance);
  const canEdit = !readOnly && canEditCanvas(session);
  const canManage = !readOnly && canManageCanvas(session);
  const focusMode = !readOnly && localStorage.getItem(FOCUS_KEY) === '1';
  document.body.classList.toggle('canvas-focus-mode', focusMode);

  container.innerHTML = `<section class="${readOnly ? 'shared-canvas-page' : 'page canvas-editor-page'}" data-canvas-id="${escapeHtml(instance.id)}" data-template-layout="${escapeHtml(template.layout || 'generic')}">
    <header class="canvas-editor-header" style="--canvas-accent:${escapeHtml(template.color)}">
      <div class="canvas-editor-identity">
        <a class="canvas-back-link" href="${readOnly ? '#/access' : `#/w/${instance.workspaceId}/p/${instance.projectId}/innovation`}">${icon('arrowLeft')} ${readOnly ? 'Acceso WonkUp' : 'Volver al Toolkit'}</a>
        <div class="canvas-title-row"><span class="canvas-title-icon">${icon(template.icon)}</span><div><span class="page-kicker">${escapeHtml(template.category)} · ${escapeHtml(project.name || 'Proyecto')}</span><h1>${escapeHtml(instance.title)}</h1><p>${escapeHtml(template.description)}</p></div></div>
      </div>
      <div class="canvas-editor-actions">
        ${readOnly ? '' : `<div class="canvas-presence" id="canvas-presence" aria-label="Participantes conectados">${participantAvatar(session?.user, true)}</div>`}
        <div class="canvas-completion" title="Avance de llenado: 70% cobertura de secciones y 30% profundidad"><strong>${completion}%</strong><span>avance de llenado</span></div>
        <button class="button button-secondary" id="canvas-fullscreen" type="button">${icon('maximize')} Pantalla completa</button>
        ${readOnly ? `<span class="status-badge">Solo lectura</span>` : `
          <button class="button button-secondary" id="canvas-focus" type="button">${icon('sidebar')} ${focusMode ? 'Mostrar barra lateral' : 'Modo enfoque'}</button>
          <button class="button button-secondary" id="canvas-history" type="button">${icon('history')} Historial</button>
          ${canManage ? `<button class="button button-secondary" id="canvas-share" type="button">${icon('link')} Compartir</button>` : ''}
          <button class="button button-secondary" id="canvas-print" type="button">${icon('file')} Exportar PDF</button>
          ${canManage ? `<button class="icon-button" id="canvas-settings" type="button" aria-label="Administrar canvas">${icon('more')}</button>` : ''}
        `}
      </div>
    </header>

    <div class="canvas-toolbar" aria-label="Herramientas del canvas">
      <div class="canvas-view-switch" role="group" aria-label="Vista del canvas">
        <button class="button button-ghost ${viewMode === 'board' ? 'active' : ''}" data-canvas-view="board" type="button" aria-pressed="${viewMode === 'board'}">${icon('columns')} Canvas</button>
        <button class="button button-ghost ${viewMode === 'list' ? 'active' : ''}" data-canvas-view="list" type="button" aria-pressed="${viewMode === 'list'}">${icon('list')} Lista</button>
      </div>
      <div class="canvas-toolbar-meta"><span>${instance.notes.length} notas</span><span>${new Set(instance.notes.map(note => note.sectionId)).size}/${template.sections.length} secciones con contenido</span><span>Versión ${instance.version}</span>${CanvasService.mode === 'mock' ? '<span class="demo-chip">Demo local</span>' : ''}</div>
      ${canEdit ? `<button class="button button-primary" id="canvas-add-note" type="button">${icon('plus')} Nueva nota</button>` : ''}
    </div>

    <div class="canvas-workspace" id="canvas-workspace">
      ${viewMode === 'list' ? renderCanvasList(instance, canEdit) : renderCanvasBoard(instance, canEdit)}
    </div>

    <footer class="canvas-editor-footer"><span>Última actualización: ${formatDate(instance.updatedAt)}</span><span>${readOnly ? 'Vista compartida de consulta' : 'Los cambios se guardan automáticamente.'}</span>${sharedToken ? `<span>Código: ${escapeHtml(sharedToken)}</span>` : ''}</footer>
  </section>`;

  bindCanvasEvents(container, context, viewMode);

  let stopPresence = () => {};
  if (!readOnly && session) stopPresence = CanvasService.startPresence({ canvasId: instance.id, session, onChange: people => renderPresence(container, people) });
  const unsubscribe = readOnly ? () => {} : CanvasService.subscribe(event => {
    if (event.canvasId !== instance.id || event.source === 'presence') return;
    if (document.querySelector('#wonkup-modal')) return;
    reloadCanvas(container, context);
  });
  const fullscreenListener = () => updateFullscreenButton(container);
  document.addEventListener('fullscreenchange', fullscreenListener);
  cleanupEditor = () => {
    stopPresence();
    unsubscribe();
    document.removeEventListener('fullscreenchange', fullscreenListener);
  };
}

function renderCanvasBoard(instance, canEdit) {
  const layout = instance.template.layout || 'generic';
  if (layout === 'value-proposition') return renderValueProposition(instance, canEdit);
  if (layout === 'prioritization') return renderPrioritization(instance, canEdit);
  if (layout === 'business-model' || layout === 'lean' || layout === 'empathy') return renderSpecializedGrid(instance, canEdit, layout);
  return renderGenericBoard(instance, canEdit);
}

function renderGenericBoard(instance, canEdit) {
  const template = instance.template;
  return `<div class="canvas-board-shell"><div class="canvas-board-hint">${icon('arrowRight')} Desplázate horizontalmente para explorar las secciones.</div><div class="canvas-board-scroll"><div class="canvas-board" style="--canvas-columns:${Math.max(2, Number(template.columns || 3))}">${template.sections.map(section => canvasSection(instance, section, canEdit)).join('')}</div></div></div>`;
}

function renderSpecializedGrid(instance, canEdit, layout) {
  return `<div class="canvas-board-shell canvas-document"><div class="canvas-board-hint">${icon('arrowRight')} El desplazamiento queda contenido dentro del lienzo.</div><div class="canvas-board-scroll"><div class="canvas-specialized-grid layout-${escapeHtml(layout)}">${instance.template.sections.map(section => canvasSection(instance, section, canEdit, `canvas-area-${section.area}`)).join('')}</div></div></div>`;
}

function renderValueProposition(instance, canEdit) {
  const groups = instance.template.groups || [];
  return `<div class="canvas-board-shell canvas-document"><div class="canvas-board-hint">${icon('arrowRight')} Mapa de valor y perfil del cliente.</div><div class="canvas-board-scroll"><div class="value-proposition-layout">${groups.map(group => {
    const sections = instance.template.sections.filter(section => section.group === group.id);
    return `<section class="value-proposition-group group-${escapeHtml(group.tone)}"><header><h2>${escapeHtml(group.emoji)} ${escapeHtml(group.title)}</h2></header><div class="value-proposition-group-grid">${sections.map(section => canvasSection(instance, section, canEdit, `canvas-area-${section.area}`)).join('')}</div></section>`;
  }).join('')}</div></div></div>`;
}

function renderPrioritization(instance, canEdit) {
  const sectionMap = Object.fromEntries(instance.template.sections.map(section => [section.area, section]));
  return `<div class="canvas-board-shell canvas-document"><div class="canvas-board-hint">${icon('arrowRight')} Arrastra las ideas entre los cuadrantes.</div><div class="canvas-board-scroll"><div class="priority-matrix">
    <div class="priority-axis priority-axis-y"><span>+</span><strong>Deseabilidad</strong><span>−</span></div>
    <div class="priority-axis priority-axis-x"><span>−</span><strong>Factibilidad</strong><span>+</span></div>
    <div class="priority-quadrants">
      ${canvasSection(instance, sectionMap.investigate, canEdit, 'canvas-area-investigate')}
      ${canvasSection(instance, sectionMap.implement, canEdit, 'canvas-area-implement')}
      ${canvasSection(instance, sectionMap.discard, canEdit, 'canvas-area-discard')}
      ${canvasSection(instance, sectionMap.validate, canEdit, 'canvas-area-validate')}
    </div>
  </div></div></div>`;
}

function renderCanvasList(instance, canEdit) {
  return `<div class="canvas-list canvas-document">${instance.template.sections.map(section => {
    const notes = notesForSection(instance, section.id);
    return `<section class="canvas-list-section"><header><div><span class="canvas-section-tone tone-${escapeHtml(section.tone)}"></span><h2>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</h2><p>${escapeHtml(section.prompt)}</p></div>${canEdit ? `<button class="icon-button" type="button" data-add-note="${escapeHtml(section.id)}" aria-label="Agregar nota en ${escapeHtml(section.title)}">${icon('plus')}</button>` : ''}</header><div class="canvas-list-notes">${notes.length ? notes.map(note => noteCard(note, canEdit, false)).join('') : `<p class="canvas-empty-section">Sin notas todavía.</p>`}</div></section>`;
  }).join('')}</div>`;
}

function canvasSection(instance, section, canEdit, extraClass = '') {
  if (!section) return '';
  const notes = notesForSection(instance, section.id);
  return `<section class="canvas-section tone-${escapeHtml(section.tone)} ${escapeHtml(extraClass)}" data-section-id="${escapeHtml(section.id)}" style="--section-span:${Math.max(1, Number(section.colSpan || 1))}">
    <header class="canvas-section-header"><div>${section.step ? `<span class="canvas-step">${escapeHtml(section.step)}</span>` : ''}<h2><span class="canvas-section-emoji" aria-hidden="true">${escapeHtml(section.emoji || '')}</span>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.prompt)}</p></div>${canEdit ? `<button class="icon-button" type="button" data-add-note="${escapeHtml(section.id)}" aria-label="Agregar nota en ${escapeHtml(section.title)}">${icon('plus')}</button>` : ''}</header>
    <div class="canvas-note-stack" data-drop-section="${escapeHtml(section.id)}">${notes.length ? notes.map(note => noteCard(note, canEdit, true)).join('') : `<div class="canvas-empty-section">${canEdit ? 'Agrega o arrastra una nota aquí.' : 'Sin notas.'}</div>`}</div>
  </section>`;
}

function noteCard(note, canEdit, draggable) {
  const color = getCanvasNoteColor(note.colorId);
  const comments = note.comments?.length || 0;
  return `<article class="canvas-note" data-note-id="${escapeHtml(note.id)}" ${canEdit && draggable ? 'draggable="true"' : ''} tabindex="0" style="--note-bg:${color.background};--note-border:${color.border};--note-text:${color.text}">
    <div class="canvas-note-handle">${canEdit && draggable ? icon('grip') : ''}<span>${escapeHtml(color.name)}</span></div>
    <p>${escapeHtml(note.text)}</p>
    ${note.sourceCanvasId ? `<span class="linked-note-label">${icon('link')} Vinculada</span>` : ''}
    <footer><span class="note-author" title="${escapeHtml(note.author?.name || 'Autor')}">${escapeHtml(note.author?.initials || '?')}</span><time datetime="${escapeHtml(note.updatedAt)}">${relativeTime(note.updatedAt)}</time>${comments ? `<span class="note-comments">${icon('message')} ${comments}</span>` : ''}${canEdit ? `<button class="note-open" type="button" data-open-note="${escapeHtml(note.id)}" aria-label="Editar nota">${icon('edit')}</button>` : ''}</footer>
  </article>`;
}

function bindCanvasEvents(container, context, currentView) {
  const { instance, session, readOnly } = context;
  const canEdit = !readOnly && canEditCanvas(session);
  container.querySelectorAll('[data-canvas-view]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    const value = button.dataset.canvasView;
    localStorage.setItem(VIEW_KEY, value);
    localStorage.setItem(`${VIEW_KEY}.${instance.templateId}`, value);
    renderCanvasEditor(container, context);
  }));
  container.querySelector('#canvas-add-note')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openNoteForm({ instance, session, onSaved: () => reloadCanvas(container, context) });
  });
  container.querySelectorAll('[data-add-note]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openNoteForm({ instance, session, sectionId: button.dataset.addNote, onSaved: () => reloadCanvas(container, context) });
  }));
  container.querySelectorAll('[data-open-note]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openNoteDetail({ instance, noteId: button.dataset.openNote, session, onSaved: () => reloadCanvas(container, context) });
  }));
  container.querySelectorAll('.canvas-note').forEach(card => {
    card.addEventListener('dblclick', () => { if (canEdit) openNoteDetail({ instance, noteId: card.dataset.noteId, session, onSaved: () => reloadCanvas(container, context) }); });
    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && canEdit) {
        event.preventDefault();
        openNoteDetail({ instance, noteId: card.dataset.noteId, session, onSaved: () => reloadCanvas(container, context) });
      }
    });
    if (!canEdit || currentView !== 'board') return;
    card.addEventListener('dragstart', event => {
      draggedNoteId = card.dataset.noteId;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedNoteId);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      draggedNoteId = '';
      card.classList.remove('dragging');
      container.querySelectorAll('.canvas-note-stack').forEach(stack => stack.classList.remove('drag-over'));
    });
  });
  if (canEdit && currentView === 'board') {
    container.querySelectorAll('[data-drop-section]').forEach(stack => {
      stack.addEventListener('dragover', event => { event.preventDefault(); stack.classList.add('drag-over'); });
      stack.addEventListener('dragleave', event => { if (!stack.contains(event.relatedTarget)) stack.classList.remove('drag-over'); });
      stack.addEventListener('drop', async event => {
        event.preventDefault();
        stack.classList.remove('drag-over');
        const noteId = event.dataTransfer.getData('text/plain') || draggedNoteId;
        if (!noteId) return;
        try {
          await CanvasService.moveNote({ canvasId: instance.id, noteId, toSectionId: stack.dataset.dropSection, session });
          showToast('Nota movida.');
          reloadCanvas(container, context);
        } catch (error) { showToast(error.message, { type: 'error' }); }
      });
    });
  }
  container.querySelector('#canvas-history')?.addEventListener('click', () => openHistory({ instance, session, context, container }));
  container.querySelector('#canvas-share')?.addEventListener('click', () => openShare(instance, session));
  container.querySelector('#canvas-print')?.addEventListener('click', () => openExport(instance));
  container.querySelector('#canvas-settings')?.addEventListener('click', () => openCanvasSettings({ instance, session, context, container }));
  container.querySelector('#canvas-focus')?.addEventListener('click', () => toggleFocusMode(container, context));
  container.querySelector('#canvas-fullscreen')?.addEventListener('click', () => toggleFullscreen(container));
}

function openNoteForm({ instance, session, sectionId = '', onSaved }) {
  const template = instance.template;
  const modal = openModal({
    title: 'Nueva nota',
    subtitle: `Agrega una idea al ${template.name}.`,
    size: 'sm',
    initialFocus: '#canvas-note-text',
    body: `<form id="canvas-note-form" class="form-grid" novalidate>
      <div class="field field-full"><label for="canvas-note-section">Sección *</label><select class="select" id="canvas-note-section" required>${template.sections.map(section => `<option value="${escapeHtml(section.id)}" ${section.id === sectionId ? 'selected' : ''}>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('')}</select></div>
      <div class="field field-full"><label for="canvas-note-text">Contenido *</label><textarea class="input textarea" id="canvas-note-text" rows="5" maxlength="1200" required aria-describedby="canvas-note-text-help canvas-note-text-error"></textarea><small class="field-help" id="canvas-note-text-help">Una idea concreta por nota.</small><small class="field-error" id="canvas-note-text-error"></small></div>
      ${colorField('canvas-note-color', 'sky')}
      <div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('plus')} Agregar nota</button></div>
    </form>`
  });
  const form = modal.root.querySelector('#canvas-note-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const textField = modal.root.querySelector('#canvas-note-text');
    const text = textField.value.trim();
    textField.setAttribute('aria-invalid', String(!text));
    if (!text) {
      modal.root.querySelector('#canvas-note-text-error').textContent = 'Escribe el contenido de la nota.';
      textField.focus();
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await CanvasService.createNote({ canvasId: instance.id, sectionId: modal.root.querySelector('#canvas-note-section').value, input: { text, colorId: form.elements['canvas-note-color'].value }, session });
      modal.close();
      showToast('Nota agregada.');
      onSaved?.();
    } catch (error) {
      showToast(error.message, { type: 'error' });
      submit.disabled = false;
    }
  });
}

function openNoteDetail({ instance, noteId, session, onSaved }) {
  const note = instance.notes.find(item => item.id === noteId);
  if (!note) return;
  const modal = openModal({
    title: 'Detalle de la nota',
    subtitle: 'Edita, comenta, vincula o convierte esta idea en trabajo accionable.',
    size: 'lg',
    initialFocus: '#note-detail-text',
    body: `<div class="note-detail-layout"><form id="note-detail-form" class="form-grid" novalidate>
      <div class="field field-full"><label for="note-detail-text">Contenido *</label><textarea class="input textarea" id="note-detail-text" rows="6" maxlength="1200" required>${escapeHtml(note.text)}</textarea><small class="field-error" id="note-detail-error"></small></div>
      <div class="field"><label for="note-detail-section">Sección</label><select class="select" id="note-detail-section">${instance.template.sections.map(section => `<option value="${escapeHtml(section.id)}" ${section.id === note.sectionId ? 'selected' : ''}>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="note-detail-color">Color</label><select class="select" id="note-detail-color">${CANVAS_NOTE_COLORS.map(color => `<option value="${color.id}" ${color.id === note.colorId ? 'selected' : ''}>${escapeHtml(color.name)}</option>`).join('')}</select></div>
      <div class="note-meta field-full"><span>Creada por <strong>${escapeHtml(note.author?.name || 'Usuario')}</strong></span><span>${formatDate(note.createdAt)}</span>${note.sourceCanvasId ? `<span>${icon('link')} Resultado vinculado</span>` : ''}</div>
      <div class="modal-actions field-full note-actions"><button class="button button-danger" type="button" id="delete-note">${icon('trash')} Eliminar</button><button class="button button-secondary" type="button" id="link-note">${icon('link')} Vincular</button><button class="button button-secondary" type="button" id="convert-note">${icon('checkSquare')} Crear tarea</button><button class="button button-primary" type="submit">Guardar cambios</button></div>
    </form>
    <aside class="note-comments-panel"><h3>Comentarios</h3><div class="note-comment-list">${note.comments?.length ? note.comments.map(comment => `<article><span class="note-author">${escapeHtml(comment.author?.initials || '?')}</span><div><strong>${escapeHtml(comment.author?.name || 'Usuario')}</strong><p>${escapeHtml(comment.text)}</p><time>${relativeTime(comment.createdAt)}</time></div></article>`).join('') : '<p class="muted-copy">No hay comentarios todavía.</p>'}</div><form id="note-comment-form"><label class="sr-only" for="note-comment-text">Nuevo comentario</label><textarea class="input textarea" id="note-comment-text" rows="3" maxlength="800" placeholder="Escribe un comentario..."></textarea><button class="button button-secondary" type="submit">${icon('message')} Comentar</button></form></aside></div>`
  });
  modal.root.querySelector('#note-detail-form').addEventListener('submit', async event => {
    event.preventDefault();
    const textField = modal.root.querySelector('#note-detail-text');
    const text = textField.value.trim();
    if (!text) {
      textField.setAttribute('aria-invalid', 'true');
      modal.root.querySelector('#note-detail-error').textContent = 'La nota no puede quedar vacía.';
      textField.focus();
      return;
    }
    try {
      await CanvasService.updateNote({ canvasId: instance.id, noteId, patch: { text, sectionId: modal.root.querySelector('#note-detail-section').value, colorId: modal.root.querySelector('#note-detail-color').value }, session });
      modal.close();
      showToast('Nota actualizada.');
      onSaved?.();
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
  modal.root.querySelector('#note-comment-form').addEventListener('submit', async event => {
    event.preventDefault();
    const field = modal.root.querySelector('#note-comment-text');
    try {
      await CanvasService.addComment({ canvasId: instance.id, noteId, text: field.value, session });
      modal.close();
      showToast('Comentario agregado.');
      onSaved?.();
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
  modal.root.querySelector('#delete-note').addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Eliminar nota', message: 'La nota y sus comentarios se eliminarán del canvas.', confirmLabel: 'Eliminar', danger: true });
    if (!confirmed) return;
    try {
      await CanvasService.deleteNote({ canvasId: instance.id, noteId, session });
      closeModal();
      showToast('Nota eliminada.');
      onSaved?.();
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
  modal.root.querySelector('#convert-note').addEventListener('click', () => { modal.close(); openConvertToTask({ instance, note, session, onSaved }); });
  modal.root.querySelector('#link-note').addEventListener('click', () => { modal.close(); openLinkNote({ instance, note, session, onSaved }); });
}

async function openConvertToTask({ instance, note, session, onSaved }) {
  try {
    const board = await KanbanService.getBoard({ projectId: instance.projectId, workspaceId: instance.workspaceId, session });
    const modal = openModal({
      title: 'Convertir nota en tarea',
      subtitle: 'Crea una tarjeta Kanban manteniendo la trazabilidad con el canvas.',
      size: 'sm',
      initialFocus: '#task-from-note-title',
      body: `<form id="task-from-note-form" class="form-grid"><div class="field field-full"><label for="task-from-note-title">Título *</label><input class="input" id="task-from-note-title" maxlength="160" value="${escapeHtml(note.text.slice(0, 90))}" required></div><div class="field field-full"><label for="task-from-note-column">Columna</label><select class="select" id="task-from-note-column">${board.columns.map(column => `<option value="${escapeHtml(column.id)}">${escapeHtml(column.name)}</option>`).join('')}</select></div><div class="field"><label for="task-from-note-priority">Prioridad</label><select class="select" id="task-from-note-priority"><option value="low">Baja</option><option value="medium" selected>Media</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div><div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('checkSquare')} Crear tarea</button></div></form>`
    });
    modal.root.querySelector('#task-from-note-form').addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await KanbanService.createCard({ projectId: instance.projectId, workspaceId: instance.workspaceId, input: { title: modal.root.querySelector('#task-from-note-title').value, description: `${note.text}\n\nOrigen: ${instance.title}`, columnId: modal.root.querySelector('#task-from-note-column').value, priority: modal.root.querySelector('#task-from-note-priority').value, labels: [{ id: 'canvas', name: 'Canvas', tone: 'violet' }], visibility: 'internal' }, session });
        modal.close();
        showToast('Tarea creada en el Kanban.');
        onSaved?.();
      } catch (error) { showToast(error.message, { type: 'error' }); }
    });
  } catch (error) { showToast(error.message, { type: 'error' }); }
}

async function openLinkNote({ instance, note, session, onSaved }) {
  try {
    const targets = (await CanvasService.listInstances({ workspaceId: instance.workspaceId, projectId: instance.projectId, session })).filter(item => item.id !== instance.id);
    if (!targets.length) { showToast('Crea otro canvas dentro del proyecto para vincular este resultado.'); return; }
    const first = targets[0];
    const modal = openModal({
      title: 'Vincular resultado',
      subtitle: 'Copia esta nota a otro canvas y conserva el vínculo de origen.',
      size: 'sm',
      initialFocus: '#link-target-canvas',
      body: `<form id="link-note-form" class="form-grid"><div class="field field-full"><label for="link-target-canvas">Canvas de destino</label><select class="select" id="link-target-canvas">${targets.map(target => `<option value="${escapeHtml(target.id)}">${escapeHtml(target.title)}</option>`).join('')}</select></div><div class="field field-full"><label for="link-target-section">Sección de destino</label><select class="select" id="link-target-section">${first.template.sections.map(section => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('')}</select></div><div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('link')} Vincular nota</button></div></form>`
    });
    const targetSelect = modal.root.querySelector('#link-target-canvas');
    const sectionSelect = modal.root.querySelector('#link-target-section');
    const updateSections = () => {
      const target = targets.find(item => item.id === targetSelect.value);
      sectionSelect.innerHTML = target.template.sections.map(section => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('');
    };
    targetSelect.addEventListener('change', updateSections);
    modal.root.querySelector('#link-note-form').addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await CanvasService.linkNote({ sourceCanvasId: instance.id, sourceNoteId: note.id, targetCanvasId: targetSelect.value, targetSectionId: sectionSelect.value, session });
        modal.close();
        showToast('Nota vinculada al canvas de destino.');
        onSaved?.();
      } catch (error) { showToast(error.message, { type: 'error' }); }
    });
  } catch (error) { showToast(error.message, { type: 'error' }); }
}

async function openHistory({ instance, session, context, container }) {
  const versions = await CanvasService.listVersions({ canvasId: instance.id, session });
  const isSuperadmin = session?.role === 'superadmin';
  const modal = openModal({
    title: 'Historial y versiones',
    subtitle: 'Consulta la actividad y recupera puntos de control del canvas.',
    size: 'lg',
    body: `<div class="history-version-layout"><section><div class="section-heading compact"><div><h3>Actividad</h3><p>Últimos ${Math.min(instance.history.length, 150)} eventos.</p></div></div><div class="canvas-history-list">${instance.history.length ? instance.history.map(entry => `<article><span class="history-icon">${icon(historyIcon(entry.type))}</span><div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.actor?.name || 'Sistema')} · ${relativeTime(entry.createdAt)}</small></div></article>`).join('') : '<p class="muted-copy">Todavía no hay actividad registrada.</p>'}</div></section><section><div class="section-heading compact"><div><h3>Versiones</h3><p>Se conservan hasta 20 snapshots locales.</p></div>${canManageCanvas(session) ? `<button class="button button-secondary" type="button" id="create-version">${icon('plus')} Punto de control</button>` : ''}</div><div class="canvas-version-list">${versions.length ? versions.map(version => `<article><div><strong>Versión ${version.version}</strong><span>${escapeHtml(version.label || 'Punto de control')}</span><small>${escapeHtml(version.actor?.name || 'Sistema')} · ${formatDateTime(version.createdAt)} · ${version.notes?.length || 0} notas</small></div>${isSuperadmin ? `<button class="button button-secondary" type="button" data-restore-version="${escapeHtml(version.id)}">${icon('restore')} Restaurar</button>` : ''}</article>`).join('') : '<p class="muted-copy">No existen versiones guardadas.</p>'}</div></section></div>`
  });
  modal.root.querySelector('#create-version')?.addEventListener('click', async () => {
    try {
      await CanvasService.createVersion({ canvasId: instance.id, label: `Punto de control · ${formatDateTime(new Date().toISOString())}`, session });
      modal.close();
      showToast('Punto de control creado.');
      reloadCanvas(container, context);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
  modal.root.querySelectorAll('[data-restore-version]').forEach(button => button.addEventListener('click', async () => {
    if (!globalThis.confirm('Se creará una versión nueva basada en este punto de control. La versión actual quedará respaldada. ¿Continuar?')) return;
    try {
      await CanvasService.restoreVersion({ canvasId: instance.id, snapshotId: button.dataset.restoreVersion, session });
      closeModal();
      showToast('Versión restaurada.');
      reloadCanvas(container, context);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  }));
}

async function openShare(instance, session) {
  const modal = openModal({
    title: 'Compartir canvas',
    subtitle: 'Genera enlaces de consulta, QR y fechas de vencimiento flexibles.',
    size: 'lg',
    initialFocus: '#share-expiry-preset',
    body: `<div class="share-canvas-box"><form id="share-create-form" class="form-grid"><div class="field"><label for="share-expiry-preset">Vigencia</label><select class="select" id="share-expiry-preset"><option value="1">1 día</option><option value="7" selected>7 días</option><option value="15">15 días</option><option value="30">30 días</option><option value="custom">Fecha personalizada</option></select></div><div class="field"><label for="share-custom-expiry">Fecha y hora de vencimiento</label><input class="input" id="share-custom-expiry" type="datetime-local" disabled></div><div class="field field-full"><label for="share-label">Etiqueta opcional</label><input class="input" id="share-label" maxlength="80" placeholder="Ej.: Revisión del cliente"></div><div class="modal-actions field-full"><button class="button button-primary" type="submit">${icon('link')} Generar enlace</button></div></form><div id="share-result"></div><section class="share-active-section"><h3>Enlaces generados</h3><div id="share-token-list"><span class="spinner"></span> Cargando...</div></section><p class="field-help">Modo demo local: el QR y el enlace solo podrán abrir el canvas en este mismo navegador hasta conectar Firebase.</p></div>`
  });
  const preset = modal.root.querySelector('#share-expiry-preset');
  const custom = modal.root.querySelector('#share-custom-expiry');
  custom.min = toLocalDateTime(new Date(Date.now() + 5 * 60000));
  preset.addEventListener('change', () => {
    custom.disabled = preset.value !== 'custom';
    if (!custom.disabled && !custom.value) custom.value = toLocalDateTime(new Date(Date.now() + 7 * 86400000));
  });

  const refreshTokens = async selectedToken => {
    const tokens = await CanvasService.listShareTokens({ canvasId: instance.id, session });
    renderShareTokens(modal.root, instance, tokens, session, selectedToken, refreshTokens);
  };
  await refreshTokens();

  modal.root.querySelector('#share-create-form').addEventListener('submit', async event => {
    event.preventDefault();
    let expiresAt = '';
    try {
      if (preset.value === 'custom') {
        if (!custom.value) throw new Error('Selecciona una fecha y hora de vencimiento.');
        expiresAt = new Date(custom.value).toISOString();
      } else {
        expiresAt = new Date(Date.now() + Number(preset.value) * 86400000).toISOString();
      }
      const token = await CanvasService.createShareToken({ canvasId: instance.id, expiresAt, label: modal.root.querySelector('#share-label').value, session });
      await refreshTokens(token);
      showToast('Enlace de consulta generado.');
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
}

function renderShareTokens(root, instance, tokens, session, selectedToken, refreshTokens) {
  const active = tokens.filter(token => token.active && new Date(token.expiresAt).getTime() > Date.now());
  root.querySelector('#share-token-list').innerHTML = tokens.length ? tokens.map(token => {
    const link = shareLink(token.code);
    const status = !token.active ? 'Revocado' : new Date(token.expiresAt).getTime() <= Date.now() ? 'Vencido' : 'Activo';
    return `<article class="share-token-item"><div><strong>${escapeHtml(token.label || token.code)}</strong><span>${status} · vence ${formatDateTime(token.expiresAt)}</span></div><div class="share-token-actions"><button class="icon-button" type="button" data-copy-token="${escapeHtml(link)}" aria-label="Copiar enlace">${icon('copy')}</button>${token.active ? `<button class="button button-ghost" type="button" data-show-token="${escapeHtml(token.id)}">Ver</button><button class="button button-danger" type="button" data-revoke-token="${escapeHtml(token.id)}">Revocar</button>` : ''}</div></article>`;
  }).join('') : '<p class="muted-copy">Todavía no se generaron enlaces.</p>';

  const token = selectedToken || active[0];
  root.querySelector('#share-result').innerHTML = token ? shareResultMarkup(token) : '';
  bindShareTokenActions(root, instance, tokens, session, refreshTokens);
}

function shareResultMarkup(token) {
  const link = shareLink(token.code);
  const qr = qrImageUrl(link);
  return `<section class="share-result-card"><div class="share-result-main"><label for="canvas-share-link">Enlace compartido</label><div class="copy-field"><input class="input" id="canvas-share-link" readonly value="${escapeHtml(link)}"><button class="button button-secondary" id="copy-canvas-link" type="button">${icon('copy')} Copiar</button></div><div class="share-code"><span>Código</span><strong>${escapeHtml(token.code)}</strong></div><p class="field-help">Vence el ${formatDateTime(token.expiresAt)}.</p></div><div class="share-qr"><img src="${escapeHtml(qr)}" alt="Código QR del enlace compartido" width="180" height="180"><a class="button button-secondary" href="${escapeHtml(qr)}" target="_blank" rel="noopener">${icon('download')} Abrir QR</a></div></section>`;
}

function bindShareTokenActions(root, instance, tokens, session, refreshTokens) {
  const resultLink = root.querySelector('#canvas-share-link')?.value;
  root.querySelector('#copy-canvas-link')?.addEventListener('click', async event => {
    const copied = await copyText(resultLink, root.querySelector('#canvas-share-link'));
    event.currentTarget.innerHTML = copied ? `${icon('check')} Enlace copiado` : `${icon('copy')} Seleccionado`;
    showToast(copied ? 'Enlace copiado.' : 'El enlace quedó seleccionado para copiarlo manualmente.');
  });
  root.querySelectorAll('[data-copy-token]').forEach(button => button.addEventListener('click', async () => {
    const copied = await copyText(button.dataset.copyToken);
    showToast(copied ? 'Enlace copiado.' : 'No se pudo copiar automáticamente.');
  }));
  root.querySelectorAll('[data-show-token]').forEach(button => button.addEventListener('click', () => {
    const token = tokens.find(item => item.id === button.dataset.showToken);
    root.querySelector('#share-result').innerHTML = shareResultMarkup(token);
    bindShareTokenActions(root, instance, tokens, session, refreshTokens);
  }));
  root.querySelectorAll('[data-revoke-token]').forEach(button => button.addEventListener('click', async () => {
    if (!globalThis.confirm('El enlace dejará de funcionar inmediatamente. ¿Revocar enlace?')) return;
    try {
      await CanvasService.revokeShareToken({ canvasId: instance.id, tokenId: button.dataset.revokeToken, session });
      await refreshTokens();
      showToast('Enlace revocado.');
    } catch (error) { showToast(error.message, { type: 'error' }); }
  }));
}

function openExport(instance) {
  const modal = openModal({
    title: 'Exportar canvas a PDF',
    subtitle: 'Elige entre una síntesis de una hoja o un documento completo.',
    size: 'sm',
    body: `<form id="canvas-export-form" class="form-grid"><fieldset class="field field-full export-options"><legend>Formato</legend><label><input type="radio" name="export-mode" value="summary" checked><span><strong>Resumen A4 horizontal</strong><small>Intenta presentar el canvas completo en una hoja. Puede ocultar contenido excedente.</small></span></label><label><input type="radio" name="export-mode" value="detail"><span><strong>Detalle A4 horizontal</strong><small>Mantiene el texto legible y continúa en las páginas necesarias.</small></span></label></fieldset><div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('file')} Abrir impresión</button></div></form>`
  });
  modal.root.querySelector('#canvas-export-form').addEventListener('submit', event => {
    event.preventDefault();
    const mode = new FormData(event.currentTarget).get('export-mode') || 'summary';
    modal.close();
    printCanvas(mode, instance.templateId);
  });
}

function openCanvasSettings({ instance, session, context, container }) {
  const modal = openModal({
    title: 'Administrar canvas',
    subtitle: 'Actualiza el título o archiva la instancia metodológica.',
    size: 'sm',
    initialFocus: '#canvas-settings-title',
    body: `<form id="canvas-settings-form" class="form-grid"><div class="field field-full"><label for="canvas-settings-title">Título</label><input class="input" id="canvas-settings-title" maxlength="140" value="${escapeHtml(instance.title)}" required></div><div class="modal-actions field-full"><button class="button button-danger" type="button" id="archive-canvas">${icon('archive')} Archivar</button><button class="button button-primary" type="submit">Guardar</button></div></form>`
  });
  modal.root.querySelector('#canvas-settings-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await CanvasService.updateInstance({ canvasId: instance.id, patch: { title: modal.root.querySelector('#canvas-settings-title').value }, session });
      modal.close();
      showToast('Canvas actualizado.');
      reloadCanvas(container, context);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
  modal.root.querySelector('#archive-canvas').addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Archivar canvas', message: 'El canvas se ocultará del Toolkit, pero conservará notas e historial.', confirmLabel: 'Archivar', danger: true });
    if (!confirmed) return;
    try {
      await CanvasService.archiveInstance({ canvasId: instance.id, session });
      closeModal();
      showToast('Canvas archivado.');
      location.hash = `#/w/${instance.workspaceId}/p/${instance.projectId}/innovation`;
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
}

function colorField(name, selected) {
  return `<fieldset class="field field-full color-field"><legend>Color</legend><div class="note-color-options">${CANVAS_NOTE_COLORS.map(color => `<label style="--swatch:${color.background};--swatch-border:${color.border}"><input type="radio" name="${name}" value="${color.id}" ${color.id === selected ? 'checked' : ''}><span></span>${escapeHtml(color.name)}</label>`).join('')}</div></fieldset>`;
}

function renderPresence(container, people) {
  const root = container.querySelector('#canvas-presence');
  if (!root) return;
  root.innerHTML = people.length ? people.slice(0, 5).map((entry, index) => participantAvatar(entry.user, index === 0)).join('') + (people.length > 5 ? `<span class="presence-more">+${people.length - 5}</span>` : '') : '<span class="presence-label">Sin participantes</span>';
}

function participantAvatar(user, active = false) {
  if (!user) return '';
  return `<span class="presence-avatar ${active ? 'active' : ''}" title="${escapeHtml(user.name || 'Participante')}">${escapeHtml(user.initials || user.name?.slice(0, 2) || 'P')}</span>`;
}

function notesForSection(instance, sectionId) {
  return instance.notes.filter(note => note.sectionId === sectionId).sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

async function reloadCanvas(container, context) {
  try {
    const next = await CanvasService.getInstance({ canvasId: context.instance.id, session: context.session });
    renderCanvasEditor(container, { ...context, instance: next });
  } catch (error) { showToast(error.message, { type: 'error' }); }
}

function toggleFocusMode(container, context) {
  const next = !document.body.classList.contains('canvas-focus-mode');
  document.body.classList.toggle('canvas-focus-mode', next);
  localStorage.setItem(FOCUS_KEY, next ? '1' : '0');
  renderCanvasEditor(container, context);
}

async function toggleFullscreen(container) {
  const page = container.querySelector('.canvas-editor-page, .shared-canvas-page');
  try {
    if (!document.fullscreenElement) await page.requestFullscreen();
    else await document.exitFullscreen();
  } catch { showToast('El navegador no permitió cambiar a pantalla completa.', { type: 'error' }); }
}

function updateFullscreenButton(container) {
  const button = container.querySelector('#canvas-fullscreen');
  if (!button) return;
  button.innerHTML = document.fullscreenElement ? `${icon('minimize')} Salir de pantalla completa` : `${icon('maximize')} Pantalla completa`;
}

function printCanvas(mode, templateId) {
  document.body.classList.add('canvas-printing', mode === 'summary' ? 'canvas-print-summary' : 'canvas-print-detail');
  document.body.dataset.printTemplate = templateId;
  const cleanup = () => {
    document.body.classList.remove('canvas-printing', 'canvas-print-summary', 'canvas-print-detail');
    delete document.body.dataset.printTemplate;
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  requestAnimationFrame(() => window.print());
  setTimeout(cleanup, 5000);
}

async function copyText(value, visibleField = null) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* use fallback */ }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.left = '-9999px';
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { copied = false; }
  field.remove();
  if (!copied && visibleField) {
    visibleField.focus();
    visibleField.select();
  }
  return copied;
}

function shareLink(code) {
  return `${location.origin}${location.pathname}#/share/canvas/${code}`;
}

function qrImageUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&format=png&data=${encodeURIComponent(value)}`;
}

function toLocalDateTime(date) {
  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function historyIcon(type) {
  if (type.includes('created')) return 'plus';
  if (type.includes('moved')) return 'arrowRight';
  if (type.includes('deleted') || type.includes('archived')) return 'archive';
  if (type.includes('comment')) return 'message';
  if (type.includes('shared') || type.includes('linked')) return 'link';
  if (type.includes('version')) return 'history';
  return 'edit';
}

function relativeTime(value) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

export function cleanupCanvasView() {
  cleanupEditor?.();
  cleanupEditor = null;
  document.body.classList.remove('canvas-focus-mode', 'canvas-printing', 'canvas-print-summary', 'canvas-print-detail');
}
