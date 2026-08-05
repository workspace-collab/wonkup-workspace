const DAY_MS = 24 * 60 * 60 * 1000;

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((number(value) + Number.EPSILON) * factor) / factor;
}

function dateOnly(value) {
  if (!value) return null;
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function effectiveIncomeAmount(item) {
  const amount = Math.max(0, number(item.amount));
  return item.type === 'refund' ? -amount : amount;
}

export function getEffectiveIncomeStatus(item, today = new Date()) {
  if (item.status === 'void') return 'void';
  if (item.status === 'paid') return 'paid';
  const due = dateOnly(item.dueDate);
  const current = dateOnly(today.toISOString().slice(0, 10));
  if (due && current && due.getTime() < current.getTime()) return 'overdue';
  return 'pending';
}

export function calculateFinanceMetrics(record, today = new Date()) {
  const settings = record?.settings || {};
  const incomes = Array.isArray(record?.incomes) ? record.incomes : [];
  const costs = Array.isArray(record?.costs) ? record.costs : [];
  const entries = Array.isArray(record?.timeEntries) ? record.timeEntries : [];
  const rates = new Map((record?.memberRates || []).map(rate => [rate.userId, rate]));

  const contractedAmount = Math.max(0, number(settings.contractedAmount));
  const discount = Math.max(0, number(settings.discount));
  const taxableBase = Math.max(0, contractedAmount - discount);
  const taxAmount = taxableBase * Math.max(0, number(settings.taxRate)) / 100;
  const totalBillable = taxableBase + taxAmount;

  const paidIncome = incomes
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + effectiveIncomeAmount(item), 0);
  const pendingIncome = incomes
    .filter(item => !['paid', 'void'].includes(item.status))
    .reduce((sum, item) => sum + effectiveIncomeAmount(item), 0);
  const overdueItems = incomes.filter(item => getEffectiveIncomeStatus(item, today) === 'overdue');
  const overdueAmount = overdueItems.reduce((sum, item) => sum + effectiveIncomeAmount(item), 0);
  const outstanding = Math.max(0, totalBillable - paidIncome);

  const directCosts = costs
    .filter(item => item.paymentStatus !== 'void')
    .reduce((sum, item) => sum + Math.max(0, number(item.amount)), 0);
  const paidCosts = costs
    .filter(item => item.paymentStatus === 'paid')
    .reduce((sum, item) => sum + Math.max(0, number(item.amount)), 0);
  const pendingCosts = Math.max(0, directCosts - paidCosts);

  const actualHours = entries.reduce((sum, entry) => sum + Math.max(0, number(entry.hours)), 0);
  const billableHours = entries.filter(entry => entry.billable !== false)
    .reduce((sum, entry) => sum + Math.max(0, number(entry.hours)), 0);
  const laborCost = entries.reduce((sum, entry) => {
    const rate = rates.get(entry.userId);
    return sum + Math.max(0, number(entry.hours)) * Math.max(0, number(rate?.costRate));
  }, 0);
  const billableHoursValue = entries.reduce((sum, entry) => {
    if (entry.billable === false) return sum;
    const rate = rates.get(entry.userId);
    return sum + Math.max(0, number(entry.hours)) * Math.max(0, number(rate?.billableRate));
  }, 0);

  const realCost = laborCost + directCosts;
  const expectedProfit = totalBillable - realCost;
  const cashProfit = paidIncome - paidCosts - laborCost;
  const expectedMargin = totalBillable > 0 ? (expectedProfit / totalBillable) * 100 : 0;
  const cashMargin = paidIncome > 0 ? (cashProfit / paidIncome) * 100 : 0;
  const internalBudget = Math.max(0, number(settings.internalBudget));
  const budgetUsedPercent = internalBudget > 0 ? (realCost / internalBudget) * 100 : 0;
  const budgetVariance = realCost - internalBudget;
  const plannedHours = Math.max(0, number(settings.plannedHours));
  const hoursUsedPercent = plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0;
  const hoursVariance = actualHours - plannedHours;

  const categoryTotals = {};
  costs.filter(item => item.paymentStatus !== 'void').forEach(item => {
    const key = item.category || 'other';
    categoryTotals[key] = round((categoryTotals[key] || 0) + Math.max(0, number(item.amount)));
  });

  const memberHours = {};
  entries.forEach(entry => {
    const key = entry.userId || entry.userName || 'unknown';
    if (!memberHours[key]) memberHours[key] = { userId: entry.userId || '', userName: entry.userName || 'Sin nombre', hours: 0 };
    memberHours[key].hours = round(memberHours[key].hours + Math.max(0, number(entry.hours)));
  });

  return {
    contractedAmount: round(contractedAmount),
    discount: round(discount),
    taxableBase: round(taxableBase),
    taxAmount: round(taxAmount),
    totalBillable: round(totalBillable),
    received: round(paidIncome),
    pendingIncome: round(pendingIncome),
    outstanding: round(outstanding),
    overdueAmount: round(overdueAmount),
    overdueCount: overdueItems.length,
    directCosts: round(directCosts),
    paidCosts: round(paidCosts),
    pendingCosts: round(pendingCosts),
    actualHours: round(actualHours),
    billableHours: round(billableHours),
    plannedHours: round(plannedHours),
    hoursUsedPercent: round(hoursUsedPercent, 1),
    hoursVariance: round(hoursVariance),
    laborCost: round(laborCost),
    billableHoursValue: round(billableHoursValue),
    realCost: round(realCost),
    internalBudget: round(internalBudget),
    budgetUsedPercent: round(budgetUsedPercent, 1),
    budgetVariance: round(budgetVariance),
    expectedProfit: round(expectedProfit),
    cashProfit: round(cashProfit),
    expectedMargin: round(expectedMargin, 1),
    cashMargin: round(cashMargin, 1),
    targetMargin: round(settings.targetMargin),
    categoryTotals,
    memberHours: Object.values(memberHours).sort((a, b) => b.hours - a.hours)
  };
}

export function buildFinanceAlerts(record, metrics, today = new Date()) {
  const alerts = [];
  const settings = record?.settings || {};
  const costs = Array.isArray(record?.costs) ? record.costs : [];

  if (metrics.overdueCount > 0) {
    alerts.push({
      id: 'overdue-payments',
      level: 'critical',
      title: `${metrics.overdueCount} pago${metrics.overdueCount === 1 ? '' : 's'} vencido${metrics.overdueCount === 1 ? '' : 's'}`,
      message: `Hay un importe vencido de ${metrics.overdueAmount}.`,
      action: 'income'
    });
  }

  if (metrics.plannedHours > 0 && metrics.hoursUsedPercent >= 100) {
    alerts.push({
      id: 'hours-exceeded',
      level: 'critical',
      title: 'Horas planificadas superadas',
      message: `El proyecto registra ${metrics.actualHours} h frente a ${metrics.plannedHours} h planificadas.`,
      action: 'time'
    });
  } else if (metrics.plannedHours > 0 && metrics.hoursUsedPercent >= 85) {
    alerts.push({
      id: 'hours-warning',
      level: 'warning',
      title: 'Consumo de horas elevado',
      message: `Ya se utilizó ${metrics.hoursUsedPercent}% de las horas planificadas.`,
      action: 'time'
    });
  }

  if (metrics.internalBudget > 0 && metrics.budgetUsedPercent >= 100) {
    alerts.push({
      id: 'budget-exceeded',
      level: 'critical',
      title: 'Presupuesto interno excedido',
      message: `El costo real supera el presupuesto en ${Math.max(0, metrics.budgetVariance)}.`,
      action: 'costs'
    });
  } else if (metrics.internalBudget > 0 && metrics.budgetUsedPercent >= 85) {
    alerts.push({
      id: 'budget-warning',
      level: 'warning',
      title: 'Presupuesto cerca del límite',
      message: `Se utilizó ${metrics.budgetUsedPercent}% del presupuesto interno.`,
      action: 'costs'
    });
  }

  if (metrics.totalBillable > 0 && metrics.expectedMargin < Math.max(0, number(settings.targetMargin))) {
    alerts.push({
      id: 'margin-low',
      level: metrics.expectedMargin < 0 ? 'critical' : 'warning',
      title: 'Margen por debajo de la meta',
      message: `El margen proyectado es ${metrics.expectedMargin}% y la meta es ${Math.max(0, number(settings.targetMargin))}%.`,
      action: 'profitability'
    });
  }

  const missingReceipts = costs.filter(item => item.paymentStatus !== 'void' && Math.max(0, number(item.amount)) > 0 && !String(item.receiptUrl || '').trim());
  if (missingReceipts.length) {
    alerts.push({
      id: 'missing-receipts',
      level: 'info',
      title: `${missingReceipts.length} costo${missingReceipts.length === 1 ? '' : 's'} sin comprobante`,
      message: 'Completa el enlace de sustento para mejorar la trazabilidad.',
      action: 'costs'
    });
  }

  const nextDue = (record?.incomes || [])
    .filter(item => getEffectiveIncomeStatus(item, today) === 'pending' && item.dueDate)
    .map(item => ({ item, due: dateOnly(item.dueDate) }))
    .filter(entry => entry.due)
    .sort((a, b) => a.due - b.due)[0];
  if (nextDue) {
    const current = dateOnly(today.toISOString().slice(0, 10));
    const days = Math.ceil((nextDue.due.getTime() - current.getTime()) / DAY_MS);
    if (days >= 0 && days <= 7) {
      alerts.push({
        id: 'payment-due-soon',
        level: 'info',
        title: 'Próximo cobro por vencer',
        message: `${nextDue.item.concept || 'Pago'} vence en ${days === 0 ? 'hoy' : `${days} día${days === 1 ? '' : 's'}`}.`,
        action: 'income'
      });
    }
  }

  return alerts;
}
