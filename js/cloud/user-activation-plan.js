const ALLOWED_ROLES = Object.freeze(['workspace_admin', 'project_lead', 'collaborator', 'reviewer', 'client', 'guest']);
const PROJECT_SCOPED_ROLES = new Set(['project_lead', 'collaborator', 'reviewer', 'client', 'guest']);

const clone = value => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 240) {
  return String(value || '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'WU';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function buildUserActivationPlan(snapshot, rawInput = {}) {
  const input = {
    uid: cleanText(rawInput.uid, 128),
    name: cleanText(rawInput.name, 120),
    email: cleanText(rawInput.email, 254).toLowerCase(),
    role: cleanText(rawInput.role, 40),
    personId: cleanText(rawInput.personId, 128),
    workspaceIds: unique(Array.isArray(rawInput.workspaceIds) ? rawInput.workspaceIds.map(item => cleanText(item, 128)) : []),
    projectIds: unique(Array.isArray(rawInput.projectIds) ? rawInput.projectIds.map(item => cleanText(item, 128)) : [])
  };

  const errors = [];
  if (!/^[A-Za-z0-9:_-]{8,128}$/.test(input.uid)) errors.push('El UID no tiene un formato válido. Cópialo desde Firebase Authentication.');
  if (input.name.length < 2) errors.push('Escribe el nombre completo.');
  if (!validEmail(input.email)) errors.push('Escribe un correo válido.');
  if (!ALLOWED_ROLES.includes(input.role)) errors.push('Selecciona un rol permitido.');
  if (!input.workspaceIds.length) errors.push('Selecciona al menos un workspace.');

  const workspaces = Array.isArray(snapshot?.workspaces) ? snapshot.workspaces : [];
  const projects = Array.isArray(snapshot?.projects) ? snapshot.projects : [];
  const people = Array.isArray(snapshot?.people) ? snapshot.people : [];
  const workspaceById = new Map(workspaces.map(item => [item.id, item]));
  const projectById = new Map(projects.map(item => [item.id, item]));

  input.workspaceIds.forEach(workspaceId => {
    if (!workspaceById.has(workspaceId)) errors.push(`El workspace ${workspaceId} no existe en el respaldo local.`);
  });

  input.projectIds.forEach(projectId => {
    const project = projectById.get(projectId);
    if (!project) errors.push(`El proyecto ${projectId} no existe en el respaldo local.`);
    else if (!input.workspaceIds.includes(project.workspaceId)) errors.push(`El proyecto ${projectId} pertenece a un workspace no seleccionado.`);
  });

  if (PROJECT_SCOPED_ROLES.has(input.role) && !input.projectIds.length) {
    errors.push('Este rol necesita al menos un proyecto asignado.');
  }

  if (input.personId && !people.some(person => person.id === input.personId)) {
    errors.push('La persona seleccionada no existe en el directorio local.');
  }

  if (errors.length) {
    const error = new Error(errors.join(' '));
    error.validationErrors = errors;
    throw error;
  }

  const timestamp = new Date().toISOString();
  const workspaceRoles = Object.fromEntries(input.workspaceIds.map(workspaceId => [workspaceId, input.role]));
  const projectRoles = Object.fromEntries(input.projectIds.map(projectId => [projectId, input.role]));
  const operations = [{
    group: 'profiles',
    path: `users/${input.uid}`,
    data: {
      uid: input.uid,
      personId: input.personId,
      name: input.name,
      email: input.email,
      initials: initials(input.name),
      role: input.role,
      roleLabel: {
        workspace_admin: 'Administrador de workspace',
        project_lead: 'Líder de proyecto',
        collaborator: 'Colaborador',
        reviewer: 'Revisor',
        client: 'Cliente',
        guest: 'Invitado'
      }[input.role],
      status: 'active',
      workspaceIds: clone(input.workspaceIds),
      projectIds: clone(input.projectIds),
      workspaceRoles,
      projectRoles,
      schemaVersion: 10,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  }];

  input.workspaceIds.forEach(workspaceId => {
    operations.push({
      group: 'workspaceMemberships',
      path: `workspaces/${workspaceId}/members/${input.uid}`,
      data: {
        id: input.uid,
        authUid: input.uid,
        userId: input.personId,
        workspaceId,
        role: input.role,
        status: 'active',
        schemaVersion: 10,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    });

    if (input.personId) {
      operations.push({
        group: 'peopleLinks',
        path: `workspaces/${workspaceId}/people/${input.personId}`,
        data: {
          authUid: input.uid,
          email: input.email,
          updatedAt: timestamp
        }
      });
    }
  });

  input.projectIds.forEach(projectId => {
    const project = projectById.get(projectId);
    operations.push({
      group: 'projectMemberships',
      path: `workspaces/${project.workspaceId}/projects/${projectId}/members/${input.uid}`,
      data: {
        id: input.uid,
        authUid: input.uid,
        userId: input.personId,
        workspaceId: project.workspaceId,
        projectId,
        role: input.role,
        allocation: Number(rawInput.allocation || 0),
        status: 'active',
        schemaVersion: 10,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    });
  });

  const uniquePaths = new Set();
  const duplicates = [];
  operations.forEach(operation => {
    if (uniquePaths.has(operation.path)) duplicates.push(operation.path);
    uniquePaths.add(operation.path);
  });

  const counts = operations.reduce((result, operation) => {
    result[operation.group] = (result[operation.group] || 0) + 1;
    result.total += 1;
    return result;
  }, { profiles: 0, workspaceMemberships: 0, projectMemberships: 0, peopleLinks: 0, total: 0 });

  return {
    schemaVersion: 10,
    generatedAt: timestamp,
    input,
    counts,
    duplicates,
    operations
  };
}

export const USER_ACTIVATION_ROLES = ALLOWED_ROLES;
