import { calculateFinanceMetrics, buildFinanceAlerts, getEffectiveIncomeStatus } from './finance-calculations.js?v=11.0.0';

const DAY_MS = 86400000;

function toDate(value) {
  if (!value) return null;
  const text = String(value);
  const date = new Date(text.length <= 10 ? `${text.slice(0, 10)}T12:00:00` : text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function round(value, decimals = 1) {
  const number = Number(value || 0);
  const factor = 10 ** decimals;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function inRange(value, from, to) {
  const date = toDate(value);
  if (!date) return false;
  return (!from || date >= from) && (!to || date <= to);
}

export function resolveReportPeriod(period = '90d', now = new Date()) {
  const end = endOfDay(now);
  if (period === 'all') return { key: 'all', from: null, to: end, label: 'Todo el historial' };
  if (period === 'year') return { key: 'year', from: new Date(now.getFullYear(), 0, 1), to: end, label: `Año ${now.getFullYear()}` };
  if (period === 'month') return { key: 'month', from: new Date(now.getFullYear(), now.getMonth(), 1), to: end, label: 'Mes actual' };
  const days = period === '30d' ? 30 : period === '180d' ? 180 : 90;
  return {
    key: `${days}d`,
    from: startOfDay(new Date(end.getTime() - ((days - 1) * DAY_MS))),
    to: end,
    label: `Últimos ${days} días`
  };
}

function filterFinanceRecord(record, period) {
  const from = period?.from || null;
  const to = period?.to || null;
  if (!record || (!from && !to)) return record || null;
  return {
    ...record,
    incomes: (record.incomes || []).filter(item => inRange(item.paidDate || item.dueDate, from, to)),
    costs: (record.costs || []).filter(item => inRange(item.date, from, to)),
    timeEntries: (record.timeEntries || []).filter(item => inRange(item.date, from, to))
  };
}

function dueState(value, today = new Date()) {
  const due = toDate(value);
  if (!due) return 'none';
  const current = startOfDay(today);
  const delta = Math.ceil((startOfDay(due).getTime() - current.getTime()) / DAY_MS);
  if (delta < 0) return 'overdue';
  if (delta <= 7) return 'soon';
  return 'future';
}

function projectRisk(project, projectTasks, projectDeliverables, finance) {
  let score = 0;
  const reasons = [];
  if (project.health === 'red') { score += 4; reasons.push('salud crítica'); }
  else if (project.health === 'amber') { score += 2; reasons.push('salud en riesgo'); }
  if (project.status === 'blocked') { score += 4; reasons.push('proyecto bloqueado'); }
  if (project.status === 'pending_client') { score += 1; reasons.push('esperando cliente'); }
  const overdueTasks = projectTasks.filter(item => dueState(item.dueDate) === 'overdue').length;
  if (overdueTasks) { score += Math.min(3, overdueTasks); reasons.push(`${overdueTasks} tarea${overdueTasks === 1 ? '' : 's'} vencida${overdueTasks === 1 ? '' : 's'}`); }
  const overdueDeliverables = projectDeliverables.filter(item => item.status !== 'approved' && dueState(item.dueDate) === 'overdue').length;
  if (overdueDeliverables) { score += Math.min(3, overdueDeliverables * 2); reasons.push(`${overdueDeliverables} entregable${overdueDeliverables === 1 ? '' : 's'} vencido${overdueDeliverables === 1 ? '' : 's'}`); }
  const criticalAlerts = (finance?.alerts || []).filter(item => item.level === 'critical').length;
  if (criticalAlerts) { score += Math.min(4, criticalAlerts * 2); reasons.push(`${criticalAlerts} alerta${criticalAlerts === 1 ? '' : 's'} financiera${criticalAlerts === 1 ? '' : 's'}`); }
  const level = score >= 6 ? 'critical' : score >= 3 ? 'warning' : score >= 1 ? 'watch' : 'stable';
  return { score, level, reasons };
}

function monthKey(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthBuckets(period, now = new Date()) {
  const end = period?.to || endOfDay(now);
  const start = period?.from || new Date(end.getFullYear(), end.getMonth() - 5, 1);
  const boundedStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const buckets = [];
  const cursor = new Date(boundedStart);
  while (cursor <= end && buckets.length < 18) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: new Intl.DateTimeFormat('es-PE', { month: 'short', year: buckets.length > 10 ? '2-digit' : undefined }).format(cursor).replace('.', ''),
      income: 0,
      costs: 0,
      hours: 0
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (!buckets.length) {
    const key = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(end).replace('.', ''), income: 0, costs: 0, hours: 0 });
  }
  return buckets;
}

function aggregateTrend(records, period, now) {
  const buckets = buildMonthBuckets(period, now);
  const map = new Map(buckets.map(item => [item.key, item]));
  records.forEach(record => {
    (record.incomes || []).forEach(item => {
      if (item.status !== 'paid') return;
      const bucket = map.get(monthKey(item.paidDate || item.dueDate));
      if (bucket) bucket.income += item.type === 'refund' ? -Number(item.amount || 0) : Number(item.amount || 0);
    });
    (record.costs || []).forEach(item => {
      if (item.paymentStatus === 'void') return;
      const bucket = map.get(monthKey(item.date));
      if (bucket) bucket.costs += Number(item.amount || 0);
    });
    (record.timeEntries || []).forEach(item => {
      const bucket = map.get(monthKey(item.date));
      if (bucket) bucket.hours += Number(item.hours || 0);
    });
  });
  return buckets.map(item => ({ ...item, income: round(item.income, 2), costs: round(item.costs, 2), hours: round(item.hours, 1) }));
}

function statusCount(items, key) {
  return items.filter(item => item.status === key).length;
}

export function buildPortfolioReport({
  projects = [],
  financeRecords = [],
  deliverables = [],
  tasks = [],
  activities = [],
  period = resolveReportPeriod('90d'),
  status = 'all',
  now = new Date()
} = {}) {
  const filteredProjects = projects.filter(project => status === 'all' || project.status === status);
  const projectIds = new Set(filteredProjects.map(project => project.id));
  const visibleDeliverables = deliverables.filter(item => projectIds.has(item.projectId));
  const visibleTasks = tasks.filter(item => projectIds.has(item.projectId));
  const records = financeRecords.filter(item => projectIds.has(item.projectId));
  const periodRecords = records.map(record => filterFinanceRecord(record, period)).filter(Boolean);
  const financeMap = new Map(records.map(record => {
    const metrics = record.metrics || calculateFinanceMetrics(record, now);
    const alerts = record.alerts || buildFinanceAlerts(record, metrics, now);
    return [record.projectId, { ...record, metrics, alerts }];
  }));

  const projectRows = filteredProjects.map(project => {
    const projectTasks = visibleTasks.filter(item => item.projectId === project.id);
    const projectDeliverables = visibleDeliverables.filter(item => item.projectId === project.id);
    const finance = financeMap.get(project.id) || null;
    const metrics = finance?.metrics || {};
    const risk = projectRisk(project, projectTasks, projectDeliverables, finance);
    return {
      id: project.id,
      workspaceId: project.workspaceId,
      code: project.code,
      name: project.name,
      owner: project.owner || 'Sin responsable',
      client: project.client || 'Sin cliente',
      status: project.status,
      health: project.health,
      progress: Number(project.progress || 0),
      dueDate: project.dueDate,
      pendingTasks: projectTasks.length || Number(project.pendingTasks || 0),
      overdueTasks: projectTasks.filter(item => dueState(item.dueDate, now) === 'overdue').length,
      deliverables: projectDeliverables.length,
      inReviewDeliverables: projectDeliverables.filter(item => item.status === 'in_review').length,
      approvedDeliverables: projectDeliverables.filter(item => item.status === 'approved').length,
      overdueDeliverables: projectDeliverables.filter(item => item.status !== 'approved' && dueState(item.dueDate, now) === 'overdue').length,
      totalBillable: Number(metrics.totalBillable || 0),
      received: Number(metrics.received || 0),
      outstanding: Number(metrics.outstanding || 0),
      realCost: Number(metrics.realCost || 0),
      expectedProfit: Number(metrics.expectedProfit || 0),
      expectedMargin: Number(metrics.expectedMargin || 0),
      actualHours: Number(metrics.actualHours || 0),
      plannedHours: Number(metrics.plannedHours || 0),
      risk
    };
  }).sort((a, b) => b.risk.score - a.risk.score || a.dueDate.localeCompare(b.dueDate));

  const projectCount = filteredProjects.length;
  const completed = statusCount(filteredProjects, 'completed');
  const active = statusCount(filteredProjects, 'active');
  const atRisk = projectRows.filter(item => ['critical', 'warning'].includes(item.risk.level)).length;
  const avgProgress = projectCount ? round(sum(filteredProjects, item => item.progress) / projectCount, 0) : 0;
  const overdueTasks = visibleTasks.filter(item => dueState(item.dueDate, now) === 'overdue').length;
  const dueSoonTasks = visibleTasks.filter(item => dueState(item.dueDate, now) === 'soon').length;
  const overdueDeliverables = visibleDeliverables.filter(item => item.status !== 'approved' && dueState(item.dueDate, now) === 'overdue').length;
  const totalBillable = sum(projectRows, item => item.totalBillable);
  const received = sum(projectRows, item => item.received);
  const outstanding = sum(projectRows, item => item.outstanding);
  const realCost = sum(projectRows, item => item.realCost);
  const expectedProfit = sum(projectRows, item => item.expectedProfit);
  const expectedMargin = totalBillable > 0 ? round((expectedProfit / totalBillable) * 100, 1) : 0;
  const actualHours = sum(projectRows, item => item.actualHours);
  const plannedHours = sum(projectRows, item => item.plannedHours);
  const hoursUsedPercent = plannedHours > 0 ? round((actualHours / plannedHours) * 100, 1) : 0;

  const statusBreakdown = [
    ['active', 'En desarrollo'],
    ['pending_client', 'En revisión'],
    ['planned', 'Planeamiento'],
    ['blocked', 'Bloqueado'],
    ['completed', 'Completado']
  ].map(([key, label]) => ({ key, label, value: statusCount(filteredProjects, key) }));

  const deliveryBreakdown = [
    ['draft', 'Borrador'],
    ['in_review', 'En revisión'],
    ['changes_requested', 'Cambios solicitados'],
    ['approved', 'Aprobado']
  ].map(([key, label]) => ({ key, label, value: statusCount(visibleDeliverables, key) }));

  const riskProjects = projectRows.filter(item => item.risk.level !== 'stable').slice(0, 6);
  const upcoming = [
    ...visibleTasks.map(item => ({ type: 'task', title: item.title, dueDate: item.dueDate, projectId: item.projectId, priority: item.priority })),
    ...visibleDeliverables.filter(item => item.status !== 'approved').map(item => ({ type: 'deliverable', title: item.title, dueDate: item.dueDate, projectId: item.projectId, priority: item.priority }))
  ].filter(item => toDate(item.dueDate)).sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate)).slice(0, 8);

  return {
    generatedAt: now.toISOString(),
    period,
    status,
    projects: filteredProjects,
    projectRows,
    financeRecords: periodRecords,
    deliverables: visibleDeliverables,
    tasks: visibleTasks,
    activities: activities.filter(item => projectIds.has(item.projectId)).slice(0, 8),
    trend: aggregateTrend(periodRecords, period, now),
    riskProjects,
    upcoming,
    statusBreakdown,
    deliveryBreakdown,
    metrics: {
      projectCount,
      active,
      completed,
      atRisk,
      avgProgress,
      overdueTasks,
      dueSoonTasks,
      deliverableCount: visibleDeliverables.length,
      inReviewDeliverables: statusCount(visibleDeliverables, 'in_review'),
      approvedDeliverables: statusCount(visibleDeliverables, 'approved'),
      changesRequestedDeliverables: statusCount(visibleDeliverables, 'changes_requested'),
      overdueDeliverables,
      totalBillable: round(totalBillable, 2),
      received: round(received, 2),
      outstanding: round(outstanding, 2),
      realCost: round(realCost, 2),
      expectedProfit: round(expectedProfit, 2),
      expectedMargin,
      actualHours: round(actualHours, 1),
      plannedHours: round(plannedHours, 1),
      hoursUsedPercent
    }
  };
}

export function getIncomeEffectiveStatus(item, now = new Date()) {
  return getEffectiveIncomeStatus(item, now);
}
