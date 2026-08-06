import { KanbanService } from '../services/kanban-service.js?v=12.0.1';
import { ProjectService } from '../services/project-service.js?v=12.0.1';
import { canCommentKanban, canConfigureKanban, canDeleteKanbanCard, canEditKanban } from '../utils/permissions.js?v=12.0.1';
import { KANBAN_TONES, kanbanTemplates } from '../../data/kanban-templates.js?v=12.0.1';
import { icon } from '../utils/icons.js?v=12.0.1';
import { escapeHtml, formatDate } from '../utils/format.js?v=12.0.1';
import { openModal, closeModal, confirmModal } from '../components/modal.js?v=12.0.1';
import { showToast } from '../components/toast.js?v=12.0.1';

let activeContext = null;
let unsubscribeEvents = null;
let unsubscribeRealtime = null;
let realtimeRefreshTimer = null;
let kanbanGeneration = 0;

const PRIORITIES = {
  high: { label: 'Alta', className: 'badge-red' },
  medium: { label: 'Media', className: 'badge-gold' },
  low: { label: 'Baja', className: 'badge-green' }
};

const VISIBILITY_LABELS = {
  internal: 'Interna',
  client: 'Visible al cliente',
  restricted: 'Restringida'
};

export function renderKanban(container, workspaceId, projectId = null, embedded = false, session = null) {
  const generation = ++kanbanGeneration;
  teardownRealtime();
  container.innerHTML = `<section class="${embedded ? '' : 'page'}" style="${embedded ? 'margin-top:18px' : ''}"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando Kanban...</p></div></section>`;
  initializeKanban({ container, workspaceId, projectId, embedded, session, generation });
}

async function initializeKanban({ container, workspaceId, projectId, embedded, session, generation }) {
  try {
    const projects = await ProjectService.listProjects({ workspaceId, session, includeArchived: false });
    if (generation !== kanbanGeneration || !container.isConnected) return;
    const selectedProject = projectId
      ? projects.find(project => project.id === projectId) || await ProjectService.getProject({ projectId, session })
      : projects[0];

    if (!selectedProject) {
      container.innerHTML = `<section class="${embedded ? '' : 'page'}"><div class="empty-state"><div class="empty-state-icon">${icon('kanban')}</div><h2>No hay proyectos disponibles</h2><p>Crea o selecciona un proyecto para inicializar su tablero Kanban.</p></div></section>`;
      return;
    }

    const [board, members, workspaceUsers] = await Promise.all([
      KanbanService.getBoard({ projectId: selectedProject.id, workspaceId: selectedProject.workspaceId, session }),
      ProjectService.listMembers({ projectId: selectedProject.id, session }).catch(() => []),
      ProjectService.listUsers({ workspaceId: selectedProject.workspaceId, session }).catch(() => [])
    ]);
    if (generation !== kanbanGeneration || !container.isConnected) return;
    const peopleMap = new Map();
    workspaceUsers.forEach(user => peopleMap.set(user.id, user));
    members.forEach(member => {
      const user = member.user || workspaceUsers.find(item => item.id === member.userId);
      if (user) peopleMap.set(user.id, user);
    });

    activeContext = {
      container,
      workspaceId,
      projectId: selectedProject.id,
      project: selectedProject,
      projects,
      members,
      people: [...peopleMap.values()],
      board,
      embedded,
      session,
      filters: { search: '', assigneeId: '', priority: '', label: '' },
      source: KanbanService.dataSource({ session }),
      editable: canEditKanban(session, selectedProject.id, selectedProject.workspaceId) && selectedProject.status !== 'archived',
      commentable: canCommentKanban(session, selectedProject.id, selectedProject.workspaceId) && selectedProject.status !== 'archived',
      configurable: canConfigureKanban(session, selectedProject.id, selectedProject.workspaceId) && selectedProject.status !== 'archived',
      busy: false,
      viewMode: matchMedia('(max-width: 760px)').matches ? 'list' : (localStorage.getItem('wonkup.kanban.view') || 'board')
    };

    renderBoard();
    if (sessionStorage.getItem('wonkup.intent.newTask') === '1' && activeContext.editable) {
      sessionStorage.removeItem('wonkup.intent.newTask');
      setTimeout(() => openCardEditor(), 0);
    }
    attachRealtime(generation);
  } catch (error) {
    if (generation !== kanbanGeneration || !container.isConnected) return;
    container.innerHTML = `<section class="${embedded ? '' : 'page'}"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar el Kanban</h2><p>${escapeHtml(error.message || 'Ocurrió un error inesperado.')}</p></div></section>`;
  }
}

function teardownRealtime() {
  unsubscribeEvents?.();
  unsubscribeRealtime?.();
  unsubscribeEvents = null;
  unsubscribeRealtime = null;
  clearTimeout(realtimeRefreshTimer);
}

async function attachRealtime(generation) {
  if (!activeContext || generation !== kanbanGeneration || !activeContext.container?.isConnected) return;
  unsubscribeEvents = KanbanService.subscribe(event => {
    if (!activeContext || activeContext.busy) return;
    if (event?.projectId && event.projectId !== activeContext.projectId) return;
    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = setTimeout(() => refreshBoard({ silent: true }), 100);
  });
  const realtime = await KanbanService.startRealtime({
    projectId: activeContext.projectId,
    workspaceId: activeContext.project.workspaceId,
    session: activeContext.session
  }).catch(() => () => {});
  if (generation !== kanbanGeneration || !activeContext?.container?.isConnected) { realtime?.(); return; }
  unsubscribeRealtime = realtime;
}


export function cleanupKanbanView() {
  kanbanGeneration += 1;
  teardownRealtime();
  activeContext = null;
}

function filteredCards() {
  const { board, filters } = activeContext;
  const query = filters.search.trim().toLocaleLowerCase('es');
  return board.cards.filter(card => {
    const haystack = [card.title, card.description, ...(card.labels || []).map(label => label.name)]
      .join(' ')
      .toLocaleLowerCase('es');
    if (query && !haystack.includes(query)) return false;
    if (filters.assigneeId && card.assigneeId !== filters.assigneeId) return false;
    if (filters.priority && card.priority !== filters.priority) return false;
    if (filters.label && !(card.labels || []).some(label => label.name === filters.label)) return false;
    return true;
  });
}

function allLabels() {
  const labels = new Set();
  activeContext.board.cards.forEach(card => (card.labels || []).forEach(label => labels.add(label.name)));
  return [...labels].sort((a, b) => a.localeCompare(b, 'es'));
}

function renderBoard() {
  const context = activeContext;
  if (!context) return;
  const cards = filteredCards();
  const visibleIds = new Set(cards.map(card => card.id));
  const totalCards = context.board.cards.length;
  const doneColumnIds = new Set(context.board.columns.filter(column => column.isDone).map(column => column.id));
  const doneCards = context.board.cards.filter(card => doneColumnIds.has(card.columnId)).length;
  const overdueCards = context.board.cards.filter(card => isOverdue(card) && !doneColumnIds.has(card.columnId)).length;
  const estimatedHours = context.board.cards.reduce((sum, card) => sum + Number(card.estimatedHours || 0), 0);
  const actualHours = context.board.cards.reduce((sum, card) => sum + Number(card.actualHours || 0), 0);
  const sectionClass = context.embedded ? '' : 'page';
  const projectSelector = context.projects.length > 1
    ? `<label class="kanban-project-selector"><span>Proyecto</span><select class="select" id="kanban-project-select">${context.projects.map(project => `<option value="${escapeHtml(project.id)}" ${project.id === context.projectId ? 'selected' : ''}>${escapeHtml(project.name)}</option>`).join('')}</select></label>`
    : `<div class="kanban-current-project"><span>Proyecto</span><strong>${escapeHtml(context.project.name)}</strong></div>`;

  context.container.innerHTML = `<section class="${sectionClass}">
    ${context.embedded ? '' : `<div class="page-header"><div><h1>Kanban</h1><p>Planifica, prioriza y da seguimiento al trabajo del equipo.</p></div><div class="page-header-actions">${context.editable ? `<button class="button button-primary" id="new-kanban-card">${icon('plus')} Nueva tarjeta</button>` : ''}</div></div>`}
    <div class="kanban-command-bar">
      ${projectSelector}
      <div class="kanban-mode"><span class="status-dot ${context.source === 'firebase' ? 'online' : 'demo'}"></span><strong>${context.source === 'firebase' ? 'Firestore en tiempo real' : 'Demo local sincronizada'}</strong></div>
      <div class="kanban-command-actions">
        ${context.embedded && context.editable ? `<button class="button button-primary" id="new-kanban-card">${icon('plus')} Nueva tarjeta</button>` : ''}
        ${context.editable ? `<button class="button button-secondary" id="archived-kanban-cards">${icon('archive')} Archivadas <span class="button-count">${context.board.archivedCards?.length || 0}</span></button>` : ''}
        ${context.configurable ? `<button class="button button-secondary" id="configure-kanban">${icon('columns')} Configurar tablero</button>` : ''}
        ${context.configurable && context.source === 'mock' ? `<button class="button button-ghost" id="reset-kanban">${icon('refresh')} Restablecer demo</button>` : ''}
        <div class="kanban-view-switch" aria-label="Cambiar vista del Kanban"><button class="icon-button ${context.viewMode === 'board' ? 'active' : ''}" type="button" data-kanban-view="board" aria-label="Vista de tablero" aria-pressed="${context.viewMode === 'board'}">${icon('columns')}</button><button class="icon-button ${context.viewMode === 'list' ? 'active' : ''}" type="button" data-kanban-view="list" aria-label="Vista de lista" aria-pressed="${context.viewMode === 'list'}">${icon('list')}</button></div>
      </div>
    </div>

    <div class="kanban-metrics">
      ${metric('Tarjetas', totalCards, icon('kanban'))}
      ${metric('Completadas', doneCards, icon('check'))}
      ${metric('Atrasadas', overdueCards, icon('alert'), overdueCards ? 'danger' : '')}
      ${metric('Horas', `${actualHours}/${estimatedHours} h`, icon('clock'))}
    </div>

    <div class="toolbar kanban-toolbar">
      <label class="search-box" for="kanban-search"><span class="sr-only">Buscar tarjetas, etiquetas o contenido</span>${icon('search')}<input id="kanban-search" type="search" value="${escapeHtml(context.filters.search)}" placeholder="Buscar tarjetas, etiquetas o contenido..." aria-label="Buscar en el Kanban"></label>
      <select class="select" id="kanban-assignee"><option value="">Todos los responsables</option>${memberOptions(context.filters.assigneeId)}</select>
      <select class="select" id="kanban-priority"><option value="">Todas las prioridades</option>${Object.entries(PRIORITIES).map(([value, item]) => `<option value="${value}" ${context.filters.priority === value ? 'selected' : ''}>${item.label}</option>`).join('')}</select>
      <select class="select" id="kanban-label"><option value="">Todas las etiquetas</option>${allLabels().map(label => `<option value="${escapeHtml(label)}" ${context.filters.label === label ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>
      <button class="button button-ghost" id="clear-kanban-filters">${icon('filter')} Limpiar</button>
    </div>

    ${context.viewMode === 'list' ? renderListView(cards) : `<div class="kanban-scroll-shell" data-kanban-scroll-shell>
      <button class="kanban-scroll-button kanban-scroll-prev" type="button" data-kanban-scroll="prev" aria-label="Ver columnas anteriores">${icon('arrowLeft')}</button>
      <div class="kanban-board kanban-board-functional" id="kanban-board" tabindex="0" aria-label="Tablero Kanban con ${context.board.columns.length} columnas">
        ${context.board.columns.map(column => renderColumn(column, visibleIds)).join('')}
      </div>
      <button class="kanban-scroll-button kanban-scroll-next" type="button" data-kanban-scroll="next" aria-label="Ver columnas siguientes">${icon('arrowRight')}</button>
      <div class="kanban-scroll-hint" aria-hidden="true"><span data-kanban-column-counter>Columna 1 de ${context.board.columns.length}</span><span>Desliza para ver más</span></div>
    </div>`}
    ${cards.length === 0 ? `<div class="kanban-filter-empty"><strong>No encontramos tarjetas con estos filtros.</strong><button class="button button-ghost" id="empty-clear-filters">Limpiar filtros</button></div>` : ''}
  </section>`;

  bindBoardEvents();
}

function metric(label, value, visual, tone = '') {
  return `<article class="kanban-metric ${tone}"><span>${visual}</span><div><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(label)}</small></div></article>`;
}

function renderColumn(column, visibleIds) {
  const allColumnCards = activeContext.board.cards
    .filter(card => card.columnId === column.id)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  const cards = allColumnCards.filter(card => visibleIds.has(card.id));
  const atLimit = column.wipLimit > 0 && allColumnCards.length >= column.wipLimit;
  const overLimit = column.wipLimit > 0 && allColumnCards.length > column.wipLimit;
  return `<section class="kanban-column kanban-tone-${column.tone || 'gray'} ${overLimit ? 'wip-over' : atLimit ? 'wip-limit' : ''}" data-column-id="${escapeHtml(column.id)}">
    <div class="kanban-column-head">
      <div class="kanban-column-title"><span class="kanban-column-dot"></span><strong>${escapeHtml(column.name)}</strong><span class="kanban-count">${allColumnCards.length}</span></div>
      <div class="kanban-column-actions">${column.wipLimit ? `<span class="kanban-wip" title="Límite de trabajo en curso">WIP ${allColumnCards.length}/${column.wipLimit}</span>` : ''}${activeContext.editable ? `<button class="icon-button icon-button-sm" data-add-card="${escapeHtml(column.id)}" title="Agregar tarjeta">${icon('plus')}</button>` : ''}</div>
    </div>
    <div class="kanban-cards" data-dropzone="${escapeHtml(column.id)}">
      ${cards.map(card => renderCard(card)).join('')}
      ${cards.length === 0 ? `<div class="kanban-column-empty">${activeContext.filters.search || activeContext.filters.assigneeId || activeContext.filters.priority || activeContext.filters.label ? 'Sin coincidencias' : 'Suelta una tarjeta aquí'}</div>` : ''}
    </div>
  </section>`;
}

function renderCard(card) {
  const priority = PRIORITIES[card.priority] || PRIORITIES.medium;
  const completed = (card.checklist || []).filter(item => item.completed).length;
  const total = (card.checklist || []).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const doneColumn = activeContext.board.columns.find(column => column.id === card.columnId)?.isDone;
  const dueClass = isOverdue(card) && !doneColumn ? 'overdue' : '';
  return `<article class="kanban-card kanban-card-functional ${dueClass}" data-card-id="${escapeHtml(card.id)}" draggable="${activeContext.editable ? 'true' : 'false'}" tabindex="0" role="button" aria-label="Abrir tarjeta ${escapeHtml(card.title)}">
    <div class="kanban-card-top">${activeContext.editable ? `<span class="kanban-drag-handle" title="Arrastrar">${icon('grip')}</span>` : ''}<span class="badge ${priority.className}">${priority.label}</span>${card.visibility === 'client' ? `<span class="kanban-visibility" title="Visible al cliente">${icon('eye')}</span>` : ''}</div>
    <div class="kanban-card-title">${escapeHtml(card.title)}</div>
    ${(card.labels || []).length ? `<div class="kanban-labels">${card.labels.slice(0, 3).map(label => `<span class="kanban-label" style="--label-color:${safeColor(label.color)}">${escapeHtml(label.name)}</span>`).join('')}</div>` : ''}
    ${total ? `<div class="kanban-check-progress"><div><span style="width:${percent}%"></span></div><small>${completed}/${total}</small></div>` : ''}
    <div class="kanban-card-meta">
      ${card.dueDate ? `<span class="kanban-due ${dueClass}">${icon('calendar')} ${formatDate(card.dueDate)}</span>` : '<span></span>'}
      <span class="kanban-card-icons">${(card.comments || []).length ? `<small>${icon('message')} ${(card.comments || []).length}</small>` : ''}${Number(card.estimatedHours || 0) ? `<small>${icon('clock')} ${Number(card.actualHours || 0)}/${Number(card.estimatedHours || 0)}h</small>` : ''}</span>
    </div>
    <div class="kanban-card-footer"><span class="kanban-avatar" title="${escapeHtml(card.assignee?.name || 'Sin responsable')}">${escapeHtml(card.assignee?.initials || 'SR')}</span><small>${escapeHtml(card.assignee?.name || 'Sin responsable')}</small></div>
  </article>`;
}


function renderListView(cards) {
  const columns = activeContext.board.columns;
  return `<div class="kanban-list-view" id="kanban-list-view">${columns.map(column => {
    const columnCards = cards.filter(card => card.columnId === column.id);
    return `<section class="kanban-list-group" aria-labelledby="list-column-${escapeHtml(column.id)}"><header><h2 id="list-column-${escapeHtml(column.id)}">${escapeHtml(column.name)}</h2><span class="badge badge-gray">${columnCards.length}</span></header><div>${columnCards.length ? columnCards.map(card => {
      const priority = PRIORITIES[card.priority] || PRIORITIES.medium;
      return `<button class="kanban-list-card" type="button" data-open-card="${escapeHtml(card.id)}"><span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.assignee?.name || 'Sin responsable')}${card.dueDate ? ` · ${formatDate(card.dueDate)}` : ''}</small></span><span class="badge ${priority.className}">${priority.label}</span>${icon('arrowRight')}</button>`;
    }).join('') : '<p class="muted-copy">Sin tarjetas en esta columna.</p>'}</div></section>`;
  }).join('')}</div>`;
}

function memberOptions(selectedId = '') {
  return activeContext.people.map(user => `<option value="${escapeHtml(user.id)}" ${user.id === selectedId ? 'selected' : ''}>${escapeHtml(user.name || 'Usuario')}</option>`).join('');
}

function bindBoardEvents() {
  const context = activeContext;
  if (!context) return;
  const container = context.container;

  container.querySelector('#kanban-project-select')?.addEventListener('change', event => {
    const project = context.projects.find(item => item.id === event.target.value);
    if (!project) return;
    renderKanban(context.container, context.workspaceId, project.id, context.embedded, context.session);
  });

  container.querySelectorAll('#new-kanban-card').forEach(button => button.addEventListener('click', () => openCardEditor()));
  container.querySelectorAll('[data-add-card]').forEach(button => button.addEventListener('click', () => openCardEditor(null, button.dataset.addCard)));
  container.querySelector('#reset-kanban')?.addEventListener('click', resetBoard);
  container.querySelector('#archived-kanban-cards')?.addEventListener('click', openArchivedCards);
  container.querySelector('#configure-kanban')?.addEventListener('click', openBoardSettings);
  container.querySelectorAll('[data-kanban-view]').forEach(button => button.addEventListener('click', () => {
    context.viewMode = button.dataset.kanbanView;
    localStorage.setItem('wonkup.kanban.view', context.viewMode);
    renderBoard();
  }));
  container.querySelectorAll('[data-open-card]').forEach(button => button.addEventListener('click', () => {
    const card = context.board.cards.find(item => item.id === button.dataset.openCard);
    if (card) openCardEditor(card);
  }));
  const board = container.querySelector('#kanban-board');
  const updateCounter = () => {
    if (!board) return;
    const columns = [...board.querySelectorAll('.kanban-column')];
    if (!columns.length) return;
    const index = columns.reduce((best, column, current) => Math.abs(column.offsetLeft - board.scrollLeft) < Math.abs(columns[best].offsetLeft - board.scrollLeft) ? current : best, 0);
    const counter = container.querySelector('[data-kanban-column-counter]');
    if (counter) counter.textContent = `Columna ${index + 1} de ${columns.length}`;
  };
  board?.addEventListener('scroll', updateCounter, { passive: true });
  container.querySelectorAll('[data-kanban-scroll]').forEach(button => button.addEventListener('click', () => {
    if (!board) return;
    const direction = button.dataset.kanbanScroll === 'next' ? 1 : -1;
    board.scrollBy({ left: direction * Math.max(280, board.clientWidth * 0.82), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(updateCounter, 220);
  }));

  const applyFilter = () => {
    context.filters = {
      search: container.querySelector('#kanban-search')?.value || '',
      assigneeId: container.querySelector('#kanban-assignee')?.value || '',
      priority: container.querySelector('#kanban-priority')?.value || '',
      label: container.querySelector('#kanban-label')?.value || ''
    };
    renderBoard();
  };

  let searchTimer;
  container.querySelector('#kanban-search')?.addEventListener('input', event => {
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => {
      context.filters.search = value;
      renderBoard();
      requestAnimationFrame(() => {
        const input = context.container.querySelector('#kanban-search');
        input?.focus();
        input?.setSelectionRange(value.length, value.length);
      });
    }, 160);
  });
  ['#kanban-assignee', '#kanban-priority', '#kanban-label'].forEach(selector => container.querySelector(selector)?.addEventListener('change', applyFilter));
  const clearFilters = () => { context.filters = { search: '', assigneeId: '', priority: '', label: '' }; renderBoard(); };
  container.querySelector('#clear-kanban-filters')?.addEventListener('click', clearFilters);
  container.querySelector('#empty-clear-filters')?.addEventListener('click', clearFilters);

  container.querySelectorAll('[data-card-id]').forEach(card => {
    card.addEventListener('click', event => {
      if (event.defaultPrevented || card.classList.contains('dragging')) return;
      openCardEditor(card.dataset.cardId);
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCardEditor(card.dataset.cardId);
      }
    });
  });

  if (context.editable) bindDragAndDrop(container);
}

function bindDragAndDrop(container) {
  let draggedId = '';
  container.querySelectorAll('.kanban-card[draggable="true"]').forEach(card => {
    card.addEventListener('dragstart', event => {
      draggedId = card.dataset.cardId;
      card.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedId);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.kanban-cards').forEach(zone => zone.classList.remove('drag-over'));
    });
  });

  container.querySelectorAll('[data-dropzone]').forEach(zone => {
    zone.addEventListener('dragover', event => {
      event.preventDefault();
      zone.classList.add('drag-over');
      const afterElement = getDragAfterElement(zone, event.clientY);
      const dragging = container.querySelector('.kanban-card.dragging');
      if (!dragging) return;
      const empty = zone.querySelector('.kanban-column-empty');
      empty?.remove();
      if (afterElement) zone.insertBefore(dragging, afterElement);
      else zone.appendChild(dragging);
    });
    zone.addEventListener('dragleave', event => {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', async event => {
      event.preventDefault();
      zone.classList.remove('drag-over');
      const cardId = draggedId || event.dataTransfer.getData('text/plain');
      const cardElements = [...zone.querySelectorAll('.kanban-card')];
      const toIndex = Math.max(0, cardElements.findIndex(item => item.dataset.cardId === cardId));
      await moveCard(cardId, zone.dataset.dropzone, toIndex);
    });
  });
}

function getDragAfterElement(container, y) {
  return [...container.querySelectorAll('.kanban-card:not(.dragging)')].reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

async function moveCard(cardId, toColumnId, toIndex) {
  const context = activeContext;
  if (!context || context.busy) return;
  context.busy = true;
  try {
    context.board = await KanbanService.moveCard({
      projectId: context.projectId,
      workspaceId: context.project.workspaceId,
      cardId,
      toColumnId,
      toIndex,
      session: context.session
    });
    showToast('Tarjeta movida.');
  } catch (error) {
    showToast(error.message || 'No se pudo mover la tarjeta.');
    await refreshBoard({ silent: true });
  } finally {
    context.busy = false;
    renderBoard();
  }
}

function openCardEditor(cardId = null, defaultColumnId = '') {
  const context = activeContext;
  if (!context) return;
  const card = cardId ? context.board.cards.find(item => item.id === cardId) : null;
  const editing = Boolean(card);
  const editable = context.editable;
  const body = `<form id="kanban-card-form" class="kanban-detail-form">
    <div class="kanban-detail-grid">
      <label class="form-field form-field-wide"><span>Título *</span><input class="input" name="title" maxlength="120" required value="${escapeHtml(card?.title || '')}" ${editable ? '' : 'disabled'}></label>
      <label class="form-field form-field-wide"><span>Descripción</span><textarea class="textarea" name="description" rows="4" maxlength="1500" ${editable ? '' : 'disabled'}>${escapeHtml(card?.description || '')}</textarea></label>
      <label class="form-field"><span>Columna</span><select class="select" name="columnId" ${editable && !editing ? '' : 'disabled'}>${context.board.columns.map(column => `<option value="${escapeHtml(column.id)}" ${(card?.columnId || defaultColumnId || context.board.columns[0]?.id) === column.id ? 'selected' : ''}>${escapeHtml(column.name)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Prioridad</span><select class="select" name="priority" ${editable ? '' : 'disabled'}>${Object.entries(PRIORITIES).map(([value, item]) => `<option value="${value}" ${(card?.priority || 'medium') === value ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>
      <label class="form-field"><span>Responsable</span><select class="select" name="assigneeId" ${editable ? '' : 'disabled'}><option value="">Sin responsable</option>${memberOptions(card?.assigneeId || '')}</select></label>
      <label class="form-field"><span>Visibilidad</span><select class="select" name="visibility" ${editable ? '' : 'disabled'}>${Object.entries(VISIBILITY_LABELS).map(([value, label]) => `<option value="${value}" ${(card?.visibility || 'internal') === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <label class="form-field"><span>Inicio</span><input class="input" type="date" name="startDate" value="${escapeHtml(card?.startDate || '')}" ${editable ? '' : 'disabled'}></label>
      <label class="form-field"><span>Vencimiento</span><input class="input" type="date" name="dueDate" value="${escapeHtml(card?.dueDate || '')}" ${editable ? '' : 'disabled'}></label>
      <label class="form-field"><span>Horas estimadas</span><input class="input" type="number" min="0" step="0.5" name="estimatedHours" value="${Number(card?.estimatedHours || 0)}" ${editable ? '' : 'disabled'}></label>
      <label class="form-field"><span>Horas reales</span><input class="input" type="number" min="0" step="0.5" name="actualHours" value="${Number(card?.actualHours || 0)}" ${editable ? '' : 'disabled'}></label>
      <label class="form-field form-field-wide"><span>Etiquetas <small>separadas por coma</small></span><input class="input" name="labels" value="${escapeHtml((card?.labels || []).map(label => label.name).join(', '))}" ${editable ? '' : 'disabled'} placeholder="UX/UI, Desarrollo, Cliente"></label>
      <fieldset class="form-field form-field-wide kanban-participants"><legend>Participantes</legend>${context.people.map(user => `<label><input type="checkbox" name="participants" value="${escapeHtml(user.id)}" ${(card?.participantIds || []).includes(user.id) ? 'checked' : ''} ${editable ? '' : 'disabled'}><span class="kanban-avatar">${escapeHtml(user.initials || 'US')}</span><span>${escapeHtml(user.name || 'Usuario')}</span></label>`).join('') || '<p class="muted-copy">No hay miembros disponibles.</p>'}</fieldset>
      ${editing ? `<fieldset class="form-field form-field-wide kanban-participants"><legend>Dependencias</legend>${context.board.cards.filter(item => item.id !== card.id).map(item => `<label><input type="checkbox" name="dependencies" value="${escapeHtml(item.id)}" ${(card.dependencies || []).includes(item.id) ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>${escapeHtml(item.title)}</span></label>`).join('') || '<p class="muted-copy">No hay otras tarjetas.</p>'}</fieldset>` : ''}
    </div>
    ${editable ? `<div class="modal-actions">${editing ? `<button class="button button-danger button-left" type="button" id="archive-kanban-card">${icon('archive')} Archivar</button>` : ''}<button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${editing ? 'Guardar cambios' : 'Crear tarjeta'}</button></div>` : ''}
  </form>
  ${editing ? renderCardCollaboration(card, editable, context.commentable) : ''}`;

  const modal = openModal({
    title: editing ? escapeHtml(card.title) : 'Nueva tarjeta',
    subtitle: editing ? `${escapeHtml(context.project.name)} · ${escapeHtml(context.board.columns.find(column => column.id === card.columnId)?.name || '')}` : `Proyecto ${escapeHtml(context.project.name)}`,
    body,
    size: 'lg'
  });

  const form = modal.root.querySelector('#kanban-card-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!editable) return;
    const input = cardInput(new FormData(form));
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      if (editing) await KanbanService.updateCard({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId: card.id, patch: input, session: context.session });
      else await KanbanService.createCard({ projectId: context.projectId, workspaceId: context.project.workspaceId, input, session: context.session });
      closeModal();
      showToast(editing ? 'Tarjeta actualizada.' : 'Tarjeta creada.');
      await refreshBoard({ silent: true });
    } catch (error) {
      showToast(error.message || 'No se pudo guardar la tarjeta.');
      submit.disabled = false;
    }
  });

  modal.root.querySelector('#archive-kanban-card')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Archivar tarjeta', message: `La tarjeta <strong>${escapeHtml(card.title)}</strong> dejará de mostrarse en el tablero.`, confirmLabel: 'Archivar', danger: true });
    if (!confirmed) return;
    try {
      await KanbanService.archiveCard({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId: card.id, session: context.session });
      closeModal();
      showToast('Tarjeta archivada.');
      await refreshBoard({ silent: true });
    } catch (error) { showToast(error.message || 'No se pudo archivar la tarjeta.'); }
  });

  if (editing) bindCollaborationEvents(modal.root, card.id);
}

function cardInput(formData) {
  const labels = String(formData.get('labels') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map(name => ({ id: slug(name), name, color: colorFromText(name) }));
  return {
    title: String(formData.get('title') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    columnId: String(formData.get('columnId') || ''),
    priority: String(formData.get('priority') || 'medium'),
    assigneeId: String(formData.get('assigneeId') || ''),
    visibility: String(formData.get('visibility') || 'internal'),
    startDate: String(formData.get('startDate') || ''),
    dueDate: String(formData.get('dueDate') || ''),
    estimatedHours: Number(formData.get('estimatedHours') || 0),
    actualHours: Number(formData.get('actualHours') || 0),
    labels,
    participantIds: formData.getAll('participants').map(String),
    dependencies: formData.getAll('dependencies').map(String)
  };
}

function renderCardCollaboration(card, editable, commentable = editable) {
  const checklist = card.checklist || [];
  const comments = [...(card.comments || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const history = [...(card.history || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `<div class="kanban-collaboration-grid">
    <section class="kanban-detail-section"><div class="kanban-detail-title"><div><h3>${icon('checkSquare')} Checklist</h3><p>${checklist.filter(item => item.completed).length} de ${checklist.length} completados</p></div></div>
      <div class="kanban-checklist">${checklist.map(item => `<label class="kanban-check-item ${item.completed ? 'completed' : ''}"><input type="checkbox" data-check-item="${escapeHtml(item.id)}" ${item.completed ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>${escapeHtml(item.text)}</span>${editable ? `<button type="button" class="icon-button icon-button-sm" data-delete-check="${escapeHtml(item.id)}">${icon('trash')}</button>` : ''}</label>`).join('') || '<p class="muted-copy">Aún no hay elementos en la checklist.</p>'}</div>
      ${editable ? `<form class="kanban-inline-form" id="add-checklist-form"><input class="input" name="text" maxlength="160" placeholder="Agregar elemento..."><button class="button button-secondary" type="submit">${icon('plus')} Agregar</button></form>` : ''}
    </section>
    <section class="kanban-detail-section"><div class="kanban-detail-title"><div><h3>${icon('message')} Comentarios</h3><p>${comments.length} comentarios</p></div></div>
      ${commentable ? `<form class="kanban-comment-form" id="add-comment-form"><textarea class="textarea" name="text" rows="3" maxlength="1000" placeholder="Escribe un comentario..."></textarea><button class="button button-primary" type="submit">Comentar</button></form>` : ''}
      <div class="kanban-comments">${comments.map(comment => `<article><span class="kanban-avatar">${escapeHtml(comment.author?.initials || 'US')}</span><div><strong>${escapeHtml(comment.author?.name || 'Usuario')}</strong><small>${formatDateTime(comment.createdAt)}</small><p>${escapeHtml(comment.text)}</p></div></article>`).join('') || '<p class="muted-copy">No hay comentarios todavía.</p>'}</div>
    </section>
    <section class="kanban-detail-section kanban-history-section"><div class="kanban-detail-title"><div><h3>${icon('history')} Historial</h3><p>Trazabilidad de cambios recientes</p></div></div>
      <div class="kanban-history">${history.map(item => `<article><span>${historyIcon(item.type)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.actor?.name || 'Sistema')} · ${formatDateTime(item.createdAt)}</small></div></article>`).join('') || '<p class="muted-copy">Sin actividad registrada.</p>'}</div>
    </section>
  </div>`;
}

function bindCollaborationEvents(root, cardId) {
  const context = activeContext;
  root.querySelectorAll('[data-check-item]').forEach(input => input.addEventListener('change', async () => {
    try {
      await KanbanService.toggleChecklistItem({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId, itemId: input.dataset.checkItem, completed: input.checked, session: context.session });
      await refreshBoard({ silent: true, reopenCardId: cardId });
    } catch (error) { showToast(error.message || 'No se pudo actualizar la checklist.'); }
  }));
  root.querySelectorAll('[data-delete-check]').forEach(button => button.addEventListener('click', async () => {
    try {
      await KanbanService.deleteChecklistItem({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId, itemId: button.dataset.deleteCheck, session: context.session });
      await refreshBoard({ silent: true, reopenCardId: cardId });
    } catch (error) { showToast(error.message || 'No se pudo eliminar el elemento.'); }
  }));
  root.querySelector('#add-checklist-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get('text');
    try {
      await KanbanService.addChecklistItem({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId, text, session: context.session });
      await refreshBoard({ silent: true, reopenCardId: cardId });
    } catch (error) { showToast(error.message || 'No se pudo agregar el elemento.'); }
  });
  root.querySelector('#add-comment-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = new FormData(form).get('text');
    try {
      await KanbanService.addComment({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId, text, session: context.session });
      await refreshBoard({ silent: true, reopenCardId: cardId });
    } catch (error) { showToast(error.message || 'No se pudo agregar el comentario.'); }
  });
}

async function refreshBoard({ silent = false, reopenCardId = null } = {}) {
  const context = activeContext;
  if (!context) return;
  if (!silent) context.container.querySelector('#kanban-board')?.classList.add('is-loading');
  try {
    context.board = await KanbanService.getBoard({ projectId: context.projectId, workspaceId: context.project.workspaceId, session: context.session });
    renderBoard();
    if (reopenCardId) {
      closeModal();
      openCardEditor(reopenCardId);
    }
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar el tablero.');
  }
}

async function resetBoard() {
  const context = activeContext;
  const confirmed = await confirmModal({ title: 'Restablecer tablero demo', message: 'Se eliminarán los cambios locales del Kanban de este proyecto y se recuperarán los datos de demostración.', confirmLabel: 'Restablecer', danger: true });
  if (!confirmed) return;
  try {
    context.board = await KanbanService.resetBoard({ projectId: context.projectId, workspaceId: context.project.workspaceId, session: context.session });
    showToast('Tablero restablecido.');
    renderBoard();
  } catch (error) { showToast(error.message || 'No se pudo restablecer el tablero.'); }
}


function openArchivedCards() {
  const context = activeContext;
  if (!context) return;
  const archived = context.board.archivedCards || [];
  const columnName = id => context.board.columns.find(column => column.id === id)?.name
    || context.board.archivedColumns?.find(column => column.id === id)?.name
    || 'Columna no disponible';
  const modal = openModal({
    title: 'Tarjetas archivadas',
    subtitle: 'Restaura una tarjeta en su columna anterior o selecciona otro destino.',
    body: archived.length ? `<div class="archived-card-list">${archived.map(card => `<article class="archived-card-row">
      <div class="archived-card-copy"><span class="badge badge-gray">Archivada</span><h3>${escapeHtml(card.title)}</h3><p>Antes estaba en <strong>${escapeHtml(columnName(card.columnBeforeArchive))}</strong>${card.archivedAt ? ` · ${formatDateTime(card.archivedAt)}` : ''}</p></div>
      <label><span>Restaurar en</span><select class="select" data-restore-column="${escapeHtml(card.id)}">${context.board.columns.map(column => `<option value="${escapeHtml(column.id)}" ${column.id === card.columnBeforeArchive ? 'selected' : ''}>${escapeHtml(column.name)}</option>`).join('')}</select></label>
      <div class="archived-card-actions"><button class="button button-secondary" data-restore-card="${escapeHtml(card.id)}">${icon('restore')} Restaurar</button>${canDeleteKanbanCard(context.session, context.projectId, context.project.workspaceId) ? `<button class="button button-danger" data-delete-card="${escapeHtml(card.id)}">${icon('trash')} Eliminar</button>` : ''}</div>
    </article>`).join('')}</div>` : `<div class="empty-state compact-empty"><div class="empty-state-icon">${icon('archive')}</div><h3>No hay tarjetas archivadas</h3><p>Las tarjetas que archives aparecerán aquí para poder restaurarlas.</p></div>`,
    size: 'lg'
  });

  modal.root.querySelectorAll('[data-restore-card]').forEach(button => button.addEventListener('click', async () => {
    const cardId = button.dataset.restoreCard;
    const columnId = modal.root.querySelector(`[data-restore-column="${CSS.escape(cardId)}"]`)?.value || '';
    button.disabled = true;
    try {
      context.board = await KanbanService.restoreCard({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId, columnId, session: context.session });
      modal.close();
      showToast('Tarjeta restaurada.');
      renderBoard();
    } catch (error) {
      button.disabled = false;
      showToast(error.message || 'No se pudo restaurar la tarjeta.');
    }
  }));

  modal.root.querySelectorAll('[data-delete-card]').forEach(button => button.addEventListener('click', async () => {
    const card = archived.find(item => item.id === button.dataset.deleteCard);
    const confirmed = await confirmModal({
      title: 'Eliminar tarjeta definitivamente',
      message: `La tarjeta <strong>${escapeHtml(card?.title || '')}</strong> y su historial se eliminarán de forma permanente.`,
      confirmLabel: 'Eliminar definitivamente', danger: true
    });
    if (!confirmed) return;
    try {
      context.board = await KanbanService.deleteCard({ projectId: context.projectId, workspaceId: context.project.workspaceId, cardId: button.dataset.deleteCard, session: context.session });
      closeModal();
      showToast('Tarjeta eliminada definitivamente.');
      renderBoard();
    } catch (error) { showToast(error.message || 'No se pudo eliminar la tarjeta.'); }
  }));
}

function openBoardSettings() {
  const context = activeContext;
  if (!context?.configurable) return;
  const combinedColumns = [...context.board.columns, ...(context.board.archivedColumns || [])]
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  let workingColumns = combinedColumns.map(column => ({ ...column, active: column.active !== false && !column.archived }));

  const modal = openModal({
    title: 'Configurar tablero',
    subtitle: 'Elige una plantilla o personaliza las columnas y sus límites WIP.',
    body: `<div class="board-settings">
      <section class="board-settings-section"><div class="section-heading"><div><h3>Plantillas rápidas</h3><p>Puedes usar 4, 5, 6 o 9 columnas según la complejidad del proyecto.</p></div></div><div class="kanban-template-grid">${kanbanTemplates.map(template => `<button type="button" class="kanban-template-card ${context.board.templateId === template.id ? 'selected' : ''}" data-template-id="${escapeHtml(template.id)}"><strong>${escapeHtml(template.name)}</strong><span>${template.columns.length} columnas</span><p>${escapeHtml(template.description)}</p></button>`).join('')}</div></section>
      <form id="board-settings-form">
        <section class="board-settings-section"><div class="section-heading"><div><h3>Configuración personalizada</h3><p>Un límite WIP de 0 significa que la columna no tiene límite.</p></div><button class="button button-secondary" id="add-board-column" type="button">${icon('plus')} Agregar columna</button></div>
          <label class="form-field board-name-field"><span>Nombre del tablero</span><input class="input" name="boardName" maxlength="100" value="${escapeHtml(context.board.name || 'Tablero principal')}"></label>
          <div class="board-column-list" id="board-column-list"></div>
          <div class="board-settings-help">${icon('alert')} No se puede desactivar una columna mientras contenga tarjetas. Muévelas primero.</div>
        </section>
        <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">Guardar configuración</button></div>
      </form>
    </div>`,
    size: 'xl', closeOnBackdrop: false
  });

  const list = modal.root.querySelector('#board-column-list');
  const renderRows = () => {
    list.innerHTML = workingColumns.map((column, index) => renderColumnSettingRow(column, index, context.board.cards.filter(card => card.columnId === column.id).length)).join('');
    bindRows();
  };

  const bindRows = () => {
    list.querySelectorAll('[data-column-field]').forEach(input => input.addEventListener('input', () => {
      const index = Number(input.closest('[data-column-index]').dataset.columnIndex);
      const field = input.dataset.columnField;
      if (field === 'active' || field === 'isDone') workingColumns[index][field] = input.checked;
      else if (field === 'wipLimit') workingColumns[index][field] = Math.max(0, Number(input.value || 0));
      else workingColumns[index][field] = input.value;
      if (field === 'isDone' && input.checked) {
        workingColumns.forEach((column, itemIndex) => { column.isDone = itemIndex === index; });
        renderRows();
      }
    }));
    list.querySelectorAll('[data-column-up]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.columnUp);
      if (index <= 0) return;
      [workingColumns[index - 1], workingColumns[index]] = [workingColumns[index], workingColumns[index - 1]];
      renderRows();
    }));
    list.querySelectorAll('[data-column-down]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.columnDown);
      if (index >= workingColumns.length - 1) return;
      [workingColumns[index + 1], workingColumns[index]] = [workingColumns[index], workingColumns[index + 1]];
      renderRows();
    }));
    list.querySelectorAll('[data-column-remove]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.columnRemove);
      const column = workingColumns[index];
      const count = context.board.cards.filter(card => card.columnId === column.id).length;
      if (count) {
        showToast(`Mueve primero las ${count} tarjeta(s) de ${column.name}.`);
        return;
      }
      workingColumns.splice(index, 1);
      renderRows();
    }));
  };

  modal.root.querySelector('#add-board-column').addEventListener('click', () => {
    workingColumns.push({
      id: `column-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Nueva columna', wipLimit: 0, tone: 'sky', isDone: false, active: true
    });
    renderRows();
    list.lastElementChild?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  modal.root.querySelectorAll('[data-template-id]').forEach(button => button.addEventListener('click', async () => {
    const template = kanbanTemplates.find(item => item.id === button.dataset.templateId);
    const confirmed = await confirmModal({
      title: `Aplicar plantilla ${escapeHtml(template?.name || '')}`,
      message: 'Las columnas actuales serán reemplazadas. Las tarjetas de columnas que desaparezcan se moverán a la primera columna de la plantilla.',
      confirmLabel: 'Aplicar plantilla'
    });
    if (!confirmed) return;
    try {
      context.board = await KanbanService.applyTemplate({ projectId: context.projectId, workspaceId: context.project.workspaceId, templateId: button.dataset.templateId, session: context.session });
      closeModal();
      showToast(`Plantilla ${template.name} aplicada.`);
      renderBoard();
    } catch (error) { showToast(error.message || 'No se pudo aplicar la plantilla.'); }
  }));

  modal.root.querySelector('#board-settings-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      context.board = await KanbanService.updateBoardColumns({
        projectId: context.projectId,
        workspaceId: context.project.workspaceId,
        name: new FormData(event.currentTarget).get('boardName'),
        columns: workingColumns,
        session: context.session
      });
      modal.close();
      showToast('Configuración del tablero guardada.');
      renderBoard();
    } catch (error) {
      submit.disabled = false;
      showToast(error.message || 'No se pudo guardar la configuración.');
    }
  });

  renderRows();
}

function renderColumnSettingRow(column, index, cardCount) {
  return `<article class="board-column-row ${column.active ? '' : 'is-inactive'}" data-column-index="${index}">
    <span class="board-column-grip">${icon('grip')}</span>
    <label class="form-field"><span>Nombre</span><input class="input" data-column-field="name" maxlength="80" value="${escapeHtml(column.name)}"></label>
    <label class="form-field compact"><span>Límite WIP</span><input class="input" data-column-field="wipLimit" type="number" min="0" max="99" value="${Number(column.wipLimit || 0)}"></label>
    <label class="form-field compact"><span>Color</span><select class="select" data-column-field="tone">${KANBAN_TONES.map(tone => `<option value="${tone}" ${tone === column.tone ? 'selected' : ''}>${toneLabel(tone)}</option>`).join('')}</select></label>
    <label class="column-check"><input type="checkbox" data-column-field="isDone" ${column.isDone ? 'checked' : ''}><span>Etapa final</span></label>
    <label class="column-check"><input type="checkbox" data-column-field="active" ${column.active ? 'checked' : ''}><span>Activa</span></label>
    <span class="board-column-count">${cardCount} tarjeta${cardCount === 1 ? '' : 's'}</span>
    <div class="board-column-actions"><button class="icon-button icon-button-sm" type="button" data-column-up="${index}" aria-label="Subir columna">${icon('chevronUp')}</button><button class="icon-button icon-button-sm" type="button" data-column-down="${index}" aria-label="Bajar columna">${icon('chevronDown')}</button><button class="icon-button icon-button-sm danger-icon" type="button" data-column-remove="${index}" aria-label="Quitar columna">${icon('trash')}</button></div>
  </article>`;
}

function toneLabel(tone) {
  const labels = { gray: 'Gris', gold: 'Dorado', violet: 'Violeta', sky: 'Celeste', blue: 'Azul', orange: 'Naranja', yellow: 'Amarillo', red: 'Rojo', green: 'Verde' };
  return labels[tone] || tone;
}

function isOverdue(card) {
  if (!card.dueDate) return false;
  const due = new Date(`${card.dueDate}T23:59:59`);
  return Number.isFinite(due.getTime()) && due.getTime() < Date.now();
}

function safeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : '#50a8f3';
}

function colorFromText(text) {
  const palette = ['#50a8f3', '#f1c22d', '#36a269', '#7c69d8', '#f59e0b', '#dc5a5a', '#2f8fe9'];
  const total = [...text].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function slug(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `label-${Date.now()}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function historyIcon(type) {
  if (type === 'moved' || type === 'reordered') return icon('arrowRight');
  if (type === 'commented') return icon('message');
  if (type === 'checklist') return icon('checkSquare');
  if (type === 'archived') return icon('archive');
  if (type === 'restored') return icon('restore');
  if (type === 'created') return icon('plus');
  return icon('edit');
}
