import { AiUsageService } from '../services/ai-usage-service.js?v=12.5.0';
import { openModal } from '../components/modal.js?v=12.5.0';
import { showToast } from '../components/toast.js?v=12.5.0';
import { escapeHtml } from '../utils/format.js?v=12.5.0';
import { icon } from '../utils/icons.js?v=12.5.0';

let active = true;
let state = {
  days: 7,
  uid: '',
  workspaceId: '',
  projectId: '',
  canvasId: '',
  result: null
};

function integer(value) {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function decimal(value, digits = 1) {
  return new Intl.NumberFormat('es-PE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value || 0));
}

function money(value) {
  const number = Number(value || 0);
  const digits = number < 0.01 ? 4 : 2;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(number);
}

function option(value, label, selected = '') {
  return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function budgetBadge(percent) {
  if (percent >= 90) return '<span class="badge badge-danger">Atención</span>';
  if (percent >= 50) return '<span class="badge badge-warning">En seguimiento</span>';
  return '<span class="badge badge-success">Controlado</span>';
}

function userUsageBadge(averageRequestsPerDay = 0) {
  const average = Number(averageRequestsPerDay || 0);
  if (average > 150) return `<span class="badge badge-danger" title="${decimal(average)} consultas por día en promedio">Excepcional</span>`;
  if (average > 50) return `<span class="badge badge-warning" title="${decimal(average)} consultas por día en promedio">Intensivo</span>`;
  return `<span class="badge badge-success" title="${decimal(average)} consultas por día en promedio">Normal</span>`;
}

function renderFilters(container, dimensions, users) {
  const host = container.querySelector('#ai-usage-filters');
  if (!host) return;
  const workspaces = dimensions?.workspaces || [];
  const projects = (dimensions?.projects || []).filter(item => !state.workspaceId || item.workspaceId === state.workspaceId);
  const canvases = (dimensions?.canvases || []).filter(item => {
    if (state.workspaceId && item.workspaceId !== state.workspaceId) return false;
    if (state.projectId && item.projectId !== state.projectId) return false;
    return true;
  });
  host.innerHTML = `
    <label><span>Periodo</span><select class="select" id="ai-filter-days">
      ${option('1', 'Hoy', String(state.days))}
      ${option('7', 'Últimos 7 días', String(state.days))}
      ${option('30', 'Últimos 30 días', String(state.days))}
    </select></label>
    <label><span>Usuario</span><select class="select" id="ai-filter-user">${option('', 'Todos los usuarios', state.uid)}${users.map(item => option(item.uid, item.name || item.email || item.uid, state.uid)).join('')}</select></label>
    <label><span>Workspace</span><select class="select" id="ai-filter-workspace">${option('', 'Todos los workspaces', state.workspaceId)}${workspaces.map(item => option(item.id, item.name, state.workspaceId)).join('')}</select></label>
    <label><span>Proyecto</span><select class="select" id="ai-filter-project">${option('', 'Todos los proyectos', state.projectId)}${projects.map(item => option(item.id, item.name, state.projectId)).join('')}</select></label>
    <label><span>Lienzo</span><select class="select" id="ai-filter-canvas">${option('', 'Todos los lienzos', state.canvasId)}${canvases.map(item => option(item.id, item.name, state.canvasId)).join('')}</select></label>`;

  host.querySelector('#ai-filter-days')?.addEventListener('change', event => { state.days = Number(event.target.value || 7); refresh(container); });
  host.querySelector('#ai-filter-user')?.addEventListener('change', event => { state.uid = event.target.value; refresh(container); });
  host.querySelector('#ai-filter-workspace')?.addEventListener('change', event => {
    state.workspaceId = event.target.value;
    state.projectId = '';
    state.canvasId = '';
    refresh(container);
  });
  host.querySelector('#ai-filter-project')?.addEventListener('change', event => {
    state.projectId = event.target.value;
    state.canvasId = '';
    refresh(container);
  });
  host.querySelector('#ai-filter-canvas')?.addEventListener('change', event => { state.canvasId = event.target.value; refresh(container); });
}

function renderStats(container, result) {
  const totals = result.totals || {};
  const host = container.querySelector('#ai-usage-stats');
  if (!host) return;
  host.innerHTML = `
    <article><strong>${integer(totals.requests)}</strong><span>Consultas exitosas</span></article>
    <article><strong>${integer(totals.failedRequests)}</strong><span>Errores / bloqueos API</span></article>
    <article><strong>${integer(totals.totalTokens)}</strong><span>Tokens procesados</span></article>
    <article><strong>${money(totals.estimatedCostUsd)}</strong><span>Costo estimado</span></article>
    <article><strong>${integer(totals.acceptedNotes)}</strong><span>Notas aceptadas</span></article>
    <article><strong>${decimal(totals.acceptanceRate || 0)}%</strong><span>Tasa de aceptación</span></article>`;
}

function renderBudget(container, result) {
  const month = result.month || {};
  const settings = result.settings || {};
  const percent = Number(month.budgetPercent || 0);
  const host = container.querySelector('#ai-budget-card');
  if (!host) return;
  host.innerHTML = `
    <div class="ai-budget-copy">
      <div class="panel-heading compact"><div><span class="panel-kicker">CONTROL GLOBAL</span><h2>Presupuesto IA del mes</h2></div>${budgetBadge(percent)}</div>
      <div class="ai-budget-values"><strong>${money(month.costUsd)}</strong><span>de ${money(settings.monthlyBudgetUsd || 10)} estimados</span></div>
      <div class="ai-budget-track" role="progressbar" aria-label="Consumo estimado del presupuesto IA" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(percent))}"><i style="width:${Math.min(100, Math.max(0, percent))}%"></i></div>
      <div class="ai-budget-meta"><span>${decimal(percent)}% utilizado</span><span>${integer(month.requests)} consultas este mes</span><span>Acción al 100%: solo alertar</span></div>
    </div>
    <div class="ai-budget-status ${settings.enabled === false ? 'is-paused' : ''}">
      <strong>${settings.enabled === false ? 'AI Coach pausado' : 'AI Coach activo'}</strong>
      <span>Usuarios: sin límite de consultas durante el piloto.</span>
      <button class="button button-secondary button-sm" id="ai-settings-button" type="button">${icon('settings')} Configurar</button>
    </div>`;
  host.querySelector('#ai-settings-button')?.addEventListener('click', () => openSettings(container, result));
}

function renderUsers(container, result) {
  const host = container.querySelector('#ai-users-table');
  if (!host) return;
  const users = result.users || [];
  if (!users.length) {
    host.innerHTML = '<div class="empty-state compact"><h3>Sin uso en este periodo</h3><p>Las métricas aparecerán después de las primeras consultas a WonkUp AI Coach.</p></div>';
    return;
  }
  host.innerHTML = `<div class="ai-usage-table-wrap"><table class="ai-usage-table"><thead><tr><th>Usuario</th><th>Indicador</th><th>Consultas</th><th>Participación</th><th>Tokens</th><th>Costo est.</th><th>Aceptadas</th><th>Tasa</th></tr></thead><tbody>${users.map(user => `
    <tr>
      <td><strong>${escapeHtml(user.name || 'Usuario')}</strong><small>${escapeHtml(user.email || '')}</small></td>
      <td>${userUsageBadge(user.averageRequestsPerDay)}</td>
      <td>${integer(user.requests)}${user.failedRequests ? `<small>${integer(user.failedRequests)} error${user.failedRequests === 1 ? '' : 'es'}</small>` : ''}</td>
      <td><div class="ai-share-cell"><span>${decimal(user.usageShare || 0)}%</span><i><b style="width:${Math.min(100, Number(user.usageShare || 0))}%"></b></i></div></td>
      <td>${integer(user.totalTokens)}</td>
      <td>${money(user.estimatedCostUsd)}</td>
      <td>${integer(user.acceptedNotes)} / ${integer(user.suggestionsProposed)}</td>
      <td>${decimal(user.acceptanceRate || 0)}%</td>
    </tr>`).join('')}</tbody></table></div>`;
}

function renderActions(container, result) {
  const host = container.querySelector('#ai-action-breakdown');
  if (!host) return;
  const actions = result.actions || {};
  const total = Math.max(1, Number(result.totals?.requests || 0));
  const rows = [
    ['Preguntas guía', Number(actions.questions || 0), '🧭'],
    ['Proponer notas', Number(actions.suggest || 0), '✨'],
    ['Revisar sección', Number(actions.review || 0), '🔎']
  ];
  host.innerHTML = rows.map(([label, count, emoji]) => `<article><span>${emoji}</span><div><strong>${escapeHtml(label)}</strong><small>${integer(count)} consultas · ${decimal((count / total) * 100)}%</small><i><b style="width:${Math.min(100, (count / total) * 100)}%"></b></i></div></article>`).join('');
}

function renderTopCanvases(container, result) {
  const host = container.querySelector('#ai-top-canvases');
  if (!host) return;
  const items = result.topCanvases || [];
  if (!items.length) {
    host.innerHTML = '<p class="muted-copy">Todavía no hay lienzos con actividad de IA en este periodo.</p>';
    return;
  }
  host.innerHTML = items.map((item, index) => `<article><span class="ai-rank">${index + 1}</span><div><strong>${escapeHtml(item.name || 'Lienzo')}</strong><small>${integer(item.requests)} consultas · ${money(item.estimatedCostUsd)}</small></div></article>`).join('');
}

function openSettings(container, result) {
  const settings = result.settings || {};
  const modal = openModal({
    title: 'Configuración de WonkUp AI Coach',
    subtitle: 'Durante el piloto no existen límites por usuario. El presupuesto es un indicador de control y no bloquea el servicio.',
    body: `<form id="ai-settings-form" class="form-grid" novalidate>
      <label class="field field-full"><span>Presupuesto mensual de referencia (USD)</span><input class="input" id="ai-monthly-budget" type="number" min="0" max="10000" step="1" value="${Number(settings.monthlyBudgetUsd || 10)}"><small class="field-help">Se usa para alertas y seguimiento. Llegar al 100% no suspende automáticamente la IA.</small></label>
      <label class="ai-settings-toggle field-full"><input id="ai-enabled" type="checkbox" ${settings.enabled === false ? '' : 'checked'}><span><strong>AI Coach activo</strong><small>Desmárcalo solo como corte de emergencia.</small></span></label>
      <div class="ai-alert-thresholds field-full"><strong>Alertas informativas</strong><span>50% · 75% · 90% · 100%</span></div>
      <div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">Guardar configuración</button></div>
    </form>`
  });
  modal.root.querySelector('#ai-settings-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      await AiUsageService.updateSettings({
        monthlyBudgetUsd: Number(modal.root.querySelector('#ai-monthly-budget')?.value || 0),
        enabled: Boolean(modal.root.querySelector('#ai-enabled')?.checked)
      });
      modal.close();
      showToast('Configuración de IA actualizada.');
      await refresh(container);
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar la configuración.', { type: 'error' });
      if (button) button.disabled = false;
    }
  });
}

function renderResult(container, result) {
  state.result = result;
  const unfilteredUsers = result.users || [];
  renderFilters(container, result.dimensions || {}, unfilteredUsers);
  renderStats(container, result);
  renderBudget(container, result);
  renderUsers(container, result);
  renderActions(container, result);
  renderTopCanvases(container, result);
  const version = container.querySelector('#ai-functions-version');
  if (version) version.textContent = `Functions ${result.release || 'activa'}`;
}

async function refresh(container) {
  const status = container.querySelector('#ai-usage-status');
  if (status) status.innerHTML = '<span class="spinner spinner-blue"></span> Actualizando métricas...';
  try {
    const result = await AiUsageService.summary({
      days: state.days,
      uid: state.uid,
      workspaceId: state.workspaceId,
      projectId: state.projectId,
      canvasId: state.canvasId
    });
    if (!active || !container.isConnected) return;
    renderResult(container, result);
    if (status) status.textContent = `Actualizado · periodo de ${state.days === 1 ? 'hoy' : `${state.days} días`}`;
  } catch (error) {
    if (!active || !container.isConnected) return;
    if (status) status.innerHTML = `<span class="text-danger">${escapeHtml(error.message || 'No se pudieron cargar las métricas.')}</span>`;
  }
}

export async function renderAiAdmin(container) {
  active = true;
  state = { days: 7, uid: '', workspaceId: '', projectId: '', canvasId: '', result: null };
  container.innerHTML = `
    <section class="page ai-admin-page">
      <header class="page-header ai-admin-header">
        <div><span class="eyebrow">ADMINISTRACIÓN</span><h1>IA y consumo</h1><p>Mide quién usa WonkUp AI Coach, cuánto cuesta y qué porcentaje de las propuestas termina incorporándose a los lienzos.</p></div>
        <div class="page-actions"><span class="badge badge-success" id="ai-functions-version">Cloud Functions</span><button class="button button-secondary" id="refresh-ai-usage" type="button">${icon('refresh')} Actualizar</button></div>
      </header>
      <div class="ai-pilot-note">${icon('activity')}<div><strong>Piloto sin límites por usuario</strong><span>No se bloquean consultas por cantidad. WonkUp registra consumo, tokens, costo estimado, errores y aceptación de propuestas para decidir límites con evidencia real.</span></div></div>
      <section class="panel ai-budget-card" id="ai-budget-card"><div class="cloud-loading"><span class="spinner spinner-blue"></span> Cargando control global...</div></section>
      <section class="ai-usage-stats" id="ai-usage-stats">${Array.from({ length: 6 }).map(() => '<article><strong>—</strong><span>Cargando</span></article>').join('')}</section>
      <section class="panel ai-filter-panel"><div class="panel-heading"><div><span class="panel-kicker">FILTROS</span><h2>Analizar consumo</h2></div><div class="ai-usage-status" id="ai-usage-status" role="status" aria-live="polite"></div></div><div class="ai-usage-filters" id="ai-usage-filters"></div></section>
      <section class="panel ai-users-panel"><div class="panel-heading"><div><span class="panel-kicker">POR USUARIO</span><h2>Quién está usando más la IA</h2><p>Participación, costo y valor generado durante el periodo seleccionado.</p></div></div><div id="ai-users-table"><div class="cloud-loading"><span class="spinner spinner-blue"></span> Cargando usuarios...</div></div></section>
      <div class="ai-admin-grid">
        <section class="panel"><div class="panel-heading"><div><span class="panel-kicker">TIPO DE USO</span><h2>Acciones del AI Coach</h2></div></div><div class="ai-action-breakdown" id="ai-action-breakdown"></div></section>
        <section class="panel"><div class="panel-heading"><div><span class="panel-kicker">LIENZOS</span><h2>Lienzos con mayor uso</h2></div></div><div class="ai-top-canvases" id="ai-top-canvases"></div></section>
      </div>
      <p class="ai-cost-disclaimer">Costo estimado calculado a partir de los tokens reportados por Gemini y la tarifa configurada en WonkUp. La factura de Google Cloud es la fuente contable definitiva.</p>
    </section>`;
  container.querySelector('#refresh-ai-usage')?.addEventListener('click', () => refresh(container));
  await refresh(container);
}

export function cleanupAiAdminView() {
  active = false;
}
