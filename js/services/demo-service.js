import { demoWorkspaces } from '../../data/demo-workspaces.js?v=11.0.0';
import { demoProjects } from '../../data/demo-projects.js?v=11.0.0';
import { demoActivities, demoTasks } from '../../data/demo-activities.js?v=11.0.0';
import { demoKanban } from '../../data/demo-kanban.js?v=11.0.0';
import { canvasTemplates } from '../../data/canvas-templates.js?v=11.0.0';
import { canAccessProject, canAccessWorkspace, canViewMaster } from '../utils/permissions.js?v=11.0.0';

function projectVisibleToSession(project, session) {
  if (!session) return false;
  if (canViewMaster(session)) return true;
  return canAccessProject(session, project.id, project.workspaceId);
}

function cloudWorkspaces(session = null) {
  const fromSession = Array.isArray(session?.workspaces) ? session.workspaces : [];
  const fromRuntime = Array.isArray(globalThis.__wonkupCloudWorkspaces) ? globalThis.__wonkupCloudWorkspaces : [];
  const source = fromSession.length ? fromSession : fromRuntime;
  return source.map(item => ({ ...item }));
}

export const DemoService = {
  getWorkspaces: () => {
    const cloud = cloudWorkspaces();
    return cloud.length ? cloud : [...demoWorkspaces];
  },

  getWorkspacesForSession(session) {
    if (!session) return [];
    const cloud = cloudWorkspaces(session);
    if (cloud.length) {
      if (canViewMaster(session)) return cloud;
      return cloud.filter(item => canAccessWorkspace(session, item.id));
    }
    if (canViewMaster(session)) return [...demoWorkspaces];
    return demoWorkspaces.filter(item => canAccessWorkspace(session, item.id));
  },

  getWorkspace(id) {
    const cloud = cloudWorkspaces();
    return cloud.find(item => item.id === id) || demoWorkspaces.find(item => item.id === id);
  },

  getProjects(workspaceId) {
    return workspaceId && workspaceId !== 'all'
      ? demoProjects.filter(item => item.workspaceId === workspaceId)
      : [...demoProjects];
  },

  getProjectsForSession(workspaceId, session) {
    return this.getProjects(workspaceId).filter(project => projectVisibleToSession(project, session));
  },

  getProject: id => demoProjects.find(item => item.id === id),

  getProjectForSession(id, session) {
    const project = this.getProject(id);
    return project && projectVisibleToSession(project, session) ? project : null;
  },

  getActivities(workspaceId, session = null) {
    const visibleProjectIds = new Set(
      session ? this.getProjectsForSession(workspaceId, session).map(project => project.id) : demoProjects.map(project => project.id)
    );
    return demoActivities.filter(item => {
      const workspaceMatch = !workspaceId || workspaceId === 'all' || item.workspaceId === workspaceId;
      return workspaceMatch && visibleProjectIds.has(item.projectId);
    });
  },

  getTasks(workspaceId, session = null) {
    const visibleProjectIds = new Set(
      session ? this.getProjectsForSession(workspaceId, session).map(project => project.id) : demoProjects.map(project => project.id)
    );
    return demoTasks.filter(item => {
      const workspaceMatch = !workspaceId || workspaceId === 'all' || item.workspaceId === workspaceId;
      return workspaceMatch && visibleProjectIds.has(item.projectId);
    });
  },

  getKanban: projectId => demoKanban[projectId] || demoKanban.default,
  getCanvasTemplates: () => [...canvasTemplates]
};
