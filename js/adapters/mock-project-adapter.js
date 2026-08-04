import { demoProjects } from '../../data/demo-projects.js';
import { demoClients } from '../../data/demo-clients.js';
import { demoProjectMembers } from '../../data/demo-project-members.js';
import { demoResources } from '../../data/demo-resources.js';
import { demoMilestones } from '../../data/demo-milestones.js';
import { demoUsers } from '../../data/demo-users.js';
import { demoWorkspaces } from '../../data/demo-workspaces.js';
import {
  canAccessProject,
  canAccessWorkspace,
  canArchiveProject,
  canCreateProject,
  canEditProject,
  canManageClients,
  canManageProjectResources,
  canManageProjectTeam,
  canViewMaster,
  isReadOnlyRole
} from '../utils/permissions.js';

const KEYS = Object.freeze({
  projects: 'wonkup.e3.projects',
  clients: 'wonkup.e3.clients',
  members: 'wonkup.e3.members',
  resources: 'wonkup.e3.resources',
  milestones: 'wonkup.e3.milestones'
});

const wait = (milliseconds = 120) => new Promise(resolve => setTimeout(resolve, milliseconds));
const clone = value => JSON.parse(JSON.stringify(value));

function read(key, seed) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // If localStorage is unavailable, use the seed in memory for this request.
  }
  const value = clone(seed);
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  return value;
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return clone(value);
}

function id(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sessionCanSeeProject(project, session) {
  if (!session || !project) return false;
  if (canViewMaster(session)) return true;
  return canAccessProject(session, project.id, project.workspaceId);
}

function projectCode(workspaceId, projects) {
  const workspace = demoWorkspaces.find(item => item.id === workspaceId);
  const prefix = workspace?.code?.replace('WSP-', '') || 'GEN';
  const numbers = projects
    .filter(item => item.workspaceId === workspaceId)
    .map(item => Number(String(item.code || '').match(/(\d+)$/)?.[1] || 0));
  const next = Math.max(0, ...numbers) + 1;
  return `PROY-${prefix}-${String(next).padStart(3, '0')}`;
}

function enrichProject(input) {
  const clients = read(KEYS.clients, demoClients);
  const user = demoUsers.find(item => item.id === input.ownerUserId);
  const client = clients.find(item => item.id === input.clientId);
  const seed = demoProjects.find(item => item.id === input.id) || {};
  return {
    coverImage: seed.coverImage || '',
    brandColor: seed.brandColor || '#50a8f3',
    statusBeforeArchive: '',
    archivedAt: '',
    archivedBy: '',
    restoredAt: '',
    restoredBy: '',
    ...input,
    owner: user?.name || input.owner || 'Sin responsable',
    client: client?.name || input.client || 'Sin cliente'
  };
}

function requireWorkspace(session, workspaceId) {
  if (!canAccessWorkspace(session, workspaceId)) throw new Error('No tienes acceso a este workspace.');
}

export const MockProjectAdapter = {
  async listProjects({ workspaceId = 'all', session, includeArchived = false } = {}) {
    await wait();
    return read(KEYS.projects, demoProjects)
      .filter(project => workspaceId === 'all' || project.workspaceId === workspaceId)
      .filter(project => includeArchived || project.status !== 'archived')
      .filter(project => sessionCanSeeProject(project, session))
      .map(enrichProject);
  },

  async getProject({ projectId, session }) {
    await wait(70);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    return project && sessionCanSeeProject(project, session) ? enrichProject(project) : null;
  },

  async createProject({ input, session }) {
    await wait(220);
    if (!canCreateProject(session)) throw new Error('Tu rol no permite crear proyectos.');
    requireWorkspace(session, input.workspaceId);
    const projects = read(KEYS.projects, demoProjects);
    const now = new Date().toISOString();
    const project = enrichProject({
      id: id('p'),
      code: projectCode(input.workspaceId, projects),
      ...input,
      health: input.health || 'green',
      cost: 0,
      hours: 0,
      pendingTasks: 0,
      driveFolderId: '',
      driveUrl: '',
      createdAt: now,
      updatedAt: now
    });
    projects.push(project);
    write(KEYS.projects, projects);

    const members = read(KEYS.members, demoProjectMembers);
    if (project.ownerUserId) {
      members.push({
        id: id('pm'), projectId: project.id, userId: project.ownerUserId,
        role: 'project_lead', allocation: 40, status: 'active'
      });
      write(KEYS.members, members);
    }
    return clone(project);
  },

  async updateProject({ projectId, patch, session }) {
    await wait(180);
    const projects = read(KEYS.projects, demoProjects);
    const index = projects.findIndex(item => item.id === projectId);
    if (index < 0) throw new Error('Proyecto no encontrado.');
    const current = projects[index];
    if (!canEditProject(session, current.id, current.workspaceId)) throw new Error('Tu rol no permite editar este proyecto.');
    if (patch.workspaceId && patch.workspaceId !== current.workspaceId) requireWorkspace(session, patch.workspaceId);
    projects[index] = enrichProject({ ...current, ...patch, id: current.id, code: current.code, updatedAt: new Date().toISOString() });
    write(KEYS.projects, projects);
    return clone(projects[index]);
  },

  async archiveProject({ projectId, session }) {
    await wait(150);
    const projects = read(KEYS.projects, demoProjects);
    const index = projects.findIndex(item => item.id === projectId);
    if (index < 0) throw new Error('Proyecto no encontrado.');
    const current = projects[index];
    if (!canArchiveProject(session, current.workspaceId)) throw new Error('Tu rol no permite archivar proyectos.');
    if (current.status === 'archived') return clone(enrichProject(current));
    const now = new Date().toISOString();
    projects[index] = {
      ...current,
      statusBeforeArchive: current.status || 'planned',
      status: 'archived',
      archivedAt: now,
      archivedBy: session?.user?.id || '',
      restoredAt: '',
      restoredBy: '',
      updatedAt: now
    };
    write(KEYS.projects, projects);
    return clone(enrichProject(projects[index]));
  },

  async restoreProject({ projectId, session }) {
    await wait(150);
    const projects = read(KEYS.projects, demoProjects);
    const index = projects.findIndex(item => item.id === projectId);
    if (index < 0) throw new Error('Proyecto no encontrado.');
    const current = projects[index];
    if (!canArchiveProject(session, current.workspaceId)) throw new Error('Tu rol no permite restaurar proyectos.');
    if (current.status !== 'archived') throw new Error('El proyecto no está archivado.');
    const now = new Date().toISOString();
    projects[index] = {
      ...current,
      status: current.statusBeforeArchive || 'planned',
      statusBeforeArchive: '',
      restoredAt: now,
      restoredBy: session?.user?.id || '',
      updatedAt: now
    };
    write(KEYS.projects, projects);
    return clone(enrichProject(projects[index]));
  },

  async listClients({ workspaceId = 'all', session, includeArchived = false }) {
    await wait(80);
    return read(KEYS.clients, demoClients)
      .filter(client => workspaceId === 'all' || client.workspaceId === workspaceId)
      .filter(client => includeArchived || client.status !== 'archived')
      .filter(client => canViewMaster(session) || canAccessWorkspace(session, client.workspaceId));
  },

  async createClient({ input, session }) {
    await wait(160);
    if (!canManageClients(session)) throw new Error('Tu rol no permite crear clientes.');
    requireWorkspace(session, input.workspaceId);
    const clients = read(KEYS.clients, demoClients);
    const now = new Date().toISOString();
    const client = {
      id: id('client'), ...input, status: 'active',
      archivedAt: '', archivedBy: '', restoredAt: '', restoredBy: '',
      createdAt: now, updatedAt: now
    };
    clients.push(client);
    write(KEYS.clients, clients);
    return clone(client);
  },

  async updateClient({ clientId, patch, session }) {
    await wait(140);
    if (!canManageClients(session)) throw new Error('Tu rol no permite editar clientes.');
    const clients = read(KEYS.clients, demoClients);
    const index = clients.findIndex(client => client.id === clientId);
    if (index < 0) throw new Error('Cliente no encontrado.');
    requireWorkspace(session, clients[index].workspaceId);
    const allowed = ['name', 'contactName', 'email', 'phone'];
    const next = { ...clients[index] };
    allowed.forEach(key => {
      if (key in patch) next[key] = patch[key];
    });
    if (String(next.name || '').trim().length < 2) throw new Error('El nombre del cliente es obligatorio.');
    next.updatedAt = new Date().toISOString();
    clients[index] = next;
    write(KEYS.clients, clients);
    return clone(next);
  },

  async archiveClient({ clientId, session }) {
    await wait(120);
    if (!canManageClients(session)) throw new Error('Tu rol no permite archivar clientes.');
    const clients = read(KEYS.clients, demoClients);
    const index = clients.findIndex(client => client.id === clientId);
    if (index < 0) throw new Error('Cliente no encontrado.');
    requireWorkspace(session, clients[index].workspaceId);
    if (clients[index].status === 'archived') return clone(clients[index]);
    const now = new Date().toISOString();
    clients[index] = {
      ...clients[index], status: 'archived', archivedAt: now,
      archivedBy: session?.user?.id || '', restoredAt: '', restoredBy: '', updatedAt: now
    };
    write(KEYS.clients, clients);
    return clone(clients[index]);
  },

  async restoreClient({ clientId, session }) {
    await wait(120);
    if (!canManageClients(session)) throw new Error('Tu rol no permite restaurar clientes.');
    const clients = read(KEYS.clients, demoClients);
    const index = clients.findIndex(client => client.id === clientId);
    if (index < 0) throw new Error('Cliente no encontrado.');
    requireWorkspace(session, clients[index].workspaceId);
    if (clients[index].status !== 'archived') throw new Error('El cliente no está archivado.');
    const now = new Date().toISOString();
    clients[index] = {
      ...clients[index], status: 'active', restoredAt: now,
      restoredBy: session?.user?.id || '', updatedAt: now
    };
    write(KEYS.clients, clients);
    return clone(clients[index]);
  },

  async deleteClient({ clientId, session }) {
    await wait(120);
    if (session?.role !== 'superadmin') throw new Error('Solo el superadministrador puede eliminar clientes definitivamente.');
    const clients = read(KEYS.clients, demoClients);
    const index = clients.findIndex(client => client.id === clientId);
    if (index < 0) throw new Error('Cliente no encontrado.');
    requireWorkspace(session, clients[index].workspaceId);
    if (clients[index].status !== 'archived') throw new Error('Archiva el cliente antes de eliminarlo definitivamente.');
    const linkedProjects = read(KEYS.projects, demoProjects).filter(project => project.clientId === clientId);
    if (linkedProjects.length) throw new Error('No puedes eliminar este cliente porque está vinculado a uno o más proyectos.');
    clients.splice(index, 1);
    write(KEYS.clients, clients);
    return { deleted: true, clientId };
  },

  async listUsers({ workspaceId, session }) {
    await wait(60);
    requireWorkspace(session, workspaceId);
    return clone(demoUsers.filter(user => user.status === 'active' && !['usr-cliente-taxi', 'usr-invitado'].includes(user.id)));
  },

  async listMembers({ projectId, session }) {
    await wait(70);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !sessionCanSeeProject(project, session)) throw new Error('Proyecto no autorizado.');
    return read(KEYS.members, demoProjectMembers)
      .filter(member => member.projectId === projectId && member.status === 'active')
      .map(member => ({ ...member, user: clone(demoUsers.find(user => user.id === member.userId) || { name: 'Usuario', initials: 'US' }) }));
  },

  async assignMember({ projectId, input, session }) {
    await wait(150);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !canManageProjectTeam(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite administrar el equipo.');
    const members = read(KEYS.members, demoProjectMembers);
    const existing = members.find(item => item.projectId === projectId && item.userId === input.userId);
    if (existing) {
      existing.role = input.role;
      existing.allocation = Number(input.allocation || 0);
      existing.status = 'active';
    } else {
      members.push({ id: id('pm'), projectId, userId: input.userId, role: input.role, allocation: Number(input.allocation || 0), status: 'active' });
    }
    write(KEYS.members, members);
    return this.listMembers({ projectId, session });
  },

  async removeMember({ projectId, memberId, session }) {
    await wait(120);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !canManageProjectTeam(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite administrar el equipo.');
    const members = read(KEYS.members, demoProjectMembers);
    const target = members.find(item => item.id === memberId && item.projectId === projectId);
    if (target) target.status = 'inactive';
    write(KEYS.members, members);
    return { removed: Boolean(target) };
  },

  async listResources({ projectId, session }) {
    await wait(70);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !sessionCanSeeProject(project, session)) throw new Error('Proyecto no autorizado.');
    return read(KEYS.resources, demoResources)
      .filter(resource => resource.projectId === projectId && resource.status === 'active')
      .filter(resource => !isReadOnlyRole(session) || resource.visibility === 'client');
  },

  async addResource({ projectId, input, session }) {
    await wait(140);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !canManageProjectResources(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite registrar recursos.');
    const resources = read(KEYS.resources, demoResources);
    const resource = { id: id('res'), projectId, ...input, status: 'active', createdAt: new Date().toISOString() };
    resources.push(resource);
    write(KEYS.resources, resources);
    return clone(resource);
  },

  async removeResource({ projectId, resourceId, session }) {
    await wait(110);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !canManageProjectResources(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite retirar recursos.');
    const resources = read(KEYS.resources, demoResources);
    const target = resources.find(item => item.id === resourceId && item.projectId === projectId);
    if (target) target.status = 'inactive';
    write(KEYS.resources, resources);
    return { removed: Boolean(target) };
  },

  async listMilestones({ projectId, session }) {
    await wait(70);
    const project = read(KEYS.projects, demoProjects).find(item => item.id === projectId);
    if (!project || !sessionCanSeeProject(project, session)) throw new Error('Proyecto no autorizado.');
    return read(KEYS.milestones, demoMilestones)
      .filter(item => item.projectId === projectId)
      .filter(item => !isReadOnlyRole(session) || item.visibility === 'client');
  },

  async createDriveStructure({ projectId, session }) {
    await wait(360);
    const projects = read(KEYS.projects, demoProjects);
    const index = projects.findIndex(item => item.id === projectId);
    if (index < 0) throw new Error('Proyecto no encontrado.');
    const project = projects[index];
    if (!canEditProject(session, project.id, project.workspaceId)) throw new Error('Tu rol no permite crear la estructura documental.');
    const folderName = `${project.code}_${String(project.name).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, '-')}`;
    const folderId = project.driveFolderId || `mock-drive-${project.id}`;
    projects[index] = { ...project, driveFolderId: folderId, driveUrl: '', updatedAt: new Date().toISOString() };
    write(KEYS.projects, projects);
    return {
      mode: 'mock',
      folderId,
      folderName,
      folderUrl: '',
      folders: ['00_Resumen', '01_Investigación', '02_Planeamiento', '03_UX-UI', '04_Desarrollo', '05_Pruebas', '06_Marketing', '07_Finanzas', '08_Entregables/Internos', '08_Entregables/Cliente', '09_Legal', '10_Archivo']
    };
  }
};
