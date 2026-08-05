import { CanvasService } from '../services/canvas-service.js?v=9.0.4';
import { ProjectService } from '../services/project-service.js?v=9.0.4';
import { KanbanService } from '../services/kanban-service.js?v=9.0.4';
import { CANVAS_NOTE_COLORS, getCanvasNoteColor } from '../../data/canvas-templates.js?v=9.0.4';
import { canEditCanvas, canManageCanvas } from '../utils/permissions.js?v=9.0.4';
import { calculateCanvasProgress } from '../utils/canvas-progress.js?v=9.0.4';
import { icon } from '../utils/icons.js?v=9.0.4';
import { escapeHtml, formatDate } from '../utils/format.js?v=9.0.4';
import { openModal, confirmModal, closeModal } from '../components/modal.js?v=9.0.4';
import { showToast } from '../components/toast.js?v=9.0.4';
import { createCanvasWorkspaceController } from '../components/canvas-workspace-controller.js?v=9.0.4';

let cleanupEditor = null;
let workspaceController = null;
let refreshSequence = 0;
let timerTicker = null;
let timerAudioContext = null;
let canvasMutationActive = false;
let navigationBlockedUntil = 0;
const VIEW_KEY = 'wonkup.canvas.view';
const TIMER_KEY = 'wonkup.canvas.teamTimer';
const IMMERSIVE_CLASS = 'canvas-immersive-mode';

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
  workspaceController?.destroy();
  workspaceController = null;
  const { instance, project, session, readOnly, sharedToken = '' } = context;
  const template = instance.template;
  const storedView = localStorage.getItem(`${VIEW_KEY}.${template.id}`) || localStorage.getItem(VIEW_KEY);
  const viewMode = storedView || (matchMedia('(max-width: 760px)').matches ? 'list' : 'board');
  const completion = calculateCanvasProgress(instance);
  const canEdit = !readOnly && canEditCanvas(session);
  const canManage = !readOnly && canManageCanvas(session);
  document.body.classList.remove('canvas-focus-mode');
  container.dataset.activeCanvasId = instance.id;
  const projectBrand = normalizeCanvasBrand(project.brandColor || template.color);

  container.innerHTML = `<section class="${readOnly ? 'shared-canvas-page' : 'page canvas-editor-page'}" data-canvas-id="${escapeHtml(instance.id)}" data-template-layout="${escapeHtml(template.layout || 'generic')}">
    <header class="canvas-editor-header" style="--canvas-accent:${escapeHtml(template.color)};--canvas-brand:${escapeHtml(projectBrand)}">
      <div class="canvas-editor-identity">
        <button class="canvas-back-link" id="canvas-back" type="button" data-back-hash="${readOnly ? '#/access' : `#/w/${instance.workspaceId}/p/${instance.projectId}/innovation`}">${icon('arrowLeft')} ${readOnly ? 'Acceso WonkUp' : 'Volver al Toolkit'}</button>
        <div class="canvas-title-row"><span class="canvas-title-icon">${icon(template.icon)}</span><div><span class="page-kicker">${escapeHtml(template.category)} · ${escapeHtml(project.name || 'Proyecto')}</span><h1>${escapeHtml(instance.title)}</h1><p>${escapeHtml(template.description)}</p></div></div>
      </div>
      <div class="canvas-editor-actions">
        ${readOnly ? '' : `<div class="canvas-presence" id="canvas-presence" aria-label="Participantes conectados">${participantAvatar(session?.user, true)}</div>`}
        <div class="canvas-completion" title="Avance de llenado: 70% cobertura de secciones y 30% profundidad"><strong>${completion}%</strong><span>avance de llenado</span></div>
        ${readOnly ? '' : timerMarkup(instance.id)}
        <button class="button button-secondary" id="canvas-fullscreen" type="button">${icon('maximize')} Pantalla completa</button>
        ${readOnly ? `<span class="status-badge">Solo lectura</span>` : `
          <button class="button button-secondary" id="canvas-history" type="button">${icon('history')} Historial</button>
          ${canManage ? `<button class="button button-secondary" id="canvas-share" type="button">${icon('link')} Compartir</button>` : ''}
          <button class="button button-secondary" id="canvas-print" type="button">${icon('file')} Imprimir / PDF</button>
          ${canManage ? `<button class="icon-button" id="canvas-settings" type="button" aria-label="Administrar canvas">${icon('more')}</button>` : ''}
        `}
      </div>
    </header>

    <div class="canvas-toolbar" aria-label="Herramientas del canvas">
      <div class="canvas-view-switch" role="group" aria-label="Vista del canvas">
        <button class="button button-ghost ${viewMode === 'board' ? 'active' : ''}" data-canvas-view="board" type="button" aria-pressed="${viewMode === 'board'}">${icon('columns')} Canvas</button>
        <button class="button button-ghost ${viewMode === 'list' ? 'active' : ''}" data-canvas-view="list" type="button" aria-pressed="${viewMode === 'list'}">${icon('list')} Lista</button>
      </div>
      <div class="canvas-toolbar-meta"><span data-canvas-note-count>${instance.notes.length} notas</span><span data-canvas-section-count>${new Set(instance.notes.map(note => note.sectionId)).size}/${template.sections.length} secciones con contenido</span><span data-canvas-version>Versión ${instance.version}</span>${CanvasService.mode === 'mock' ? '<span class="demo-chip">Demo local</span>' : ''}</div>
    </div>

    <div class="canvas-workspace" id="canvas-workspace">
      ${viewMode === 'list' ? renderCanvasList(instance, canEdit) : renderCanvasBoard(instance, canEdit)}
    </div>

    <footer class="canvas-editor-footer"><span data-canvas-updated>Última actualización: ${formatDate(instance.updatedAt)}</span><span>${readOnly ? 'Vista compartida de consulta' : 'Los cambios se guardan automáticamente.'}</span><span class="canvas-build-version">Motor 5.9.0</span>${sharedToken ? `<span>Código: ${escapeHtml(sharedToken)}</span>` : ''}</footer>
  </section>`;

  bindCanvasEvents(container, context, viewMode);

  let stopPresence = () => {};
  if (!readOnly && session) stopPresence = CanvasService.startPresence({ canvasId: instance.id, session, onChange: people => renderPresence(container, people) });
  const unsubscribe = readOnly ? () => {} : CanvasService.subscribe(event => {
    if (event.source === 'presence' || event.source === 'local') return;
    if (event.source !== 'storage' && event.canvasId !== context.instance.id) return;
    if (document.querySelector('#wonkup-modal')) return;
    reloadCanvas(container, context);
  });
  if (!readOnly) bindCanvasTimer(container, instance.id);
  updateFullscreenButton(container);
  updateTimerVisibility(container);
  const fullscreenHost = container.closest('#main-view') || container;
  const immersiveKeydown = event => {
    if (event.key !== 'Escape' || !document.body.classList.contains(IMMERSIVE_CLASS)) return;
    if (document.querySelector('#wonkup-modal')) return;
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.remove(IMMERSIVE_CLASS);
    fullscreenHost.classList.remove('canvas-fullscreen-host');
    updateFullscreenButton(container);
    updateTimerVisibility(container);
  };
  document.addEventListener('keydown', immersiveKeydown);
  cleanupEditor = () => {
    stopPresence();
    unsubscribe();
    workspaceController?.destroy();
    workspaceController = null;
    stopTimerTicker();
    document.removeEventListener('keydown', immersiveKeydown);
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
    return `<section class="canvas-list-section"><header><div><span class="canvas-section-tone tone-${escapeHtml(section.tone)}"></span><h2>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</h2><p>${escapeHtml(section.prompt)}</p></div>${canEdit ? `<button class="icon-button" type="button" data-add-note="${escapeHtml(section.id)}" aria-label="Agregar nota en ${escapeHtml(section.title)}">${icon('plus')}</button>` : ''}</header><div class="canvas-list-notes" data-drop-section="${escapeHtml(section.id)}">${notes.length ? notes.map(note => noteCard(note, canEdit, false)).join('') : `<p class="canvas-empty-section">Sin notas todavía.</p>`}</div></section>`;
  }).join('')}</div>`;
}

function canvasSection(instance, section, canEdit, extraClass = '') {
  if (!section) return '';
  const notes = notesForSection(instance, section.id);
  return `<section class="canvas-section tone-${escapeHtml(section.tone)} ${escapeHtml(extraClass)}" data-section-id="${escapeHtml(section.id)}" style="--section-span:${Math.max(1, Number(section.colSpan || 1))}">
    <header class="canvas-section-header"><div>${section.step ? `<span class="canvas-step">${escapeHtml(section.step)}</span>` : ''}<h2><span class="canvas-section-emoji" aria-hidden="true">${escapeHtml(section.emoji || '')}</span>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.prompt)}</p></div>${canEdit ? `<button class="icon-button" type="button" data-add-note="${escapeHtml(section.id)}" aria-label="Agregar nota en ${escapeHtml(section.title)}">${icon('plus')}</button>` : ''}</header>
    <div class="canvas-note-stack" data-drop-section="${escapeHtml(section.id)}">${notes.length ? notes.map(note => noteCard(note, canEdit, true)).join('') : `<div class="canvas-empty-section">${canEdit ? 'Pulsa + para crear una nota aquí.' : 'Sin notas.'}</div>`}</div>
  </section>`;
}

function normalizeHexColor(value, fallback = '#dff1ff') {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
}

function hexRgb(hex) {
  const value = normalizeHexColor(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function mixHex(hex, target, ratio) {
  const source = hexRgb(hex);
  const destination = hexRgb(target);
  const mix = channel => Math.round(channel[0] + (channel[1] - channel[0]) * ratio).toString(16).padStart(2, '0');
  return `#${mix([source.r, destination.r])}${mix([source.g, destination.g])}${mix([source.b, destination.b])}`;
}

function textColorForHex(hex) {
  const { r, g, b } = hexRgb(hex);
  const linear = value => {
    const channel = value / 255;
    return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  };
  const luminance = .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
  return luminance > .43 ? '#172238' : '#ffffff';
}

function resolveNoteColor(note) {
  const preset = getCanvasNoteColor(note.colorId);
  if (!note.colorHex) return preset;
  const background = normalizeHexColor(note.colorHex, preset.background);
  return {
    ...preset,
    id: 'custom',
    name: 'Personalizado',
    background,
    border: mixHex(background, '#000000', .22),
    text: textColorForHex(background)
  };
}

function noteCard(note, canEdit, draggable) {
  const color = resolveNoteColor(note);
  const comments = note.comments?.length || 0;
  const renderKey = [note.text, note.colorId, note.colorHex || '', comments, note.sourceCanvasId || '', note.sourceNoteId || ''].join('|');
  const quickTools = canEdit ? `<div class="canvas-note-quick-actions" aria-label="Acciones rápidas de la nota">
    <div class="canvas-note-color-dots">${CANVAS_NOTE_COLORS.map(item => `<button class="note-color-dot ${!note.colorHex && item.id === note.colorId ? 'active' : ''}" type="button" data-note-color="${escapeHtml(item.id)}" style="--dot:${item.background};--dot-border:${item.border}" aria-label="Cambiar a color ${escapeHtml(item.name)}" title="${escapeHtml(item.name)}"></button>`).join('')}</div>
    <button class="note-quick-icon note-quick-delete" type="button" data-delete-note="${escapeHtml(note.id)}" aria-label="Eliminar nota" title="Eliminar">${icon('trash')}</button>
  </div>` : '';
  return `<article class="canvas-note" data-note-id="${escapeHtml(note.id)}" data-note-render-key="${escapeHtml(renderKey)}" tabindex="0" style="--note-bg:${color.background};--note-border:${color.border};--note-text:${color.text}">
    ${quickTools}
    <div class="canvas-note-handle" ${canEdit && draggable ? `data-drag-note="${escapeHtml(note.id)}" role="button" tabindex="0" aria-label="Mover nota" title="Arrastrar nota"` : ''}>${canEdit && draggable ? icon('grip') : ''}</div>
    <p>${escapeHtml(note.text)}</p>
    ${note.sourceCanvasId ? `<span class="linked-note-label">${icon('link')} Vinculada</span>` : ''}
    <footer><span class="note-author" title="${escapeHtml(note.author?.name || 'Autor')}">${escapeHtml(note.author?.initials || '?')}</span><time datetime="${escapeHtml(note.updatedAt)}">${relativeTime(note.updatedAt)}</time>${comments ? `<span class="note-comments">${icon('message')} ${comments}</span>` : ''}${canEdit ? `<button class="note-open" type="button" draggable="false" data-open-note="${escapeHtml(note.id)}" aria-label="Más opciones de la nota" title="Más opciones">${icon('more')}</button>` : ''}</footer>
  </article>`;
}

function blockCanvasNavigation(duration = 900) {
  navigationBlockedUntil = Math.max(navigationBlockedUntil, Date.now() + duration);
}

function bindCanvasEvents(container, context, currentView) {
  const { session, readOnly } = context;
  const back = container.querySelector('#canvas-back');
  let backPointerArmed = false;

  back?.addEventListener('pointerdown', event => {
    backPointerArmed = event.isPrimary !== false && event.button === 0;
  });
  back?.addEventListener('pointercancel', () => { backPointerArmed = false; });
  back?.addEventListener('pointerleave', event => {
    if (event.buttons) backPointerArmed = false;
  });
  back?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const keyboardActivation = event.detail === 0;
    const intentionalActivation = keyboardActivation || backPointerArmed;
    backPointerArmed = false;
    if (!intentionalActivation || canvasMutationActive || Date.now() < navigationBlockedUntil) return;
    navigateFromCanvas(event.currentTarget.dataset.backHash || '#/');
  });

  container.querySelectorAll('[data-canvas-view]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    const value = button.dataset.canvasView;
    localStorage.setItem(VIEW_KEY, value);
    localStorage.setItem(`${VIEW_KEY}.${context.instance.templateId}`, value);
    renderCanvasEditor(container, context);
  }));

  const openDetail = noteId => {
    blockCanvasNavigation(800);
    openNoteDetail({
      context,
      noteId,
      container,
      onSaved: next => next
        ? applyCanvasInstance(container, context, next, { focusNoteId: noteId })
        : reloadCanvas(container, context)
    });
  };

  const workspace = container.querySelector('#canvas-workspace');
  workspaceController = workspace ? createCanvasWorkspaceController({
    workspace,
    getInstance: () => context.instance,
    getCanEdit: () => !context.readOnly && canEditCanvas(context.session),
    getViewMode: () => currentView,
    renderNote: (note, canEdit, draggable) => noteCard(note, canEdit, draggable),
    emptyMarkup: canEdit => `<div class="canvas-empty-section">${canEdit ? 'Pulsa + para crear una nota aquí.' : 'Sin notas.'}</div>`,
    colors: CANVAS_NOTE_COLORS,
    defaultColorForSection: sectionId => {
      const tone = context.instance.template.sections.find(section => section.id === sectionId)?.tone || 'sky';
      return CANVAS_NOTE_COLORS.some(color => color.id === tone) ? tone : 'sky';
    },
    onAddNote: async ({ sectionId, text, colorId }) => {
      const previous = context.instance;
      const next = await CanvasService.createNote({
        canvasId: previous.id,
        sectionId,
        input: { text, colorId },
        session: context.session
      });
      context.instance = next;
      updateCanvasMutationSummary(container, next);
      return next;
    },
    onOpenNote: openDetail,
    onUpdateNote: async ({ noteId, patch }) => {
      const next = await CanvasService.updateNote({
        canvasId: context.instance.id,
        noteId,
        patch,
        session: context.session
      });
      context.instance = next;
      updateCanvasMutationSummary(container, next);
      return next;
    },
    onDeleteNote: async ({ noteId }) => {
      const next = await CanvasService.deleteNote({
        canvasId: context.instance.id,
        noteId,
        session: context.session
      });
      context.instance = next;
      updateCanvasMutationSummary(container, next);
      return next;
    },
    onMoveNote: async ({ noteId, toSectionId, toIndex }) => {
      const next = await CanvasService.moveNote({
        canvasId: context.instance.id,
        noteId,
        toSectionId,
        toIndex,
        session: context.session
      });
      context.instance = next;
      updateCanvasMutationSummary(container, next);
      return next;
    },
    onInteractionStart: () => beginCanvasMutation(container),
    onInteractionEnd: () => endCanvasMutation(container),
    onMessage: (message, type) => showToast(message, type === 'error' ? { type: 'error' } : undefined)
  }) : null;

  container.querySelector('#canvas-history')?.addEventListener('click', () => {
    blockCanvasNavigation(1000);
    openHistory({ instance: context.instance, session, context, container });
  });
  container.querySelector('#canvas-share')?.addEventListener('click', () => {
    blockCanvasNavigation(1000);
    openShare(context.instance, session);
  });
  container.querySelector('#canvas-print')?.addEventListener('click', () => {
    showToast('Abriendo impresión. Selecciona “Guardar como PDF” en el navegador.');
    printCanvas('summary', context.instance.templateId);
  });
  container.querySelector('#canvas-settings')?.addEventListener('click', () => {
    blockCanvasNavigation(1000);
    openCanvasSettings({ instance: context.instance, session, context, container });
  });
  container.querySelector('#canvas-fullscreen')?.addEventListener('click', () => toggleFullscreen(container));
}

function newestNoteId(previous, next) {
  if (!next?.notes?.length) return '';
  const previousIds = new Set(previous?.notes?.map(note => note.id) || []);
  return next.notes.find(note => !previousIds.has(note.id))?.id || next.notes.at(-1)?.id || '';
}

function applyCanvasInstance(container, context, next, { focusNoteId = '' } = {}) {
  if (!next || container.dataset.activeCanvasId !== next.id) return;
  context.instance = next;
  workspaceController?.sync(next, { focusNoteId });
  updateCanvasMutationSummary(container, next);
}

function beginCanvasMutation(container) {
  canvasMutationActive = true;
  container.dataset.canvasMutating = 'true';
}

function endCanvasMutation(container) {
  canvasMutationActive = false;
  delete container.dataset.canvasMutating;
}

function navigateFromCanvas(hash) {
  canvasMutationActive = false;
  navigationBlockedUntil = 0;
  location.hash = hash;
}

function openNoteForm({ context, sectionId = '', container, onSaved }) {
  const instance = context.instance;
  const session = context.session;
  const template = instance.template;
  const selectedSection = template.sections.find(section => section.id === sectionId) || template.sections[0];
  const modal = openModal({
    title: 'Nueva nota',
    subtitle: `Agrega una idea al ${template.name}.`,
    size: 'sm',
    initialFocus: '#canvas-note-text',
    onClose: () => blockCanvasNavigation(900),
    body: `<form id="canvas-note-form" class="form-grid canvas-note-quick-form" novalidate>
      <div class="field field-full canvas-note-content-field"><label for="canvas-note-text">Contenido *</label><textarea class="input textarea" id="canvas-note-text" rows="6" maxlength="1200" required aria-describedby="canvas-note-text-help canvas-note-text-error" placeholder="Escribe una idea concreta..."></textarea><small class="field-help" id="canvas-note-text-help">Una idea por nota. Puedes ajustar la sección y el color en Opciones.</small><small class="field-error" id="canvas-note-text-error"></small></div>
      <details class="note-advanced-options field-full">
        <summary>${icon('more')} Opciones de nota <span>${escapeHtml(selectedSection?.emoji || '')} ${escapeHtml(selectedSection?.title || '')}</span></summary>
        <div class="note-advanced-body">
          <div class="field field-full"><label for="canvas-note-section">Sección</label><select class="select select-compact" id="canvas-note-section" required>${template.sections.map(section => `<option value="${escapeHtml(section.id)}" ${section.id === selectedSection?.id ? 'selected' : ''}>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('')}</select></div>
          ${colorField('canvas-note-color', 'sky', true)}
        </div>
      </details>
      <div class="canvas-note-submit-status field-full" id="canvas-note-submit-status" role="status" aria-live="polite"></div>
      <div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('plus')} Agregar nota</button></div>
    </form>`
  });
  const form = modal.root.querySelector('#canvas-note-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopPropagation();
    const textField = modal.root.querySelector('#canvas-note-text');
    const text = textField.value.trim();
    textField.setAttribute('aria-invalid', String(!text));
    if (!text) {
      modal.root.querySelector('#canvas-note-text-error').textContent = 'Escribe el contenido de la nota.';
      textField.focus();
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    const status = modal.root.querySelector('#canvas-note-submit-status');
    submit.disabled = true;
    status.textContent = 'Guardando nota...';
    beginCanvasMutation(container);
    blockCanvasNavigation(1600);
    try {
      const data = new FormData(form);
      const next = await CanvasService.createNote({
        canvasId: context.instance.id,
        sectionId: modal.root.querySelector('#canvas-note-section').value,
        input: { text, colorId: data.get('canvas-note-color') || 'sky' },
        session
      });
      onSaved?.(next);
      modal.close({ restoreFocus: false });
      showToast('Nota agregada correctamente.');
    } catch (error) {
      status.textContent = error.message || 'No se pudo guardar la nota.';
      showToast(error.message || 'No se pudo guardar la nota.', { type: 'error' });
      submit.disabled = false;
    } finally {
      endCanvasMutation(container);
      blockCanvasNavigation(900);
    }
  });
}

function openNoteDetail({ context, noteId, container, onSaved }) {
  const instance = context.instance;
  const session = context.session;
  const note = instance.notes.find(item => item.id === noteId);
  if (!note) return;
  const modal = openModal({
    title: 'Detalle de la nota',
    subtitle: 'Edita, comenta, vincula o convierte esta idea en trabajo accionable.',
    size: 'lg',
    initialFocus: '#note-detail-text',
    onClose: () => blockCanvasNavigation(900),
    body: `<div class="note-detail-layout"><form id="note-detail-form" class="form-grid" novalidate>
      <div class="field field-full"><label for="note-detail-text">Contenido *</label><textarea class="input textarea" id="note-detail-text" rows="6" maxlength="1200" required>${escapeHtml(note.text)}</textarea><small class="field-error" id="note-detail-error"></small></div>
      <div class="field"><label for="note-detail-section">Sección</label><select class="select" id="note-detail-section">${instance.template.sections.map(section => `<option value="${escapeHtml(section.id)}" ${section.id === note.sectionId ? 'selected' : ''}>${escapeHtml(section.emoji || '')} ${escapeHtml(section.title)}</option>`).join('')}</select></div>
      ${detailColorField(note)}
      <div class="note-meta field-full"><span>Creada por <strong>${escapeHtml(note.author?.name || 'Usuario')}</strong></span><span>${formatDate(note.createdAt)}</span>${note.sourceCanvasId ? `<span>${icon('link')} Resultado vinculado</span>` : ''}</div>
      <div class="modal-actions field-full note-actions"><button class="button button-danger" type="button" id="delete-note">${icon('trash')} Eliminar</button><button class="button button-secondary" type="button" id="link-note">${icon('link')} Vincular</button><button class="button button-secondary" type="button" id="convert-note">${icon('checkSquare')} Crear tarea</button><button class="button button-primary" type="submit">Guardar cambios</button></div>
    </form>
    <aside class="note-comments-panel"><h3>Comentarios</h3><div class="note-comment-list">${note.comments?.length ? note.comments.map(comment => `<article><span class="note-author">${escapeHtml(comment.author?.initials || '?')}</span><div><strong>${escapeHtml(comment.author?.name || 'Usuario')}</strong><p>${escapeHtml(comment.text)}</p><time>${relativeTime(comment.createdAt)}</time></div></article>`).join('') : '<p class="muted-copy">No hay comentarios todavía.</p>'}</div><form id="note-comment-form"><label class="sr-only" for="note-comment-text">Nuevo comentario</label><textarea class="input textarea" id="note-comment-text" rows="3" maxlength="800" placeholder="Escribe un comentario..."></textarea><button class="button button-secondary" type="submit">${icon('message')} Comentar</button></form></aside></div>`
  });

  const noteColorInput = modal.root.querySelector('#note-detail-color');
  const noteColorCode = modal.root.querySelector('#note-detail-color-code');
  noteColorInput?.addEventListener('input', event => {
    const value = normalizeHexColor(event.target.value);
    if (noteColorCode) noteColorCode.textContent = value;
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
    beginCanvasMutation(container);
    blockCanvasNavigation(1600);
    try {
      const next = await CanvasService.updateNote({
        canvasId: context.instance.id,
        noteId,
        patch: {
          text,
          sectionId: modal.root.querySelector('#note-detail-section').value,
          colorId: note.colorId || 'sky',
          colorHex: normalizeHexColor(modal.root.querySelector('#note-detail-color')?.value, getCanvasNoteColor(note.colorId).background)
        },
        session
      });
      onSaved?.(next);
      modal.close({ restoreFocus: false });
      showToast('Nota actualizada.');
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar la nota.', { type: 'error' });
    } finally {
      endCanvasMutation(container);
      blockCanvasNavigation(900);
    }
  });

  modal.root.querySelector('#note-comment-form').addEventListener('submit', async event => {
    event.preventDefault();
    const field = modal.root.querySelector('#note-comment-text');
    beginCanvasMutation(container);
    blockCanvasNavigation(1600);
    try {
      const next = await CanvasService.addComment({ canvasId: context.instance.id, noteId, text: field.value, session });
      onSaved?.(next);
      modal.close({ restoreFocus: false });
      showToast('Comentario agregado.');
    } catch (error) {
      showToast(error.message || 'No se pudo agregar el comentario.', { type: 'error' });
    } finally {
      endCanvasMutation(container);
      blockCanvasNavigation(900);
    }
  });

  modal.root.querySelector('#delete-note').addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Eliminar nota', message: 'La nota y sus comentarios se eliminarán del canvas.', confirmLabel: 'Eliminar', danger: true });
    if (!confirmed) return;
    beginCanvasMutation(container);
    blockCanvasNavigation(1600);
    try {
      const next = await CanvasService.deleteNote({ canvasId: context.instance.id, noteId, session });
      onSaved?.(next);
      closeModal({ restoreFocus: false });
      showToast('Nota eliminada.');
    } catch (error) {
      showToast(error.message || 'No se pudo eliminar la nota.', { type: 'error' });
    } finally {
      endCanvasMutation(container);
      blockCanvasNavigation(900);
    }
  });

  modal.root.querySelector('#convert-note').addEventListener('click', () => {
    modal.close({ restoreFocus: false });
    openConvertToTask({ instance: context.instance, note, session, onSaved });
  });
  modal.root.querySelector('#link-note').addEventListener('click', () => {
    modal.close({ restoreFocus: false });
    openLinkNote({ instance: context.instance, note, session, onSaved });
  });
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
    onClose: () => blockCanvasNavigation(900),
    body: `<div class="history-version-layout"><section><div class="section-heading compact"><div><h3>Actividad</h3><p>Últimos ${Math.min(instance.history.length, 150)} eventos.</p></div></div><div class="canvas-history-list">${instance.history.length ? instance.history.map(entry => `<article><span class="history-icon">${icon(historyIcon(entry.type))}</span><div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.actor?.name || 'Sistema')} · ${relativeTime(entry.createdAt)}</small></div></article>`).join('') : '<p class="muted-copy">Todavía no hay actividad registrada.</p>'}</div></section><section><div class="section-heading compact"><div><h3>Versiones</h3><p>Se conservan hasta 20 snapshots locales.</p></div>${canManageCanvas(session) ? `<button class="button button-secondary" type="button" id="create-version">${icon('plus')} Punto de control</button>` : ''}</div><div class="canvas-version-feedback" id="canvas-version-feedback" role="status" aria-live="polite"></div><div class="canvas-version-list">${versions.length ? versions.map(version => `<article><div><strong>Versión ${version.version}</strong><span>${escapeHtml(version.label || 'Punto de control')}</span><small>${escapeHtml(version.actor?.name || 'Sistema')} · ${formatDateTime(version.createdAt)} · ${version.notes?.length || 0} notas</small></div>${isSuperadmin ? `<button class="button button-secondary" type="button" data-restore-version="${escapeHtml(version.id)}">${icon('restore')} Restaurar</button>` : ''}</article>`).join('') : '<p class="muted-copy">No existen versiones guardadas.</p>'}</div></section></div>`
  });
  modal.root.querySelector('#create-version')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const feedback = modal.root.querySelector('#canvas-version-feedback');
    button.disabled = true;
    feedback.textContent = 'Creando punto de control...';
    try {
      await CanvasService.createVersion({ canvasId: instance.id, label: `Punto de control · ${formatDateTime(new Date().toISOString())}`, session });
      const next = await CanvasService.getInstance({ canvasId: instance.id, session });
      applyCanvasInstance(container, context, next);
      modal.close({ restoreFocus: false });
      showToast('Punto de control creado.');
      queueMicrotask(() => openHistory({ instance: context.instance, session, context, container }));
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo crear el punto de control.';
      showToast(error.message, { type: 'error' });
      button.disabled = false;
    }
  });
  modal.root.querySelectorAll('[data-restore-version]').forEach(button => button.addEventListener('click', async event => {
    const confirmed = globalThis.confirm('Se creará una versión nueva basada en este punto de control. La versión actual quedará respaldada. ¿Continuar?');
    if (!confirmed) return;
    const feedback = modal.root.querySelector('#canvas-version-feedback');
    event.currentTarget.disabled = true;
    feedback.textContent = 'Restaurando versión...';
    try {
      beginCanvasMutation(container);
      const next = await CanvasService.restoreVersion({ canvasId: instance.id, snapshotId: event.currentTarget.dataset.restoreVersion, session });
      applyCanvasInstance(container, context, next);
      modal.close({ restoreFocus: false });
      showToast('Versión restaurada sin salir del canvas.');
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo restaurar la versión.';
      showToast(error.message, { type: 'error' });
      event.currentTarget.disabled = false;
    } finally {
      endCanvasMutation(container);
    }
  }));
}

async function openShare(instance, session) {
  const modal = openModal({
    title: 'Compartir canvas',
    subtitle: 'El enlace y el QR quedan listos al abrir esta ventana.',
    size: 'md',
    onClose: () => blockCanvasNavigation(500),
    body: `<div class="share-canvas-box share-canvas-simple">
      <div id="share-result" class="share-result-loading"><span class="spinner"></span> Preparando enlace...</div>
      <details class="share-secondary-options">
        <summary>${icon('more')} Cambiar vigencia o crear otro enlace</summary>
        <form id="share-create-form" class="form-grid share-options-form">
          <div class="field"><label for="share-expiry-preset">Vigencia</label><select class="select" id="share-expiry-preset"><option value="1">1 día</option><option value="7" selected>7 días</option><option value="15">15 días</option><option value="30">30 días</option><option value="custom">Fecha personalizada</option></select></div>
          <div class="field"><label for="share-custom-expiry">Fecha y hora</label><input class="input" id="share-custom-expiry" type="datetime-local" disabled></div>
          <div class="field field-full"><label for="share-label">Etiqueta opcional</label><input class="input" id="share-label" maxlength="80" placeholder="Ej.: Revisión del cliente"></div>
          <div class="modal-actions field-full"><button class="button button-secondary" type="submit">${icon('plus')} Crear otro enlace</button></div>
        </form>
      </details>
      <details class="share-secondary-options">
        <summary>${icon('settings')} Administrar enlaces</summary>
        <div id="share-token-list"><span class="spinner"></span> Cargando...</div>
        <p class="field-help">Revocar sirve para desactivar inmediatamente un enlace enviado por error o cuando la revisión ya terminó.</p>
      </details>
      <p class="field-help">Modo demo local: el QR y el enlace solo podrán abrir el canvas en este mismo navegador hasta conectar Firebase.</p>
    </div>`
  });

  const preset = modal.root.querySelector('#share-expiry-preset');
  const custom = modal.root.querySelector('#share-custom-expiry');
  custom.min = toLocalDateTime(new Date(Date.now() + 5 * 60000));
  preset.addEventListener('change', () => {
    custom.disabled = preset.value !== 'custom';
    if (!custom.disabled && !custom.value) custom.value = toLocalDateTime(new Date(Date.now() + 7 * 86400000));
  });

  const refreshTokens = async (selectedToken, ensureActive = true) => {
    let tokens = await CanvasService.listShareTokens({ canvasId: instance.id, session });
    const active = tokens.filter(token => token.active && new Date(token.expiresAt).getTime() > Date.now());
    let token = selectedToken || active[0] || null;
    if (!token && ensureActive) {
      token = await CanvasService.createShareToken({
        canvasId: instance.id,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        label: 'Enlace principal',
        session
      });
      tokens = await CanvasService.listShareTokens({ canvasId: instance.id, session });
    }
    renderShareTokens(modal.root, instance, tokens, session, token, refreshTokens);
  };

  try {
    await refreshTokens();
  } catch (error) {
    modal.root.querySelector('#share-result').innerHTML = `<div class="inline-feedback error">${escapeHtml(error.message || 'No se pudo preparar el enlace.')}</div>`;
  }

  modal.root.querySelector('#share-create-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      let expiresAt = '';
      if (preset.value === 'custom') {
        if (!custom.value) throw new Error('Selecciona una fecha y hora de vencimiento.');
        expiresAt = new Date(custom.value).toISOString();
      } else {
        expiresAt = new Date(Date.now() + Number(preset.value) * 86400000).toISOString();
      }
      const token = await CanvasService.createShareToken({
        canvasId: instance.id,
        expiresAt,
        label: modal.root.querySelector('#share-label').value,
        session
      });
      await refreshTokens(token);
      modal.root.querySelector('.share-secondary-options')?.removeAttribute('open');
      showToast('Nuevo enlace listo para compartir.');
    } catch (error) {
      showToast(error.message, { type: 'error' });
    } finally {
      submit.disabled = false;
    }
  });
}

function renderShareTokens(root, instance, tokens, session, selectedToken, refreshTokens) {
  const active = tokens.filter(token => token.active && new Date(token.expiresAt).getTime() > Date.now());
  const token = selectedToken || active[0] || null;
  root.querySelector('#share-result').innerHTML = token ? shareResultMarkup(token) : '<p class="muted-copy">No hay un enlace activo.</p>';
  root.querySelector('#share-token-list').innerHTML = tokens.length ? tokens.map(item => {
    const link = shareLink(item.code);
    const status = !item.active ? 'Revocado' : new Date(item.expiresAt).getTime() <= Date.now() ? 'Vencido' : 'Activo';
    return `<article class="share-token-item share-token-item-compact"><div><strong>${escapeHtml(item.label || item.code)}</strong><span>${status} · vence ${formatDateTime(item.expiresAt)}</span></div><div class="share-token-actions"><button class="icon-button" type="button" data-copy-token="${escapeHtml(link)}" aria-label="Copiar enlace" title="Copiar enlace">${icon('copy')}</button>${item.active && new Date(item.expiresAt).getTime() > Date.now() ? `<button class="icon-button danger-soft" type="button" data-revoke-token="${escapeHtml(item.id)}" aria-label="Revocar enlace" title="Desactivar este enlace">${icon('lock')}</button>` : ''}</div></article>`;
  }).join('') : '<p class="muted-copy">Todavía no se generaron enlaces.</p>';
  bindShareTokenActions(root, instance, tokens, session, refreshTokens);
}

function shareResultMarkup(token) {
  const link = shareLink(token.code);
  const qr = qrImageUrl(link);
  return `<section class="share-quick-card">
    <button class="share-quick-qr" type="button" data-expand-qr="${escapeHtml(token.id)}" aria-label="Ampliar código QR"><img src="${escapeHtml(qr)}" alt="Código QR del canvas" width="190" height="190"><span>${icon('maximize')} Ampliar</span></button>
    <div class="share-quick-content"><span class="share-ready-badge">${icon('check')} Listo para compartir</span><h3>Enlace de consulta</h3><p>Vence el ${formatDateTime(token.expiresAt)}.</p><div class="copy-field share-copy-field"><input class="input" id="canvas-share-link" readonly value="${escapeHtml(link)}"><button class="button button-primary" id="copy-canvas-link" type="button">${icon('copy')} Copiar enlace</button></div><div class="copy-feedback" id="copy-feedback" role="status" aria-live="polite"></div><button class="button button-ghost share-native-button" id="native-share-link" type="button">${icon('link')} Compartir con otra aplicación</button></div>
  </section>`;
}

function bindShareTokenActions(root, instance, tokens, session, refreshTokens) {
  const resultLink = root.querySelector('#canvas-share-link')?.value || '';
  root.querySelector('#copy-canvas-link')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const feedback = root.querySelector('#copy-feedback');
    button.disabled = true;
    button.innerHTML = `${icon('copy')} Copiando...`;
    const copied = await copyText(resultLink, root.querySelector('#canvas-share-link'));
    button.disabled = false;
    button.innerHTML = copied ? `${icon('check')} Enlace copiado` : `${icon('copy')} Enlace seleccionado`;
    button.classList.toggle('copy-success', copied);
    if (feedback) {
      feedback.textContent = copied ? '✓ Enlace copiado.' : 'Enlace seleccionado. Presiona Ctrl+C o Cmd+C.';
      feedback.classList.toggle('is-manual', !copied);
    }
    setTimeout(() => {
      if (!button.isConnected) return;
      button.innerHTML = `${icon('copy')} Copiar enlace`;
      button.classList.remove('copy-success');
    }, 3200);
  });

  const nativeShare = root.querySelector('#native-share-link');
  if (!navigator.share) nativeShare?.remove();
  else nativeShare?.addEventListener('click', async () => {
    try {
      await navigator.share({ title: instance.title, text: 'Consulta este canvas de WonkUp.', url: resultLink });
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('No se pudo abrir el menú para compartir.', { type: 'error' });
    }
  });

  root.querySelectorAll('[data-expand-qr]').forEach(button => button.addEventListener('click', () => {
    const token = tokens.find(item => item.id === button.dataset.expandQr);
    if (token) openQrZoom(root, token);
  }));

  root.querySelectorAll('[data-copy-token]').forEach(button => button.addEventListener('click', async () => {
    const copied = await copyText(button.dataset.copyToken);
    button.innerHTML = copied ? icon('check') : icon('copy');
    button.classList.toggle('copy-success', copied);
    setTimeout(() => {
      if (!button.isConnected) return;
      button.innerHTML = icon('copy');
      button.classList.remove('copy-success');
    }, 2200);
  }));

  root.querySelectorAll('[data-revoke-token]').forEach(button => button.addEventListener('click', async () => {
    if (!globalThis.confirm('El enlace dejará de abrir el canvas inmediatamente. ¿Desactivarlo?')) return;
    try {
      await CanvasService.revokeShareToken({ canvasId: instance.id, tokenId: button.dataset.revokeToken, session });
      await refreshTokens(null, false);
      showToast('Enlace desactivado.');
    } catch (error) {
      showToast(error.message, { type: 'error' });
    }
  }));
}

function openExport(instance) {
  const modal = openModal({
    title: 'Exportar canvas a PDF',
    subtitle: 'Elige entre una síntesis de una hoja o un documento completo.',
    size: 'sm',
    onClose: () => blockCanvasNavigation(900),
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
    onClose: () => blockCanvasNavigation(900),
    body: `<form id="canvas-settings-form" class="form-grid"><div class="field field-full"><label for="canvas-settings-title">Título</label><input class="input" id="canvas-settings-title" maxlength="140" value="${escapeHtml(instance.title)}" required></div><div class="modal-actions field-full"><button class="button button-danger" type="button" id="archive-canvas">${icon('archive')} Archivar</button><button class="button button-primary" type="submit">Guardar</button></div></form><div class="canvas-settings-extra"><span>Exportación avanzada</span><button class="button button-secondary" type="button" id="canvas-print-detail">${icon('file')} PDF detallado multipágina</button></div>`
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
  modal.root.querySelector('#canvas-print-detail')?.addEventListener('click', () => {
    modal.close({ restoreFocus: false });
    showToast('Abriendo impresión detallada. Selecciona “Guardar como PDF”.');
    printCanvas('detail', instance.templateId);
  });
  modal.root.querySelector('#archive-canvas').addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Archivar canvas', message: 'El canvas se ocultará del Toolkit, pero conservará notas e historial.', confirmLabel: 'Archivar', danger: true });
    if (!confirmed) return;
    try {
      await CanvasService.archiveInstance({ canvasId: instance.id, session });
      closeModal();
      showToast('Canvas archivado.');
      navigateFromCanvas(`#/w/${instance.workspaceId}/p/${instance.projectId}/innovation`);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  });
}

function normalizeCanvasBrand(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#50a8f3';
}

function detailColorField(note) {
  const preset = getCanvasNoteColor(note.colorId);
  const selected = normalizeHexColor(note.colorHex || preset.background, preset.background);
  return `<div class="field field-full note-detail-color-field"><label for="note-detail-color">Color de la nota</label><div class="color-input-row note-detail-color-input"><input class="color-input" type="color" id="note-detail-color" name="note-detail-color" value="${escapeHtml(selected)}" aria-describedby="note-detail-color-code"><code id="note-detail-color-code">${escapeHtml(selected)}</code></div><small>Selecciona cualquier color. El texto se ajustará automáticamente para conservar legibilidad.</small></div>`;
}

function colorField(name, selected, compact = false) {
  return `<fieldset class="field field-full color-field ${compact ? 'color-field-compact' : ''}"><legend>Color</legend><div class="note-color-options">${CANVAS_NOTE_COLORS.map(color => `<label title="${escapeHtml(color.name)}" style="--swatch:${color.background};--swatch-border:${color.border}"><input type="radio" name="${name}" value="${color.id}" ${color.id === selected ? 'checked' : ''}><span></span><em>${escapeHtml(color.name)}</em></label>`).join('')}</div></fieldset>`;
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

function updateCanvasMutationSummary(container, instance) {
  const completion = calculateCanvasProgress(instance);
  const completionValue = container.querySelector('.canvas-completion strong');
  const noteCount = container.querySelector('[data-canvas-note-count]');
  const sectionCount = container.querySelector('[data-canvas-section-count]');
  const version = container.querySelector('[data-canvas-version]');
  const updated = container.querySelector('[data-canvas-updated]');
  if (completionValue) completionValue.textContent = `${completion}%`;
  if (noteCount) noteCount.textContent = `${instance.notes.length} notas`;
  if (sectionCount) sectionCount.textContent = `${new Set(instance.notes.map(note => note.sectionId)).size}/${instance.template.sections.length} secciones con contenido`;
  if (version) version.textContent = `Versión ${instance.version}`;
  if (updated) updated.textContent = `Última actualización: ${formatDate(instance.updatedAt)}`;
}

function ensureEmptyCanvasStack(stack, canEdit) {
  if (!stack || stack.querySelector('.canvas-note')) return;
  if (!stack.querySelector('.canvas-empty-section')) {
    stack.insertAdjacentHTML('beforeend', `<div class="canvas-empty-section">${canEdit ? 'Pulsa + para crear una nota aquí.' : 'Sin notas.'}</div>`);
  }
}

async function reloadCanvas(container, context) {
  const requestId = ++refreshSequence;
  const canvasId = context.instance.id;
  try {
    const next = await CanvasService.getInstance({ canvasId, session: context.session });
    if (requestId !== refreshSequence || container.dataset.activeCanvasId !== canvasId) return;
    applyCanvasInstance(container, context, next);
  } catch (error) { showToast(error.message, { type: 'error' }); }
}

async function toggleFullscreen(container) {
  const host = container.closest('#main-view') || container;
  const next = !document.body.classList.contains(IMMERSIVE_CLASS);
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { /* noop */ }
  }
  document.body.classList.toggle(IMMERSIVE_CLASS, next);
  host.classList.toggle('canvas-fullscreen-host', next);
  updateFullscreenButton(container);
  updateTimerVisibility(container);
  if (next) requestAnimationFrame(() => container.querySelector('.canvas-workspace')?.focus?.({ preventScroll: true }));
}

function updateFullscreenButton(container) {
  const button = container.querySelector('#canvas-fullscreen');
  if (!button) return;
  const active = document.body.classList.contains(IMMERSIVE_CLASS);
  button.innerHTML = active ? `${icon('minimize')} Salir de pantalla completa` : `${icon('maximize')} Pantalla completa`;
  button.setAttribute('aria-pressed', String(active));
}

function printCanvas(mode, templateId) {
  const restoreImmersive = document.body.classList.contains(IMMERSIVE_CLASS);
  document.body.classList.remove(IMMERSIVE_CLASS);
  document.body.classList.add('canvas-printing', mode === 'summary' ? 'canvas-print-summary' : 'canvas-print-detail');
  document.body.dataset.printTemplate = templateId;
  const cleanup = () => {
    document.body.classList.remove('canvas-printing', 'canvas-print-summary', 'canvas-print-detail');
    if (restoreImmersive) document.body.classList.add(IMMERSIVE_CLASS);
    delete document.body.dataset.printTemplate;
    updateFullscreenButton(document.querySelector('[data-canvas-id]')?.closest('.route-host') || document);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  requestAnimationFrame(() => window.print());
  setTimeout(cleanup, 5000);
}

async function copyText(value, visibleField = null) {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText && globalThis.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* continue with selection fallback */ }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const host = document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : document.body;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  Object.assign(field.style, {
    position: 'fixed',
    top: '8px',
    left: '8px',
    width: '2px',
    height: '2px',
    padding: '0',
    border: '0',
    opacity: '0.01',
    pointerEvents: 'none',
    fontSize: '16px',
    zIndex: '2147483647'
  });
  host.appendChild(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, text.length);

  let copied = false;
  try { copied = Boolean(document.execCommand('copy')); } catch { copied = false; }
  field.remove();

  if (copied) {
    activeElement?.focus?.({ preventScroll: true });
    return true;
  }

  if (visibleField) {
    visibleField.focus({ preventScroll: true });
    visibleField.select?.();
    visibleField.setSelectionRange?.(0, visibleField.value?.length || text.length);
  } else {
    activeElement?.focus?.({ preventScroll: true });
  }
  return false;
}

function openQrZoom(root, token) {
  root.querySelector('.qr-zoom-overlay')?.remove();
  const link = shareLink(token.code);
  const overlay = document.createElement('div');
  overlay.className = 'qr-zoom-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Código QR ampliado');
  overlay.innerHTML = `<div class="qr-zoom-card"><button class="icon-button qr-zoom-close" type="button" aria-label="Cerrar QR ampliado">${icon('x')}</button><img src="${escapeHtml(qrImageUrl(link))}" alt="Código QR ampliado" width="420" height="420"><span>Código de acceso</span><strong>${escapeHtml(token.code)}</strong><label class="sr-only" for="qr-expanded-link">Enlace compartido</label><input class="input qr-zoom-link" id="qr-expanded-link" data-qr-link-field readonly value="${escapeHtml(link)}"><div class="qr-zoom-actions"><button class="button button-secondary" type="button" data-copy-zoom>${icon('copy')} Copiar enlace</button><a class="button button-primary" href="${escapeHtml(qrImageUrl(link))}" target="_blank" rel="noopener">${icon('download')} Abrir imagen</a></div><div class="copy-feedback" data-qr-feedback role="status" aria-live="polite"></div></div>`;
  root.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('.qr-zoom-close').addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  overlay.querySelector('[data-copy-zoom]').addEventListener('click', async event => {
    const button = event.currentTarget;
    const feedback = overlay.querySelector('[data-qr-feedback]');
    const visibleField = overlay.querySelector('[data-qr-link-field]');
    button.disabled = true;
    button.innerHTML = `${icon('copy')} Copiando...`;
    const copied = await copyText(link, visibleField);
    button.disabled = false;
    button.innerHTML = copied ? `${icon('check')} Enlace copiado` : `${icon('copy')} Enlace seleccionado`;
    button.classList.toggle('copy-success', copied);
    feedback.textContent = copied ? '✓ Enlace copiado al portapapeles.' : 'El enlace quedó seleccionado. Presiona Ctrl+C o Cmd+C.';
    feedback.classList.toggle('is-success', copied);
    feedback.classList.toggle('is-manual', !copied);
    showToast(copied ? 'Enlace copiado al portapapeles.' : 'Enlace seleccionado para copia manual.', { duration: 6500 });
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.innerHTML = `${icon('copy')} Copiar enlace`;
      button.classList.remove('copy-success');
    }, 4200);
  });
  overlay.querySelector('.qr-zoom-close').focus();
}

function ensureTimerAudio() {
  try {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!timerAudioContext) timerAudioContext = new AudioContextClass();
    if (timerAudioContext.state === 'suspended') timerAudioContext.resume?.();
    return timerAudioContext;
  } catch {
    return null;
  }
}

function playTimerAlarm() {
  const audio = ensureTimerAudio();
  if (!audio) return;
  const start = audio.currentTime + 0.03;
  [0, 0.32, 0.64].forEach((offset, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = index === 2 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(index === 2 ? 1046 : 880, start + offset);
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.23);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.25);
  });
}

function readTimerState(canvasId) {
  try {
    const all = JSON.parse(localStorage.getItem(TIMER_KEY) || '{}');
    const current = all[canvasId] || {};
    const duration = Math.max(60, Number(current.duration || 300));
    let remaining = Math.max(0, Number(current.remaining ?? duration));
    let running = Boolean(current.running);
    let endsAt = Number(current.endsAt || 0);
    if (running && endsAt) {
      remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (!remaining) running = false;
    }
    return { duration, remaining, running, endsAt: running ? endsAt : 0 };
  } catch {
    return { duration: 300, remaining: 300, running: false, endsAt: 0 };
  }
}

function saveTimerState(canvasId, state) {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(TIMER_KEY) || '{}'); } catch { all = {}; }
  all[canvasId] = state;
  localStorage.setItem(TIMER_KEY, JSON.stringify(all));
}

function timerMarkup(canvasId) {
  const state = readTimerState(canvasId);
  return `<div class="canvas-team-timer fullscreen-only" id="canvas-team-timer" aria-label="Temporizador de ideación"><span class="timer-caption">${icon('clock')} TIMER</span><strong id="canvas-timer-display">${formatTimer(state.remaining)}</strong><select id="canvas-timer-preset" aria-label="Duración del temporizador"><option value="300" ${state.duration === 300 ? 'selected' : ''}>5 min</option><option value="600" ${state.duration === 600 ? 'selected' : ''}>10 min</option><option value="900" ${state.duration === 900 ? 'selected' : ''}>15 min</option><option value="1200" ${state.duration === 1200 ? 'selected' : ''}>20 min</option><option value="1800" ${state.duration === 1800 ? 'selected' : ''}>30 min</option></select><button class="icon-button" id="canvas-timer-toggle" type="button" aria-label="${state.running ? 'Pausar' : 'Iniciar'} temporizador">${icon(state.running ? 'pause' : 'play')}</button><button class="icon-button" id="canvas-timer-reset" type="button" aria-label="Reiniciar temporizador">${icon('refresh')}</button></div>`;
}

function formatTimer(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function stopTimerTicker() {
  if (timerTicker) clearInterval(timerTicker);
  timerTicker = null;
}

function bindCanvasTimer(container, canvasId) {
  stopTimerTicker();
  const preset = container.querySelector('#canvas-timer-preset');
  const toggle = container.querySelector('#canvas-timer-toggle');
  const reset = container.querySelector('#canvas-timer-reset');
  const render = () => {
    const state = readTimerState(canvasId);
    const display = container.querySelector('#canvas-timer-display');
    if (display) display.textContent = formatTimer(state.remaining);
    container.querySelector('#canvas-team-timer')?.classList.toggle('is-finished', !state.running && state.remaining === 0);
    if (toggle) {
      toggle.innerHTML = icon(state.running ? 'pause' : 'play');
      toggle.setAttribute('aria-label', `${state.running ? 'Pausar' : 'Iniciar'} temporizador`);
    }
    if (!state.running && state.remaining === 0) {
      const finishedKey = `${TIMER_KEY}.finished.${canvasId}`;
      if (sessionStorage.getItem(finishedKey) !== String(state.endsAt || 'done')) {
        sessionStorage.setItem(finishedKey, String(state.endsAt || 'done'));
        playTimerAlarm();
        showToast('⏱ Tiempo terminado. Es momento de cerrar la ideación.', { duration: 9000 });
        navigator.vibrate?.([180, 100, 180, 100, 240]);
      }
    }
  };
  preset?.addEventListener('change', () => {
    const duration = Number(preset.value || 300);
    saveTimerState(canvasId, { duration, remaining: duration, running: false, endsAt: 0 });
    render();
  });
  toggle?.addEventListener('click', () => {
    ensureTimerAudio();
    const state = readTimerState(canvasId);
    if (state.running) {
      saveTimerState(canvasId, { ...state, remaining: Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000)), running: false, endsAt: 0 });
    } else {
      const remaining = state.remaining > 0 ? state.remaining : state.duration;
      saveTimerState(canvasId, { ...state, remaining, running: true, endsAt: Date.now() + remaining * 1000 });
      sessionStorage.removeItem(`${TIMER_KEY}.finished.${canvasId}`);
    }
    render();
  });
  reset?.addEventListener('click', () => {
    const state = readTimerState(canvasId);
    saveTimerState(canvasId, { duration: state.duration, remaining: state.duration, running: false, endsAt: 0 });
    sessionStorage.removeItem(`${TIMER_KEY}.finished.${canvasId}`);
    render();
  });
  timerTicker = setInterval(render, 500);
  render();
  updateTimerVisibility(container);
}

function updateTimerVisibility(container) {
  container.querySelector('#canvas-team-timer')?.classList.toggle('is-visible', document.body.classList.contains(IMMERSIVE_CLASS));
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
  workspaceController?.destroy();
  workspaceController = null;
  refreshSequence += 1;
  cleanupEditor?.();
  cleanupEditor = null;
  stopTimerTicker();
  document.querySelector('#main-view')?.classList.remove('canvas-fullscreen-host');
  canvasMutationActive = false;
  navigationBlockedUntil = 0;
  document.body.classList.remove('canvas-focus-mode', IMMERSIVE_CLASS, 'canvas-printing', 'canvas-print-summary', 'canvas-print-detail');
}
