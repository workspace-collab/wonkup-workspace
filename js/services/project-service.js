import { API_CONFIG } from '../config/api-config.js';
import { MockProjectAdapter } from '../adapters/mock-project-adapter.js?v=8.1.0';
import { AppsScriptProjectAdapter } from '../adapters/apps-script-project-adapter.js?v=8.1.0';

function adapter() {
  return API_CONFIG.mode === 'apps-script' ? AppsScriptProjectAdapter : MockProjectAdapter;
}

export const ProjectService = {
  mode: API_CONFIG.mode,
  listProjects: options => adapter().listProjects(options),
  getProject: options => adapter().getProject(options),
  createProject: options => adapter().createProject(options),
  updateProject: options => adapter().updateProject(options),
  archiveProject: options => adapter().archiveProject(options),
  restoreProject: options => adapter().restoreProject(options),
  listClients: options => adapter().listClients(options),
  createClient: options => adapter().createClient(options),
  updateClient: options => adapter().updateClient(options),
  archiveClient: options => adapter().archiveClient(options),
  restoreClient: options => adapter().restoreClient(options),
  deleteClient: options => adapter().deleteClient(options),
  listUsers: options => adapter().listUsers(options),
  createUser: options => adapter().createUser(options),
  listMembers: options => adapter().listMembers(options),
  assignMember: options => adapter().assignMember(options),
  removeMember: options => adapter().removeMember(options),
  listResources: options => adapter().listResources(options),
  addResource: options => adapter().addResource(options),
  removeResource: options => adapter().removeResource(options),
  listMilestones: options => adapter().listMilestones(options),
  createDriveStructure: options => adapter().createDriveStructure(options)
};
