import { demoWorkspaces } from '../../data/demo-workspaces.js?v=12.0.0';
import { demoProjects } from '../../data/demo-projects.js?v=12.0.0';
import { demoClients } from '../../data/demo-clients.js?v=12.0.0';
import { demoUsers } from '../../data/demo-users.js?v=12.0.0';
import { demoProjectMembers } from '../../data/demo-project-members.js?v=12.0.0';

const STORAGE_KEYS = Object.freeze({
  projects: 'wonkup.e3.projects',
  clients: 'wonkup.e3.clients',
  users: 'wonkup.e8.users',
  members: 'wonkup.e3.members'
});

const clone = value => JSON.parse(JSON.stringify(value));

const VALID_WORKSPACE_STATUSES = new Set(['active', 'inactive', 'archived']);
const VALID_PROJECT_STATUSES = new Set(['draft', 'planned', 'active', 'pending_client', 'on_hold', 'blocked', 'completed', 'archived']);
const VALID_PROJECT_ROLES = new Set(['project_lead', 'collaborator', 'reviewer', 'client', 'guest']);
const VALID_MEMBER_STATUSES = new Set(['active', 'inactive', 'pending']);

function normalizeWorkspaceStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (VALID_WORKSPACE_STATUSES.has(status)) return status;
  if (['disabled', 'paused'].includes(status)) return 'inactive';
  return 'active';
}

function normalizeProjectStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (VALID_PROJECT_STATUSES.has(status)) return status;
  const aliases = {
    planning: 'planned',
    in_progress: 'active',
    development: 'active',
    review: 'pending_client',
    pending: 'pending_client',
    paused: 'on_hold',
    hold: 'on_hold',
    done: 'completed',
    closed: 'completed'
  };
  return aliases[status] || 'planned';
}

function normalizeProjectRole(value) {
  const role = String(value || '').trim().toLowerCase();
  if (VALID_PROJECT_ROLES.has(role)) return role;
  const aliases = {
    lead: 'project_lead',
    leader: 'project_lead',
    lider: 'project_lead',
    member: 'collaborator',
    contributor: 'collaborator',
    revisor: 'reviewer',
    viewer: 'guest'
  };
  return aliases[role] || 'collaborator';
}

function normalizeMemberStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return VALID_MEMBER_STATUSES.has(status) ? status : 'active';
}

function readLocal(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Use bundled data when local storage is not available.
  }
  return clone(fallback);
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([, item]) => item !== undefined)
  );
}

function nowIso() {
  return new Date().toISOString();
}

export function getLocalFoundationSnapshot() {
  return {
    schemaVersion: 9,
    exportedAt: nowIso(),
    workspaces: clone(demoWorkspaces),
    projects: readLocal(STORAGE_KEYS.projects, demoProjects),
    clients: readLocal(STORAGE_KEYS.clients, demoClients),
    people: readLocal(STORAGE_KEYS.users, demoUsers),
    projectMembers: readLocal(STORAGE_KEYS.members, demoProjectMembers)
  };
}

function workspaceDoc(workspace) {
  const timestamp = nowIso();
  return cleanObject({
    id: workspace.id,
    code: workspace.code || '',
    name: workspace.name || 'Workspace',
    shortName: workspace.shortName || workspace.name || 'Workspace',
    description: workspace.description || '',
    color: workspace.color || '#50a8f3',
    logo: workspace.logo || '',
    status: normalizeWorkspaceStatus(workspace.status),
    schemaVersion: 9,
    createdAt: workspace.createdAt || timestamp,
    updatedAt: timestamp
  });
}

function projectDoc(project) {
  const timestamp = nowIso();
  return cleanObject({
    ...project,
    id: project.id,
    workspaceId: project.workspaceId,
    name: String(project.name || 'Proyecto').trim() || 'Proyecto',
    status: normalizeProjectStatus(project.status),
    schemaVersion: 9,
    createdAt: project.createdAt || timestamp,
    updatedAt: project.updatedAt || timestamp
  });
}

function clientDoc(client) {
  const timestamp = nowIso();
  return cleanObject({
    ...client,
    id: client.id,
    workspaceId: client.workspaceId,
    schemaVersion: 9,
    createdAt: client.createdAt || timestamp,
    updatedAt: client.updatedAt || timestamp
  });
}

function personDoc(person, workspaceId) {
  const timestamp = nowIso();
  return cleanObject({
    ...person,
    id: person.id,
    workspaceId,
    userType: person.userType || 'internal',
    status: person.status || 'active',
    schemaVersion: 9,
    createdAt: person.createdAt || timestamp,
    updatedAt: person.updatedAt || timestamp
  });
}

function memberDoc(member, project) {
  const timestamp = nowIso();
  return cleanObject({
    ...member,
    id: member.userId,
    memberId: member.id,
    projectId: member.projectId,
    workspaceId: project.workspaceId,
    userId: member.userId,
    authUid: member.authUid || '',
    role: normalizeProjectRole(member.role),
    allocation: Number(member.allocation || 0),
    status: normalizeMemberStatus(member.status),
    schemaVersion: 9,
    createdAt: member.createdAt || timestamp,
    updatedAt: timestamp
  });
}

export function buildFoundationMigrationPlan(snapshot = getLocalFoundationSnapshot(), options = {}) {
  const selectedWorkspaceIds = new Set(
    options.workspaceIds?.length
      ? options.workspaceIds
      : snapshot.workspaces.map(item => item.id)
  );

  const include = {
    workspaces: options.include?.workspaces !== false,
    projects: options.include?.projects !== false,
    clients: options.include?.clients !== false,
    people: options.include?.people !== false,
    projectMembers: options.include?.projectMembers !== false
  };

  const workspaces = snapshot.workspaces.filter(item => selectedWorkspaceIds.has(item.id));
  const projects = snapshot.projects.filter(item => selectedWorkspaceIds.has(item.workspaceId));
  const projectIds = new Set(projects.map(item => item.id));
  const clients = snapshot.clients.filter(item => selectedWorkspaceIds.has(item.workspaceId));
  const projectMembers = snapshot.projectMembers.filter(item => projectIds.has(item.projectId));
  const projectById = new Map(projects.map(item => [item.id, item]));

  const personWorkspaceMap = new Map();
  workspaces.forEach(workspace => personWorkspaceMap.set(workspace.id, new Set()));
  projects.forEach(project => {
    if (project.ownerUserId) personWorkspaceMap.get(project.workspaceId)?.add(project.ownerUserId);
  });
  projectMembers.forEach(member => {
    const project = projectById.get(member.projectId);
    if (project) personWorkspaceMap.get(project.workspaceId)?.add(member.userId);
  });
  snapshot.people.forEach(person => {
    const explicit = Array.isArray(person.workspaceIds) ? person.workspaceIds : [];
    explicit.forEach(workspaceId => {
      if (selectedWorkspaceIds.has(workspaceId)) personWorkspaceMap.get(workspaceId)?.add(person.id);
    });
  });

  const operations = [];
  if (include.workspaces) {
    workspaces.forEach(workspace => operations.push({
      group: 'workspaces',
      path: `workspaces/${workspace.id}`,
      data: workspaceDoc(workspace)
    }));
  }
  if (include.clients) {
    clients.forEach(client => operations.push({
      group: 'clients',
      path: `workspaces/${client.workspaceId}/clients/${client.id}`,
      data: clientDoc(client)
    }));
  }
  if (include.people) {
    for (const [workspaceId, userIds] of personWorkspaceMap.entries()) {
      for (const userId of userIds) {
        const person = snapshot.people.find(item => item.id === userId);
        if (!person) continue;
        operations.push({
          group: 'people',
          path: `workspaces/${workspaceId}/people/${person.id}`,
          data: personDoc(person, workspaceId)
        });
      }
    }
  }
  if (include.projects) {
    projects.forEach(project => operations.push({
      group: 'projects',
      path: `workspaces/${project.workspaceId}/projects/${project.id}`,
      data: projectDoc(project)
    }));
  }
  if (include.projectMembers) {
    projectMembers.forEach(member => {
      const project = projectById.get(member.projectId);
      if (!project) return;
      const person = snapshot.people.find(item => item.id === member.userId);
      const authUid = String(member.authUid || person?.authUid || '');
      const membershipId = authUid || member.userId;
      operations.push({
        group: 'projectMembers',
        path: `workspaces/${project.workspaceId}/projects/${project.id}/members/${membershipId}`,
        data: { ...memberDoc({ ...member, authUid }, project), id: membershipId }
      });
    });
  }

  const uniquePaths = new Set();
  const duplicates = [];
  operations.forEach(operation => {
    if (uniquePaths.has(operation.path)) duplicates.push(operation.path);
    uniquePaths.add(operation.path);
  });

  const counts = operations.reduce((accumulator, operation) => {
    accumulator[operation.group] = (accumulator[operation.group] || 0) + 1;
    return accumulator;
  }, {});

  return {
    schemaVersion: 9,
    generatedAt: nowIso(),
    selectedWorkspaceIds: [...selectedWorkspaceIds],
    counts: {
      workspaces: counts.workspaces || 0,
      clients: counts.clients || 0,
      people: counts.people || 0,
      projects: counts.projects || 0,
      projectMembers: counts.projectMembers || 0,
      total: operations.length
    },
    duplicates,
    operations
  };
}
