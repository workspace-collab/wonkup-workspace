import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=11.0.1';
import { defaultKanbanColumns } from '../../data/demo-kanban.js?v=11.0.1';
import { getKanbanTemplate } from '../../data/kanban-templates.js?v=11.0.1';
import {
  canAccessProject,
  canCommentKanban,
  canConfigureKanban,
  canDeleteKanbanCard,
  canEditKanban,
  canViewKanban
} from '../utils/permissions.js?v=11.0.1';

const listeners = new Set();
const directoryCache = new Map();
let activeRealtimeStops = [];

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
    'permission-denied': 'Las reglas de Firestore no permiten esta operación en el Kanban.',
    'unavailable': 'Firestore no está disponible temporalmente.',
    'failed-precondition': 'Firestore requiere una configuración o índice adicional.',
    'not-found': 'La tarjeta o el tablero ya no existe.',
    'aborted': 'Otro usuario modificó el tablero al mismo tiempo. Vuelve a intentarlo.'
  };
  return new Error(messages[code] || error?.message || 'No se pudo completar la operación del Kanban.');
}

async function context(session) {
  if (session?.source !== 'firebase') {
    throw new Error('Para usar el Kanban en la nube ingresa con una Cuenta WonkUp.');
  }
  const client = await getFirebaseClient();
  const user = client.auth.currentUser || await waitForFirebaseAuth();
  if (!user || user.uid !== session.firebaseUid) {
    throw new Error('La sesión de Firebase no está disponible. Ingresa nuevamente.');
  }
  return client;
}

function requireView(session, projectId, workspaceId) {
  if (!canAccessProject(session, projectId, workspaceId) || !canViewKanban(session, projectId, workspaceId)) {
    throw new Error('No tienes acceso a este tablero.');
  }
}

function requireEdit(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canEditKanban(session, projectId, workspaceId)) {
    throw new Error('Tu rol no permite modificar el Kanban.');
  }
}

function requireComment(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canCommentKanban(session, projectId, workspaceId)) {
    throw new Error('Tu rol no permite comentar en el Kanban.');
  }
}

function requireConfigure(session, projectId, workspaceId) {
  requireView(session, projectId, workspaceId);
  if (!canConfigureKanban(session, projectId, workspaceId)) {
    throw new Error('Tu rol no permite configurar este tablero.');
  }
}

function refs(client, workspaceId, projectId) {
  const { doc, collection } = client.sdk.firestore;
  const projectRef = doc(client.db, 'workspaces', workspaceId, 'projects', projectId);
  const boardRef = doc(projectRef, 'boards', 'main');
  return {
    projectRef,
    boardRef,
    cardsRef: collection(boardRef, 'cards'),
    activityRef: collection(projectRef, 'activity')
  };
}

function actor(session) {
  return {
    actorId: session?.user?.id || session?.firebaseUid || 'system',
    actorUid: session?.firebaseUid || '',
    actorName: session?.user?.name || session?.user?.email || 'Usuario WonkUp'
  };
}

function history(type, title, session, meta = {}) {
  return {
    id: uid('hist'),
    type,
    title,
    ...actor(session),
    createdAt: nowIso(),
    meta: clone(meta)
  };
}

function activity(type, title, session, workspaceId, projectId, card = null, meta = {}) {
  const id = uid('activity');
  return {
    id,
    type,
    title,
    workspaceId,
    projectId,
    cardId: card?.id || '',
    cardTitle: card?.title || '',
    ...actor(session),
    createdAt: nowIso(),
    meta: clone(meta),
    schemaVersion: 10
  };
}

function normalizeColumns(columns) {
  return (columns || []).map((column, index) => ({
    id: String(column.id || `column-${index + 1}`),
    name: String(column.name || `Columna ${index + 1}`).trim(),
    order: Number(column.order || (index + 1) * 10),
    wipLimit: Math.max(0, Number(column.wipLimit || 0)),
    tone: String(column.tone || 'gray'),
    isDone: Boolean(column.isDone),
    active: column.active !== false && !column.archived,
    archived: Boolean(column.archived || column.active === false)
  })).sort((a, b) => a.order - b.order);
}

function defaultBoard(workspaceId, projectId) {
  const timestamp = nowIso();
  const columns = normalizeColumns(getKanbanTemplate('basic-4')?.columns || defaultKanbanColumns);
  return {
    id: `board-${projectId}`,
    workspaceId,
    projectId,
    name: 'Tablero principal',
    templateId: 'basic-4',
    columns,
    version: 1,
    schemaVersion: 10,
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: ''
  };
}

async function ensureBoard(client, workspaceId, projectId, canCreate) {
  const { getDoc, setDoc } = client.sdk.firestore;
  const { boardRef } = refs(client, workspaceId, projectId);
  const snapshot = await getDoc(boardRef);
  if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
  if (!canCreate) throw new Error('El tablero todavía no ha sido inicializado por un miembro del equipo.');
  const board = defaultBoard(workspaceId, projectId);
  await setDoc(boardRef, board);
  return board;
}

async function loadDirectory(client, workspaceId, projectId, { force = false } = {}) {
  const cacheKey = `${workspaceId}:${projectId}`;
  if (!force && directoryCache.has(cacheKey)) return directoryCache.get(cacheKey);
  const { collection, getDocs, doc, getDoc } = client.sdk.firestore;
  const [peopleSnapshot, membersSnapshot] = await Promise.all([
    getDocs(collection(client.db, 'workspaces', workspaceId, 'people')),
    getDocs(collection(client.db, 'workspaces', workspaceId, 'projects', projectId, 'members'))
  ]);
  const map = new Map();
  const uidByPersonId = new Map();
  const peopleByEmail = new Map();
  const memberUids = new Set();
  peopleSnapshot.docs.forEach(item => {
    const person = { id: item.id, ...item.data() };
    map.set(person.id, person);
    const email = String(person.email || '').trim().toLowerCase();
    if (email) peopleByEmail.set(email, person);
    if (person.authUid) {
      map.set(person.authUid, person);
      uidByPersonId.set(person.id, person.authUid);
      memberUids.add(person.authUid);
    }
  });
  for (const item of membersSnapshot.docs) {
    const member = { id: item.id, ...item.data() };
    const authUid = String(
      member.authUid || (item.id && item.id !== member.userId ? item.id : '') || ''
    ).trim();
    if (authUid) memberUids.add(authUid);
    let person = map.get(member.userId) || map.get(authUid) || null;
    let profile = null;
    if (authUid) {
      try {
        const profileSnapshot = await getDoc(doc(client.db, 'users', authUid));
        if (profileSnapshot.exists()) profile = { authUid, ...profileSnapshot.data() };
      } catch {
        // Missing optional profile information must not block the board.
      }
    }
    if (!person && profile?.personId) person = map.get(profile.personId) || null;
    if (!person && profile?.email) person = peopleByEmail.get(String(profile.email).trim().toLowerCase()) || null;
    if (person) {
      map.set(member.id, person);
      if (authUid) {
        map.set(authUid, person);
        uidByPersonId.set(person.id, authUid);
      }
      if (member.userId && authUid) uidByPersonId.set(member.userId, authUid);
    } else if (profile && authUid) {
      const fallback = {
        id: member.userId || profile.personId || authUid,
        authUid,
        ...profile
      };
      map.set(fallback.id, fallback);
      map.set(authUid, fallback);
      if (member.userId) uidByPersonId.set(member.userId, authUid);
      if (profile.personId) uidByPersonId.set(profile.personId, authUid);
    }
  }
  const value = { map, uidByPersonId, memberUids };
  directoryCache.set(cacheKey, value);
  return value;
}

function publicPerson(person) {
  if (!person) return null;
  const name = person.name || person.displayName || person.email || 'Usuario';
  return {
    id: person.id || person.authUid || '',
    authUid: person.authUid || '',
    name,
    email: person.email || '',
    initials: person.initials || String(name).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
    photoURL: person.photoURL || ''
  };
}

async function enrichBoard(client, workspaceId, projectId, board, allCards) {
  const directory = await loadDirectory(client, workspaceId, projectId);
  const enrichCard = card => ({
    ...card,
    assignee: publicPerson(directory.map.get(card.assigneeId)),
    participants: (card.participantIds || []).map(id => publicPerson(directory.map.get(id))).filter(Boolean),
    comments: (card.comments || []).map(item => ({ ...item, author: publicPerson(directory.map.get(item.authorId) || directory.map.get(item.actorUid)) })),
    history: (card.history || []).map(item => ({ ...item, actor: publicPerson(directory.map.get(item.actorId) || directory.map.get(item.actorUid)) }))
  });
  const columns = normalizeColumns(board.columns || []);
  return {
    ...board,
    columns: columns.filter(column => column.active),
    archivedColumns: columns.filter(column => !column.active),
    cards: allCards.filter(card => !card.archived).map(enrichCard),
    archivedCards: allCards.filter(card => card.archived).map(enrichCard)
  };
}

async function loadBoard(client, workspaceId, projectId, canCreate) {
  const { query, orderBy, getDocs } = client.sdk.firestore;
  const board = await ensureBoard(client, workspaceId, projectId, canCreate);
  const { cardsRef } = refs(client, workspaceId, projectId);
  const snapshot = await getDocs(query(cardsRef, orderBy('position', 'asc')));
  const cards = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  return enrichBoard(client, workspaceId, projectId, board, cards);
}

function cardById(board, cardId, { archived = null } = {}) {
  const cards = [...(board.cards || []), ...(board.archivedCards || [])];
  const card = cards.find(item => item.id === cardId && (archived === null || Boolean(item.archived) === archived));
  if (!card) throw new Error('Tarjeta no encontrada.');
  return card;
}

function ensureWip(board, columnId, ignoreCardId = '') {
  const column = board.columns.find(item => item.id === columnId);
  if (!column) throw new Error('La columna de destino no está disponible.');
  const count = board.cards.filter(card => card.id !== ignoreCardId && card.columnId === columnId).length;
  if (column.wipLimit > 0 && count >= column.wipLimit) {
    throw new Error(`La columna ${column.name} alcanzó su límite WIP de ${column.wipLimit}.`);
  }
  return column;
}

function validateColumns(input, board) {
  if (!Array.isArray(input)) throw new Error('La configuración de columnas no es válida.');
  const columns = normalizeColumns(input).map((column, index) => ({ ...column, order: (index + 1) * 10 }));
  const active = columns.filter(column => column.active);
  if (active.length < 2) throw new Error('El tablero debe tener al menos dos columnas activas.');
  if (columns.some(column => !column.name)) throw new Error('Todas las columnas deben tener un nombre.');
  if (new Set(columns.map(column => column.id)).size !== columns.length) throw new Error('Los identificadores de columna deben ser únicos.');
  if (!active.some(column => column.isDone)) throw new Error('Marca una columna activa como etapa final.');
  const activeIds = new Set(active.map(column => column.id));
  const occupied = board.cards.find(card => !activeIds.has(card.columnId));
  if (occupied) throw new Error('No puedes desactivar una columna que todavía contiene tarjetas. Muévelas primero.');
  return columns;
}

function addActivityToBatch(client, batch, workspaceId, projectId, entry) {
  const { doc } = client.sdk.firestore;
  const { activityRef } = refs(client, workspaceId, projectId);
  batch.set(doc(activityRef, entry.id), entry);
}

export function buildKanbanNotificationAudience(card = {}, { includeCreator = false, includeCommenters = false, personIds = [], directUids = [] } = {}) {
  const people = new Set((personIds || []).map(String).filter(Boolean));
  const uids = new Set((directUids || []).map(String).filter(Boolean));
  if (includeCreator) {
    if (card.createdById) people.add(String(card.createdById));
    if (card.createdByUid) uids.add(String(card.createdByUid));
    const created = (card.history || []).find(item => item.type === 'created') || (card.history || [])[0];
    if (created?.actorId) people.add(String(created.actorId));
    if (created?.actorUid) uids.add(String(created.actorUid));
  }
  if (includeCommenters) {
    (card.comments || []).forEach(comment => {
      if (comment.authorId) people.add(String(comment.authorId));
      if (comment.actorUid) uids.add(String(comment.actorUid));
    });
  }
  return { personIds: [...people], directUids: [...uids] };
}

async function recipientUids(client, workspaceId, projectId, personIds = [], directUids = [], fallbackToProjectMembers = false) {
  const directory = await loadDirectory(client, workspaceId, projectId, { force: true });
  const recipients = new Set((directUids || []).map(String).filter(Boolean));
  (personIds || []).forEach(id => {
    const value = String(id || '');
    const resolved = directory.uidByPersonId.get(value) || directory.map.get(value)?.authUid || '';
    if (resolved) recipients.add(resolved);
  });
  if (!recipients.size && fallbackToProjectMembers) {
    directory.memberUids.forEach(uidValue => recipients.add(uidValue));
  }
  return [...recipients];
}

async function createNotifications(client, {
  workspaceId,
  projectId,
  card,
  session,
  type,
  title,
  message,
  personIds = [],
  directUids = [],
  fallbackToProjectMembers = false
}) {
  const actorUid = session?.firebaseUid || '';
  const recipients = (await recipientUids(
    client,
    workspaceId,
    projectId,
    personIds,
    directUids,
    fallbackToProjectMembers
  )).filter(uidValue => uidValue !== actorUid).slice(0, 12);
  if (!recipients.length) return { attempted: 0, delivered: 0 };
  const { doc, collection, setDoc } = client.sdk.firestore;
  const results = await Promise.allSettled(recipients.map(recipientUid => {
    const ref = doc(collection(client.db, 'users', recipientUid, 'notifications'));
    return setDoc(ref, {
      id: ref.id,
      recipientUid,
      actorUid,
      actorName: session?.user?.name || 'Usuario WonkUp',
      type,
      title,
      message,
      href: `#/w/${workspaceId}/p/${projectId}/kanban`,
      workspaceId,
      projectId,
      cardId: card?.id || '',
      read: false,
      createdAt: nowIso(),
      schemaVersion: 10
    });
  }));
  const rejected = results.filter(result => result.status === 'rejected');
  if (rejected.length) console.warn('WonkUp notification delivery failed', rejected.map(result => result.reason));
  return { attempted: recipients.length, delivered: recipients.length - rejected.length };
}

async function updateBoardTouch(client, batch, boardRef, session) {
  batch.update(boardRef, {
    updatedAt: nowIso(),
    updatedBy: session?.firebaseUid || '',
    version: client.sdk.firestore.increment(1),
    schemaVersion: 10
  });
}


async function commitCardPatches(client, cardsRef, patches, chunkSize = 4) {
  const { doc, writeBatch } = client.sdk.firestore;
  for (let index = 0; index < patches.length; index += chunkSize) {
    const batch = writeBatch(client.db);
    patches.slice(index, index + chunkSize).forEach(item => {
      batch.update(doc(cardsRef, item.id), item.patch);
    });
    await batch.commit();
  }
}

async function commitBoardActivity(client, workspaceId, projectId, boardRef, session, entry) {
  const batch = client.sdk.firestore.writeBatch(client.db);
  addActivityToBatch(client, batch, workspaceId, projectId, entry);
  await updateBoardTouch(client, batch, boardRef, session);
  await batch.commit();
}

function normalizeCardInput(input = {}) {
  return {
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    priority: ['high', 'medium', 'low'].includes(input.priority) ? input.priority : 'medium',
    assigneeId: String(input.assigneeId || ''),
    participantIds: [...new Set((input.participantIds || []).map(String))],
    labels: clone(input.labels || []),
    startDate: String(input.startDate || ''),
    dueDate: String(input.dueDate || ''),
    estimatedHours: Number(input.estimatedHours || 0),
    actualHours: Number(input.actualHours || 0),
    visibility: ['internal', 'client', 'restricted'].includes(input.visibility) ? input.visibility : 'internal',
    dependencies: [...new Set((input.dependencies || []).map(String))]
  };
}

export const FirebaseKanbanAdapter = {
  async getBoard({ projectId, workspaceId, session }) {
    try {
      requireView(session, projectId, workspaceId);
      const client = await context(session);
      return await loadBoard(client, workspaceId, projectId, canEditKanban(session, projectId, workspaceId));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createCard({ projectId, workspaceId, input, session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const clean = normalizeCardInput(input);
      if (!clean.title) throw new Error('Escribe un título para la tarjeta.');
      const columnId = String(input.columnId || board.columns[0]?.id || 'backlog');
      ensureWip(board, columnId);
      const position = (board.cards.filter(card => card.columnId === columnId).length + 1) * 1000;
      const timestamp = nowIso();
      const { doc, writeBatch } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const cardRef = doc(cardsRef);
      const card = {
        id: cardRef.id,
        workspaceId,
        projectId,
        columnId,
        position,
        ...clean,
        checklist: [],
        comments: [],
        history: [history('created', 'Tarjeta creada', session)],
        archived: false,
        columnBeforeArchive: '',
        positionBeforeArchive: 0,
        archivedAt: '',
        archivedBy: '',
        restoredAt: '',
        restoredBy: '',
        schemaVersion: 10,
        createdById: session.user.id || session.firebaseUid,
        createdByUid: session.firebaseUid,
        createdAt: timestamp,
        updatedAt: timestamp,
        updatedBy: session.firebaseUid
      };
      const entry = activity('kanban.card.created', `Creó la tarjeta “${card.title}”`, session, workspaceId, projectId, card);
      const batch = writeBatch(client.db);
      batch.set(cardRef, card);
      addActivityToBatch(client, batch, workspaceId, projectId, entry);
      await updateBoardTouch(client, batch, boardRef, session);
      await batch.commit();
      await createNotifications(client, {
        workspaceId, projectId, card, session,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: card.title,
        personIds: [card.assigneeId, ...card.participantIds]
      });
      return (await loadBoard(client, workspaceId, projectId, true)).cards.find(item => item.id === card.id);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateCard({ projectId, workspaceId, cardId, patch, session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const client = await context(session);
      let board = await loadBoard(client, workspaceId, projectId, true);
      let current = cardById(board, cardId, { archived: false });
      if (patch.columnId && patch.columnId !== current.columnId) {
        board = await this.moveCard({
          projectId,
          workspaceId,
          cardId,
          toColumnId: patch.columnId,
          toIndex: board.cards.filter(card => card.columnId === patch.columnId).length,
          session
        });
        current = cardById(board, cardId, { archived: false });
      }
      const cleanInput = normalizeCardInput({ ...current, ...patch });
      if (!cleanInput.title) throw new Error('El título no puede quedar vacío.');
      const allowedPatch = {
        ...cleanInput,
        updatedAt: nowIso(),
        updatedBy: session.firebaseUid,
        history: client.sdk.firestore.arrayUnion(history('updated', current.title === cleanInput.title ? 'Detalles actualizados' : `Título actualizado: ${cleanInput.title}`, session))
      };
      if ('checklist' in patch) allowedPatch.checklist = clone(patch.checklist || []);
      const { doc, writeBatch } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const cardRef = doc(cardsRef, cardId);
      const nextCard = { ...current, ...allowedPatch, history: current.history };
      const entry = activity('kanban.card.updated', `Actualizó la tarjeta “${cleanInput.title}”`, session, workspaceId, projectId, nextCard);
      const batch = writeBatch(client.db);
      batch.update(cardRef, allowedPatch);
      addActivityToBatch(client, batch, workspaceId, projectId, entry);
      await updateBoardTouch(client, batch, boardRef, session);
      await batch.commit();

      const newlyAssigned = cleanInput.assigneeId && cleanInput.assigneeId !== current.assigneeId;
      const dueChanged = cleanInput.dueDate && cleanInput.dueDate !== current.dueDate;
      if (newlyAssigned || dueChanged) {
        const audience = buildKanbanNotificationAudience({ ...current, ...cleanInput }, {
          includeCreator: dueChanged,
          personIds: [cleanInput.assigneeId, ...cleanInput.participantIds]
        });
        await createNotifications(client, {
          workspaceId, projectId, card: { ...current, ...cleanInput }, session,
          type: newlyAssigned ? 'task_assigned' : 'due_date_changed',
          title: newlyAssigned ? 'Tarea asignada' : 'Fecha de tarea actualizada',
          message: cleanInput.title,
          ...audience
        });
      }
      return (await loadBoard(client, workspaceId, projectId, true)).cards.find(item => item.id === cardId);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async moveCard({ projectId, workspaceId, cardId, toColumnId, toIndex = 0, session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const moving = cardById(board, cardId, { archived: false });
      const fromColumnId = moving.columnId;
      const targetColumn = fromColumnId === toColumnId
        ? board.columns.find(column => column.id === toColumnId)
        : ensureWip(board, toColumnId, cardId);
      if (!targetColumn) throw new Error('Columna de destino no encontrada.');

      const sourceCards = board.cards
        .filter(card => card.id !== cardId && card.columnId === fromColumnId)
        .sort((a, b) => Number(a.position) - Number(b.position));
      const targetCards = fromColumnId === toColumnId
        ? sourceCards
        : board.cards.filter(card => card.id !== cardId && card.columnId === toColumnId).sort((a, b) => Number(a.position) - Number(b.position));
      const safeIndex = Math.max(0, Math.min(Number(toIndex || 0), targetCards.length));
      targetCards.splice(safeIndex, 0, moving);

      const { arrayUnion } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const timestamp = nowIso();
      const affected = new Map();
      sourceCards.forEach((card, index) => affected.set(card.id, { columnId: fromColumnId, position: (index + 1) * 1000 }));
      targetCards.forEach((card, index) => affected.set(card.id, { columnId: toColumnId, position: (index + 1) * 1000 }));
      const patches = [];
      for (const [id, placement] of affected.entries()) {
        const update = { ...placement, updatedAt: timestamp, updatedBy: session.firebaseUid };
        if (id === cardId) {
          update.history = arrayUnion(history(
            fromColumnId === toColumnId ? 'reordered' : 'moved',
            fromColumnId === toColumnId ? 'Orden actualizado' : `Movida a ${targetColumn.name}`,
            session,
            { fromColumnId, toColumnId }
          ));
        }
        patches.push({ id, patch: update });
      }
      await commitCardPatches(client, cardsRef, patches);
      const movedCard = { ...moving, columnId: toColumnId, position: (safeIndex + 1) * 1000 };
      const entry = activity('kanban.card.moved', `Movió “${moving.title}” a ${targetColumn.name}`, session, workspaceId, projectId, movedCard, { fromColumnId, toColumnId });
      await commitBoardActivity(client, workspaceId, projectId, boardRef, session, entry);
      const moveAudience = buildKanbanNotificationAudience(movedCard, {
        includeCreator: true,
        personIds: [moving.assigneeId, ...(moving.participantIds || [])]
      });
      await createNotifications(client, {
        workspaceId, projectId, card: movedCard, session,
        type: 'task_moved',
        title: `Tarea movida a ${targetColumn.name}`,
        message: moving.title,
        ...moveAudience
      });
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async archiveCard({ projectId, workspaceId, cardId, session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const card = cardById(board, cardId, { archived: false });
      const remaining = board.cards.filter(item => item.id !== cardId && item.columnId === card.columnId).sort((a, b) => Number(a.position) - Number(b.position));
      const { arrayUnion } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const timestamp = nowIso();
      const patches = [{ id: cardId, patch: {
        archived: true,
        columnBeforeArchive: card.columnId,
        positionBeforeArchive: Number(card.position || 0),
        archivedAt: timestamp,
        archivedBy: session.firebaseUid,
        restoredAt: '',
        restoredBy: '',
        updatedAt: timestamp,
        updatedBy: session.firebaseUid,
        history: arrayUnion(history('archived', 'Tarjeta archivada', session, { columnId: card.columnId }))
      }}];
      remaining.forEach((item, index) => patches.push({ id: item.id, patch: { position: (index + 1) * 1000, updatedAt: timestamp } }));
      await commitCardPatches(client, cardsRef, patches);
      await commitBoardActivity(client, workspaceId, projectId, boardRef, session, activity('kanban.card.archived', `Archivó “${card.title}”`, session, workspaceId, projectId, card));
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async restoreCard({ projectId, workspaceId, cardId, columnId = '', session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const card = cardById(board, cardId, { archived: true });
      const fallback = board.columns.some(column => column.id === card.columnBeforeArchive)
        ? card.columnBeforeArchive
        : board.columns[0]?.id;
      const destinationId = columnId || fallback;
      const destination = ensureWip(board, destinationId, cardId);
      const position = (board.cards.filter(item => item.columnId === destinationId).length + 1) * 1000;
      const { doc, writeBatch, arrayUnion } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const batch = writeBatch(client.db);
      const timestamp = nowIso();
      batch.update(doc(cardsRef, cardId), {
        columnId: destinationId,
        position,
        archived: false,
        restoredAt: timestamp,
        restoredBy: session.firebaseUid,
        updatedAt: timestamp,
        updatedBy: session.firebaseUid,
        history: arrayUnion(history('restored', `Tarjeta restaurada en ${destination.name}`, session))
      });
      addActivityToBatch(client, batch, workspaceId, projectId, activity('kanban.card.restored', `Restauró “${card.title}”`, session, workspaceId, projectId, card));
      await updateBoardTouch(client, batch, boardRef, session);
      await batch.commit();
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async deleteCard({ projectId, workspaceId, cardId, session }) {
    try {
      requireView(session, projectId, workspaceId);
      if (!canDeleteKanbanCard(session, projectId, workspaceId)) throw new Error('Tu rol no permite eliminar tarjetas definitivamente.');
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const card = cardById(board, cardId);
      const { doc, writeBatch } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const batch = writeBatch(client.db);
      batch.delete(doc(cardsRef, cardId));
      addActivityToBatch(client, batch, workspaceId, projectId, activity('kanban.card.deleted', `Eliminó definitivamente “${card.title}”`, session, workspaceId, projectId, card));
      await updateBoardTouch(client, batch, boardRef, session);
      await batch.commit();
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async addComment({ projectId, workspaceId, cardId, text, session }) {
    try {
      requireComment(session, projectId, workspaceId);
      const cleanText = String(text || '').trim();
      if (!cleanText) throw new Error('Escribe un comentario.');
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, false);
      const card = cardById(board, cardId, { archived: false });
      const timestamp = nowIso();
      const comment = { id: uid('com'), authorId: session.user.id, actorUid: session.firebaseUid, text: cleanText, createdAt: timestamp };
      const { doc, writeBatch, arrayUnion } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      const batch = writeBatch(client.db);
      batch.update(doc(cardsRef, cardId), {
        comments: arrayUnion(comment),
        history: arrayUnion(history('commented', 'Comentario agregado', session)),
        updatedAt: timestamp,
        updatedBy: session.firebaseUid
      });
      addActivityToBatch(client, batch, workspaceId, projectId, activity('kanban.card.commented', `Comentó en “${card.title}”`, session, workspaceId, projectId, card));
      if (canEditKanban(session, projectId, workspaceId)) {
        await updateBoardTouch(client, batch, boardRef, session);
      }
      await batch.commit();
      const commentAudience = buildKanbanNotificationAudience(card, {
        includeCreator: true,
        includeCommenters: true,
        personIds: [card.assigneeId, ...(card.participantIds || [])]
      });
      await createNotifications(client, {
        workspaceId, projectId, card, session,
        type: 'task_comment',
        title: 'Nuevo comentario en una tarea',
        message: card.title,
        fallbackToProjectMembers: true,
        ...commentAudience
      });
      return (await loadBoard(client, workspaceId, projectId, false)).cards.find(item => item.id === cardId);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async addChecklistItem({ projectId, workspaceId, cardId, text, session }) {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('Escribe el elemento de la checklist.');
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = cardById(board, cardId, { archived: false });
    return this.updateCard({
      projectId,
      workspaceId,
      cardId,
      patch: { checklist: [...(card.checklist || []), { id: uid('chk'), text: clean, completed: false }] },
      session
    });
  },

  async toggleChecklistItem({ projectId, workspaceId, cardId, itemId, completed, session }) {
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = cardById(board, cardId, { archived: false });
    const checklist = (card.checklist || []).map(item => item.id === itemId ? { ...item, completed: Boolean(completed) } : item);
    return this.updateCard({ projectId, workspaceId, cardId, patch: { checklist }, session });
  },

  async deleteChecklistItem({ projectId, workspaceId, cardId, itemId, session }) {
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = cardById(board, cardId, { archived: false });
    const checklist = (card.checklist || []).filter(item => item.id !== itemId);
    return this.updateCard({ projectId, workspaceId, cardId, patch: { checklist }, session });
  },

  async updateBoardColumns({ projectId, workspaceId, name, columns, session }) {
    try {
      requireConfigure(session, projectId, workspaceId);
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const normalized = validateColumns(columns, board);
      const { writeBatch } = client.sdk.firestore;
      const { boardRef } = refs(client, workspaceId, projectId);
      const batch = writeBatch(client.db);
      batch.update(boardRef, {
        name: String(name || 'Tablero principal').trim() || 'Tablero principal',
        columns: normalized,
        templateId: 'custom',
        updatedAt: nowIso(),
        updatedBy: session.firebaseUid,
        version: client.sdk.firestore.increment(1),
        schemaVersion: 10
      });
      addActivityToBatch(client, batch, workspaceId, projectId, activity('kanban.board.updated', 'Actualizó la configuración del tablero', session, workspaceId, projectId));
      await batch.commit();
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async applyTemplate({ projectId, workspaceId, templateId, session }) {
    try {
      requireConfigure(session, projectId, workspaceId);
      const template = getKanbanTemplate(templateId);
      if (!template) throw new Error('Plantilla no encontrada.');
      const client = await context(session);
      const board = await loadBoard(client, workspaceId, projectId, true);
      const columns = normalizeColumns(template.columns).map((column, index) => ({ ...column, order: (index + 1) * 10, active: true, archived: false }));
      const activeIds = new Set(columns.map(column => column.id));
      const fallbackColumnId = columns[0].id;
      const { writeBatch, arrayUnion } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      let fallbackPosition = board.cards.filter(card => activeIds.has(card.columnId)).filter(card => card.columnId === fallbackColumnId).length;
      const patches = [];
      board.cards.filter(card => !activeIds.has(card.columnId)).forEach(card => {
        fallbackPosition += 1;
        patches.push({ id: card.id, patch: {
          columnId: fallbackColumnId,
          position: fallbackPosition * 1000,
          updatedAt: nowIso(),
          updatedBy: session.firebaseUid,
          history: arrayUnion(history('moved', `Movida a ${columns[0].name} al aplicar plantilla`, session))
        }});
      });
      await commitCardPatches(client, cardsRef, patches);
      const batch = writeBatch(client.db);
      batch.update(boardRef, {
        templateId: template.id,
        columns,
        updatedAt: nowIso(),
        updatedBy: session.firebaseUid,
        version: client.sdk.firestore.increment(1),
        schemaVersion: 10
      });
      addActivityToBatch(client, batch, workspaceId, projectId, activity('kanban.board.template', `Aplicó la plantilla ${template.name}`, session, workspaceId, projectId));
      await batch.commit();
      return loadBoard(client, workspaceId, projectId, true);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async resetBoard() {
    throw new Error('El reinicio de datos demo solo está disponible al ingresar mediante un código local.');
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async startRealtime({ projectId, workspaceId, session }) {
    try {
      requireView(session, projectId, workspaceId);
      const client = await context(session);
      activeRealtimeStops.forEach(stop => stop?.());
      activeRealtimeStops = [];
      const { query, orderBy, onSnapshot } = client.sdk.firestore;
      const { cardsRef, boardRef } = refs(client, workspaceId, projectId);
      let readySnapshots = 0;
      const emit = action => {
        if (readySnapshots < 2) {
          readySnapshots += 1;
          return;
        }
        listeners.forEach(listener => listener({ source: 'firebase', projectId, workspaceId, action, at: nowIso() }));
      };
      activeRealtimeStops.push(onSnapshot(boardRef, () => emit('board:snapshot'), () => {}));
      activeRealtimeStops.push(onSnapshot(query(cardsRef, orderBy('position', 'asc')), () => emit('cards:snapshot'), () => {}));
      return () => {
        activeRealtimeStops.forEach(stop => stop?.());
        activeRealtimeStops = [];
      };
    } catch (error) {
      throw friendlyError(error);
    }
  }
};
