import { ProjectService } from './project-service.js?v=11.0.1';
import { FinanceService } from './finance-service.js?v=11.0.1';
import { DeliverableService } from './deliverable-service.js?v=11.0.1';
import { DemoService } from './demo-service.js?v=11.0.1';
import { buildPortfolioReport, resolveReportPeriod } from '../utils/report-calculations.js?v=11.0.1';
import { canAccessProjectFinance, isInternalUser } from '../utils/permissions.js?v=11.0.1';

async function loadFinance(projects, session) {
  const results = await Promise.all(projects.map(async project => {
    if (!canAccessProjectFinance(session, project.id, project.workspaceId)) return null;
    try {
      return await FinanceService.getProjectFinance({ projectId: project.id, workspaceId: project.workspaceId, session });
    } catch {
      return null;
    }
  }));
  return results.filter(Boolean);
}

export const ReportService = {
  mode: 'aggregate',

  async getPortfolioReport({ workspaceId = 'all', session, period = '90d', status = 'all' } = {}) {
    if (!isInternalUser(session)) throw new Error('Tu rol no permite consultar reportes internos.');
    const projects = await ProjectService.listProjects({ workspaceId, session, includeArchived: false });
    const [financeRecords, deliverableGroups] = await Promise.all([
      loadFinance(projects, session),
      Promise.all(projects.map(project => DeliverableService.listDeliverables({
        workspaceId: project.workspaceId,
        projectId: project.id,
        session,
        includeArchived: false
      }).catch(() => [])))
    ]);
    const deliverables = deliverableGroups.flat();
    return buildPortfolioReport({
      projects,
      financeRecords,
      deliverables,
      tasks: DemoService.getTasks(workspaceId, session),
      activities: DemoService.getActivities(workspaceId, session),
      period: resolveReportPeriod(period),
      status
    });
  },

  subscribe(listener) {
    const unsubscribeFinance = FinanceService.subscribe(event => listener({ source: 'finance', ...event }));
    const unsubscribeDeliverables = DeliverableService.subscribe(event => listener({ source: 'deliverables', ...event }));
    return () => {
      unsubscribeFinance?.();
      unsubscribeDeliverables?.();
    };
  }
};
