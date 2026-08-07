import { ReportService } from '../services/report-service.js?v=12.4.0';
import { canViewFinancials } from '../utils/permissions.js?v=12.4.0';
import { icon } from '../utils/icons.js?v=12.4.0';
import { escapeHtml, formatCurrency, formatDate } from '../utils/format.js?v=12.4.0';
import { showToast } from '../components/toast.js?v=12.4.0';

const STATUS_LABELS = {
  all: 'Todos los estados',
  active: 'En desarrollo',
  pending_client: 'En revisión',
  planned: 'Planeamiento',
  blocked: 'Bloqueado',
  completed: 'Completado'
};

const PROJECT_STATUS = {
  active: ['En desarrollo', 'badge-blue'],
  pending_client: ['En revisión', 'badge-orange'],
  planned: ['Planeamiento', 'badge-violet'],
  blocked: ['Bloqueado', 'badge-red'],
  completed: ['Completado', 'badge-green']
};

const RISK_LABELS = {
  critical: ['Crítico', 'badge-red'],
  warning: ['En riesgo', 'badge-orange'],
  watch: ['Observar', 'badge-gold'],
  stable: ['Estable', 'badge-green']
};

let cleanupReports = null;

export function cleanupReportsView() {
  cleanupReports?.();
  cleanupReports = null;
}

export function renderReports(container, workspaceId, session) {
  cleanupReportsView();
  const state = { period: '90d', status: 'all', tab: 'executive', report: null, loading: false };
  container.innerHTML = loadingPanel('Preparando reportes...');
  const unsubscribe = ReportService.subscribe(() => {
    if (container.isConnected) loadReports(container, workspaceId, session, state, { silent: true });
  });
  cleanupReports = () => unsubscribe?.();
  globalThis.__wonkupCleanupReports = cleanupReportsView;
  loadReports(container, workspaceId, session, state);
}

async function loadReports(container, workspaceId, session, state, { silent = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  if (!silent) container.innerHTML = loadingPanel('Consolidando proyectos, entregables y finanzas...');
  try {
    const report = await ReportService.getPortfolioReport({ workspaceId, session, period: state.period, status: state.status });
    if (!container.isConnected) return;
    state.report = report;
    renderReportShell(container, workspaceId, session, state);
  } catch (error) {
    if (!container.isConnected) return;
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h1>No se pudieron generar los reportes</h1><p>${escapeHtml(error.message)}</p></div></section>`;
  } finally {
    state.loading = false;
  }
}

function renderReportShell(container, workspaceId, session, state) {
  const report = state.report;
  const financial = canViewFinancials(session);
  const workspaceLabel = workspaceId === 'all' ? 'Portafolio maestro' : 'Workspace actual';
  const tabs = [
    ['executive', 'Ejecutivo'],
    ['projects', 'Proyectos'],
    ['delivery', 'Entregables'],
    ...(financial ? [['finance', 'Finanzas']] : [])
  ];
  if (!tabs.some(([key]) => key === state.tab)) state.tab = 'executive';

  container.innerHTML = `<section class="page reports-page" data-report-root>
    <div class="page-header reports-page-header">
      <div>
        <span class="page-kicker">${icon('chart')} ${workspaceLabel}</span>
        <h1>Dashboard y reportes</h1>
        <p>Indicadores ejecutivos, riesgos, entregables y desempeño del portafolio.</p>
      </div>
      <div class="page-header-actions reports-actions">
        <button class="button button-secondary" id="reports-csv">${icon('download')} Exportar CSV</button>
        <button class="button button-primary" id="reports-print">${icon('file')} Imprimir / PDF</button>
      </div>
    </div>

    <article class="reports-filter-panel">
      <div class="reports-filter-copy"><strong>Vista consolidada</strong><span>Actualizada ${new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generatedAt))}</span></div>
      <label><span>Periodo</span><select class="select" id="reports-period"><option value="month" ${state.period === 'month' ? 'selected' : ''}>Mes actual</option><option value="30d" ${state.period === '30d' ? 'selected' : ''}>Últimos 30 días</option><option value="90d" ${state.period === '90d' ? 'selected' : ''}>Últimos 90 días</option><option value="180d" ${state.period === '180d' ? 'selected' : ''}>Últimos 180 días</option><option value="year" ${state.period === 'year' ? 'selected' : ''}>Año actual</option><option value="all" ${state.period === 'all' ? 'selected' : ''}>Todo el historial</option></select></label>
      <label><span>Estado</span><select class="select" id="reports-status">${Object.entries(STATUS_LABELS).map(([key, label]) => `<option value="${key}" ${state.status === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <button class="icon-button" id="reports-refresh" aria-label="Actualizar reportes" title="Actualizar">${icon('refresh')}</button>
    </article>

    <nav class="reports-tabs" aria-label="Tipos de reporte">${tabs.map(([key, label]) => `<button class="reports-tab ${state.tab === key ? 'active' : ''}" data-report-tab="${key}" ${state.tab === key ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
    <div id="reports-content">${renderReportTab(report, state.tab, financial)}</div>
    <footer class="reports-footer"><span>Periodo: ${escapeHtml(report.period.label)}</span><span>Fuente: módulos operativos WonkUp · modo demo local</span></footer>
  </section>`;

  bindReportEvents(container, workspaceId, session, state);
}

function bindReportEvents(container, workspaceId, session, state) {
  container.querySelector('#reports-period')?.addEventListener('change', event => {
    state.period = event.target.value;
    loadReports(container, workspaceId, session, state);
  });
  container.querySelector('#reports-status')?.addEventListener('change', event => {
    state.status = event.target.value;
    loadReports(container, workspaceId, session, state);
  });
  container.querySelector('#reports-refresh')?.addEventListener('click', () => loadReports(container, workspaceId, session, state));
  container.querySelectorAll('[data-report-tab]').forEach(button => button.addEventListener('click', () => {
    state.tab = button.dataset.reportTab;
    container.querySelectorAll('[data-report-tab]').forEach(item => item.classList.toggle('active', item === button));
    const slot = container.querySelector('#reports-content');
    if (slot) slot.innerHTML = renderReportTab(state.report, state.tab, canViewFinancials(session));
  }));
  container.querySelector('#reports-print')?.addEventListener('click', () => {
    document.body.classList.add('reports-printing');
    const cleanup = () => document.body.classList.remove('reports-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => window.print(), 40);
    setTimeout(cleanup, 3000);
  });
  container.querySelector('#reports-csv')?.addEventListener('click', () => exportCsv(state.report, state.tab, canViewFinancials(session)));
}

function renderReportTab(report, tab, financial) {
  if (tab === 'projects') return renderProjectsReport(report, financial);
  if (tab === 'delivery') return renderDeliveryReport(report);
  if (tab === 'finance' && financial) return renderFinanceReport(report);
  return renderExecutiveReport(report, financial);
}

function renderExecutiveReport(report, financial) {
  const metrics = report.metrics;
  return `<div class="reports-stack">
    <div class="reports-kpi-grid">
      ${kpi('briefcase', metrics.projectCount, 'Proyectos visibles', `${metrics.active} en ejecución`, 'blue')}
      ${kpi('activity', `${metrics.avgProgress}%`, 'Avance promedio', `${metrics.completed} completados`, 'green')}
      ${kpi('alert', metrics.atRisk, 'Proyectos en riesgo', `${metrics.overdueTasks} tareas vencidas`, metrics.atRisk ? 'danger' : 'green')}
      ${kpi('eye', metrics.inReviewDeliverables, 'En revisión', `${metrics.approvedDeliverables} entregables aprobados`, 'gold')}
      ${financial ? kpi('wallet', formatCurrency(metrics.received), 'Ingresos recibidos', `${formatCurrency(metrics.outstanding)} por cobrar`, 'blue') : kpi('clock', metrics.actualHours, 'Horas registradas', `${metrics.hoursUsedPercent}% de lo planificado`, 'blue')}
      ${financial ? kpi('chart', `${metrics.expectedMargin}%`, 'Margen proyectado', `${formatCurrency(metrics.expectedProfit)} de utilidad`, metrics.expectedMargin >= 25 ? 'green' : 'danger') : kpi('calendar', metrics.dueSoonTasks, 'Próximos vencimientos', 'Siguientes 7 días', 'gold')}
    </div>

    <div class="reports-two-column">
      <article class="panel report-panel"><div class="panel-header"><div><h2>Progreso del portafolio</h2><p>Distribución por estado actual.</p></div></div><div class="panel-body">${renderBreakdown(report.statusBreakdown, 'project')}</div></article>
      <article class="panel report-panel"><div class="panel-header"><div><h2>Flujo de entregables</h2><p>Estado de las entregas visibles.</p></div></div><div class="panel-body">${renderBreakdown(report.deliveryBreakdown, 'delivery')}</div></article>
    </div>

    ${financial ? `<article class="panel report-panel"><div class="panel-header"><div><h2>Tendencia financiera y de horas</h2><p>${escapeHtml(report.period.label)}.</p></div></div><div class="panel-body">${renderTrend(report.trend, true)}</div></article>` : ''}

    <div class="reports-two-column">
      <article class="panel report-panel"><div class="panel-header"><div><h2>Proyectos que requieren atención</h2><p>Priorizados por riesgo operativo y financiero.</p></div><a class="panel-link" href="#">${report.riskProjects.length} detectados</a></div><div class="panel-body report-risk-list">${report.riskProjects.map(renderRiskRow).join('') || emptyInline('No se detectaron riesgos relevantes.')}</div></article>
      <article class="panel report-panel"><div class="panel-header"><div><h2>Próximos vencimientos</h2><p>Tareas y entregables más cercanos.</p></div></div><div class="panel-body report-deadline-list">${report.upcoming.map(item => renderDeadline(item, report.projects)).join('') || emptyInline('No hay vencimientos registrados.')}</div></article>
    </div>

    ${renderPortfolioTable(report.projectRows.slice(0, 8), financial, 'Vista ejecutiva por proyecto')}
  </div>`;
}

function renderProjectsReport(report, financial) {
  const avgTasks = report.metrics.projectCount ? Math.round(report.tasks.length / report.metrics.projectCount) : 0;
  return `<div class="reports-stack">
    <div class="reports-kpi-grid reports-kpi-grid-4">
      ${kpi('briefcase', report.metrics.projectCount, 'Proyectos', report.period.label, 'blue')}
      ${kpi('activity', `${report.metrics.avgProgress}%`, 'Avance promedio', 'Portafolio filtrado', 'green')}
      ${kpi('checkSquare', avgTasks, 'Tareas promedio', `${report.metrics.overdueTasks} vencidas`, 'gold')}
      ${kpi('alert', report.metrics.atRisk, 'Con riesgo', 'Requieren seguimiento', report.metrics.atRisk ? 'danger' : 'green')}
    </div>
    ${renderPortfolioTable(report.projectRows, financial, 'Comparativo completo de proyectos')}
  </div>`;
}

function renderDeliveryReport(report) {
  const total = Math.max(1, report.metrics.deliverableCount);
  const approvalRate = Math.round((report.metrics.approvedDeliverables / total) * 100);
  const checklistTotal = report.deliverables.reduce((sum, item) => sum + (item.checklist || []).length, 0);
  const checklistDone = report.deliverables.reduce((sum, item) => sum + (item.checklist || []).filter(check => check.done).length, 0);
  const checklistRate = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  return `<div class="reports-stack">
    <div class="reports-kpi-grid reports-kpi-grid-4">
      ${kpi('file', report.metrics.deliverableCount, 'Entregables', report.period.label, 'blue')}
      ${kpi('eye', report.metrics.inReviewDeliverables, 'En revisión', 'Esperando decisión', 'gold')}
      ${kpi('check', `${approvalRate}%`, 'Tasa de aprobación', `${report.metrics.approvedDeliverables} aprobados`, 'green')}
      ${kpi('alert', report.metrics.overdueDeliverables, 'Entregables vencidos', `${checklistRate}% de checklist`, report.metrics.overdueDeliverables ? 'danger' : 'green')}
    </div>
    <article class="panel report-panel"><div class="panel-header"><div><h2>Estado de entregables</h2><p>Seguimiento de revisión, aprobación y fechas.</p></div></div><div class="panel-body finance-table-wrap"><table class="finance-table reports-table"><thead><tr><th>Entregable</th><th>Proyecto</th><th>Estado</th><th>Checklist</th><th>Versiones</th><th>Entrega</th></tr></thead><tbody>${report.deliverables.map(item => {
      const project = report.projects.find(projectItem => projectItem.id === item.projectId);
      const totalChecks = (item.checklist || []).length;
      const doneChecks = (item.checklist || []).filter(check => check.done).length;
      const status = deliverableStatus(item.status);
      return `<tr><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.ownerName || 'Sin responsable')}</small></td><td>${escapeHtml(project?.name || item.projectId)}</td><td><span class="badge ${status[1]}">${status[0]}</span></td><td>${doneChecks}/${totalChecks || 0}</td><td>${(item.versions || []).length}</td><td>${formatDate(item.dueDate)}</td></tr>`;
    }).join('') || `<tr><td colspan="6">${emptyInline('No hay entregables para este filtro.')}</td></tr>`}</tbody></table></div></article>
  </div>`;
}

function renderFinanceReport(report) {
  const metrics = report.metrics;
  return `<div class="reports-stack">
    <div class="reports-kpi-grid">
      ${kpi('wallet', formatCurrency(metrics.totalBillable), 'Total facturable', report.period.label, 'blue')}
      ${kpi('check', formatCurrency(metrics.received), 'Cobrado', `${Math.round(metrics.totalBillable ? metrics.received / metrics.totalBillable * 100 : 0)}% del total`, 'green')}
      ${kpi('clock', formatCurrency(metrics.outstanding), 'Saldo por cobrar', `${metrics.overdueTasks} tareas vencidas`, 'gold')}
      ${kpi('chart', formatCurrency(metrics.realCost), 'Costo real', `${metrics.actualHours} horas`, 'blue')}
      ${kpi('activity', formatCurrency(metrics.expectedProfit), 'Utilidad proyectada', `${metrics.expectedMargin}% de margen`, metrics.expectedProfit >= 0 ? 'green' : 'danger')}
      ${kpi('alert', `${metrics.hoursUsedPercent}%`, 'Consumo de horas', `${metrics.actualHours} de ${metrics.plannedHours} h`, metrics.hoursUsedPercent > 100 ? 'danger' : 'gold')}
    </div>
    <article class="panel report-panel"><div class="panel-header"><div><h2>Ingresos, costos y horas por mes</h2><p>${escapeHtml(report.period.label)}.</p></div></div><div class="panel-body">${renderTrend(report.trend, true)}</div></article>
    ${renderPortfolioTable(report.projectRows, true, 'Rentabilidad por proyecto')}
  </div>`;
}

function renderPortfolioTable(rows, financial, title) {
  return `<article class="panel report-panel"><div class="panel-header"><div><h2>${escapeHtml(title)}</h2><p>Indicadores comparables y acceso al detalle.</p></div></div><div class="panel-body finance-table-wrap"><table class="finance-table reports-table"><thead><tr><th>Proyecto</th><th>Estado</th><th>Riesgo</th><th>Avance</th><th>Tareas</th><th>Entregables</th>${financial ? '<th>Cobrado</th><th>Costo</th><th>Margen</th>' : '<th>Horas</th>'}<th></th></tr></thead><tbody>${rows.map(row => {
    const status = PROJECT_STATUS[row.status] || [row.status, 'badge-gray'];
    const risk = RISK_LABELS[row.risk.level] || RISK_LABELS.stable;
    return `<tr><td><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.owner)} · ${formatDate(row.dueDate)}</small></td><td><span class="badge ${status[1]}">${status[0]}</span></td><td><span class="badge ${risk[1]}">${risk[0]}</span></td><td><div class="report-progress"><span style="width:${Math.min(100, row.progress)}%"></span></div><small>${row.progress}%</small></td><td>${row.pendingTasks}${row.overdueTasks ? `<small class="report-danger-copy">${row.overdueTasks} vencida${row.overdueTasks === 1 ? '' : 's'}</small>` : ''}</td><td>${row.deliverables}<small>${row.inReviewDeliverables} en revisión</small></td>${financial ? `<td class="finance-number">${formatCurrency(row.received)}</td><td class="finance-number">${formatCurrency(row.realCost)}</td><td><strong class="${row.expectedMargin < 20 ? 'report-danger-copy' : 'report-positive-copy'}">${row.expectedMargin}%</strong></td>` : `<td>${row.actualHours} h<small>de ${row.plannedHours || '-'} h</small></td>`}<td><a class="icon-button" href="#/w/${row.workspaceId}/p/${row.id}/summary" aria-label="Abrir proyecto">${icon('arrowRight')}</a></td></tr>`;
  }).join('') || `<tr><td colspan="10">${emptyInline('No hay proyectos para este filtro.')}</td></tr>`}</tbody></table></div></article>`;
}

function renderTrend(trend, financial) {
  const maxMoney = Math.max(1, ...trend.flatMap(item => [item.income, item.costs]));
  const maxHours = Math.max(1, ...trend.map(item => item.hours));
  return `<div class="report-trend" role="img" aria-label="Tendencia de ingresos, costos y horas">${trend.map(item => `<div class="report-trend-column"><div class="report-trend-bars">${financial ? `<span class="report-bar report-bar-income" style="height:${Math.max(4, item.income / maxMoney * 100)}%" title="Ingresos: ${formatCurrency(item.income)}"></span><span class="report-bar report-bar-cost" style="height:${Math.max(4, item.costs / maxMoney * 100)}%" title="Costos: ${formatCurrency(item.costs)}"></span>` : ''}<span class="report-bar report-bar-hours" style="height:${Math.max(4, item.hours / maxHours * 100)}%" title="Horas: ${item.hours}"></span></div><strong>${escapeHtml(item.label)}</strong><small>${financial ? `${formatCurrency(item.income)} / ${formatCurrency(item.costs)}` : `${item.hours} h`}</small></div>`).join('')}</div><div class="report-chart-legend">${financial ? '<span><i class="legend-income"></i>Ingresos</span><span><i class="legend-cost"></i>Costos</span>' : ''}<span><i class="legend-hours"></i>Horas</span></div>`;
}

function renderBreakdown(items, type) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  const classes = type === 'delivery'
    ? ['breakdown-gray', 'breakdown-gold', 'breakdown-red', 'breakdown-green']
    : ['breakdown-blue', 'breakdown-gold', 'breakdown-violet', 'breakdown-red', 'breakdown-green'];
  return `<div class="report-breakdown">${items.map((item, index) => `<div class="report-breakdown-row"><div><span>${escapeHtml(item.label)}</span><strong>${item.value}</strong></div><div class="report-progress"><span class="${classes[index] || 'breakdown-blue'}" style="width:${item.value / total * 100}%"></span></div></div>`).join('')}</div>`;
}

function renderRiskRow(row) {
  const risk = RISK_LABELS[row.risk.level] || RISK_LABELS.stable;
  return `<a class="report-risk-row" href="#/w/${row.workspaceId}/p/${row.id}/summary"><span class="report-risk-indicator report-risk-${row.risk.level}">${icon(row.risk.level === 'critical' ? 'alert' : 'activity')}</span><span><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.risk.reasons.join(' · ') || 'Seguimiento preventivo')}</small></span><span class="badge ${risk[1]}">${risk[0]}</span></a>`;
}

function renderDeadline(item, projects) {
  const project = projects.find(projectItem => projectItem.id === item.projectId);
  return `<div class="report-deadline-row"><span class="report-deadline-icon">${icon(item.type === 'deliverable' ? 'file' : 'checkSquare')}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(project?.name || 'Proyecto')} · ${item.type === 'deliverable' ? 'Entregable' : 'Tarea'}</small></span><time>${formatDate(item.dueDate, { year: false })}</time></div>`;
}

function kpi(iconName, value, label, note, tone = 'blue') {
  return `<article class="report-kpi report-kpi-${tone}"><span>${icon(iconName)}</span><div><strong>${escapeHtml(value)}</strong><p>${escapeHtml(label)}</p><small>${escapeHtml(note)}</small></div></article>`;
}

function deliverableStatus(status) {
  const map = {
    draft: ['Borrador', 'badge-gray'],
    in_review: ['En revisión', 'badge-orange'],
    changes_requested: ['Cambios solicitados', 'badge-red'],
    approved: ['Aprobado', 'badge-green']
  };
  return map[status] || [status, 'badge-gray'];
}

function exportCsv(report, tab, financial) {
  let rows = [];
  let filename = `wonkup-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  if (tab === 'delivery') {
    rows = [['Entregable', 'Proyecto', 'Estado', 'Responsable', 'Fecha', 'Checklist', 'Versiones'], ...report.deliverables.map(item => {
      const project = report.projects.find(projectItem => projectItem.id === item.projectId);
      return [item.title, project?.name || item.projectId, deliverableStatus(item.status)[0], item.ownerName || '', item.dueDate || '', `${(item.checklist || []).filter(check => check.done).length}/${(item.checklist || []).length}`, (item.versions || []).length];
    })];
  } else {
    const headers = ['Código', 'Proyecto', 'Responsable', 'Cliente', 'Estado', 'Riesgo', 'Avance', 'Tareas pendientes', 'Tareas vencidas', 'Entregables', 'En revisión', 'Horas'];
    if (financial) headers.push('Facturable', 'Cobrado', 'Saldo', 'Costo real', 'Utilidad', 'Margen');
    rows = [headers, ...report.projectRows.map(item => {
      const row = [item.code, item.name, item.owner, item.client, PROJECT_STATUS[item.status]?.[0] || item.status, RISK_LABELS[item.risk.level]?.[0] || item.risk.level, item.progress, item.pendingTasks, item.overdueTasks, item.deliverables, item.inReviewDeliverables, item.actualHours];
      if (financial) row.push(item.totalBillable, item.received, item.outstanding, item.realCost, item.expectedProfit, item.expectedMargin);
      return row;
    })];
  }
  const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Reporte CSV descargado.');
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function loadingPanel(text) {
  return `<section class="page"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>${escapeHtml(text)}</p></div></section>`;
}

function emptyInline(text) {
  return `<div class="report-empty-inline">${escapeHtml(text)}</div>`;
}
