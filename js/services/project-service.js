import { API_CONFIG } from '../config/api-config.js?v=12.0.0';
import { MockProjectAdapter } from '../adapters/mock-project-adapter.js?v=12.0.0';
import { AppsScriptProjectAdapter } from '../adapters/apps-script-project-adapter.js?v=12.0.0';
import { FirebaseProjectAdapter } from '../adapters/firebase-project-adapter.js?v=12.0.0';

export function projectDataSourceForSession(session) {
  if (API_CONFIG.projectMode === 'firebase') return 'firebase';
  if (API_CONFIG.projectMode === 'hybrid') return session?.source === 'firebase' ? 'firebase' : 'mock';
  if (API_CONFIG.projectMode === 'apps-script' || API_CONFIG.mode === 'apps-script') return 'apps-script';
  return 'mock';
}

function adapter(options = {}) {
  const source = projectDataSourceForSession(options?.session);
  if (source === 'firebase') return FirebaseProjectAdapter;
  if (source === 'apps-script') return AppsScriptProjectAdapter;
  return MockProjectAdapter;
}

export const ProjectService = {
  mode: API_CONFIG.projectMode,
  dataSource: options => projectDataSourceForSession(options?.session),
  listProjects: options => adapter(options).listProjects(options),
  getProject: options => adapter(options).getProject(options),
  createProject: options => adapter(options).createProject(options),
  updateProject: options => adapter(options).updateProject(options),
  archiveProject: options => adapter(options).archiveProject(options),
  restoreProject: options => adapter(options).restoreProject(options),
  listClients: options => adapter(options).listClients(options),
  createClient: options => adapter(options).createClient(options),
  updateClient: options => adapter(options).updateClient(options),
  archiveClient: options => adapter(options).archiveClient(options),
  restoreClient: options => adapter(options).restoreClient(options),
  deleteClient: options => adapter(options).deleteClient(options),
  listUsers: options => adapter(options).listUsers(options),
  createUser: options => adapter(options).createUser(options),
  listMembers: options => adapter(options).listMembers(options),
  assignMember: options => adapter(options).assignMember(options),
  removeMember: options => adapter(options).removeMember(options),
  listResources: options => adapter(options).listResources(options),
  addResource: options => adapter(options).addResource(options),
  removeResource: options => adapter(options).removeResource(options),
  listMilestones: options => adapter(options).listMilestones(options),
  createDriveStructure: options => adapter(options).createDriveStructure(options)
};
