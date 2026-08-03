import { demoWorkspaces } from '../../data/demo-workspaces.js';
import { demoProjects } from '../../data/demo-projects.js';
import { demoActivities, demoTasks } from '../../data/demo-activities.js';
import { demoKanban } from '../../data/demo-kanban.js';
import { canvasTemplates } from '../../data/canvas-templates.js';

export const DemoService = {
  getWorkspaces: () => [...demoWorkspaces],
  getWorkspace: id => demoWorkspaces.find(item => item.id === id),
  getProjects: workspaceId => workspaceId && workspaceId !== 'all' ? demoProjects.filter(item => item.workspaceId === workspaceId) : [...demoProjects],
  getProject: id => demoProjects.find(item => item.id === id),
  getActivities: workspaceId => workspaceId && workspaceId !== 'all' ? demoActivities.filter(item => item.workspaceId === workspaceId) : [...demoActivities],
  getTasks: workspaceId => workspaceId && workspaceId !== 'all' ? demoTasks.filter(item => item.workspaceId === workspaceId) : [...demoTasks],
  getKanban: projectId => demoKanban[projectId] || demoKanban.default,
  getCanvasTemplates: () => [...canvasTemplates]
};
