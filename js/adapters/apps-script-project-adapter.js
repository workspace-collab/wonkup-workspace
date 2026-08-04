import { postAppsScript } from './apps-script-adapter.js';

function withSession(session, payload = {}) {
  return { sessionToken: session?.token, ...payload };
}

export const AppsScriptProjectAdapter = {
  listProjects({ workspaceId = 'all', session, includeArchived = false }) {
    return postAppsScript('projects.list', withSession(session, { workspaceId, includeArchived }));
  },
  getProject({ projectId, session }) {
    return postAppsScript('projects.get', withSession(session, { projectId }));
  },
  createProject({ input, session }) {
    return postAppsScript('projects.create', withSession(session, { input }));
  },
  updateProject({ projectId, patch, session }) {
    return postAppsScript('projects.update', withSession(session, { projectId, patch }));
  },
  archiveProject({ projectId, session }) {
    return postAppsScript('projects.archive', withSession(session, { projectId }));
  },
  restoreProject({ projectId, session }) {
    return postAppsScript('projects.restore', withSession(session, { projectId }));
  },
  listClients({ workspaceId = 'all', session }) {
    return postAppsScript('clients.list', withSession(session, { workspaceId }));
  },
  createClient({ input, session }) {
    return postAppsScript('clients.create', withSession(session, { input }));
  },
  listUsers({ workspaceId, session }) {
    return postAppsScript('users.listForWorkspace', withSession(session, { workspaceId }));
  },
  listMembers({ projectId, session }) {
    return postAppsScript('projectMembers.list', withSession(session, { projectId }));
  },
  assignMember({ projectId, input, session }) {
    return postAppsScript('projectMembers.assign', withSession(session, { projectId, input }));
  },
  removeMember({ projectId, memberId, session }) {
    return postAppsScript('projectMembers.remove', withSession(session, { projectId, memberId }));
  },
  listResources({ projectId, session }) {
    return postAppsScript('resources.list', withSession(session, { projectId }));
  },
  addResource({ projectId, input, session }) {
    return postAppsScript('resources.create', withSession(session, { projectId, input }));
  },
  removeResource({ projectId, resourceId, session }) {
    return postAppsScript('resources.remove', withSession(session, { projectId, resourceId }));
  },
  listMilestones({ projectId, session }) {
    return postAppsScript('milestones.list', withSession(session, { projectId }));
  },
  createDriveStructure({ projectId, session }) {
    return postAppsScript('drive.createProjectStructure', withSession(session, { projectId }));
  }
};
