import { demoWorkspaces } from '../../data/demo-workspaces.js';
import { demoProjects } from '../../data/demo-projects.js';
import { demoActivities, demoTasks } from '../../data/demo-activities.js';
import { demoKanban } from '../../data/demo-kanban.js';
import { canvasTemplates } from '../../data/canvas-templates.js';
import { canAccessProject, canAccessWorkspace, canViewMaster } from '../utils/permissions.js';

function projectVisibleToSession(project, session) {
  if (!session) return false;
  if (canViewMaster(session)) return true;
  return canAccessProject(session, project.id, project.workspaceId);
}

export const DemoService = {
  getWorkspaces: () => [...demoWorkspaces],

  getWorkspacesForSession(session) {
    if (!session) return [];
    if (canViewMaster(session)) return [...demoWorkspaces];
    return demoWorkspaces.filter(item => canAccessWorkspace(session, item.id));
  },

  getWorkspace: id => demoWorkspaces.find(item => item.id === id),

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
