import { ReportService } from '../services/report-service.js?v=12.2.0';
import { canViewFinancials } from '../utils/permissions.js?v=12.2.0';
import { icon } from '../utils/icons.js?v=12.2.0';
import { escapeHtml, formatCurrency, formatDate } from '../utils/format.js?v=12.2.0';

const STATUS_LABELS = {
  active: ['En desarrollo', 'badge-blue'],
  pending_client: ['En revisión', 'badge-orange'],
  planned: ['Planeamiento', 'badge-violet'],
  completed: ['Completado', 'badge-green'],
  blocked: ['Bloqueado', 'badge-red'],
  archived: ['Archivado', 'badge-gray']
};

const RISK_LABELS = {
  critical: ['Crítico', 'badge-red'],
  warning: ['En riesgo', 'badge-orange'],
  watch: ['Observar', 'badge-gold'],
  stable: ['Estable', 'badge-green']
};

export function renderDashboard(container, workspaceId, session) {
  container.innerHTML = loading('Cargando dashboard ejecutivo...');
  loadDashboard(container, workspaceId, session);
}

async function loadDashboard(container, workspaceId, session) {
  try {
    const report = await ReportService.getPortfolioReport({ workspaceId, session, period: '90d', status: 'all' });
    if (!container.isConnected) return;
    renderDashboardContent(container, workspaceId, session, report);
  } catch (error) {
    if (!container.isConnected) return;
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h1>No se pudo cargar el dashboard</h1><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}

function renderDashboardContent(container, workspaceId, session, report) {
  const metrics = report.metrics;
  const financial = canViewFinancials(session);
  const projectsHref = workspaceId === 'all' ? '#/master/projects' : `#/w/${workspaceId}/projects`;
  const reportsHref = workspaceId === 'all' ? '#/master/reports' : `#/w/${workspaceId}/reports`;
  const workspaceLabel = workspaceId === 'all' ? 'Portafolio maestro WonkUp' : 'Workspace seleccionado';

  container.innerHTML = `<section class="page executive-dashboard">
    <div class="page-header dashboard-hero-header">
      <div><span class="page-kicker">${escapeHtml(session.roleLabel)} · ${workspaceLabel}</span><h1>Dashboard ejecutivo</h1><p>Panorama integrado de proyectos, riesgos, entregables${financial ? ', finanzas' : ''} y horas.</p></div>
      <div class="page-header-actions"><a class="button button-secondary" href="${projectsHref}">${icon('folder')} Proyectos</a><a class="button button-primary" href="${reportsHref}">${icon('chart')} Ver reportes</a></div>
    </div>

    <div class="executive-kpi-grid">
      ${executiveMetric('briefcase', metrics.projectCount, 'Proyectos visibles', `${metrics.active} en ejecución`, 'blue')}
      ${executiveMetric('activity', `${metrics.avgProgress}%`, 'Avance promedio', `${metrics.completed} completados`, 'green')}
      ${executiveMetric('alert', metrics.atRisk, 'Requieren atención', `${metrics.overdueTasks} tareas vencidas`, metrics.atRisk ? 'danger' : 'green')}
      ${executiveMetric('eye', metrics.inReviewDeliverables, 'Entregables en revisión', `${metrics.approvedDeliverables} aprobados`, 'gold')}
      ${financial ? executiveMetric('wallet', formatCurrency(metrics.received), 'Ingresos cobrados', `${formatCurrency(metrics.outstanding)} pendientes`, 'blue') : executiveMetric('clock', `${metrics.actualHours} h`, 'Horas registradas', `${metrics.hoursUsedPercent}% consumido`, 'blue')}
      ${financial ? executiveMetric('chart', `${metrics.expectedMargin}%`, 'Margen proyectado', `${formatCurrency(metrics.expectedProfit)} utilidad`, metrics.expectedMargin >= 25 ? 'green' : 'danger') : executiveMetric('calendar', metrics.dueSoonTasks, 'Vencen esta semana', 'Tareas próximas', 'gold')}
    </div>

    <div class="dashboard-middle-grid executive-dashboard-grid">
      <article class="panel dashboard-portfolio-panel"><div class="panel-header"><div><h2>Portafolio prioritario</h2><p>Ordenado por nivel de riesgo y vencimiento.</p></div><a class="panel-link" href="${reportsHref}">Comparar todos</a></div><div class="panel-body dashboard-project-table">${report.projectRows.slice(0, 6).map(renderProjectRow).join('') || empty('No hay proyectos visibles.')}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Salud del portafolio</h2><p>Avance y distribución actual.</p></div></div><div class="panel-body dashboard-health-body">
        <div class="dashboard-gauge" style="--gauge:${Math.min(100, metrics.avgProgress)}"><div><strong>${metrics.avgProgress}%</strong><span>avance general</span></div></div>
        <div class="dashboard-status-list">${report.statusBreakdown.map(item => `<div><span><i class="dashboard-status-dot dashboard-status-${item.key}"></i>${escapeHtml(item.label)}</span><strong>${item.value}</strong></div>`).join('')}</div>
      </div></article>
    </div>

    <div class="dashboard-bottom-grid executive-dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h2>Alertas y riesgos</h2><p>Situaciones que requieren una decisión.</p></div><span class="badge ${metrics.atRisk ? 'badge-red' : 'badge-green'}">${metrics.atRisk}</span></div><div class="panel-body dashboard-risk-list">${report.riskProjects.slice(0, 5).map(renderRiskRow).join('') || `<div class="dashboard-all-clear">${icon('check')}<div><strong>Portafolio estable</strong><span>No se detectaron riesgos relevantes.</span></div></div>`}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Próximos vencimientos</h2><p>Tareas y entregables más cercanos.</p></div></div><div class="panel-body dashboard-deadlines">${report.upcoming.slice(0, 6).map(item => renderDeadline(item, report.projects)).join('') || empty('No hay fechas próximas.')}</div></article>
    </div>

    ${financial ? `<article class="panel dashboard-finance-panel"><div class="panel-header"><div><h2>Desempeño financiero — 90 días</h2><p>Ingresos cobrados, costos y horas registradas.</p></div><a class="panel-link" href="${reportsHref}">Reporte financiero</a></div><div class="panel-body dashboard-finance-layout"><div class="dashboard-finance-summary"><div><span>Total facturable</span><strong>${formatCurrency(metrics.totalBillable)}</strong></div><div><span>Costo real</span><strong>${formatCurrency(metrics.realCost)}</strong></div><div><span>Saldo por cobrar</span><strong>${formatCurrency(metrics.outstanding)}</strong></div><div><span>Horas</span><strong>${metrics.actualHours} h</strong></div></div>${renderMiniTrend(report.trend)}</div></article>` : ''}

    <div class="session-banner"><span>${icon('shield')}</span><div><strong>Información según permisos</strong><small>La vista consolida únicamente los workspaces y proyectos autorizados para ${escapeHtml(session.roleLabel)}.</small></div></div>
  </section>`;
}

function renderProjectRow(row) {
  const status = STATUS_LABELS[row.status] || [row.status, 'badge-gray'];
  const risk = RISK_LABELS[row.risk.level] || RISK_LABELS.stable;
  return `<a class="dashboard-project-row" href="#/w/${row.workspaceId}/p/${row.id}/summary"><div class="dashboard-project-main"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.owner)} · entrega ${formatDate(row.dueDate, { year: false })}</small></div><div class="dashboard-project-progress"><span><i style="width:${Math.min(100, row.progress)}%"></i></span><strong>${row.progress}%</strong></div><span class="badge ${status[1]}">${status[0]}</span><span class="badge ${risk[1]}">${risk[0]}</span>${icon('arrowRight')}</a>`;
}

function renderRiskRow(row) {
  const risk = RISK_LABELS[row.risk.level] || RISK_LABELS.stable;
  return `<a class="dashboard-risk-row" href="#/w/${row.workspaceId}/p/${row.id}/summary"><span class="dashboard-risk-icon dashboard-risk-${row.risk.level}">${icon(row.risk.level === 'critical' ? 'alert' : 'activity')}</span><span><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.risk.reasons.join(' · ') || 'Seguimiento preventivo')}</small></span><span class="badge ${risk[1]}">${risk[0]}</span></a>`;
}

function renderDeadline(item, projects) {
  const project = projects.find(projectItem => projectItem.id === item.projectId);
  return `<div class="dashboard-deadline-row"><span>${icon(item.type === 'deliverable' ? 'file' : 'checkSquare')}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(project?.name || 'Proyecto')} · ${item.type === 'deliverable' ? 'Entregable' : 'Tarea'}</small></div><time>${formatDate(item.dueDate, { year: false })}</time></div>`;
}

function renderMiniTrend(trend) {
  const maxValue = Math.max(1, ...trend.flatMap(item => [item.income, item.costs]));
  return `<div class="dashboard-mini-trend">${trend.map(item => `<div><span class="dashboard-mini-bars"><i class="income" style="height:${Math.max(5, item.income / maxValue * 100)}%"></i><i class="cost" style="height:${Math.max(5, item.costs / maxValue * 100)}%"></i></span><strong>${escapeHtml(item.label)}</strong></div>`).join('')}</div>`;
}

function executiveMetric(iconName, value, label, note, tone) {
  return `<article class="executive-kpi executive-kpi-${tone}"><span>${icon(iconName)}</span><div><strong>${escapeHtml(value)}</strong><p>${escapeHtml(label)}</p><small>${escapeHtml(note)}</small></div></article>`;
}

function loading(text) {
  return `<section class="page"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>${escapeHtml(text)}</p></div></section>`;
}

function empty(text) {
  return `<div class="dashboard-empty">${escapeHtml(text)}</div>`;
}
