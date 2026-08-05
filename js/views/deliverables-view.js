import { DeliverableService } from '../services/deliverable-service.js?v=11.0.0';
import { ProjectService } from '../services/project-service.js?v=11.0.0';
import {
  canCommentDeliverable,
  canManageDeliverables,
  canReviewDeliverable,
  isReadOnlyRole
} from '../utils/permissions.js?v=11.0.0';
import { escapeHtml, formatDate } from '../utils/format.js?v=11.0.0';
import { normalizeText, normalizeUrl } from '../utils/validation.js?v=11.0.0';
import { icon } from '../utils/icons.js?v=11.0.0';
import { openModal, confirmModal } from '../components/modal.js?v=11.0.0';
import { showToast } from '../components/toast.js?v=11.0.0';

const STATUS_LABELS = Object.freeze({
  draft: 'Borrador',
  in_review: 'En revisión',
  changes_requested: 'Cambios solicitados',
  approved: 'Aprobado'
});

const STATUS_TONES = Object.freeze({
  draft: 'gray',
  in_review: 'blue',
  changes_requested: 'orange',
  approved: 'green'
});

const deliverableRealtimeStops = new WeakMap();
const deliverableViewState = new WeakMap();

const TYPE_LABELS = Object.freeze({
  document: 'Documento', prototype: 'Prototipo', website: 'Sitio web',
  design: 'Diseño', presentation: 'Presentación', other: 'Otro'
});

function checklistProgress(item) {
  const total = item.checklist?.length || 0;
  const completed = item.checklist?.filter(check => check.done).length || 0;
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

function latestVersion(item) {
  return (item.versions || [])[0] || null;
}

function statusBadge(status) {
  const tone = STATUS_TONES[status] || 'gray';
  return `<span class="deliverable-status deliverable-status-${tone}">${escapeHtml(STATUS_LABELS[status] || status)}</span>`;
}

function emptyState({ internal }) {
  return `<div class="deliverables-empty">${icon('file')}<h3>No hay entregables todavía</h3><p>${internal ? 'Registra el primer resultado que será revisado o aprobado.' : 'El equipo publicará aquí los entregables disponibles para tu revisión.'}</p></div>`;
}

function card(item, { session, compact = false }) {
  const progress = checklistProgress(item);
  const version = latestVersion(item);
  const needsAttention = item.status === 'in_review' && session.role === 'client';
  return `<article class="deliverable-card ${needsAttention ? 'deliverable-card-attention' : ''}" data-deliverable-card="${escapeHtml(item.id)}">
    <div class="deliverable-card-top">
      <span class="deliverable-type-icon">${icon(item.type === 'prototype' || item.type === 'design' ? 'layers' : item.type === 'website' ? 'external' : 'file')}</span>
      <div class="deliverable-card-heading"><span class="eyebrow">${escapeHtml(TYPE_LABELS[item.type] || 'Entregable')}</span><h3>${escapeHtml(item.title)}</h3></div>
      ${statusBadge(item.status)}
    </div>
    <p class="deliverable-description">${escapeHtml(item.description || 'Sin descripción.')}</p>
    <div class="deliverable-meta">
      <span>${icon('calendar')} ${item.dueDate ? `Entrega ${formatDate(item.dueDate)}` : 'Sin fecha límite'}</span>
      <span>${icon('user')} ${escapeHtml(item.ownerName || 'Sin responsable')}</span>
      <span>${icon('message')} ${(item.comments || []).length} comentario${(item.comments || []).length === 1 ? '' : 's'}</span>
    </div>
    ${progress.total ? `<div class="deliverable-progress"><div><span>Checklist</span><strong>${progress.completed}/${progress.total}</strong></div><div class="progress-track"><div class="progress-bar" style="width:${progress.percent}%"></div></div></div>` : ''}
    <div class="deliverable-card-footer">
      <div class="deliverable-version-summary">${version ? `<strong>${escapeHtml(version.label)}</strong><small>${escapeHtml(version.fileType || 'Enlace')} · ${formatDate(version.createdAt)}</small>` : '<span class="muted-copy">Sin versiones publicadas</span>'}</div>
      <button class="button ${needsAttention ? 'button-primary' : 'button-secondary'}" data-open-deliverable="${escapeHtml(item.id)}">${needsAttention ? `${icon('eye')} Revisar` : `${icon('arrowRight')} Ver detalle`}</button>
    </div>
  </article>`;
}

export function renderDeliverables(container, { workspaceId, projectId, embedded = false, portal = false } = {}, session) {
  deliverableRealtimeStops.get(container)?.();
  deliverableRealtimeStops.delete(container);
  deliverableViewState.set(container, { selectedFilter: 'active' });
  container.innerHTML = `<div class="deliverables-loading"><span class="spinner spinner-blue"></span><p>Cargando entregables...</p></div>`;
  loadDeliverables(container, { workspaceId, projectId, embedded, portal }, session);
}

async function loadDeliverables(container, context, session, selectedFilter = 'active') {
  deliverableViewState.set(container, { selectedFilter });
  try {
    const [items, project] = await Promise.all([
      DeliverableService.listDeliverables({ projectId: context.projectId, workspaceId: context.workspaceId, session, includeArchived: selectedFilter === 'archived' }),
      ProjectService.getProject({ projectId: context.projectId, session })
    ]);
    if (!container.isConnected) return;
    const internal = canManageDeliverables(session, context.projectId, context.workspaceId);
    const filtered = selectedFilter === 'archived' ? items.filter(item => item.archived) : items.filter(item => !item.archived);
    const counts = {
      all: filtered.length,
      review: filtered.filter(item => item.status === 'in_review').length,
      changes: filtered.filter(item => item.status === 'changes_requested').length,
      approved: filtered.filter(item => item.status === 'approved').length
    };

    container.innerHTML = `<section class="deliverables-module ${context.portal ? 'deliverables-portal-mode' : ''}">
      <div class="deliverables-toolbar">
        <div><span class="eyebrow">Resultados del proyecto</span><h2>Entregables y aprobaciones</h2><p>${context.portal ? 'Revisa versiones, comenta y aprueba los resultados preparados por el equipo.' : 'Centraliza versiones, feedback del cliente y aprobaciones.'}</p></div>
        ${internal ? `<button class="button button-primary" id="new-deliverable">${icon('plus')} Nuevo entregable</button>` : ''}
      </div>
      <div class="deliverable-filterbar" role="tablist" aria-label="Filtrar entregables">
        <button class="deliverable-filter active" data-deliverable-filter="all" role="tab">Todos <span>${counts.all}</span></button>
        <button class="deliverable-filter" data-deliverable-filter="in_review" role="tab">En revisión <span>${counts.review}</span></button>
        <button class="deliverable-filter" data-deliverable-filter="changes_requested" role="tab">Con cambios <span>${counts.changes}</span></button>
        <button class="deliverable-filter" data-deliverable-filter="approved" role="tab">Aprobados <span>${counts.approved}</span></button>
        ${internal ? `<button class="deliverable-filter" data-toggle-archived="true">${selectedFilter === 'archived' ? 'Ver activos' : 'Archivados'}</button>` : ''}
      </div>
      <div class="deliverables-grid" id="deliverables-grid">${filtered.length ? filtered.map(item => card(item, { session, compact: context.portal })).join('') : emptyState({ internal })}</div>
      ${DeliverableService.dataSource({ session }) === 'mock' ? '<p class="module-demo-note">Modo demo local: los entregables y comentarios se guardan en este navegador.</p>' : '<p class="module-demo-note module-cloud-note">Firestore en tiempo real: versiones, comentarios y aprobaciones se sincronizan entre usuarios.</p>'}
    </section>`;

    const grid = container.querySelector('#deliverables-grid');
    container.querySelectorAll('[data-deliverable-filter]').forEach(button => button.addEventListener('click', () => {
      container.querySelectorAll('[data-deliverable-filter]').forEach(item => item.classList.toggle('active', item === button));
      const value = button.dataset.deliverableFilter;
      const subset = value === 'all' ? filtered : filtered.filter(item => item.status === value);
      grid.innerHTML = subset.length ? subset.map(item => card(item, { session, compact: context.portal })).join('') : emptyState({ internal });
      bindCardEvents(grid, context, session, () => loadDeliverables(container, context, session, selectedFilter));
    }));

    container.querySelector('[data-toggle-archived]')?.addEventListener('click', () => loadDeliverables(container, context, session, selectedFilter === 'archived' ? 'active' : 'archived'));
    container.querySelector('#new-deliverable')?.addEventListener('click', () => openDeliverableForm({ context, session, project, onSaved: () => loadDeliverables(container, context, session, selectedFilter) }));
    bindCardEvents(container, context, session, () => loadDeliverables(container, context, session, selectedFilter));
    ensureDeliverableRealtime(container, context, session);
  } catch (error) {
    if (!container.isConnected) return;
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudieron cargar los entregables</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
}


async function ensureDeliverableRealtime(container, context, session) {
  if (DeliverableService.dataSource({ session }) !== 'firebase' || deliverableRealtimeStops.has(container)) return;
  try {
    const stop = await DeliverableService.startRealtime({
      workspaceId: context.workspaceId,
      projectId: context.projectId,
      session,
      onChange: () => {
        if (!container.isConnected) {
          deliverableRealtimeStops.get(container)?.();
          deliverableRealtimeStops.delete(container);
          return;
        }
        clearTimeout(container.__deliverableRealtimeTimer);
        container.__deliverableRealtimeTimer = setTimeout(() => {
          const state = deliverableViewState.get(container) || { selectedFilter: 'active' };
          loadDeliverables(container, context, session, state.selectedFilter);
        }, 160);
      }
    });
    if (!container.isConnected) { stop?.(); return; }
    deliverableRealtimeStops.set(container, stop);
  } catch {
    // La carga manual permanece disponible aunque el listener no pueda iniciarse.
  }
}

function bindCardEvents(scope, context, session, onChanged) {
  scope.querySelectorAll('[data-open-deliverable]').forEach(button => button.addEventListener('click', () => openDeliverableDetail({ deliverableId: button.dataset.openDeliverable, context, session, onChanged })));
}

function parseChecklist(value, existing = []) {
  const byLabel = new Map(existing.map(item => [String(item.label || '').trim().toLocaleLowerCase('es'), item]));
  return String(value || '').split('\n').map(label => label.trim()).filter(Boolean).map(label => {
    const previous = byLabel.get(label.toLocaleLowerCase('es'));
    return previous ? { id: previous.id, label, done: Boolean(previous.done) } : { label, done: false };
  });
}

function openDeliverableForm({ context, session, project, deliverable = null, onSaved }) {
  const modal = openModal({
    title: deliverable ? 'Editar entregable' : 'Nuevo entregable',
    subtitle: 'Define qué se entregará, cuándo y cómo será revisado.',
    body: `<form id="deliverable-form" class="project-form" novalidate>
      <div class="form-grid form-grid-2">
        <label class="form-field form-span-2"><span>Nombre *</span><input class="input" name="title" maxlength="180" value="${escapeHtml(deliverable?.title || '')}" required><small data-error-for="title"></small></label>
        <label class="form-field"><span>Tipo</span><select class="select" name="type">${Object.entries(TYPE_LABELS).map(([value, label]) => `<option value="${value}" ${deliverable?.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label class="form-field"><span>Fecha de entrega</span><input class="input" type="date" name="dueDate" value="${escapeHtml(deliverable?.dueDate || project?.dueDate || '')}"></label>
        <label class="form-field"><span>Prioridad</span><select class="select" name="priority"><option value="low" ${deliverable?.priority === 'low' ? 'selected' : ''}>Baja</option><option value="medium" ${!deliverable || deliverable.priority === 'medium' ? 'selected' : ''}>Media</option><option value="high" ${deliverable?.priority === 'high' ? 'selected' : ''}>Alta</option><option value="critical" ${deliverable?.priority === 'critical' ? 'selected' : ''}>Crítica</option></select></label>
        <label class="form-field"><span>Visibilidad</span><select class="select" name="visibility"><option value="client" ${deliverable?.visibility !== 'internal' ? 'selected' : ''}>Visible para el cliente</option><option value="internal" ${deliverable?.visibility === 'internal' ? 'selected' : ''}>Solo equipo interno</option></select></label>
        <label class="form-field form-span-2"><span>Descripción</span><textarea class="textarea" name="description" rows="4">${escapeHtml(deliverable?.description || '')}</textarea></label>
        <label class="form-field form-span-2"><span>Checklist de aceptación</span><textarea class="textarea" name="checklist" rows="4" placeholder="Una condición por línea">${escapeHtml((deliverable?.checklist || []).map(item => item.label).join('\n'))}</textarea><small>Ejemplo: Versión móvil revisada.</small></label>
      </div>
      <div class="form-global-error hidden" id="deliverable-form-error"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button type="submit" class="button button-primary" data-deliverable-submit>${deliverable ? 'Guardar cambios' : 'Crear entregable'}</button></div>
    </form>`, size: 'lg', closeOnBackdrop: false
  });
  const form = modal.root.querySelector('#deliverable-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const input = {
      title: normalizeText(raw.title, 180), type: normalizeText(raw.type, 40),
      dueDate: normalizeText(raw.dueDate, 20), priority: normalizeText(raw.priority, 20),
      visibility: normalizeText(raw.visibility, 20), description: normalizeText(raw.description, 2000),
      checklist: parseChecklist(raw.checklist, deliverable?.checklist || []), ownerName: deliverable?.ownerName || session.user?.name || 'Responsable'
    };
    form.querySelector('[data-error-for="title"]').textContent = input.title.length >= 3 ? '' : 'Escribe un nombre de al menos 3 caracteres.';
    if (input.title.length < 3) return;
    const submit = form.querySelector('[data-deliverable-submit]');
    if (!submit) {
      const slot = form.querySelector('#deliverable-form-error');
      slot.textContent = 'No se pudo inicializar el botón de guardado. Recarga la página e inténtalo nuevamente.';
      slot.classList.remove('hidden');
      return;
    }
    const originalLabel = submit.innerHTML;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = deliverable ? 'Guardando...' : 'Creando...';
    try {
      if (deliverable) await DeliverableService.updateDeliverable({ deliverableId: deliverable.id, workspaceId: context.workspaceId, projectId: context.projectId, patch: input, session });
      else await DeliverableService.createDeliverable({ workspaceId: context.workspaceId, projectId: context.projectId, input, session });
      modal.close();
      showToast(deliverable ? 'Entregable actualizado.' : 'Entregable creado.');
      await onSaved?.();
    } catch (error) {
      const slot = form.querySelector('#deliverable-form-error');
      slot.textContent = error.message; slot.classList.remove('hidden');
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.innerHTML = originalLabel;
    }
  });
}

async function openDeliverableDetail({ deliverableId, context, session, onChanged }) {
  try {
    const item = await DeliverableService.getDeliverable({ deliverableId, workspaceId: context.workspaceId, projectId: context.projectId, session });
    const internal = canManageDeliverables(session, item.projectId, item.workspaceId);
    const reviewer = canReviewDeliverable(session, item.projectId, item.workspaceId);
    const commenter = canCommentDeliverable(session, item.projectId, item.workspaceId);
    const progress = checklistProgress(item);
    const modal = openModal({
      title: item.title,
      subtitle: `${TYPE_LABELS[item.type] || 'Entregable'} · ${STATUS_LABELS[item.status] || item.status}`,
      body: `<div class="deliverable-detail">
        <section class="deliverable-detail-main">
          <div class="deliverable-detail-summary"><div>${statusBadge(item.status)}<span class="badge badge-gray">${escapeHtml(item.priority || 'medium')}</span></div><p>${escapeHtml(item.description || 'Sin descripción registrada.')}</p><div class="deliverable-meta"><span>${icon('calendar')} ${item.dueDate ? formatDate(item.dueDate) : 'Sin fecha'}</span><span>${icon('user')} ${escapeHtml(item.ownerName || 'Sin responsable')}</span></div></div>
          <div class="deliverable-section"><div class="deliverable-section-head"><div><h3>Versiones</h3><p>Archivos y enlaces publicados para revisión.</p></div>${internal ? `<button class="button button-secondary" id="add-deliverable-version">${icon('plus')} Registrar versión</button>` : ''}</div>
            <div class="deliverable-version-list">${(item.versions || []).length ? item.versions.map(version => `<div class="deliverable-version-row"><span class="deliverable-version-icon">${icon('file')}</span><div><strong>${escapeHtml(version.label)}</strong><small>${escapeHtml(version.fileName)} · ${escapeHtml(version.fileType)} · ${formatDate(version.createdAt)}</small>${version.notes ? `<p>${escapeHtml(version.notes)}</p>` : ''}</div><a class="icon-button" href="${escapeHtml(version.url)}" target="_blank" rel="noopener" aria-label="Abrir versión">${icon('external')}</a></div>`).join('') : '<p class="muted-copy">Todavía no se publicó ninguna versión.</p>'}</div>
          </div>
          <div class="deliverable-section"><div class="deliverable-section-head"><div><h3>Checklist de aceptación</h3><p>${progress.completed} de ${progress.total} condiciones completadas.</p></div></div>
            <div class="deliverable-checklist">${(item.checklist || []).length ? item.checklist.map(check => `<label class="deliverable-check ${check.done ? 'is-done' : ''}"><input type="checkbox" data-checklist-id="${escapeHtml(check.id)}" ${check.done ? 'checked' : ''} ${internal ? '' : 'disabled'}><span>${escapeHtml(check.label)}</span></label>`).join('') : '<p class="muted-copy">Sin condiciones registradas.</p>'}</div>
          </div>
          <div class="deliverable-actions">
            ${internal ? (item.archived ? `<button class="button button-primary" id="restore-deliverable">${icon('restore')} Restaurar entregable</button>` : `<button class="button button-secondary" id="edit-deliverable">${icon('edit')} Editar</button><button class="button button-secondary" id="archive-deliverable">${icon('archive')} Archivar</button>${item.status !== 'in_review' && item.status !== 'approved' ? `<button class="button button-primary" id="request-deliverable-review">${icon('eye')} Enviar a revisión</button>` : ''}`) : ''}
            ${reviewer && item.status === 'in_review' ? `<button class="button button-secondary" id="request-deliverable-changes">Solicitar cambios</button><button class="button button-primary" id="approve-deliverable">${icon('check')} Aprobar entregable</button>` : ''}
          </div>
        </section>
        <aside class="deliverable-comments-panel"><h3>Comentarios</h3><div class="deliverable-comments">${(item.comments || []).length ? item.comments.map(comment => `<article class="deliverable-comment"><div><strong>${escapeHtml(comment.authorName)}</strong><span>${formatDate(comment.createdAt)}</span></div><p>${escapeHtml(comment.text)}</p></article>`).join('') : '<p class="muted-copy">No hay comentarios todavía.</p>'}</div>${commenter ? `<form id="deliverable-comment-form"><label class="form-field"><span>Agregar comentario</span><textarea class="textarea" name="comment" rows="3" placeholder="Escribe observaciones claras..."></textarea></label><button class="button button-secondary button-full">${icon('message')} Comentar</button></form>` : ''}</aside>
      </div>`, size: 'xl', closeOnBackdrop: false
    });

    const refresh = async () => {
      modal.close();
      await onChanged?.();
      openDeliverableDetail({ deliverableId, context, session, onChanged });
    };

    modal.root.querySelector('#add-deliverable-version')?.addEventListener('click', () => openVersionForm({ item, context, session, onSaved: refresh }));
    modal.root.querySelector('#edit-deliverable')?.addEventListener('click', async () => {
      modal.close();
      const project = await ProjectService.getProject({ projectId: item.projectId, session });
      openDeliverableForm({ context, session, project, deliverable: item, onSaved: onChanged });
    });
    modal.root.querySelector('#request-deliverable-review')?.addEventListener('click', async () => {
      try { await DeliverableService.requestReview({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, session }); showToast('Entregable enviado a revisión.'); await refresh(); }
      catch (error) { showToast(error.message); }
    });
    modal.root.querySelector('#approve-deliverable')?.addEventListener('click', async () => {
      const confirmed = await confirmModal({ title: 'Aprobar entregable', message: 'La versión actual quedará registrada como aprobada.', confirmLabel: 'Aprobar' });
      if (!confirmed) return;
      try { await DeliverableService.approve({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, session }); showToast('Entregable aprobado.'); await refresh(); }
      catch (error) { showToast(error.message); }
    });
    modal.root.querySelector('#request-deliverable-changes')?.addEventListener('click', () => openChangesForm({ item, context, session, onSaved: refresh }));
    modal.root.querySelector('#restore-deliverable')?.addEventListener('click', async () => {
      try {
        await DeliverableService.restoreDeliverable({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, session });
        modal.close(); showToast('Entregable restaurado.'); await onChanged?.();
      } catch (error) { showToast(error.message); }
    });
    modal.root.querySelector('#archive-deliverable')?.addEventListener('click', async () => {
      const confirmed = await confirmModal({ title: 'Archivar entregable', message: 'Se ocultará del listado activo, sin eliminar su historial.', confirmLabel: 'Archivar', danger: true });
      if (!confirmed) return;
      await DeliverableService.archiveDeliverable({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, session });
      modal.close(); showToast('Entregable archivado.'); await onChanged?.();
    });
    modal.root.querySelectorAll('[data-checklist-id]').forEach(input => input.addEventListener('change', async () => {
      try { await DeliverableService.toggleChecklist({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, checklistId: input.dataset.checklistId, done: input.checked, session }); input.closest('.deliverable-check')?.classList.toggle('is-done', input.checked); }
      catch (error) { input.checked = !input.checked; showToast(error.message); }
    }));
    modal.root.querySelector('#deliverable-comment-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const text = normalizeText(new FormData(form).get('comment'), 2000);
      if (!text) return;
      try { await DeliverableService.addComment({ deliverableId, workspaceId: item.workspaceId, projectId: item.projectId, text, session }); showToast('Comentario agregado.'); await refresh(); }
      catch (error) { showToast(error.message); }
    });
  } catch (error) {
    showToast(error.message || 'No se pudo abrir el entregable.');
  }
}

function openVersionForm({ item, context, session, onSaved }) {
  const modal = openModal({
    title: 'Registrar nueva versión', subtitle: item.title,
    body: `<form id="version-form" class="project-form" novalidate><div class="form-grid form-grid-2">
      <label class="form-field"><span>Nombre de versión</span><input class="input" name="label" placeholder="Ej.: Versión 3"></label>
      <label class="form-field"><span>Tipo de archivo</span><select class="select" name="fileType"><option>Figma</option><option>Google Drive</option><option>Sitio web</option><option>PDF</option><option>Video</option><option>Otro</option></select></label>
      <label class="form-field form-span-2"><span>Nombre visible *</span><input class="input" name="fileName" required></label>
      <label class="form-field form-span-2"><span>URL *</span><input class="input" type="url" name="url" placeholder="https://..."><small data-error-for="url"></small></label>
      <label class="form-field form-span-2"><span>Notas de versión</span><textarea class="textarea" name="notes" rows="3"></textarea></label>
    </div><div class="form-global-error hidden" id="version-error"></div><div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button class="button button-primary">Registrar versión</button></div></form>`,
    size: 'md', closeOnBackdrop: false
  });
  const form = modal.root.querySelector('#version-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const input = { label: normalizeText(raw.label, 120), fileName: normalizeText(raw.fileName, 180), fileType: normalizeText(raw.fileType, 60), url: normalizeUrl(raw.url), notes: normalizeText(raw.notes, 1000) };
    form.querySelector('[data-error-for="url"]').textContent = input.url ? '' : 'Ingresa un enlace válido con https://';
    if (!input.fileName || !input.url) return;
    try { await DeliverableService.addVersion({ deliverableId: item.id, workspaceId: item.workspaceId || context.workspaceId, projectId: item.projectId || context.projectId, input, session }); modal.close(); showToast('Versión registrada.'); await onSaved?.(); }
    catch (error) { const slot = form.querySelector('#version-error'); slot.textContent = error.message; slot.classList.remove('hidden'); }
  });
}

function openChangesForm({ item, context, session, onSaved }) {
  const modal = openModal({
    title: 'Solicitar cambios', subtitle: item.title,
    body: `<form id="changes-form"><label class="form-field"><span>¿Qué debe ajustarse? *</span><textarea class="textarea" name="feedback" rows="6" placeholder="Describe el cambio, dónde se encuentra y qué resultado esperas."></textarea></label><div class="form-global-error hidden" id="changes-error"></div><div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button class="button button-primary">Enviar solicitud</button></div></form>`,
    size: 'md', closeOnBackdrop: false
  });
  modal.root.querySelector('#changes-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = normalizeText(new FormData(form).get('feedback'), 2000);
    if (feedback.length < 3) { const slot = form.querySelector('#changes-error'); slot.textContent = 'Describe el cambio solicitado.'; slot.classList.remove('hidden'); return; }
    try { await DeliverableService.requestChanges({ deliverableId: item.id, workspaceId: item.workspaceId || context.workspaceId, projectId: item.projectId || context.projectId, feedback, session }); modal.close(); showToast('Solicitud de cambios enviada.'); await onSaved?.(); }
    catch (error) { const slot = form.querySelector('#changes-error'); slot.textContent = error.message; slot.classList.remove('hidden'); }
  });
}
