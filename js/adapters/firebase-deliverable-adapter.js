import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=12.3.0';
import {
  canAccessProject,
  canCommentDeliverable,
  canManageDeliverables,
  canReviewDeliverable,
  canViewMaster,
  isReadOnlyRole
} from '../utils/permissions.js?v=12.3.0';

const listeners = new Set();
const clone = value => JSON.parse(JSON.stringify(value));

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${globalThis.crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function friendlyError(error) {
  const code = String(error?.code || '');
  const messages = {
    'permission-denied': 'Las reglas de Firestore no permiten esta operación sobre el entregable.',
    'unavailable': 'Firestore no está disponible temporalmente.',
    'failed-precondition': 'Firestore requiere una configuración adicional.',
    'not-found': 'El entregable ya no existe.',
    'aborted': 'Otro usuario modificó el entregable al mismo tiempo. Vuelve a intentarlo.'
  };
  return new Error(messages[code] || error?.message || 'No se pudo completar la operación del entregable.');
}

async function context(session) {
  if (session?.source !== 'firebase') throw new Error('Ingresa con una Cuenta WonkUp para usar entregables en la nube.');
  const client = await getFirebaseClient();
  const user = client.auth.currentUser || await waitForFirebaseAuth();
  if (!user || user.uid !== session.firebaseUid) throw new Error('La sesión de Firebase no está disponible. Ingresa nuevamente.');
  return client;
}

function requireView(session, projectId, workspaceId, item = null) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) throw new Error('No tienes acceso a este entregable.');
  if (item && isReadOnlyRole(session) && item.visibility !== 'client') throw new Error('Este entregable es interno.');
}

function requireManage(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canManageDeliverables(session, projectId, workspaceId)) throw new Error('Tu rol no permite gestionar entregables.');
}

function requireReview(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canReviewDeliverable(session, projectId, workspaceId)) throw new Error('Tu rol no permite revisar entregables.');
}

function requireComment(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canCommentDeliverable(session, projectId, workspaceId)) throw new Error('Tu rol no permite comentar.');
}

function refs(client, workspaceId, projectId, deliverableId = '') {
  const { collection, doc } = client.sdk.firestore;
  const projectRef = doc(client.db, 'workspaces', workspaceId, 'projects', projectId);
  const deliverablesRef = collection(projectRef, 'deliverables');
  return {
    projectRef,
    deliverablesRef,
    deliverableRef: deliverableId ? doc(deliverablesRef, deliverableId) : null,
    activityRef: collection(projectRef, 'activity')
  };
}

function clientVisibleQuery(client, reference) {
  return client.sdk.firestore.query(
    reference,
    client.sdk.firestore.where('visibility', '==', 'client')
  );
}

function isPermissionDenied(error) {
  return String(error?.code || '').includes('permission-denied');
}

function actor(session) {
  return {
    actorId: session?.user?.id || session?.firebaseUid || '',
    actorUid: session?.firebaseUid || '',
    actorName: session?.user?.name || session?.user?.email || 'Usuario WonkUp'
  };
}

function historyEntry(action, label, session) {
  return {
    id: uid('dh'),
    action,
    label,
    actor: actor(session).actorName,
    actorId: actor(session).actorId,
    actorUid: actor(session).actorUid,
    createdAt: nowIso()
  };
}

function normalizeChecklist(checklist = []) {
  return (checklist || []).map(item => typeof item === 'string' ? {
    id: uid('dchk'), label: item.trim(), done: false
  } : {
    id: item.id || uid('dchk'),
    label: String(item.label || '').trim().slice(0, 180),
    done: Boolean(item.done)
  }).filter(item => item.label);
}

function normalizeDeliverable(item, id = '') {
  const timestamp = nowIso();
  return {
    ...clone(item || {}),
    id: String(item?.id || id || uid('del')),
    workspaceId: String(item?.workspaceId || ''),
    projectId: String(item?.projectId || ''),
    title: String(item?.title || '').trim(),
    type: String(item?.type || 'document'),
    description: String(item?.description || ''),
    status: ['draft', 'in_review', 'changes_requested', 'approved'].includes(item?.status) ? item.status : 'draft',
    visibility: item?.visibility === 'internal' ? 'internal' : 'client',
    priority: String(item?.priority || 'medium'),
    dueDate: String(item?.dueDate || ''),
    ownerId: String(item?.ownerId || ''),
    ownerName: String(item?.ownerName || 'Responsable'),
    archived: Boolean(item?.archived),
    checklist: normalizeChecklist(item?.checklist || []),
    versions: Array.isArray(item?.versions) ? clone(item.versions).slice(0, 40) : [],
    comments: Array.isArray(item?.comments) ? clone(item.comments).slice(-200) : [],
    history: Array.isArray(item?.history) ? clone(item.history).slice(0, 200) : [],
    schemaVersion: 11,
    createdAt: String(item?.createdAt || timestamp),
    updatedAt: String(item?.updatedAt || timestamp)
  };
}

async function loadItem(client, workspaceId, projectId, deliverableId, session) {
  if (!workspaceId || !projectId) throw new Error('Falta el contexto del workspace o proyecto.');
  const { getDoc } = client.sdk.firestore;
  const reference = refs(client, workspaceId, projectId, deliverableId).deliverableRef;
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error('Entregable no encontrado.');
  const item = normalizeDeliverable(snapshot.data(), snapshot.id);
  requireView(session, projectId, workspaceId, item);
  return item;
}

function emit(event) {
  listeners.forEach(listener => {
    try { listener(clone(event)); } catch { /* listener isolation */ }
  });
}

async function projectMembers(client, workspaceId, projectId) {
  const { collection, getDocs } = client.sdk.firestore;
  const snapshot = await getDocs(collection(client.db, 'workspaces', workspaceId, 'projects', projectId, 'members'));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(item => item.status !== 'inactive');
}

async function notifyProjectMembers(client, {
  workspaceId,
  projectId,
  deliverable,
  session,
  audience = 'all',
  type,
  title,
  message
}) {
  const members = await projectMembers(client, workspaceId, projectId);
  const actorUid = session?.firebaseUid || '';
  const internalRoles = new Set(['superadmin', 'workspace_admin', 'project_lead', 'collaborator']);
  const reviewRoles = new Set(['reviewer', 'client']);
  let recipients = members.filter(member => {
    if (audience === 'internal') return internalRoles.has(member.role);
    if (audience === 'reviewers') return reviewRoles.has(member.role);
    return member.role !== 'guest';
  });
  recipients = [...new Map(recipients.map(member => {
    const uidValue = String(member.authUid || member.id || '');
    return [uidValue, { ...member, uidValue }];
  })).values()].filter(member => member.uidValue && member.uidValue !== actorUid).slice(0, 20);
  if (!recipients.length) return;

  const { collection, doc, setDoc } = client.sdk.firestore;
  await Promise.allSettled(recipients.map(member => {
    const reference = doc(collection(client.db, 'users', member.uidValue, 'notifications'));
    return setDoc(reference, {
      id: reference.id,
      recipientUid: member.uidValue,
      actorUid,
      actorName: session?.user?.name || 'Usuario WonkUp',
      type,
      title,
      message,
      href: audience === 'internal'
        ? `#/w/${workspaceId}/p/${projectId}/deliverables`
        : `#/portal/w/${workspaceId}/p/${projectId}/deliverables`,
      workspaceId,
      projectId,
      deliverableId: deliverable.id,
      read: false,
      createdAt: nowIso(),
      schemaVersion: 11
    });
  }));
}

async function updateItem({ workspaceId, projectId, deliverableId, session, mutate, eventType }) {
  try {
    const client = await context(session);
    const current = await loadItem(client, workspaceId, projectId, deliverableId, session);
    const next = normalizeDeliverable(mutate(current), deliverableId);
    const { setDoc } = client.sdk.firestore;
    await setDoc(refs(client, workspaceId, projectId, deliverableId).deliverableRef, next, { merge: true });
    emit({ type: eventType || 'updated', deliverableId, workspaceId, projectId });
    return clone(next);
  } catch (error) {
    throw friendlyError(error);
  }
}

export const FirebaseDeliverableAdapter = {
  async listDeliverables({ projectId, workspaceId, session, includeArchived = false } = {}) {
    try {
      requireView(session, projectId, workspaceId);
      const client = await context(session);
      const { getDocs } = client.sdk.firestore;
      const reference = refs(client, workspaceId, projectId).deliverablesRef;
      const managesDeliverables = canManageDeliverables(session, projectId, workspaceId);
      const source = managesDeliverables ? reference : clientVisibleQuery(client, reference);
      let snapshot;
      try {
        snapshot = await getDocs(source);
      } catch (error) {
        // A stale project-role map can make the frontend request a broader query than
        // Firestore allows. Retry safely with client-visible records instead of blanking the view.
        if (!managesDeliverables || !isPermissionDenied(error)) throw error;
        snapshot = await getDocs(clientVisibleQuery(client, reference));
      }
      return snapshot.docs
        .map(item => normalizeDeliverable(item.data(), item.id))
        .filter(item => includeArchived || !item.archived)
        .filter(item => {
          try { requireView(session, projectId, workspaceId, item); return true; } catch { return false; }
        })
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async getDeliverable({ deliverableId, workspaceId, projectId, session }) {
    try {
      const client = await context(session);
      return clone(await loadItem(client, workspaceId, projectId, deliverableId, session));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createDeliverable({ workspaceId, projectId, input, session }) {
    try {
      requireManage(session, projectId, workspaceId);
      const client = await context(session);
      const createdAt = nowIso();
      const reference = client.sdk.firestore.doc(refs(client, workspaceId, projectId).deliverablesRef);
      const deliverable = normalizeDeliverable({
        id: reference.id,
        workspaceId,
        projectId,
        title: String(input.title || '').trim().slice(0, 180),
        type: String(input.type || 'document'),
        description: String(input.description || '').trim().slice(0, 2000),
        status: 'draft',
        visibility: input.visibility === 'internal' ? 'internal' : 'client',
        priority: String(input.priority || 'medium'),
        dueDate: String(input.dueDate || ''),
        ownerId: input.ownerId || session?.user?.id || '',
        ownerName: input.ownerName || session?.user?.name || 'Responsable',
        archived: false,
        checklist: normalizeChecklist(input.checklist),
        versions: [],
        comments: [],
        history: [historyEntry('created', 'Entregable creado', session)],
        createdByUid: session?.firebaseUid || '',
        createdAt,
        updatedAt: createdAt
      }, reference.id);
      if (deliverable.title.length < 3) throw new Error('Escribe un nombre de al menos 3 caracteres.');
      await client.sdk.firestore.setDoc(reference, deliverable);
      emit({ type: 'created', deliverableId: deliverable.id, workspaceId, projectId });
      return clone(deliverable);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateDeliverable({ deliverableId, workspaceId, projectId, patch, session }) {
    requireManage(session, projectId, workspaceId);
    return updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'updated', mutate: current => ({
      ...current,
      title: patch.title !== undefined ? String(patch.title || '').trim().slice(0, 180) : current.title,
      description: patch.description !== undefined ? String(patch.description || '').trim().slice(0, 2000) : current.description,
      type: patch.type !== undefined ? String(patch.type || 'document') : current.type,
      priority: patch.priority !== undefined ? String(patch.priority || 'medium') : current.priority,
      dueDate: patch.dueDate !== undefined ? String(patch.dueDate || '') : current.dueDate,
      visibility: patch.visibility !== undefined ? (patch.visibility === 'internal' ? 'internal' : 'client') : current.visibility,
      ownerName: patch.ownerName !== undefined ? String(patch.ownerName || '').trim().slice(0, 120) : current.ownerName,
      checklist: patch.checklist !== undefined ? normalizeChecklist(patch.checklist) : current.checklist,
      updatedAt: nowIso(),
      updatedBy: session?.firebaseUid || '',
      history: [historyEntry('updated', 'Información del entregable actualizada', session), ...(current.history || [])]
    }) });
  },

  async addVersion({ deliverableId, workspaceId, projectId, input, session }) {
    requireManage(session, projectId, workspaceId);
    return updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'version_added', mutate: current => {
      const versions = current.versions || [];
      const number = Math.max(0, ...versions.map(version => Number(version.number || 0))) + 1;
      const version = {
        id: uid('dver'), number,
        label: String(input.label || `Versión ${number}`).trim().slice(0, 120),
        fileName: String(input.fileName || input.label || `Versión ${number}`).trim().slice(0, 180),
        fileType: String(input.fileType || 'Enlace').trim().slice(0, 60),
        size: String(input.size || '').trim().slice(0, 40),
        url: String(input.url || '').trim().slice(0, 1000),
        notes: String(input.notes || '').trim().slice(0, 1000),
        createdAt: nowIso(),
        createdBy: session?.user?.name || 'Usuario',
        createdByUid: session?.firebaseUid || ''
      };
      if (!/^https?:\/\//i.test(version.url)) throw new Error('Ingresa un enlace válido con http o https.');
      return {
        ...current,
        versions: [version, ...versions].slice(0, 40),
        status: current.status === 'approved' ? 'draft' : current.status,
        approvedAt: current.status === 'approved' ? '' : current.approvedAt,
        approvedBy: current.status === 'approved' ? '' : current.approvedBy,
        updatedAt: nowIso(),
        updatedBy: session?.firebaseUid || '',
        history: [historyEntry('version_added', `${version.label} registrada`, session), ...(current.history || [])]
      };
    } });
  },

  async requestReview({ deliverableId, workspaceId, projectId, session }) {
    requireManage(session, projectId, workspaceId);
    const next = await updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'review_requested', mutate: current => {
      if (!(current.versions || []).length) throw new Error('Registra al menos una versión antes de solicitar revisión.');
      return {
        ...current,
        status: 'in_review',
        requestedAt: nowIso(),
        updatedAt: nowIso(),
        updatedBy: session?.firebaseUid || '',
        history: [historyEntry('review_requested', 'Enviado a revisión del cliente', session), ...(current.history || [])]
      };
    } });
    const client = await context(session);
    await notifyProjectMembers(client, {
      workspaceId, projectId, deliverable: next, session, audience: 'reviewers',
      type: 'deliverable_review', title: 'Entregable listo para revisión',
      message: `${next.title} fue enviado a revisión.`
    });
    return next;
  },

  async approve({ deliverableId, workspaceId, projectId, session }) {
    requireReview(session, projectId, workspaceId);
    const next = await updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'approved', mutate: current => {
      if (current.status !== 'in_review') throw new Error('El entregable no está pendiente de aprobación.');
      const approvedAt = nowIso();
      return {
        ...current,
        status: 'approved',
        approvedAt,
        approvedBy: session?.user?.name || 'Cliente',
        updatedAt: approvedAt,
        updatedBy: session?.firebaseUid || '',
        history: [historyEntry('approved', 'Entregable aprobado', session), ...(current.history || [])]
      };
    } });
    const client = await context(session);
    await notifyProjectMembers(client, {
      workspaceId, projectId, deliverable: next, session, audience: 'internal',
      type: 'deliverable_approved', title: 'Entregable aprobado',
      message: `${next.title} fue aprobado.`
    });
    return next;
  },

  async requestChanges({ deliverableId, workspaceId, projectId, feedback, session }) {
    requireReview(session, projectId, workspaceId);
    const text = String(feedback || '').trim().slice(0, 2000);
    if (text.length < 3) throw new Error('Describe el cambio solicitado.');
    const next = await updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'changes_requested', mutate: current => {
      const createdAt = nowIso();
      const comment = {
        id: uid('dcom'), text,
        authorId: session?.user?.id || '',
        authorUid: session?.firebaseUid || '',
        authorName: session?.user?.name || 'Cliente',
        role: session?.role || 'client',
        createdAt
      };
      return {
        ...current,
        status: 'changes_requested',
        changeRequestedAt: createdAt,
        comments: [...(current.comments || []), comment].slice(-200),
        updatedAt: createdAt,
        updatedBy: session?.firebaseUid || '',
        history: [historyEntry('changes_requested', 'Cambios solicitados', session), ...(current.history || [])]
      };
    } });
    const client = await context(session);
    await notifyProjectMembers(client, {
      workspaceId, projectId, deliverable: next, session, audience: 'internal',
      type: 'deliverable_changes', title: 'Cambios solicitados',
      message: `Se solicitaron cambios en ${next.title}.`
    });
    return next;
  },

  async addComment({ deliverableId, workspaceId, projectId, text, session }) {
    requireComment(session, projectId, workspaceId);
    const value = String(text || '').trim().slice(0, 2000);
    if (!value) throw new Error('Escribe un comentario.');
    const next = await updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'comment_added', mutate: current => {
      const comment = {
        id: uid('dcom'), text: value,
        authorId: session?.user?.id || '',
        authorUid: session?.firebaseUid || '',
        authorName: session?.user?.name || 'Usuario',
        role: session?.role || '',
        createdAt: nowIso()
      };
      return {
        ...current,
        comments: [...(current.comments || []), comment].slice(-200),
        updatedAt: comment.createdAt,
        updatedBy: session?.firebaseUid || '',
        history: [historyEntry('comment_added', 'Comentario agregado', session), ...(current.history || [])]
      };
    } });
    const client = await context(session);
    const audience = ['client', 'reviewer'].includes(session?.role) ? 'internal' : 'reviewers';
    await notifyProjectMembers(client, {
      workspaceId, projectId, deliverable: next, session, audience,
      type: 'deliverable_comment', title: 'Nuevo comentario en un entregable',
      message: `${session?.user?.name || 'Un usuario'} comentó en ${next.title}.`
    });
    return next;
  },

  async toggleChecklist({ deliverableId, workspaceId, projectId, checklistId, done, session }) {
    requireManage(session, projectId, workspaceId);
    return updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'checklist_updated', mutate: current => ({
      ...current,
      checklist: (current.checklist || []).map(item => item.id === checklistId ? { ...item, done: Boolean(done) } : item),
      updatedAt: nowIso(),
      updatedBy: session?.firebaseUid || ''
    }) });
  },

  async archiveDeliverable({ deliverableId, workspaceId, projectId, session }) {
    requireManage(session, projectId, workspaceId);
    return updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'archived', mutate: current => ({
      ...current,
      archived: true,
      archivedAt: nowIso(),
      updatedAt: nowIso(),
      updatedBy: session?.firebaseUid || '',
      history: [historyEntry('archived', 'Entregable archivado', session), ...(current.history || [])]
    }) });
  },

  async restoreDeliverable({ deliverableId, workspaceId, projectId, session }) {
    requireManage(session, projectId, workspaceId);
    return updateItem({ workspaceId, projectId, deliverableId, session, eventType: 'restored', mutate: current => ({
      ...current,
      archived: false,
      archivedAt: '',
      updatedAt: nowIso(),
      updatedBy: session?.firebaseUid || '',
      history: [historyEntry('restored', 'Entregable restaurado', session), ...(current.history || [])]
    }) });
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async startRealtime({ workspaceId, projectId, session, onChange }) {
    try {
      requireView(session, projectId, workspaceId);
      const client = await context(session);
      let first = true;
      let activeStop = () => {};
      const reference = refs(client, workspaceId, projectId).deliverablesRef;
      const managesDeliverables = canManageDeliverables(session, projectId, workspaceId);

      const attach = (source, allowFallback) => {
        activeStop = client.sdk.firestore.onSnapshot(
          source,
          () => {
            if (first) { first = false; return; }
            emit({ type: 'realtime_sync', workspaceId, projectId });
            onChange?.();
          },
          error => {
            if (!allowFallback || !isPermissionDenied(error)) return;
            activeStop?.();
            first = true;
            attach(clientVisibleQuery(client, reference), false);
          }
        );
      };

      attach(
        managesDeliverables ? reference : clientVisibleQuery(client, reference),
        managesDeliverables
      );
      return () => activeStop?.();
    } catch (error) {
      throw friendlyError(error);
    }
  },

  resetDemo() {}
};
