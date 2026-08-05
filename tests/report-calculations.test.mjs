import assert from 'node:assert/strict';
import { buildPortfolioReport, resolveReportPeriod } from '../js/utils/report-calculations.js';

const now = new Date('2026-08-04T12:00:00-05:00');
const projects = [
  { id: 'p1', workspaceId: 'w1', code: 'P1', name: 'Proyecto uno', owner: 'Ana', client: 'Cliente', status: 'active', health: 'amber', progress: 60, dueDate: '2026-08-20' },
  { id: 'p2', workspaceId: 'w1', code: 'P2', name: 'Proyecto dos', owner: 'Luis', client: 'Cliente', status: 'completed', health: 'green', progress: 100, dueDate: '2026-07-20' }
];
const financeRecords = [
  {
    projectId: 'p1', workspaceId: 'w1',
    settings: { contractedAmount: 10000, discount: 0, taxRate: 0, internalBudget: 7000, plannedHours: 100, targetMargin: 25 },
    memberRates: [{ userId: 'u1', userName: 'Ana', costRate: 20, billableRate: 50 }],
    incomes: [{ id: 'i1', type: 'advance', status: 'paid', amount: 5000, dueDate: '2026-07-10', paidDate: '2026-07-10' }],
    costs: [{ id: 'c1', category: 'software', amount: 1000, date: '2026-07-15', paymentStatus: 'paid', receiptUrl: '' }],
    timeEntries: [{ id: 't1', userId: 'u1', userName: 'Ana', date: '2026-07-20', hours: 50, billable: true }]
  }
];
const deliverables = [
  { id: 'd1', projectId: 'p1', workspaceId: 'w1', title: 'Entrega', status: 'in_review', dueDate: '2026-08-02', checklist: [{ done: true }], versions: [{}] }
];
const tasks = [
  { id: 'task1', projectId: 'p1', workspaceId: 'w1', title: 'Tarea vencida', dueDate: '2026-08-01', priority: 'high' }
];

const report = buildPortfolioReport({ projects, financeRecords, deliverables, tasks, period: resolveReportPeriod('90d', now), now });
assert.equal(report.metrics.projectCount, 2);
assert.equal(report.metrics.active, 1);
assert.equal(report.metrics.completed, 1);
assert.equal(report.metrics.avgProgress, 80);
assert.equal(report.metrics.received, 5000);
assert.equal(report.metrics.realCost, 2000);
assert.equal(report.metrics.expectedProfit, 8000);
assert.equal(report.metrics.expectedMargin, 80);
assert.equal(report.metrics.actualHours, 50);
assert.equal(report.metrics.overdueTasks, 1);
assert.equal(report.metrics.overdueDeliverables, 1);
assert.equal(report.projectRows[0].id, 'p1');
assert.ok(report.projectRows[0].risk.score >= 3);
assert.ok(report.trend.some(item => item.income === 5000));

const activeOnly = buildPortfolioReport({ projects, financeRecords, deliverables, tasks, period: resolveReportPeriod('90d', now), status: 'active', now });
assert.equal(activeOnly.metrics.projectCount, 1);
assert.equal(activeOnly.projectRows[0].id, 'p1');

console.log('report-calculations.test.mjs: OK');
