import { FinanceService } from '../services/finance-service.js?v=12.0.0';
import {
  canConfigureProjectFinance,
  canLogProjectTime,
  canManageProjectFinance,
  canViewAllProjectTime,
  canViewProjectProfitability
} from '../utils/permissions.js?v=12.0.0';
import { icon } from '../utils/icons.js?v=12.0.0';
import { escapeHtml } from '../utils/format.js?v=12.0.0';
import { normalizeText, normalizeUrl } from '../utils/validation.js?v=12.0.0';
import { getEffectiveIncomeStatus } from '../utils/finance-calculations.js?v=12.0.0';
import { openModal, confirmModal } from '../components/modal.js?v=12.0.0';
import { showToast } from '../components/toast.js?v=12.0.0';

const FINANCE_VERSION = '7.0.0';
const TAB_KEY_PREFIX = 'wonkup.e7.finance.tab.';
const TIMER_KEY_PREFIX = 'wonkup.e7.finance.timer.';

const TAB_LABELS = {
  summary: 'Resumen',
  income: 'Ingresos',
  costs: 'Costos',
  time: 'Horas',
  profitability: 'Rentabilidad',
  settings: 'Configuración'
};

const INCOME_TYPES = {
  advance: 'Adelanto',
  partial: 'Pago parcial',
  final: 'Pago final',
  additional: 'Ingreso adicional',
  refund: 'Devolución'
};

const INCOME_STATUS = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  void: 'Anulado'
};

const COST_CATEGORIES = {
  personnel: 'Personal',
  services: 'Servicios externos',
  software: 'Software y suscripciones',
  marketing: 'Marketing',
  mobility: 'Movilidad',
  materials: 'Materiales',
  procedures: 'Trámites',
  other: 'Otros'
};

const PAYMENT_STATUS = {
  paid: 'Pagado',
  pending: 'Pendiente',
  void: 'Anulado'
};

const WORK_TYPES = {
  management: 'Gestión',
  research: 'Investigación',
  design: 'Diseño',
  development: 'Desarrollo',
  testing: 'Pruebas',
  marketing: 'Marketing',
  meeting: 'Reunión',
  support: 'Soporte',
  other: 'Otro'
};

let cleanupSubscription = null;
let timerInterval = null;
let subscriptionTimer = null;
let lastLocalMutationAt = 0;

function money(value, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function percent(value) {
  return `${Number(value || 0).toFixed(1).replace('.0', '')}%`;
}

function formatLocalDate(value) {
  if (!value) return '-';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function capProgress(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function timerKey(projectId, userId) {
  return `${TIMER_KEY_PREFIX}${projectId}.${userId}`;
}

function readTimer(projectId, userId) {
  try {
    const raw = localStorage.getItem(timerKey(projectId, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        running: Boolean(parsed.running),
        startedAt: Number(parsed.startedAt || 0),
        accumulatedSeconds: Math.max(0, Number(parsed.accumulatedSeconds || 0))
      };
    }
  } catch {
    // Use a clean timer.
  }
  return { running: false, startedAt: 0, accumulatedSeconds: 0 };
}

function writeTimer(projectId, userId, state) {
  localStorage.setItem(timerKey(projectId, userId), JSON.stringify(state));
}

function timerSeconds(state) {
  if (!state.running || !state.startedAt) return Math.max(0, state.accumulatedSeconds);
  return Math.max(0, state.accumulatedSeconds + Math.floor((Date.now() - state.startedAt) / 1000));
}

function timerText(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  return [hours, minutes, remaining].map(value => String(value).padStart(2, '0')).join(':');
}

function allowedTabs(session, project) {
  if (session.role === 'collaborator') return ['time'];
  const tabs = ['summary', 'income', 'costs', 'time'];
  if (canViewProjectProfitability(session, project.id, project.workspaceId)) tabs.push('profitability');
  if (canConfigureProjectFinance(session, project.id, project.workspaceId)) tabs.push('settings');
  return tabs;
}

function getSavedTab(projectId, tabs) {
  const saved = sessionStorage.getItem(`${TAB_KEY_PREFIX}${projectId}`);
  return tabs.includes(saved) ? saved : tabs[0];
}

function setSavedTab(projectId, tab) {
  sessionStorage.setItem(`${TAB_KEY_PREFIX}${projectId}`, tab);
}

export function cleanupFinanceView() {
  cleanupSubscription?.();
  cleanupSubscription = null;
  clearInterval(timerInterval);
  timerInterval = null;
  clearTimeout(subscriptionTimer);
  subscriptionTimer = null;
}

globalThis.__wonkupCleanupFinance = cleanupFinanceView;

export function renderFinance(container, project, session) {
  cleanupFinanceView();
  const tabs = allowedTabs(session, project);
  let activeTab = getSavedTab(project.id, tabs);
  let currentData = null;

  container.innerHTML = `<div class="finance-loading"><span class="spinner spinner-blue"></span><p>Cargando finanzas del proyecto...</p></div>`;

  const refresh = async (nextTab = activeTab, { focusHeading = false } = {}) => {
    if (!container.isConnected) return;
    activeTab = tabs.includes(nextTab) ? nextTab : tabs[0];
    setSavedTab(project.id, activeTab);
    try {
      currentData = await FinanceService.getProjectFinance({
        projectId: project.id,
        workspaceId: project.workspaceId,
        session
      });
      if (!container.isConnected) return;
      renderFinanceShell(container, project, session, currentData, tabs, activeTab, refresh);
      if (focusHeading) {
        requestAnimationFrame(() => container.querySelector('#finance-view-heading')?.focus({ preventScroll: true }));
      }
    } catch (error) {
      container.innerHTML = `<div class="empty-state finance-error"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar Finanzas</h2><p>${escapeHtml(error.message || 'Intenta nuevamente.')}</p><button class="button button-primary" id="retry-finance">Reintentar</button></div>`;
      container.querySelector('#retry-finance')?.addEventListener('click', () => refresh(activeTab));
    }
  };

  cleanupSubscription = FinanceService.subscribe(event => {
    if (!container.isConnected) return;
    if (event.projectId && event.projectId !== project.id) return;
    if (Date.now() - lastLocalMutationAt < 500) return;
    clearTimeout(subscriptionTimer);
    subscriptionTimer = setTimeout(() => refresh(activeTab), 120);
  });

  refresh(activeTab);
}

function renderFinanceShell(container, project, session, data, tabs, activeTab, refresh) {
  const canManage = canManageProjectFinance(session, project.id, project.workspaceId);
  const canConfigure = canConfigureProjectFinance(session, project.id, project.workspaceId);
  const canLogTime = canLogProjectTime(session, project.id, project.workspaceId);
  const currency = data.settings.currency || 'PEN';

  container.innerHTML = `<section class="finance-module" aria-labelledby="finance-view-heading">
    <header class="finance-header">
      <div>
        <span class="finance-eyebrow">${icon('wallet')} CONTROL FINANCIERO</span>
        <h2 id="finance-view-heading" tabindex="-1">Finanzas, horas y rentabilidad</h2>
        <p>Controla cobros, costos, dedicación y salud económica del proyecto.</p>
      </div>
      <div class="finance-header-meta">
        <span class="finance-mode-chip">${FinanceService.mode === 'mock' ? 'Demo local' : 'Datos conectados'}</span>
        <span class="finance-currency-chip">${escapeHtml(currency)}</span>
      </div>
    </header>

    <nav class="finance-subnav" aria-label="Secciones financieras">
      ${tabs.map(tab => `<button type="button" class="finance-subnav-button ${activeTab === tab ? 'active' : ''}" data-finance-tab="${tab}" ${activeTab === tab ? 'aria-current="page"' : ''}>${escapeHtml(TAB_LABELS[tab])}</button>`).join('')}
    </nav>

    <div class="finance-content" id="finance-content">
      ${renderActiveTab({ project, session, data, activeTab, canManage, canConfigure, canLogTime })}
    </div>
    <footer class="finance-footer"><span>Motor financiero ${FINANCE_VERSION}</span><span>Fuente: ${FinanceService.mode === 'mock' ? 'localStorage' : 'servicio conectado'}</span></footer>
  </section>`;

  container.querySelectorAll('[data-finance-tab]').forEach(button => {
    button.addEventListener('click', () => refresh(button.dataset.financeTab, { focusHeading: true }));
  });

  bindTabEvents(container, { project, session, data, activeTab, refresh, canManage, canConfigure, canLogTime });
}

function renderActiveTab(context) {
  const renderers = {
    summary: renderSummary,
    income: renderIncome,
    costs: renderCosts,
    time: renderTime,
    profitability: renderProfitability,
    settings: renderSettings
  };
  return (renderers[context.activeTab] || renderSummary)(context);
}

function kpi({ label, value, note = '', tone = '', iconName = 'wallet' }) {
  return `<article class="finance-kpi ${tone ? `finance-kpi-${tone}` : ''}">
    <span class="finance-kpi-icon">${icon(iconName)}</span>
    <div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong>${note ? `<p>${escapeHtml(note)}</p>` : ''}</div>
  </article>`;
}

function progressBlock(label, value, amountText, tone = '') {
  const width = capProgress(value);
  return `<div class="finance-progress-block">
    <div class="finance-progress-head"><span>${escapeHtml(label)}</span><strong>${escapeHtml(amountText)}</strong></div>
    <div class="finance-progress-track"><span class="${tone ? `finance-progress-${tone}` : ''}" style="width:${width}%"></span></div>
    <small>${percent(value)}</small>
  </div>`;
}

function renderSummary({ project, session, data, canManage, canConfigure }) {
  const m = data.metrics;
  const currency = data.settings.currency;
  const showProfit = canViewProjectProfitability(session, project.id, project.workspaceId);
  const collectionPercent = m.totalBillable > 0 ? (m.received / m.totalBillable) * 100 : 0;

  return `<div class="finance-tab-stack">
    <div class="finance-toolbar">
      <div><h3>Resumen financiero</h3><p>Indicadores ejecutivos y alertas del proyecto.</p></div>
      <div class="finance-toolbar-actions">
        ${canManage ? `<button type="button" class="button button-secondary" data-finance-action="new-income">${icon('plus')} Registrar ingreso</button>` : ''}
        ${canConfigure ? `<button type="button" class="button button-primary" data-finance-action="settings">${icon('settings')} Configurar</button>` : ''}
      </div>
    </div>

    <div class="finance-kpi-grid">
      ${kpi({ label: 'Total facturable', value: money(m.totalBillable, currency), note: `Contrato ${money(m.contractedAmount, currency)}`, iconName: 'file' })}
      ${kpi({ label: 'Pagos recibidos', value: money(m.received, currency), note: `${percent(collectionPercent)} cobrado`, tone: 'positive', iconName: 'check' })}
      ${kpi({ label: 'Saldo por cobrar', value: money(m.outstanding, currency), note: m.overdueCount ? `${m.overdueCount} vencido(s)` : 'Sin vencimientos', tone: m.overdueCount ? 'danger' : 'warning', iconName: 'clock' })}
      ${kpi({ label: 'Costo real acumulado', value: money(m.realCost, currency), note: `${money(m.laborCost, currency)} en horas`, tone: m.budgetUsedPercent > 100 ? 'danger' : '', iconName: 'wallet' })}
      ${showProfit ? kpi({ label: 'Utilidad proyectada', value: money(m.expectedProfit, currency), note: `Sobre el total facturable`, tone: m.expectedProfit >= 0 ? 'positive' : 'danger', iconName: 'chart' }) : kpi({ label: 'Horas registradas', value: `${m.actualHours} h`, note: `${m.plannedHours} h planificadas`, iconName: 'clock' })}
      ${showProfit ? kpi({ label: 'Margen proyectado', value: percent(m.expectedMargin), note: `Meta ${percent(m.targetMargin)}`, tone: m.expectedMargin >= m.targetMargin ? 'positive' : 'warning', iconName: 'target' }) : kpi({ label: 'Presupuesto utilizado', value: percent(m.budgetUsedPercent), note: money(m.internalBudget, currency), tone: m.budgetUsedPercent > 100 ? 'danger' : '', iconName: 'chart' })}
    </div>

    ${renderAlerts(data.alerts, currency)}

    <div class="finance-summary-layout">
      <article class="panel finance-panel">
        <div class="panel-header"><div><h3>Control de ejecución</h3><p>Avance de cobros, presupuesto y horas.</p></div></div>
        <div class="panel-body finance-progress-list">
          ${progressBlock('Cobros recibidos', collectionPercent, `${money(m.received, currency)} de ${money(m.totalBillable, currency)}`, 'positive')}
          ${progressBlock('Presupuesto interno', m.budgetUsedPercent, `${money(m.realCost, currency)} de ${money(m.internalBudget, currency)}`, m.budgetUsedPercent > 100 ? 'danger' : 'warning')}
          ${progressBlock('Horas planificadas', m.hoursUsedPercent, `${m.actualHours} h de ${m.plannedHours} h`, m.hoursUsedPercent > 100 ? 'danger' : '')}
        </div>
      </article>

      <article class="panel finance-panel">
        <div class="panel-header"><div><h3>Próximos movimientos</h3><p>Cobros y costos pendientes.</p></div></div>
        <div class="panel-body">
          ${renderUpcomingMovements(data, currency)}
        </div>
      </article>
    </div>

    <article class="panel finance-panel">
      <div class="panel-header"><div><h3>Distribución de costos directos</h3><p>Gastos registrados por categoría.</p></div></div>
      <div class="panel-body">${renderCategoryBars(m.categoryTotals, m.directCosts, currency)}</div>
    </article>
  </div>`;
}

function renderAlerts(alerts, currency) {
  if (!alerts?.length) {
    return `<div class="finance-all-clear">${icon('check')}<div><strong>Finanzas bajo control</strong><span>No se detectan alertas críticas con la información registrada.</span></div></div>`;
  }
  return `<section class="finance-alert-section" aria-label="Alertas financieras">
    <div class="finance-alert-heading"><h3>Alertas</h3><span>${alerts.length}</span></div>
    <div class="finance-alert-grid">${alerts.map(alert => {
      const message = String(alert.message || '').replace(/(\d+(?:\.\d+)?)/, match => {
        if (!['overdue-payments', 'budget-exceeded'].includes(alert.id)) return match;
        return money(Number(match), currency);
      });
      return `<button type="button" class="finance-alert finance-alert-${escapeHtml(alert.level)}" data-alert-tab="${escapeHtml(alert.action)}">
        <span>${icon(alert.level === 'critical' ? 'alert' : alert.level === 'warning' ? 'clock' : 'bell')}</span>
        <div><strong>${escapeHtml(alert.title)}</strong><p>${escapeHtml(message)}</p></div>${icon('arrowRight')}
      </button>`;
    }).join('')}</div>
  </section>`;
}

function renderUpcomingMovements(data, currency) {
  const income = [...data.incomes]
    .filter(item => !['paid', 'void'].includes(item.status))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 3)
    .map(item => ({
      iconName: 'arrowRight',
      title: item.concept,
      subtitle: `Cobro · ${formatLocalDate(item.dueDate)}`,
      amount: money(item.amount, currency),
      tone: getEffectiveIncomeStatus(item) === 'overdue' ? 'danger' : 'positive'
    }));
  const costs = [...data.costs]
    .filter(item => item.paymentStatus === 'pending')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 2)
    .map(item => ({
      iconName: 'wallet',
      title: item.vendor,
      subtitle: `Costo pendiente · ${formatLocalDate(item.date)}`,
      amount: money(item.amount, currency),
      tone: 'warning'
    }));
  const rows = [...income, ...costs].slice(0, 5);
  if (!rows.length) return '<p class="finance-empty-copy">No hay movimientos pendientes.</p>';
  return `<div class="finance-movement-list">${rows.map(row => `<div class="finance-movement-row">
    <span class="finance-movement-icon">${icon(row.iconName)}</span>
    <div><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.subtitle)}</small></div>
    <b class="finance-amount-${row.tone}">${escapeHtml(row.amount)}</b>
  </div>`).join('')}</div>`;
}

function renderCategoryBars(totals, total, currency) {
  const entries = Object.entries(totals || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '<p class="finance-empty-copy">Aún no se registraron costos directos.</p>';
  return `<div class="finance-bar-list">${entries.map(([category, value]) => {
    const width = total > 0 ? (value / total) * 100 : 0;
    return `<div class="finance-bar-row"><div><span>${escapeHtml(COST_CATEGORIES[category] || category)}</span><strong>${money(value, currency)}</strong></div><div class="finance-bar-track"><span style="width:${capProgress(width)}%"></span></div></div>`;
  }).join('')}</div>`;
}

function renderIncome({ project, data, canManage }) {
  const currency = data.settings.currency;
  return `<div class="finance-tab-stack">
    <div class="finance-toolbar">
      <div><h3>Ingresos y pagos</h3><p>Adelantos, pagos parciales, saldo final e ingresos adicionales.</p></div>
      ${canManage ? `<button type="button" class="button button-primary" data-finance-action="new-income">${icon('plus')} Registrar ingreso</button>` : ''}
    </div>
    <div class="finance-kpi-grid finance-kpi-grid-compact">
      ${kpi({ label: 'Recibido', value: money(data.metrics.received, currency), tone: 'positive', iconName: 'check' })}
      ${kpi({ label: 'Pendiente', value: money(data.metrics.outstanding, currency), tone: 'warning', iconName: 'clock' })}
      ${kpi({ label: 'Vencido', value: money(data.metrics.overdueAmount, currency), tone: data.metrics.overdueCount ? 'danger' : '', iconName: 'alert' })}
    </div>
    <article class="panel finance-panel">
      <div class="finance-table-wrap">
        <table class="finance-table">
          <thead><tr><th>Concepto</th><th>Tipo</th><th>Vencimiento</th><th>Estado</th><th>Monto</th><th>Referencia</th>${canManage ? '<th>Acciones</th>' : ''}</tr></thead>
          <tbody>${data.incomes.length ? data.incomes.map(item => incomeRow(item, currency, canManage)).join('') : `<tr><td colspan="${canManage ? 7 : 6}"><div class="finance-table-empty">${icon('wallet')}<strong>Sin ingresos registrados</strong><span>Registra el primer adelanto o pago del proyecto.</span></div></td></tr>`}</tbody>
        </table>
      </div>
    </article>
  </div>`;
}

function incomeRow(item, currency, canManage) {
  const status = getEffectiveIncomeStatus(item);
  return `<tr class="${status === 'void' ? 'finance-row-muted' : ''}">
    <td><strong>${escapeHtml(item.concept)}</strong>${item.evidenceUrl ? `<a class="finance-inline-link" href="${escapeHtml(item.evidenceUrl)}" target="_blank" rel="noopener">Comprobante ${icon('external')}</a>` : ''}</td>
    <td>${escapeHtml(INCOME_TYPES[item.type] || item.type)}</td>
    <td>${formatLocalDate(item.dueDate)}${item.paidDate ? `<small>Pagado ${formatLocalDate(item.paidDate)}</small>` : ''}</td>
    <td><span class="finance-status finance-status-${status}">${escapeHtml(INCOME_STATUS[status] || status)}</span></td>
    <td class="finance-number">${money(item.type === 'refund' ? -item.amount : item.amount, currency)}</td>
    <td>${escapeHtml(item.reference || '-')}</td>
    ${canManage ? `<td><div class="finance-row-actions"><button type="button" class="icon-button" data-edit-income="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.concept)}">${icon('edit')}</button>${status !== 'void' ? `<button type="button" class="icon-button danger-icon" data-void-income="${escapeHtml(item.id)}" aria-label="Anular ${escapeHtml(item.concept)}">${icon('x')}</button>` : ''}</div></td>` : ''}
  </tr>`;
}

function renderCosts({ data, canManage }) {
  const currency = data.settings.currency;
  return `<div class="finance-tab-stack">
    <div class="finance-toolbar">
      <div><h3>Costos directos</h3><p>Servicios, software, movilidad, materiales y otros gastos del proyecto.</p></div>
      ${canManage ? `<button type="button" class="button button-primary" data-finance-action="new-cost">${icon('plus')} Registrar costo</button>` : ''}
    </div>
    <div class="finance-kpi-grid finance-kpi-grid-compact">
      ${kpi({ label: 'Costo directo', value: money(data.metrics.directCosts, currency), iconName: 'wallet' })}
      ${kpi({ label: 'Pagado', value: money(data.metrics.paidCosts, currency), tone: 'positive', iconName: 'check' })}
      ${kpi({ label: 'Pendiente', value: money(data.metrics.pendingCosts, currency), tone: 'warning', iconName: 'clock' })}
    </div>
    <article class="panel finance-panel">
      <div class="finance-table-wrap">
        <table class="finance-table">
          <thead><tr><th>Proveedor / concepto</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th>Monto</th><th>Responsable</th><th>Comprobante</th>${canManage ? '<th>Acciones</th>' : ''}</tr></thead>
          <tbody>${data.costs.length ? data.costs.map(item => costRow(item, currency, canManage)).join('') : `<tr><td colspan="${canManage ? 8 : 7}"><div class="finance-table-empty">${icon('wallet')}<strong>Sin costos registrados</strong><span>Registra los gastos directos para calcular el costo real.</span></div></td></tr>`}</tbody>
        </table>
      </div>
    </article>
  </div>`;
}

function costRow(item, currency, canManage) {
  return `<tr class="${item.paymentStatus === 'void' ? 'finance-row-muted' : ''}">
    <td><strong>${escapeHtml(item.vendor)}</strong>${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ''}</td>
    <td>${escapeHtml(COST_CATEGORIES[item.category] || item.category)}</td>
    <td>${formatLocalDate(item.date)}</td>
    <td><span class="finance-status finance-status-${escapeHtml(item.paymentStatus)}">${escapeHtml(PAYMENT_STATUS[item.paymentStatus] || item.paymentStatus)}</span></td>
    <td class="finance-number">${money(item.amount, currency)}</td>
    <td>${escapeHtml(item.responsible || '-')}</td>
    <td>${item.receiptUrl ? `<a class="finance-inline-link" href="${escapeHtml(item.receiptUrl)}" target="_blank" rel="noopener">Abrir ${icon('external')}</a>` : '<span class="finance-missing">Falta sustento</span>'}</td>
    ${canManage ? `<td><div class="finance-row-actions"><button type="button" class="icon-button" data-edit-cost="${escapeHtml(item.id)}" aria-label="Editar costo">${icon('edit')}</button><button type="button" class="icon-button danger-icon" data-delete-cost="${escapeHtml(item.id)}" aria-label="Eliminar costo">${icon('trash')}</button></div></td>` : ''}
  </tr>`;
}

function renderTime({ project, session, data, canLogTime }) {
  const canViewAll = canViewAllProjectTime(session, project.id, project.workspaceId);
  return `<div class="finance-tab-stack">
    <div class="finance-toolbar">
      <div><h3>${canViewAll ? 'Horas del equipo' : 'Mis horas'}</h3><p>Registra dedicación manualmente o con el temporizador de trabajo.</p></div>
      ${canLogTime ? `<button type="button" class="button button-primary" data-finance-action="new-time">${icon('plus')} Registrar horas</button>` : ''}
    </div>
    ${canLogTime ? renderWorkTimer(project, session) : ''}
    <div class="finance-kpi-grid finance-kpi-grid-compact">
      ${kpi({ label: canViewAll ? 'Horas acumuladas' : 'Mis horas registradas', value: `${data.metrics.actualHours} h`, iconName: 'clock' })}
      ${canViewAll ? kpi({ label: 'Horas planificadas', value: `${data.metrics.plannedHours} h`, note: percent(data.metrics.hoursUsedPercent), tone: data.metrics.hoursUsedPercent > 100 ? 'danger' : '', iconName: 'target' }) : ''}
      ${canViewAll ? kpi({ label: 'Horas facturables', value: `${data.metrics.billableHours} h`, iconName: 'check' }) : ''}
    </div>
    ${canViewAll ? `<article class="panel finance-panel"><div class="panel-header"><div><h3>Dedicación por integrante</h3><p>Distribución de horas registradas.</p></div></div><div class="panel-body">${renderMemberHours(data.metrics.memberHours, data.metrics.actualHours)}</div></article>` : ''}
    <article class="panel finance-panel">
      <div class="finance-table-wrap">
        <table class="finance-table">
          <thead><tr><th>Fecha</th><th>Integrante</th><th>Tipo</th><th>Referencia</th><th>Descripción</th><th>Horas</th><th>Fuente</th>${canLogTime ? '<th>Acciones</th>' : ''}</tr></thead>
          <tbody>${data.timeEntries.length ? data.timeEntries.map(item => timeRow(item, session, canViewAll, canLogTime)).join('') : `<tr><td colspan="${canLogTime ? 8 : 7}"><div class="finance-table-empty">${icon('clock')}<strong>Sin horas registradas</strong><span>Inicia el temporizador o registra una dedicación manual.</span></div></td></tr>`}</tbody>
        </table>
      </div>
    </article>
  </div>`;
}

function renderWorkTimer(project, session) {
  const state = readTimer(project.id, session.user.id);
  return `<section class="finance-work-timer ${state.running ? 'is-running' : ''}" data-work-timer>
    <div class="finance-timer-icon">${icon('clock')}</div>
    <div class="finance-timer-copy"><small>Temporizador de trabajo</small><strong data-timer-display>${timerText(timerSeconds(state))}</strong><span>${state.running ? 'Registrando tiempo' : 'Listo para iniciar'}</span></div>
    <div class="finance-timer-actions">
      <button type="button" class="button button-secondary" data-timer-action="${state.running ? 'pause' : 'start'}">${icon(state.running ? 'pause' : 'play')} ${state.running ? 'Pausar' : 'Iniciar'}</button>
      <button type="button" class="button button-secondary" data-timer-action="reset" ${timerSeconds(state) <= 0 ? 'disabled' : ''}>${icon('refresh')} Reiniciar</button>
      <button type="button" class="button button-primary" data-timer-action="save" ${timerSeconds(state) <= 0 ? 'disabled' : ''}>${icon('check')} Detener y registrar</button>
    </div>
  </section>`;
}

function renderMemberHours(items, total) {
  if (!items?.length) return '<p class="finance-empty-copy">No hay horas para distribuir.</p>';
  return `<div class="finance-member-hours">${items.map(item => {
    const width = total > 0 ? (item.hours / total) * 100 : 0;
    return `<div class="finance-member-hour-row"><span class="profile-avatar finance-mini-avatar">${escapeHtml(initials(item.userName))}</span><div><div><strong>${escapeHtml(item.userName)}</strong><span>${item.hours} h</span></div><div class="finance-bar-track"><span style="width:${capProgress(width)}%"></span></div></div></div>`;
  }).join('')}</div>`;
}

function initials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'W';
}

function timeRow(item, session, canViewAll, canLogTime) {
  const mayEdit = canLogTime && (canViewAll || item.userId === session.user.id);
  return `<tr>
    <td>${formatLocalDate(item.date)}</td>
    <td><strong>${escapeHtml(item.userName)}</strong></td>
    <td>${escapeHtml(WORK_TYPES[item.workType] || item.workType)}</td>
    <td>${escapeHtml(item.reference || '-')}</td>
    <td>${escapeHtml(item.description)}</td>
    <td class="finance-number">${Number(item.hours).toFixed(2).replace(/\.00$/, '')} h</td>
    <td><span class="finance-source">${item.source === 'timer' ? `${icon('clock')} Timer` : 'Manual'}</span></td>
    ${canLogTime ? `<td>${mayEdit ? `<div class="finance-row-actions"><button type="button" class="icon-button" data-edit-time="${escapeHtml(item.id)}" aria-label="Editar horas">${icon('edit')}</button><button type="button" class="icon-button danger-icon" data-delete-time="${escapeHtml(item.id)}" aria-label="Eliminar horas">${icon('trash')}</button></div>` : '-'}</td>` : ''}
  </tr>`;
}

function renderProfitability({ data }) {
  const m = data.metrics;
  const currency = data.settings.currency;
  const incomeMax = Math.max(m.totalBillable, m.received, m.realCost, 1);
  return `<div class="finance-tab-stack">
    <div class="finance-toolbar"><div><h3>Rentabilidad del proyecto</h3><p>Resultado económico esperado y flujo de caja actual.</p></div></div>
    <div class="finance-kpi-grid">
      ${kpi({ label: 'Ingresos contratados', value: money(m.totalBillable, currency), iconName: 'file' })}
      ${kpi({ label: 'Costo real', value: money(m.realCost, currency), note: `${money(m.directCosts, currency)} directos + ${money(m.laborCost, currency)} horas`, iconName: 'wallet' })}
      ${kpi({ label: 'Utilidad proyectada', value: money(m.expectedProfit, currency), tone: m.expectedProfit >= 0 ? 'positive' : 'danger', iconName: 'chart' })}
      ${kpi({ label: 'Margen proyectado', value: percent(m.expectedMargin), note: `Meta ${percent(m.targetMargin)}`, tone: m.expectedMargin >= m.targetMargin ? 'positive' : 'warning', iconName: 'target' })}
      ${kpi({ label: 'Utilidad de caja', value: money(m.cashProfit, currency), note: 'Cobrado menos costos pagados y horas', tone: m.cashProfit >= 0 ? 'positive' : 'danger', iconName: 'wallet' })}
      ${kpi({ label: 'Valor facturable de horas', value: money(m.billableHoursValue, currency), note: `${m.billableHours} h facturables`, iconName: 'clock' })}
    </div>
    <div class="finance-summary-layout">
      <article class="panel finance-panel">
        <div class="panel-header"><div><h3>Ingresos frente a costos</h3><p>Comparación sobre el valor contratado.</p></div></div>
        <div class="panel-body finance-comparison">
          ${comparisonBar('Total facturable', m.totalBillable, incomeMax, currency, 'income')}
          ${comparisonBar('Pagos recibidos', m.received, incomeMax, currency, 'received')}
          ${comparisonBar('Costo real', m.realCost, incomeMax, currency, 'cost')}
          ${comparisonBar('Utilidad proyectada', Math.max(0, m.expectedProfit), incomeMax, currency, 'profit')}
        </div>
      </article>
      <article class="panel finance-panel">
        <div class="panel-header"><div><h3>Composición del costo real</h3><p>Horas internas y gastos directos.</p></div></div>
        <div class="panel-body finance-cost-composition">
          <div><span>Costo del equipo</span><strong>${money(m.laborCost, currency)}</strong><small>${percent(m.realCost > 0 ? m.laborCost / m.realCost * 100 : 0)}</small></div>
          <div><span>Costos directos</span><strong>${money(m.directCosts, currency)}</strong><small>${percent(m.realCost > 0 ? m.directCosts / m.realCost * 100 : 0)}</small></div>
          <div><span>Desviación de presupuesto</span><strong class="${m.budgetVariance > 0 ? 'negative' : 'positive'}">${money(m.budgetVariance, currency)}</strong><small>${m.budgetVariance > 0 ? 'Sobre el presupuesto' : 'Disponible'}</small></div>
        </div>
      </article>
    </div>
    <article class="panel finance-panel"><div class="panel-header"><div><h3>Tarifas internas del equipo</h3><p>Información privada de costos y capacidad.</p></div></div><div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Integrante</th><th>Costo / hora</th><th>Tarifa facturable</th><th>Capacidad semanal</th><th>Acción</th></tr></thead><tbody>${data.memberRates.length ? data.memberRates.map(rate => `<tr><td><strong>${escapeHtml(rate.userName)}</strong></td><td>${money(rate.costRate, currency)}</td><td>${money(rate.billableRate, currency)}</td><td>${Number(rate.weeklyCapacity || 0)} h</td><td><button type="button" class="icon-button" data-edit-rate="${escapeHtml(rate.userId)}" aria-label="Editar tarifa de ${escapeHtml(rate.userName)}">${icon('edit')}</button></td></tr>`).join('') : '<tr><td colspan="5"><div class="finance-table-empty"><strong>Sin tarifas configuradas</strong><span>Agrega una tarifa para calcular el costo de las horas.</span></div></td></tr>'}</tbody></table></div></article>
  </div>`;
}

function comparisonBar(label, value, max, currency, tone) {
  return `<div class="finance-comparison-row"><div><span>${escapeHtml(label)}</span><strong>${money(value, currency)}</strong></div><div class="finance-comparison-track"><span class="finance-comparison-${tone}" style="width:${capProgress(value / max * 100)}%"></span></div></div>`;
}

function renderSettings({ project, data }) {
  const s = data.settings;
  return `<div class="finance-tab-stack">
    <div class="finance-toolbar"><div><h3>Configuración financiera</h3><p>Condiciones comerciales, presupuesto y metas del proyecto.</p></div></div>
    <form class="panel finance-panel finance-settings-form" id="finance-settings-form">
      <div class="panel-body">
        <div class="form-grid two-cols">
          <label class="form-field"><span>Moneda</span><select class="select" name="currency"><option value="PEN" ${s.currency === 'PEN' ? 'selected' : ''}>Soles (PEN)</option><option value="USD" ${s.currency === 'USD' ? 'selected' : ''}>Dólares (USD)</option></select></label>
          <label class="form-field"><span>Monto contratado</span><input class="input" type="number" name="contractedAmount" min="0" step="0.01" value="${Number(s.contractedAmount || 0)}"></label>
          <label class="form-field"><span>Presupuesto interno</span><input class="input" type="number" name="internalBudget" min="0" step="0.01" value="${Number(s.internalBudget || 0)}"></label>
          <label class="form-field"><span>Descuento</span><input class="input" type="number" name="discount" min="0" step="0.01" value="${Number(s.discount || 0)}"></label>
          <label class="form-field"><span>Impuesto (%)</span><input class="input" type="number" name="taxRate" min="0" max="100" step="0.01" value="${Number(s.taxRate || 0)}"></label>
          <label class="form-field"><span>Horas planificadas</span><input class="input" type="number" name="plannedHours" min="0" step="0.25" value="${Number(s.plannedHours || 0)}"></label>
          <label class="form-field"><span>Margen objetivo (%)</span><input class="input" type="number" name="targetMargin" min="0" max="100" step="0.1" value="${Number(s.targetMargin || 0)}"></label>
        </div>
        <label class="form-field"><span>Condiciones de pago</span><textarea class="textarea" name="paymentTerms" rows="3">${escapeHtml(s.paymentTerms || '')}</textarea></label>
        <label class="form-field"><span>Notas de facturación</span><textarea class="textarea" name="billingNotes" rows="3">${escapeHtml(s.billingNotes || '')}</textarea></label>
        <div class="form-global-error hidden" id="finance-settings-error"></div>
        <div class="modal-actions"><button type="submit" class="button button-primary" data-submit>${icon('check')} Guardar configuración</button></div>
      </div>
    </form>
    <article class="panel finance-panel">
      <div class="panel-header"><div><h3>Tarifas del equipo</h3><p>Costos internos, tarifas facturables y capacidad semanal.</p></div><button type="button" class="button button-secondary" data-finance-action="new-rate">${icon('plus')} Agregar tarifa</button></div>
      <div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Integrante</th><th>Costo / hora</th><th>Tarifa facturable</th><th>Capacidad semanal</th><th>Acción</th></tr></thead><tbody>${data.memberRates.length ? data.memberRates.map(rate => `<tr><td><strong>${escapeHtml(rate.userName)}</strong></td><td>${money(rate.costRate, s.currency)}</td><td>${money(rate.billableRate, s.currency)}</td><td>${Number(rate.weeklyCapacity || 0)} h</td><td><button type="button" class="icon-button" data-edit-rate="${escapeHtml(rate.userId)}">${icon('edit')}</button></td></tr>`).join('') : '<tr><td colspan="5"><div class="finance-table-empty"><strong>Sin tarifas configuradas</strong><span>Agrega integrantes para calcular el costo del equipo.</span></div></td></tr>'}</tbody></table></div>
    </article>
  </div>`;
}

function bindTabEvents(container, context) {
  const { project, session, data, activeTab, refresh } = context;

  container.querySelectorAll('[data-alert-tab]').forEach(button => {
    button.addEventListener('click', () => refresh(button.dataset.alertTab, { focusHeading: true }));
  });

  container.querySelector('[data-finance-action="settings"]')?.addEventListener('click', () => refresh('settings', { focusHeading: true }));
  container.querySelectorAll('[data-finance-action="new-income"]').forEach(button => button.addEventListener('click', () => openIncomeForm({ project, session, onSaved: () => refresh(activeTab) })));
  container.querySelector('[data-finance-action="new-cost"]')?.addEventListener('click', () => openCostForm({ project, session, onSaved: () => refresh(activeTab) }));
  container.querySelector('[data-finance-action="new-time"]')?.addEventListener('click', () => openTimeForm({ project, session, data, onSaved: () => refresh(activeTab) }));
  container.querySelector('[data-finance-action="new-rate"]')?.addEventListener('click', () => openRateForm({ project, session, onSaved: () => refresh(activeTab) }));

  container.querySelectorAll('[data-edit-income]').forEach(button => button.addEventListener('click', () => {
    const item = data.incomes.find(entry => entry.id === button.dataset.editIncome);
    if (item) openIncomeForm({ project, session, item, onSaved: () => refresh(activeTab) });
  }));

  container.querySelectorAll('[data-void-income]').forEach(button => button.addEventListener('click', async () => {
    const item = data.incomes.find(entry => entry.id === button.dataset.voidIncome);
    if (!item) return;
    const confirmed = await confirmModal({
      title: 'Anular ingreso',
      message: `El movimiento <strong>${escapeHtml(item.concept)}</strong> dejará de contabilizarse.`,
      confirmLabel: 'Anular',
      danger: true
    });
    if (!confirmed) return;
    await runMutation(() => FinanceService.voidIncome({ projectId: project.id, incomeId: item.id, session }), 'Ingreso anulado.');
    refresh(activeTab);
  }));

  container.querySelectorAll('[data-edit-cost]').forEach(button => button.addEventListener('click', () => {
    const item = data.costs.find(entry => entry.id === button.dataset.editCost);
    if (item) openCostForm({ project, session, item, onSaved: () => refresh(activeTab) });
  }));

  container.querySelectorAll('[data-delete-cost]').forEach(button => button.addEventListener('click', async () => {
    const item = data.costs.find(entry => entry.id === button.dataset.deleteCost);
    if (!item) return;
    const confirmed = await confirmModal({
      title: 'Eliminar costo',
      message: `Se eliminará el costo <strong>${escapeHtml(item.vendor)}</strong>.`,
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!confirmed) return;
    await runMutation(() => FinanceService.deleteCost({ projectId: project.id, costId: item.id, session }), 'Costo eliminado.');
    refresh(activeTab);
  }));

  container.querySelectorAll('[data-edit-time]').forEach(button => button.addEventListener('click', () => {
    const item = data.timeEntries.find(entry => entry.id === button.dataset.editTime);
    if (item) openTimeForm({ project, session, data, item, onSaved: () => refresh(activeTab) });
  }));

  container.querySelectorAll('[data-delete-time]').forEach(button => button.addEventListener('click', async () => {
    const item = data.timeEntries.find(entry => entry.id === button.dataset.deleteTime);
    if (!item) return;
    const confirmed = await confirmModal({
      title: 'Eliminar registro de horas',
      message: `Se eliminarán <strong>${Number(item.hours)} h</strong> del ${formatLocalDate(item.date)}.`,
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!confirmed) return;
    await runMutation(() => FinanceService.deleteTimeEntry({ projectId: project.id, timeEntryId: item.id, session }), 'Registro de horas eliminado.');
    refresh(activeTab);
  }));

  container.querySelectorAll('[data-edit-rate]').forEach(button => button.addEventListener('click', () => {
    const rate = data.memberRates.find(entry => entry.userId === button.dataset.editRate);
    if (rate) openRateForm({ project, session, rate, onSaved: () => refresh(activeTab) });
  }));

  const settingsForm = container.querySelector('#finance-settings-form');
  settingsForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[data-submit]');
    const errorSlot = form.querySelector('#finance-settings-error');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    errorSlot.classList.add('hidden');
    try {
      const raw = Object.fromEntries(new FormData(form).entries());
      await runMutation(() => FinanceService.updateSettings({
        projectId: project.id,
        workspaceId: project.workspaceId,
        input: {
          currency: raw.currency,
          contractedAmount: safeNumber(raw.contractedAmount),
          internalBudget: safeNumber(raw.internalBudget),
          discount: safeNumber(raw.discount),
          taxRate: safeNumber(raw.taxRate),
          plannedHours: safeNumber(raw.plannedHours),
          targetMargin: safeNumber(raw.targetMargin),
          paymentTerms: normalizeText(raw.paymentTerms, 1000),
          billingNotes: normalizeText(raw.billingNotes, 1000)
        },
        session
      }), 'Configuración financiera guardada.');
      refresh(activeTab);
    } catch (error) {
      errorSlot.textContent = error.message || 'No se pudo guardar.';
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.innerHTML = `${icon('check')} Guardar configuración`;
    }
  });

  bindTimer(container, { project, session, data, refresh, activeTab });
}

async function runMutation(operation, successMessage) {
  lastLocalMutationAt = Date.now();
  try {
    const result = await operation();
    if (successMessage) showToast(successMessage);
    return result;
  } catch (error) {
    showToast(error.message || 'No se pudo completar la operación.');
    throw error;
  }
}

function bindTimer(container, { project, session, data, refresh, activeTab }) {
  const timerRoot = container.querySelector('[data-work-timer]');
  if (!timerRoot) return;
  clearInterval(timerInterval);

  const updateDisplay = () => {
    const state = readTimer(project.id, session.user.id);
    timerRoot.querySelector('[data-timer-display]').textContent = timerText(timerSeconds(state));
  };
  timerInterval = setInterval(updateDisplay, 1000);
  updateDisplay();

  timerRoot.querySelectorAll('[data-timer-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.timerAction;
      const state = readTimer(project.id, session.user.id);
      const elapsed = timerSeconds(state);

      if (action === 'start') {
        writeTimer(project.id, session.user.id, { running: true, startedAt: Date.now(), accumulatedSeconds: elapsed });
        refresh(activeTab);
        return;
      }
      if (action === 'pause') {
        writeTimer(project.id, session.user.id, { running: false, startedAt: 0, accumulatedSeconds: elapsed });
        refresh(activeTab);
        return;
      }
      if (action === 'reset') {
        writeTimer(project.id, session.user.id, { running: false, startedAt: 0, accumulatedSeconds: 0 });
        refresh(activeTab);
        return;
      }
      if (action === 'save') {
        writeTimer(project.id, session.user.id, { running: false, startedAt: 0, accumulatedSeconds: elapsed });
        openTimeForm({
          project,
          session,
          data,
          timerSecondsValue: elapsed,
          onSaved: () => {
            writeTimer(project.id, session.user.id, { running: false, startedAt: 0, accumulatedSeconds: 0 });
            refresh(activeTab);
          }
        });
      }
    });
  });
}

function inputValue(value) {
  return escapeHtml(value ?? '');
}

function optionList(map, selected) {
  return Object.entries(map).map(([value, label]) => `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}

function openIncomeForm({ project, session, item = null, onSaved }) {
  const editing = Boolean(item);
  const modal = openModal({
    title: editing ? 'Editar ingreso' : 'Registrar ingreso',
    subtitle: 'Control de cobros y pagos del proyecto.',
    body: `<form id="finance-income-form">
      <div class="form-grid two-cols">
        <label class="form-field span-2"><span>Concepto *</span><input class="input" name="concept" maxlength="180" value="${inputValue(item?.concept)}" placeholder="Ej.: Adelanto del proyecto" required></label>
        <label class="form-field"><span>Tipo</span><select class="select" name="type">${optionList(INCOME_TYPES, item?.type || 'partial')}</select></label>
        <label class="form-field"><span>Estado</span><select class="select" name="status"><option value="pending" ${item?.status !== 'paid' && item?.status !== 'void' ? 'selected' : ''}>Pendiente</option><option value="paid" ${item?.status === 'paid' ? 'selected' : ''}>Pagado</option><option value="void" ${item?.status === 'void' ? 'selected' : ''}>Anulado</option></select></label>
        <label class="form-field"><span>Monto *</span><input class="input" type="number" min="0.01" step="0.01" name="amount" value="${Number(item?.amount || 0)}" required></label>
        <label class="form-field"><span>Fecha de vencimiento</span><input class="input" type="date" name="dueDate" value="${inputValue(item?.dueDate)}"></label>
        <label class="form-field"><span>Fecha de pago</span><input class="input" type="date" name="paidDate" value="${inputValue(item?.paidDate)}"></label>
        <label class="form-field"><span>Referencia</span><input class="input" name="reference" maxlength="120" value="${inputValue(item?.reference)}" placeholder="N.º de operación"></label>
        <label class="form-field span-2"><span>Comprobante o sustento</span><input class="input" type="url" name="evidenceUrl" value="${inputValue(item?.evidenceUrl)}" placeholder="https://..."></label>
        <label class="form-field span-2"><span>Observaciones</span><textarea class="textarea" name="notes" rows="3">${inputValue(item?.notes)}</textarea></label>
      </div>
      <div class="form-global-error hidden" id="finance-income-error"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button type="submit" class="button button-primary" data-submit>${editing ? 'Guardar cambios' : 'Registrar ingreso'}</button></div>
    </form>`,
    size: 'lg',
    closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#finance-income-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[data-submit]');
    const errorSlot = form.querySelector('#finance-income-error');
    const raw = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    errorSlot.classList.add('hidden');
    try {
      const input = {
        concept: normalizeText(raw.concept, 180),
        type: raw.type,
        status: raw.status,
        amount: safeNumber(raw.amount),
        dueDate: raw.dueDate,
        paidDate: raw.paidDate,
        reference: normalizeText(raw.reference, 120),
        evidenceUrl: normalizeUrl(raw.evidenceUrl),
        notes: normalizeText(raw.notes, 1000)
      };
      if (editing) await runMutation(() => FinanceService.updateIncome({ projectId: project.id, incomeId: item.id, input, session }), 'Ingreso actualizado.');
      else await runMutation(() => FinanceService.createIncome({ projectId: project.id, workspaceId: project.workspaceId, input, session }), 'Ingreso registrado.');
      modal.close();
      await onSaved?.();
    } catch (error) {
      errorSlot.textContent = error.message || 'No se pudo guardar el ingreso.';
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = editing ? 'Guardar cambios' : 'Registrar ingreso';
    }
  });
}

function openCostForm({ project, session, item = null, onSaved }) {
  const editing = Boolean(item);
  const modal = openModal({
    title: editing ? 'Editar costo' : 'Registrar costo',
    subtitle: 'Gastos directos asociados al proyecto.',
    body: `<form id="finance-cost-form">
      <div class="form-grid two-cols">
        <label class="form-field span-2"><span>Proveedor o concepto *</span><input class="input" name="vendor" maxlength="180" value="${inputValue(item?.vendor)}" placeholder="Ej.: Hosting y dominio" required></label>
        <label class="form-field"><span>Categoría</span><select class="select" name="category">${optionList(COST_CATEGORIES, item?.category || 'other')}</select></label>
        <label class="form-field"><span>Estado de pago</span><select class="select" name="paymentStatus">${optionList(PAYMENT_STATUS, item?.paymentStatus || 'pending')}</select></label>
        <label class="form-field"><span>Monto *</span><input class="input" type="number" min="0.01" step="0.01" name="amount" value="${Number(item?.amount || 0)}" required></label>
        <label class="form-field"><span>Fecha *</span><input class="input" type="date" name="date" value="${inputValue(item?.date || today())}" required></label>
        <label class="form-field span-2"><span>Responsable</span><input class="input" name="responsible" maxlength="120" value="${inputValue(item?.responsible || session.user.name)}"></label>
        <label class="form-field span-2"><span>Comprobante o sustento</span><input class="input" type="url" name="receiptUrl" value="${inputValue(item?.receiptUrl)}" placeholder="https://..."></label>
        <label class="form-field span-2"><span>Observaciones</span><textarea class="textarea" name="notes" rows="3">${inputValue(item?.notes)}</textarea></label>
      </div>
      <div class="form-global-error hidden" id="finance-cost-error"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button type="submit" class="button button-primary" data-submit>${editing ? 'Guardar cambios' : 'Registrar costo'}</button></div>
    </form>`,
    size: 'lg',
    closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#finance-cost-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[data-submit]');
    const errorSlot = form.querySelector('#finance-cost-error');
    const raw = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    errorSlot.classList.add('hidden');
    try {
      const input = {
        vendor: normalizeText(raw.vendor, 180),
        category: raw.category,
        paymentStatus: raw.paymentStatus,
        amount: safeNumber(raw.amount),
        date: raw.date,
        responsible: normalizeText(raw.responsible, 120),
        receiptUrl: normalizeUrl(raw.receiptUrl),
        notes: normalizeText(raw.notes, 1000)
      };
      if (editing) await runMutation(() => FinanceService.updateCost({ projectId: project.id, costId: item.id, input, session }), 'Costo actualizado.');
      else await runMutation(() => FinanceService.createCost({ projectId: project.id, workspaceId: project.workspaceId, input, session }), 'Costo registrado.');
      modal.close();
      await onSaved?.();
    } catch (error) {
      errorSlot.textContent = error.message || 'No se pudo guardar el costo.';
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = editing ? 'Guardar cambios' : 'Registrar costo';
    }
  });
}

function userOptions(data, session, selectedUserId) {
  const rates = data.memberRates || [];
  if (!rates.length) return `<option value="${escapeHtml(session.user.id)}">${escapeHtml(session.user.name)}</option>`;
  return rates.map(rate => `<option value="${escapeHtml(rate.userId)}" data-user-name="${escapeHtml(rate.userName)}" ${selectedUserId === rate.userId ? 'selected' : ''}>${escapeHtml(rate.userName)}</option>`).join('');
}

function openTimeForm({ project, session, data, item = null, timerSecondsValue = 0, onSaved }) {
  const editing = Boolean(item);
  const canViewAll = canViewAllProjectTime(session, project.id, project.workspaceId);
  const defaultHours = item?.hours ?? (timerSecondsValue ? Math.max(0.02, Math.round(timerSecondsValue / 36) / 100) : 1);
  const selectedUserId = item?.userId || session.user.id;
  const modal = openModal({
    title: editing ? 'Editar horas' : timerSecondsValue ? 'Registrar tiempo del temporizador' : 'Registrar horas',
    subtitle: 'Dedicación real aplicada al proyecto.',
    body: `<form id="finance-time-form">
      <div class="form-grid two-cols">
        ${canViewAll ? `<label class="form-field"><span>Integrante</span><select class="select" name="userId" id="finance-time-user">${userOptions(data, session, selectedUserId)}</select></label>` : `<input type="hidden" name="userId" value="${escapeHtml(session.user.id)}">`}
        <label class="form-field"><span>Fecha *</span><input class="input" type="date" name="date" value="${inputValue(item?.date || today())}" required></label>
        <label class="form-field"><span>Horas *</span><input class="input" type="number" min="0.01" max="24" step="0.01" name="hours" value="${Number(defaultHours)}" required></label>
        <label class="form-field"><span>Tipo de trabajo</span><select class="select" name="workType">${optionList(WORK_TYPES, item?.workType || 'development')}</select></label>
        <label class="form-field span-2"><span>Tarea, entregable o referencia</span><input class="input" name="reference" maxlength="180" value="${inputValue(item?.reference)}" placeholder="Ej.: Kanban TK-014, Entregable MVP"></label>
        <label class="form-field span-2"><span>Trabajo realizado *</span><textarea class="textarea" name="description" rows="4" required>${inputValue(item?.description)}</textarea></label>
        <label class="form-check span-2"><input type="checkbox" name="billable" value="true" ${item?.billable === false ? '' : 'checked'}><span>Horas facturables al cliente</span></label>
      </div>
      <div class="form-global-error hidden" id="finance-time-error"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button type="submit" class="button button-primary" data-submit>${editing ? 'Guardar cambios' : 'Registrar horas'}</button></div>
    </form>`,
    size: 'lg',
    closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#finance-time-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[data-submit]');
    const errorSlot = form.querySelector('#finance-time-error');
    const raw = Object.fromEntries(new FormData(form).entries());
    const selectedOption = form.querySelector('#finance-time-user option:checked');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    errorSlot.classList.add('hidden');
    try {
      const input = {
        userId: raw.userId || session.user.id,
        userName: selectedOption?.dataset.userName || item?.userName || session.user.name,
        date: raw.date,
        hours: safeNumber(raw.hours),
        workType: raw.workType,
        reference: normalizeText(raw.reference, 180),
        description: normalizeText(raw.description, 1000),
        source: timerSecondsValue ? 'timer' : (item?.source || 'manual'),
        billable: raw.billable === 'true'
      };
      if (editing) await runMutation(() => FinanceService.updateTimeEntry({ projectId: project.id, timeEntryId: item.id, input, session }), 'Horas actualizadas.');
      else await runMutation(() => FinanceService.createTimeEntry({ projectId: project.id, workspaceId: project.workspaceId, input, session }), 'Horas registradas.');
      modal.close();
      await onSaved?.();
    } catch (error) {
      errorSlot.textContent = error.message || 'No se pudieron registrar las horas.';
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = editing ? 'Guardar cambios' : 'Registrar horas';
    }
  });
}

function openRateForm({ project, session, rate = null, onSaved }) {
  const modal = openModal({
    title: rate ? 'Editar tarifa' : 'Agregar tarifa',
    subtitle: 'Valores internos para calcular costo y capacidad.',
    body: `<form id="finance-rate-form">
      <div class="form-grid two-cols">
        <label class="form-field"><span>ID del integrante *</span><input class="input" name="userId" maxlength="100" value="${inputValue(rate?.userId)}" ${rate ? 'readonly' : ''} placeholder="usr-nombre" required></label>
        <label class="form-field"><span>Nombre *</span><input class="input" name="userName" maxlength="120" value="${inputValue(rate?.userName)}" required></label>
        <label class="form-field"><span>Costo interno / hora</span><input class="input" type="number" min="0" step="0.01" name="costRate" value="${Number(rate?.costRate || 0)}"></label>
        <label class="form-field"><span>Tarifa facturable / hora</span><input class="input" type="number" min="0" step="0.01" name="billableRate" value="${Number(rate?.billableRate || 0)}"></label>
        <label class="form-field span-2"><span>Capacidad semanal (horas)</span><input class="input" type="number" min="0" max="168" step="0.5" name="weeklyCapacity" value="${Number(rate?.weeklyCapacity || 0)}"></label>
      </div>
      <div class="form-global-error hidden" id="finance-rate-error"></div>
      <div class="modal-actions"><button type="button" class="button button-secondary" data-modal-close>Cancelar</button><button type="submit" class="button button-primary" data-submit>Guardar tarifa</button></div>
    </form>`,
    size: 'md',
    closeOnBackdrop: false
  });
  const form = modal.root.querySelector('#finance-rate-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[data-submit]');
    const errorSlot = form.querySelector('#finance-rate-error');
    const raw = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    errorSlot.classList.add('hidden');
    try {
      await runMutation(() => FinanceService.updateMemberRate({
        projectId: project.id,
        workspaceId: project.workspaceId,
        input: {
          userId: normalizeText(raw.userId, 100),
          userName: normalizeText(raw.userName, 120),
          costRate: safeNumber(raw.costRate),
          billableRate: safeNumber(raw.billableRate),
          weeklyCapacity: safeNumber(raw.weeklyCapacity)
        },
        session
      }), 'Tarifa guardada.');
      modal.close();
      await onSaved?.();
    } catch (error) {
      errorSlot.textContent = error.message || 'No se pudo guardar la tarifa.';
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = 'Guardar tarifa';
    }
  });
}
