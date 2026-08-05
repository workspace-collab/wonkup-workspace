import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=9.0.0';
import {
  canAccessProject,
  canAccessWorkspace,
  canArchiveProject,
  canCreateProject,
  canCreateWorkspaceUser,
  canEditProject,
  canManageClients,
  canManageProjectResources,
  canManageProjectTeam,
  canViewMaster,
  isReadOnlyRole
} from '../utils/permissions.js?v=9.0.0';

const clone = value => JSON.parse(JSON.stringify(value));

function nowIso() {
  return new Date().toISOString();
}

function friendlyError(error) {
  const code = String(error?.code || '');
  const messages = {
    'permission-denied': 'Las reglas de Firestore no permiten esta operación.',
    'unavailable': 'Firestore no está disponible temporalmente.',
    'failed-precondition': 'Firestore requiere una configuración o índice adicional.',
    'not-found': 'El registro solicitado no existe.'
  };
  return new Error(messages[code] || error?.message || 'No se pudo completar la operación en Firestore.');
}

async function context(session) {
  if (session?.source !== 'firebase') {
    throw new Error('Para usar datos en la nube debes ingresar con una cuenta WonkUp, no con un código demo.');
  }
  const client = await getFirebaseClient();
  const user = client.auth.currentUser || await waitForFirebaseAuth();
  if (!user || user.uid !== session.firebaseUid) throw new Error('La sesión de Firebase no está disponible. Ingresa nuevamente.');
  return client;
}

function normalizeDoc(snapshot) {
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

function normalizeQuery(snapshot) {
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

function activeFilter(items, includeArchived = false) {
  return includeArchived ? items : items.filter(item => item.status !== 'archived');
}

function accessibleWorkspaceIds(session) {
  return [...new Set([
    ...(session?.scopes?.workspaceIds || []).filter(id => id && id !== '*'),
    ...(session?.workspaces || []).map(item => item.id).filter(Boolean)
  ])];
}

async function resolveWorkspaceIds(client, session) {
  const known = accessibleWorkspaceIds(session);
  if (known.length || !canViewMaster(session)) return known;
  const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
  return snapshot.docs.map(item => item.id);
}

async function getProjectById(client, projectId, session) {
  for (const workspaceId of await resolveWorkspaceIds(client, session)) {
    const snapshot = await client.sdk.firestore.getDoc(
      client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'projects', projectId)
    );
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
}

async function getClientById(client, clientId, session) {
  for (const workspaceId of await resolveWorkspaceIds(client, session)) {
    const ref = client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'clients', clientId);
    const snapshot = await client.sdk.firestore.getDoc(ref);
    if (snapshot.exists()) return { ref, value: { id: snapshot.id, ...snapshot.data() } };
  }
  return null;
}

async function getWorkspaceProjects(client, workspaceId) {
  const snapshot = await client.sdk.firestore.getDocs(
    client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects')
  );
  return normalizeQuery(snapshot);
}

function workspaceCode(workspace) {
  return String(workspace?.code || 'WSP-GEN').replace(/^WSP-/, '') || 'GEN';
}

async function nextProjectCode(client, workspaceId) {
  const [workspaceSnapshot, projects] = await Promise.all([
    client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId)),
    getWorkspaceProjects(client, workspaceId)
  ]);
  const prefix = workspaceCode(normalizeDoc(workspaceSnapshot));
  const numbers = projects.map(item => Number(String(item.code || '').match(/(\d+)$/)?.[1] || 0));
  return `PROY-${prefix}-${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
}

async function enrichProjects(client, projects, session) {
  const clientCache = new Map();
  const peopleCache = new Map();
  const output = [];
  for (const project of projects) {
    if (isReadOnlyRole(session)) {
      output.push({ ...project, client: project.client || 'Cliente', owner: project.owner || 'Responsable del proyecto' });
      continue;
    }
    let clientName = project.client || 'Sin cliente';
    let ownerName = project.owner || 'Sin responsable';
    if (project.clientId) {
      const key = `${project.workspaceId}:${project.clientId}`;
      if (!clientCache.has(key)) {
        const snapshot = await client.sdk.firestore.getDoc(
          client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'clients', project.clientId)
        );
        clientCache.set(key, normalizeDoc(snapshot));
      }
      clientName = clientCache.get(key)?.name || clientName;
    }
    if (project.ownerUserId) {
      const key = `${project.workspaceId}:${project.ownerUserId}`;
      if (!peopleCache.has(key)) {
        const snapshot = await client.sdk.firestore.getDoc(
          client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'people', project.ownerUserId)
        );
        peopleCache.set(key, normalizeDoc(snapshot));
      }
      ownerName = peopleCache.get(key)?.name || ownerName;
    }
    output.push({ ...project, client: clientName, owner: ownerName });
  }
  return output;
}

export const FirebaseProjectAdapter = {
  async listProjects({ workspaceId = 'all', session, includeArchived = false } = {}) {
    try {
      const client = await context(session);
      let projects = [];
      if (workspaceId === 'all') {
        if (!canViewMaster(session)) throw new Error('Solo el superadministrador puede consultar todos los workspaces.');
        for (const id of await resolveWorkspaceIds(client, session)) {
          projects.push(...await getWorkspaceProjects(client, id));
        }
      } else {
        if (!canAccessWorkspace(session, workspaceId)) throw new Error('No tienes acceso a este workspace.');
        if (canCreateProject(session, workspaceId)) {
          projects = await getWorkspaceProjects(client, workspaceId);
        } else {
          for (const projectId of [...new Set((session?.scopes?.projectIds || []).filter(id => id && id !== '*'))]) {
            const snapshot = await client.sdk.firestore.getDoc(
              client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'projects', projectId)
            );
            if (snapshot.exists()) projects.push({ id: snapshot.id, ...snapshot.data() });
          }
        }
      }
      const visible = activeFilter(projects, includeArchived)
        .filter(project => canViewMaster(session) || canAccessProject(session, project.id, project.workspaceId));
      return enrichProjects(client, visible, session);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async getProject({ projectId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || (!canViewMaster(session) && !canAccessProject(session, project.id, project.workspaceId))) return null;
      return (await enrichProjects(client, [project], session))[0];
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createProject({ input, session }) {
    try {
      if (!canCreateProject(session, input.workspaceId)) throw new Error('Tu rol no permite crear proyectos.');
      if (!canAccessWorkspace(session, input.workspaceId)) throw new Error('No tienes acceso a este workspace.');
      const client = await context(session);
      const reference = client.sdk.firestore.doc(
        client.sdk.firestore.collection(client.db, 'workspaces', input.workspaceId, 'projects')
      );
      const timestamp = nowIso();
      const project = {
        id: reference.id,
        code: await nextProjectCode(client, input.workspaceId),
        ...clone(input),
        health: input.health || 'green',
        cost: 0,
        hours: 0,
        pendingTasks: 0,
        driveFolderId: '',
        driveUrl: '',
        schemaVersion: 9,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await client.sdk.firestore.setDoc(reference, project);
      if (project.ownerUserId) {
        const personSnapshot = await client.sdk.firestore.getDoc(
          client.sdk.firestore.doc(client.db, 'workspaces', input.workspaceId, 'people', project.ownerUserId)
        );
        const authUid = personSnapshot.exists() ? String(personSnapshot.data().authUid || '') : '';
        const membershipId = authUid || project.ownerUserId;
        await client.sdk.firestore.setDoc(
          client.sdk.firestore.doc(client.db, 'workspaces', input.workspaceId, 'projects', reference.id, 'members', membershipId),
          {
            id: membershipId,
            userId: project.ownerUserId,
            authUid,
            workspaceId: input.workspaceId,
            projectId: reference.id,
            role: 'project_lead',
            allocation: 40,
            status: 'active',
            schemaVersion: 9,
            createdAt: timestamp,
            updatedAt: timestamp
          },
          { merge: true }
        );
      }
      return (await enrichProjects(client, [project], session))[0];
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateProject({ projectId, patch, session }) {
    try {
      const client = await context(session);
      const current = await getProjectById(client, projectId, session);
      if (!current) throw new Error('Proyecto no encontrado.');
      if (!canEditProject(session, current.id, current.workspaceId)) throw new Error('Tu rol no permite editar este proyecto.');
      const updated = { ...current, ...clone(patch), id: current.id, code: current.code, workspaceId: current.workspaceId, updatedAt: nowIso() };
      await client.sdk.firestore.setDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', current.workspaceId, 'projects', current.id),
        updated,
        { merge: true }
      );
      return (await enrichProjects(client, [updated], session))[0];
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async archiveProject({ projectId, session }) {
    try {
      const client = await context(session);
      const current = await getProjectById(client, projectId, session);
      if (!current) throw new Error('Proyecto no encontrado.');
      if (!canArchiveProject(session, current.workspaceId)) throw new Error('Tu rol no permite archivar proyectos.');
      const timestamp = nowIso();
      const patch = {
        statusBeforeArchive: current.status || 'planned',
        status: 'archived',
        archivedAt: timestamp,
        archivedBy: session.user.id,
        updatedAt: timestamp
      };
      await client.sdk.firestore.updateDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', current.workspaceId, 'projects', current.id),
        patch
      );
      return { ...current, ...patch };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async restoreProject({ projectId, session }) {
    try {
      const client = await context(session);
      const current = await getProjectById(client, projectId, session);
      if (!current) throw new Error('Proyecto no encontrado.');
      if (!canArchiveProject(session, current.workspaceId)) throw new Error('Tu rol no permite restaurar proyectos.');
      const timestamp = nowIso();
      const patch = {
        status: current.statusBeforeArchive || 'planned',
        statusBeforeArchive: '',
        restoredAt: timestamp,
        restoredBy: session.user.id,
        updatedAt: timestamp
      };
      await client.sdk.firestore.updateDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', current.workspaceId, 'projects', current.id),
        patch
      );
      return { ...current, ...patch };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listClients({ workspaceId = 'all', session, includeArchived = false }) {
    try {
      const client = await context(session);
      let items = [];
      if (workspaceId === 'all') {
        if (!canViewMaster(session)) throw new Error('No tienes acceso al directorio global.');
        for (const id of await resolveWorkspaceIds(client, session)) {
          const snapshot = await client.sdk.firestore.getDocs(
            client.sdk.firestore.collection(client.db, 'workspaces', id, 'clients')
          );
          items.push(...normalizeQuery(snapshot));
        }
      } else {
        if (!canAccessWorkspace(session, workspaceId)) throw new Error('No tienes acceso a este workspace.');
        const snapshot = await client.sdk.firestore.getDocs(
          client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'clients')
        );
        items = normalizeQuery(snapshot);
      }
      return activeFilter(items, includeArchived);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createClient({ input, session }) {
    try {
      if (!canManageClients(session, input.workspaceId)) throw new Error('Tu rol no permite crear clientes.');
      if (!canAccessWorkspace(session, input.workspaceId)) throw new Error('No tienes acceso a este workspace.');
      const client = await context(session);
      const reference = client.sdk.firestore.doc(
        client.sdk.firestore.collection(client.db, 'workspaces', input.workspaceId, 'clients')
      );
      const timestamp = nowIso();
      const value = { id: reference.id, ...clone(input), status: 'active', schemaVersion: 9, createdAt: timestamp, updatedAt: timestamp };
      await client.sdk.firestore.setDoc(reference, value);
      return value;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateClient({ clientId, patch, session }) {
    try {
      const client = await context(session);
      const candidate = await getClientById(client, clientId, session);
      if (!candidate) throw new Error('Cliente no encontrado.');
      const current = candidate.value;
      if (!canManageClients(session, current.workspaceId) || !canAccessWorkspace(session, current.workspaceId)) throw new Error('Tu rol no permite editar clientes.');
      const value = { ...patch, updatedAt: nowIso() };
      await client.sdk.firestore.updateDoc(candidate.ref, value);
      return { ...current, ...clone(value) };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async archiveClient({ clientId, session }) {
    return this.updateClient({ clientId, patch: { status: 'archived', archivedAt: nowIso(), archivedBy: session.user.id }, session });
  },

  async restoreClient({ clientId, session }) {
    return this.updateClient({ clientId, patch: { status: 'active', restoredAt: nowIso(), restoredBy: session.user.id }, session });
  },

  async deleteClient() {
    throw new Error('La eliminación física está desactivada en Cloud Foundation. Archiva el cliente.');
  },

  async listUsers({ workspaceId, session }) {
    try {
      if (!canAccessWorkspace(session, workspaceId)) throw new Error('No tienes acceso a este workspace.');
      const client = await context(session);
      const snapshot = await client.sdk.firestore.getDocs(
        client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'people')
      );
      return normalizeQuery(snapshot).filter(item => item.status !== 'archived' && item.status !== 'inactive');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createUser({ input, session }) {
    try {
      const workspaceId = input.workspaceId;
      if (!canCreateWorkspaceUser(session, workspaceId)) throw new Error('Tu rol no permite crear personas.');
      const client = await context(session);
      const email = String(input.email || '').trim().toLowerCase();
      const duplicate = await client.sdk.firestore.getDocs(
        client.sdk.firestore.query(
          client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'people'),
          client.sdk.firestore.where('email', '==', email),
          client.sdk.firestore.limit(1)
        )
      );
      if (!duplicate.empty) throw new Error('Ya existe una persona registrada con ese correo.');
      const reference = client.sdk.firestore.doc(
        client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'people')
      );
      const name = String(input.name || '').trim();
      const timestamp = nowIso();
      const person = {
        id: reference.id,
        workspaceId,
        name,
        email,
        initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'US',
        status: 'active',
        userType: 'internal',
        authUid: '',
        schemaVersion: 9,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await client.sdk.firestore.setDoc(reference, person);
      return person;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listMembers({ projectId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || (!canViewMaster(session) && !canAccessProject(session, project.id, project.workspaceId))) throw new Error('Proyecto no autorizado.');
      const snapshot = await client.sdk.firestore.getDocs(
        client.sdk.firestore.collection(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'members')
      );
      const members = snapshot.docs
        .map(item => ({ ...item.data(), id: item.id, documentId: item.id }))
        .filter(item => item.status === 'active');
      const output = [];
      for (const member of members) {
        const personSnapshot = await client.sdk.firestore.getDoc(
          client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'people', member.userId)
        );
        output.push({ ...member, user: normalizeDoc(personSnapshot) || { id: member.userId, name: 'Usuario', initials: 'US' } });
      }
      return output;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async assignMember({ projectId, input, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || !canManageProjectTeam(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite administrar el equipo.');
      const personSnapshot = await client.sdk.firestore.getDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'people', input.userId)
      );
      if (!personSnapshot.exists()) throw new Error('La persona seleccionada no existe en el workspace.');
      const timestamp = nowIso();
      const authUid = String(personSnapshot.data().authUid || '');
      const membershipId = authUid || input.userId;
      await client.sdk.firestore.setDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'members', membershipId),
        {
          id: membershipId,
          userId: input.userId,
          authUid,
          workspaceId: project.workspaceId,
          projectId,
          role: input.role,
          allocation: Number(input.allocation || 0),
          status: 'active',
          schemaVersion: 9,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        { merge: true }
      );
      return this.listMembers({ projectId, session });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async removeMember({ projectId, memberId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || !canManageProjectTeam(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite administrar el equipo.');
      const reference = client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'members', memberId);
      await client.sdk.firestore.setDoc(reference, { status: 'inactive', updatedAt: nowIso() }, { merge: true });
      return { removed: true };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listResources({ projectId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || (!canViewMaster(session) && !canAccessProject(session, project.id, project.workspaceId))) throw new Error('Proyecto no autorizado.');
      const resourcesRef = client.sdk.firestore.collection(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'resources');
      const source = isReadOnlyRole(session)
        ? client.sdk.firestore.query(resourcesRef, client.sdk.firestore.where('visibility', '==', 'client'))
        : resourcesRef;
      const snapshot = await client.sdk.firestore.getDocs(source);
      return normalizeQuery(snapshot).filter(item => item.status === 'active');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async addResource({ projectId, input, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || !canManageProjectResources(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite registrar recursos.');
      const reference = client.sdk.firestore.doc(
        client.sdk.firestore.collection(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'resources')
      );
      const value = { id: reference.id, projectId, workspaceId: project.workspaceId, ...clone(input), status: 'active', schemaVersion: 9, createdAt: nowIso() };
      await client.sdk.firestore.setDoc(reference, value);
      return value;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async removeResource({ projectId, resourceId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || !canManageProjectResources(session, projectId, project.workspaceId)) throw new Error('Tu rol no permite retirar recursos.');
      await client.sdk.firestore.setDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'resources', resourceId),
        { status: 'inactive', updatedAt: nowIso() },
        { merge: true }
      );
      return { removed: true };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listMilestones({ projectId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || (!canViewMaster(session) && !canAccessProject(session, project.id, project.workspaceId))) throw new Error('Proyecto no autorizado.');
      const milestonesRef = client.sdk.firestore.collection(client.db, 'workspaces', project.workspaceId, 'projects', project.id, 'milestones');
      const source = isReadOnlyRole(session)
        ? client.sdk.firestore.query(milestonesRef, client.sdk.firestore.where('visibility', '==', 'client'))
        : milestonesRef;
      const snapshot = await client.sdk.firestore.getDocs(source);
      return normalizeQuery(snapshot);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createDriveStructure({ projectId, session }) {
    try {
      const client = await context(session);
      const project = await getProjectById(client, projectId, session);
      if (!project || !canEditProject(session, project.id, project.workspaceId)) throw new Error('Tu rol no permite preparar la estructura documental.');
      const folders = ['00_Resumen', '01_Investigación', '02_Planeamiento', '03_UX-UI', '04_Desarrollo', '05_Pruebas', '06_Marketing', '07_Finanzas', '08_Entregables/Internos', '08_Entregables/Cliente', '09_Legal', '10_Archivo'];
      await client.sdk.firestore.setDoc(
        client.sdk.firestore.doc(client.db, 'workspaces', project.workspaceId, 'projects', project.id),
        { driveProvisioningStatus: 'pending_apps_script', driveTemplate: folders, updatedAt: nowIso() },
        { merge: true }
      );
      return {
        mode: 'firebase-pending',
        folderId: '',
        folderName: `${project.code}_${project.name}`,
        folderUrl: '',
        folders
      };
    } catch (error) {
      throw friendlyError(error);
    }
  }
};
