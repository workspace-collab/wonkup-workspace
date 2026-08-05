import { demoFinanceRecords } from '../../data/demo-finance.js';
import {
  canAccessProjectFinance,
  canConfigureProjectFinance,
  canLogProjectTime,
  canManageProjectFinance,
  canViewAllProjectTime,
  canViewProjectProfitability
} from '../utils/permissions.js?v=7.0.0';
import { calculateFinanceMetrics, buildFinanceAlerts } from '../utils/finance-calculations.js';

const STORAGE_KEY = 'wonkup.e7.finance';
const CHANNEL_NAME = 'wonkup-finance';
const listeners = new Set();
const wait = (milliseconds = 80) => new Promise(resolve => setTimeout(resolve, milliseconds));
const clone = value => JSON.parse(JSON.stringify(value));
let channel = null;

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener('message', event => notify(event.data || { type: 'sync' }, false));
} catch {
  channel = null;
}

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) notify({ type: 'sync' }, false);
});

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Continue with demo seed.
  }
  const seeded = clone(demoFinanceRecords);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch { /* noop */ }
  return seeded;
}

function write(items, event = { type: 'sync' }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notify(event, true);
  return clone(items);
}

function notify(event, broadcast) {
  listeners.forEach(listener => {
    try { listener(clone(event)); } catch { /* isolate subscribers */ }
  });
  if (broadcast) {
    try { channel?.postMessage(event); } catch { /* noop */ }
  }
}

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

function number(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanUrl(value) {
  const raw = clean(value, 1000);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function ensureRecord(items, projectId, workspaceId) {
  let record = items.find(item => item.projectId === projectId);
  if (!record) {
    const createdAt = now();
    record = {
      id: uid('fin'),
      workspaceId,
      projectId,
      settings: {
        currency: 'PEN',
        contractedAmount: 0,
        internalBudget: 0,
        taxRate: 0,
        discount: 0,
        plannedHours: 0,
        targetMargin: 30,
        paymentTerms: '',
        billingNotes: ''
      },
      memberRates: [],
      incomes: [],
      costs: [],
      timeEntries: [],
      createdAt,
      updatedAt: createdAt
    };
    items.push(record);
  }
  return record;
}

function assertAccess(session, projectId, workspaceId) {
  if (!canAccessProjectFinance(session, projectId, workspaceId)) {
    throw new Error('No tienes acceso al módulo financiero de este proyecto.');
  }
}

function assertManage(session, projectId, workspaceId) {
  if (!canManageProjectFinance(session, projectId, workspaceId)) {
    throw new Error('Tu rol no permite modificar ingresos o costos.');
  }
}

function assertConfigure(session, projectId, workspaceId) {
  if (!canConfigureProjectFinance(session, projectId, workspaceId)) {
    throw new Error('Solo un administrador puede modificar la configuración financiera.');
  }
}

function findRecord(items, projectId) {
  const record = items.find(item => item.projectId === projectId);
  if (!record) throw new Error('No se encontró la configuración financiera del proyecto.');
  return record;
}

function findItem(list, itemId, label) {
  const index = list.findIndex(item => item.id === itemId);
  if (index < 0) throw new Error(`${label} no encontrado.`);
  return index;
}

function normalizeIncome(input = {}, current = {}) {
  const status = ['pending', 'paid', 'void'].includes(input.status) ? input.status : (current.status || 'pending');
  const type = ['advance', 'partial', 'final', 'additional', 'refund'].includes(input.type) ? input.type : (current.type || 'partial');
  const item = {
    ...current,
    type,
    status,
    concept: clean(input.concept ?? current.concept, 180),
    amount: number(input.amount ?? current.amount),
    dueDate: clean(input.dueDate ?? current.dueDate, 20),
    paidDate: status === 'paid' ? clean(input.paidDate ?? current.paidDate, 20) : '',
    reference: clean(input.reference ?? current.reference, 120),
    evidenceUrl: cleanUrl(input.evidenceUrl ?? current.evidenceUrl),
    notes: clean(input.notes ?? current.notes, 1000)
  };
  if (item.concept.length < 3) throw new Error('Escribe un concepto de al menos 3 caracteres.');
  if (item.amount <= 0) throw new Error('El monto debe ser mayor que cero.');
  if (item.status === 'paid' && !item.paidDate) item.paidDate = new Date().toISOString().slice(0, 10);
  return item;
}

function normalizeCost(input = {}, current = {}) {
  const categories = ['personnel', 'services', 'software', 'marketing', 'mobility', 'materials', 'procedures', 'other'];
  const statuses = ['pending', 'paid', 'void'];
  const item = {
    ...current,
    category: categories.includes(input.category) ? input.category : (current.category || 'other'),
    vendor: clean(input.vendor ?? current.vendor, 180),
    amount: number(input.amount ?? current.amount),
    date: clean(input.date ?? current.date, 20),
    responsible: clean(input.responsible ?? current.responsible, 120),
    paymentStatus: statuses.includes(input.paymentStatus) ? input.paymentStatus : (current.paymentStatus || 'pending'),
    receiptUrl: cleanUrl(input.receiptUrl ?? current.receiptUrl),
    notes: clean(input.notes ?? current.notes, 1000)
  };
  if (item.vendor.length < 2) throw new Error('Escribe un proveedor o concepto.');
  if (item.amount <= 0) throw new Error('El monto debe ser mayor que cero.');
  if (!item.date) throw new Error('Selecciona la fecha del costo.');
  return item;
}

function normalizeTime(input = {}, current = {}, session) {
  const workTypes = ['management', 'research', 'design', 'development', 'testing', 'marketing', 'meeting', 'support', 'other'];
  const item = {
    ...current,
    userId: clean(input.userId ?? current.userId ?? session?.user?.id, 100),
    userName: clean(input.userName ?? current.userName ?? session?.user?.name, 120),
    date: clean(input.date ?? current.date, 20),
    hours: number(input.hours ?? current.hours, 0, 24),
    workType: workTypes.includes(input.workType) ? input.workType : (current.workType || 'other'),
    reference: clean(input.reference ?? current.reference, 180),
    description: clean(input.description ?? current.description, 1000),
    source: input.source === 'timer' ? 'timer' : (current.source || 'manual'),
    billable: input.billable === false || input.billable === 'false' ? false : true
  };
  if (!item.date) throw new Error('Selecciona la fecha.');
  if (item.hours <= 0) throw new Error('Las horas deben ser mayores que cero.');
  if (item.description.length < 3) throw new Error('Describe brevemente el trabajo realizado.');
  return item;
}

function redact(record, session) {
  const result = clone(record);
  const fullProfitability = canViewProjectProfitability(session, record.projectId, record.workspaceId);
  const allTime = canViewAllProjectTime(session, record.projectId, record.workspaceId);

  if (!allTime) {
    result.timeEntries = result.timeEntries.filter(item => item.userId === session?.user?.id);
  }

  if (!fullProfitability) {
    result.memberRates = [];
    result.metrics.laborCost = 0;
    result.metrics.billableHoursValue = 0;
    result.metrics.cashProfit = 0;
    result.metrics.cashMargin = 0;
  }

  if (session?.role === 'collaborator') {
    result.incomes = [];
    result.costs = [];
    result.memberRates = [];
    result.settings = {
      currency: result.settings.currency,
      contractedAmount: 0,
      internalBudget: 0,
      taxRate: 0,
      discount: 0,
      plannedHours: 0,
      targetMargin: 0,
      paymentTerms: '',
      billingNotes: ''
    };
    result.metrics = calculateFinanceMetrics(result);
    result.alerts = [];
  }

  return result;
}

function enrich(record, session) {
  const raw = clone(record);
  const metrics = calculateFinanceMetrics(raw);
  const alerts = buildFinanceAlerts(raw, metrics);
  return redact({ ...raw, metrics, alerts }, session);
}

export const MockFinanceAdapter = {
  async getProjectFinance({ projectId, workspaceId, session }) {
    await wait();
    assertAccess(session, projectId, workspaceId);
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    return enrich(record, session);
  },

  async updateSettings({ projectId, workspaceId, input, session }) {
    await wait(120);
    assertConfigure(session, projectId, workspaceId);
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    record.settings = {
      ...record.settings,
      currency: input.currency === 'USD' ? 'USD' : 'PEN',
      contractedAmount: number(input.contractedAmount),
      internalBudget: number(input.internalBudget),
      taxRate: number(input.taxRate, 0, 100),
      discount: number(input.discount),
      plannedHours: number(input.plannedHours),
      targetMargin: number(input.targetMargin, 0, 100),
      paymentTerms: clean(input.paymentTerms, 1000),
      billingNotes: clean(input.billingNotes, 1000)
    };
    record.updatedAt = now();
    write(items, { type: 'settings_updated', projectId });
    return enrich(record, session);
  },

  async createIncome({ projectId, workspaceId, input, session }) {
    await wait(110);
    assertManage(session, projectId, workspaceId);
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    const created = { id: uid('inc'), ...normalizeIncome(input), createdAt: now(), createdBy: session?.user?.name || 'Usuario' };
    record.incomes.unshift(created);
    record.updatedAt = now();
    write(items, { type: 'income_created', projectId, itemId: created.id });
    return clone(created);
  },

  async updateIncome({ projectId, incomeId, input, session }) {
    await wait(100);
    const items = read();
    const record = findRecord(items, projectId);
    assertManage(session, projectId, record.workspaceId);
    const index = findItem(record.incomes, incomeId, 'Ingreso');
    record.incomes[index] = { ...normalizeIncome(input, record.incomes[index]), updatedAt: now() };
    record.updatedAt = now();
    write(items, { type: 'income_updated', projectId, itemId: incomeId });
    return clone(record.incomes[index]);
  },

  async voidIncome({ projectId, incomeId, session }) {
    await wait(80);
    const items = read();
    const record = findRecord(items, projectId);
    assertManage(session, projectId, record.workspaceId);
    const index = findItem(record.incomes, incomeId, 'Ingreso');
    record.incomes[index] = { ...record.incomes[index], status: 'void', updatedAt: now() };
    record.updatedAt = now();
    write(items, { type: 'income_voided', projectId, itemId: incomeId });
    return clone(record.incomes[index]);
  },

  async createCost({ projectId, workspaceId, input, session }) {
    await wait(110);
    assertManage(session, projectId, workspaceId);
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    const created = { id: uid('cost'), ...normalizeCost(input), createdAt: now(), createdBy: session?.user?.name || 'Usuario' };
    record.costs.unshift(created);
    record.updatedAt = now();
    write(items, { type: 'cost_created', projectId, itemId: created.id });
    return clone(created);
  },

  async updateCost({ projectId, costId, input, session }) {
    await wait(100);
    const items = read();
    const record = findRecord(items, projectId);
    assertManage(session, projectId, record.workspaceId);
    const index = findItem(record.costs, costId, 'Costo');
    record.costs[index] = { ...normalizeCost(input, record.costs[index]), updatedAt: now() };
    record.updatedAt = now();
    write(items, { type: 'cost_updated', projectId, itemId: costId });
    return clone(record.costs[index]);
  },

  async deleteCost({ projectId, costId, session }) {
    await wait(80);
    const items = read();
    const record = findRecord(items, projectId);
    assertManage(session, projectId, record.workspaceId);
    const index = findItem(record.costs, costId, 'Costo');
    record.costs.splice(index, 1);
    record.updatedAt = now();
    write(items, { type: 'cost_deleted', projectId, itemId: costId });
    return { deleted: true };
  },

  async createTimeEntry({ projectId, workspaceId, input, session }) {
    await wait(90);
    if (!canLogProjectTime(session, projectId, workspaceId)) throw new Error('Tu rol no permite registrar horas.');
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    const requestedUserId = clean(input.userId, 100);
    const mayAssignOthers = canViewAllProjectTime(session, projectId, workspaceId);
    const safeInput = mayAssignOthers ? input : {
      ...input,
      userId: session?.user?.id,
      userName: session?.user?.name
    };
    if (!mayAssignOthers && requestedUserId && requestedUserId !== session?.user?.id) {
      throw new Error('Solo puedes registrar tus propias horas.');
    }
    const created = { id: uid('time'), ...normalizeTime(safeInput, {}, session), createdAt: now(), createdBy: session?.user?.name || 'Usuario' };
    record.timeEntries.unshift(created);
    record.updatedAt = now();
    write(items, { type: 'time_created', projectId, itemId: created.id });
    return clone(created);
  },

  async updateTimeEntry({ projectId, timeEntryId, input, session }) {
    await wait(90);
    const items = read();
    const record = findRecord(items, projectId);
    if (!canLogProjectTime(session, projectId, record.workspaceId)) throw new Error('Tu rol no permite editar horas.');
    const index = findItem(record.timeEntries, timeEntryId, 'Registro de horas');
    const current = record.timeEntries[index];
    const mayEdit = canViewAllProjectTime(session, projectId, record.workspaceId) || current.userId === session?.user?.id;
    if (!mayEdit) throw new Error('Solo puedes editar tus propias horas.');
    const safeInput = canViewAllProjectTime(session, projectId, record.workspaceId) ? input : {
      ...input,
      userId: session?.user?.id,
      userName: session?.user?.name
    };
    record.timeEntries[index] = { ...normalizeTime(safeInput, current, session), updatedAt: now() };
    record.updatedAt = now();
    write(items, { type: 'time_updated', projectId, itemId: timeEntryId });
    return clone(record.timeEntries[index]);
  },

  async deleteTimeEntry({ projectId, timeEntryId, session }) {
    await wait(75);
    const items = read();
    const record = findRecord(items, projectId);
    if (!canLogProjectTime(session, projectId, record.workspaceId)) throw new Error('Tu rol no permite eliminar horas.');
    const index = findItem(record.timeEntries, timeEntryId, 'Registro de horas');
    const current = record.timeEntries[index];
    const mayDelete = canViewAllProjectTime(session, projectId, record.workspaceId) || current.userId === session?.user?.id;
    if (!mayDelete) throw new Error('Solo puedes eliminar tus propias horas.');
    record.timeEntries.splice(index, 1);
    record.updatedAt = now();
    write(items, { type: 'time_deleted', projectId, itemId: timeEntryId });
    return { deleted: true };
  },

  async updateMemberRate({ projectId, workspaceId, input, session }) {
    await wait(90);
    assertConfigure(session, projectId, workspaceId);
    const items = read();
    const record = ensureRecord(items, projectId, workspaceId);
    const userId = clean(input.userId, 100);
    if (!userId) throw new Error('Selecciona un integrante.');
    const index = record.memberRates.findIndex(item => item.userId === userId);
    const next = {
      userId,
      userName: clean(input.userName, 120) || 'Integrante',
      costRate: number(input.costRate),
      billableRate: number(input.billableRate),
      weeklyCapacity: number(input.weeklyCapacity, 0, 168)
    };
    if (index >= 0) record.memberRates[index] = next;
    else record.memberRates.push(next);
    record.updatedAt = now();
    write(items, { type: 'rate_updated', projectId, userId });
    return clone(next);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    const seeded = read();
    notify({ type: 'reset' }, true);
    return clone(seeded);
  }
};
