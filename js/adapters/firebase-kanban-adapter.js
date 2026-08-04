import { API_CONFIG } from '../config/api-config.js';
import { defaultKanbanColumns } from '../../data/demo-kanban.js';
import { demoUsers } from '../../data/demo-users.js';
import { canAccessProject, canEditKanban } from '../utils/permissions.js';

const SDK_VERSION = '10.12.5';
let runtimePromise = null;
let unsubscribeSnapshot = null;
const listeners = new Set();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function requireConfigured() {
  const config = API_CONFIG.firebase || {};
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('Firebase no está configurado. Mantén kanbanMode en mock hasta completar la configuración.');
  }
  return config;
}

function requireAccess(session, projectId, workspaceId, edit = false) {
  if (!canAccessProject(session, projectId, workspaceId)) throw new Error('No tienes acceso a este tablero.');
  if (edit && !canEditKanban(session)) throw new Error('Tu rol no permite modificar el Kanban.');
}

async function runtime(session) {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
    ]).then(([appModule, authModule, firestoreModule]) => {
      const config = requireConfigured();
      const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config);
      return {
        app,
        auth: authModule.getAuth(app),
        db: firestoreModule.getFirestore(app),
        authModule,
        firestore: firestoreModule
      };
    });
  }
  const result = await runtimePromise;
  if (!result.auth.currentUser) {
    if (!session?.firebaseCustomToken) {
      throw new Error('La sesión no contiene un token personalizado de Firebase. Configura el Access Broker de Apps Script antes de activar Firebase.');
    }
    await result.authModule.signInWithCustomToken(result.auth, session.firebaseCustomToken);
  }
  return result;
}

function refs(r, workspaceId, projectId) {
  const { doc, collection } = r.firestore;
  const projectRef = doc(r.db, 'workspaces', workspaceId, 'projects', projectId);
  const boardRef = doc(projectRef, 'boards', 'main');
  const cardsRef = collection(boardRef, 'cards');
  return { projectRef, boardRef, cardsRef };
}

function actor(session) {
  return session?.user?.id || 'system';
}

function history(type, title, session, meta = {}) {
  return { id: uid('hist'), type, title, actorId: actor(session), createdAt: new Date().toISOString(), meta };
}

function enrich(board) {
  const usersById = Object.fromEntries(demoUsers.map(user => [user.id, user]));
  return {
    ...board,
    cards: (board.cards || []).map(card => ({
      ...card,
      assignee: usersById[card.assigneeId] || null,
      participants: (card.participantIds || []).map(id => usersById[id]).filter(Boolean),
      comments: (card.comments || []).map(item => ({ ...item, author: usersById[item.authorId] || null })),
      history: (card.history || []).map(item => ({ ...item, actor: usersById[item.actorId] || null }))
    }))
  };
}

async function ensureBoard(r, workspaceId, projectId, canCreate) {
  const { getDoc, setDoc } = r.firestore;
  const { boardRef } = refs(r, workspaceId, projectId);
  const snap = await getDoc(boardRef);
  if (snap.exists()) return snap.data();
  if (!canCreate) throw new Error('El tablero aún no ha sido inicializado.');
  const createdAt = new Date().toISOString();
  const board = { id: `board-${projectId}`, projectId, name: 'Tablero principal', columns: clone(defaultKanbanColumns), version: 1, createdAt, updatedAt: createdAt };
  await setDoc(boardRef, board);
  return board;
}

async function loadBoard(r, workspaceId, projectId, canCreate) {
  const { query, orderBy, getDocs } = r.firestore;
  const board = await ensureBoard(r, workspaceId, projectId, canCreate);
  const { cardsRef } = refs(r, workspaceId, projectId);
  const cardsSnap = await getDocs(query(cardsRef, orderBy('position', 'asc')));
  const allCards = cardsSnap.docs.map(item => ({ id: item.id, ...item.data() }));
  const cards = allCards.filter(card => !card.archived);
  const archivedCards = allCards.filter(card => card.archived);
  return enrich({ ...board, columns: (board.columns || []).filter(column => column.active !== false && !column.archived), cards, archivedCards });
}

export const FirebaseKanbanAdapter = {
  async getBoard({ projectId, workspaceId, session }) {
    requireAccess(session, projectId, workspaceId);
    const r = await runtime(session);
    return loadBoard(r, workspaceId, projectId, canEditKanban(session));
  },

  async createCard({ projectId, workspaceId, input, session }) {
    requireAccess(session, projectId, workspaceId, true);
    const r = await runtime(session);
    const { setDoc, doc, getDocs } = r.firestore;
    const { boardRef, cardsRef } = refs(r, workspaceId, projectId);
    await ensureBoard(r, workspaceId, projectId, true);
    const existing = await getDocs(cardsRef);
    const columnId = input.columnId || defaultKanbanColumns[0].id;
    const position = (existing.docs.filter(item => item.data().columnId === columnId && !item.data().archived).length + 1) * 1000;
    const now = new Date().toISOString();
    const id = uid('card');
    const card = {
      columnId, position, title: String(input.title || '').trim(), description: String(input.description || '').trim(),
      priority: input.priority || 'medium', assigneeId: input.assigneeId || '', participantIds: input.participantIds || [],
      labels: input.labels || [], startDate: input.startDate || '', dueDate: input.dueDate || '',
      estimatedHours: Number(input.estimatedHours || 0), actualHours: Number(input.actualHours || 0),
      visibility: input.visibility || 'internal', dependencies: input.dependencies || [], checklist: [], comments: [],
      history: [history('created', 'Tarjeta creada', session)], archived: false, createdAt: now, updatedAt: now
    };
    if (!card.title) throw new Error('Escribe un título para la tarjeta.');
    await setDoc(doc(cardsRef, id), card);
    await r.firestore.updateDoc(boardRef, { updatedAt: now, version: r.firestore.increment(1) });
    return { id, ...card };
  },

  async updateCard({ projectId, workspaceId, cardId, patch, session }) {
    requireAccess(session, projectId, workspaceId, true);
    const r = await runtime(session);
    const { doc, updateDoc, arrayUnion } = r.firestore;
    const { cardsRef, boardRef } = refs(r, workspaceId, projectId);
    const now = new Date().toISOString();
    const cleanPatch = { ...patch, updatedAt: now, history: arrayUnion(history('updated', 'Detalles actualizados', session)) };
    await updateDoc(doc(cardsRef, cardId), cleanPatch);
    await updateDoc(boardRef, { updatedAt: now, version: r.firestore.increment(1) });
    return this.getBoard({ projectId, workspaceId, session }).then(board => board.cards.find(card => card.id === cardId));
  },

  async moveCard({ projectId, workspaceId, cardId, toColumnId, toIndex = 0, session }) {
    requireAccess(session, projectId, workspaceId, true);
    const r = await runtime(session);
    const board = await loadBoard(r, workspaceId, projectId, true);
    const card = board.cards.find(item => item.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    const targetColumn = board.columns.find(item => item.id === toColumnId);
    if (!targetColumn) throw new Error('Columna de destino no encontrada.');
    const targetCards = board.cards.filter(item => item.id !== cardId && item.columnId === toColumnId).sort((a, b) => a.position - b.position);
    if (targetColumn.wipLimit > 0 && targetCards.length >= targetColumn.wipLimit && card.columnId !== toColumnId) {
      throw new Error(`La columna ${targetColumn.name} alcanzó su límite WIP.`);
    }
    targetCards.splice(Math.max(0, Math.min(toIndex, targetCards.length)), 0, card);
    const { doc, writeBatch, arrayUnion, increment } = r.firestore;
    const { cardsRef, boardRef } = refs(r, workspaceId, projectId);
    const batch = writeBatch(r.db);
    targetCards.forEach((item, index) => {
      const patch = { columnId: toColumnId, position: (index + 1) * 1000, updatedAt: new Date().toISOString() };
      if (item.id === cardId) patch.history = arrayUnion(history('moved', `Movida a ${targetColumn.name}`, session));
      batch.update(doc(cardsRef, item.id), patch);
    });
    batch.update(boardRef, { updatedAt: new Date().toISOString(), version: increment(1) });
    await batch.commit();
    return loadBoard(r, workspaceId, projectId, true);
  },

  async archiveCard({ projectId, workspaceId, cardId, session }) {
    requireAccess(session, projectId, workspaceId, true);
    const r = await runtime(session);
    const { doc, updateDoc, arrayUnion, increment } = r.firestore;
    const { cardsRef, boardRef } = refs(r, workspaceId, projectId);
    const now = new Date().toISOString();
    await updateDoc(doc(cardsRef, cardId), { archived: true, archivedAt: now, archivedBy: actor(session), updatedAt: now, history: arrayUnion(history('archived', 'Tarjeta archivada', session)) });
    await updateDoc(boardRef, { updatedAt: now, version: increment(1) });
    return { archived: true };
  },


  async restoreCard() {
    throw new Error('La restauración de tarjetas en Firebase se habilitará al activar la integración real. Mantén kanbanMode en mock durante esta revisión.');
  },

  async deleteCard() {
    throw new Error('La eliminación definitiva en Firebase se habilitará al activar la integración real.');
  },

  async addComment({ projectId, workspaceId, cardId, text, session }) {
    requireAccess(session, projectId, workspaceId, true);
    const cleanText = String(text || '').trim();
    if (!cleanText) throw new Error('Escribe un comentario.');
    const r = await runtime(session);
    const { doc, updateDoc, arrayUnion, increment } = r.firestore;
    const { cardsRef, boardRef } = refs(r, workspaceId, projectId);
    const now = new Date().toISOString();
    await updateDoc(doc(cardsRef, cardId), {
      comments: arrayUnion({ id: uid('com'), authorId: actor(session), text: cleanText, createdAt: now }),
      history: arrayUnion(history('commented', 'Comentario agregado', session)), updatedAt: now
    });
    await updateDoc(boardRef, { updatedAt: now, version: increment(1) });
    return this.getBoard({ projectId, workspaceId, session }).then(board => board.cards.find(card => card.id === cardId));
  },

  async addChecklistItem({ projectId, workspaceId, cardId, text, session }) {
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = board.cards.find(item => item.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada.');
    return this.updateCard({ projectId, workspaceId, cardId, patch: { checklist: [...(card.checklist || []), { id: uid('chk'), text: String(text || '').trim(), completed: false }] }, session });
  },

  async toggleChecklistItem({ projectId, workspaceId, cardId, itemId, completed, session }) {
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = board.cards.find(item => item.id === cardId);
    const checklist = (card?.checklist || []).map(item => item.id === itemId ? { ...item, completed: Boolean(completed) } : item);
    return this.updateCard({ projectId, workspaceId, cardId, patch: { checklist }, session });
  },

  async deleteChecklistItem({ projectId, workspaceId, cardId, itemId, session }) {
    const board = await this.getBoard({ projectId, workspaceId, session });
    const card = board.cards.find(item => item.id === cardId);
    const checklist = (card?.checklist || []).filter(item => item.id !== itemId);
    return this.updateCard({ projectId, workspaceId, cardId, patch: { checklist }, session });
  },


  async updateBoardColumns() {
    throw new Error('La configuración de columnas en Firebase se habilitará al activar la integración real.');
  },

  async applyTemplate() {
    throw new Error('Las plantillas de tablero en Firebase se habilitarán al activar la integración real.');
  },

  async resetBoard() {
    throw new Error('El reinicio del tablero solo está disponible en modo demo.');
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async startRealtime({ projectId, workspaceId, session }) {
    requireAccess(session, projectId, workspaceId);
    const r = await runtime(session);
    unsubscribeSnapshot?.();
    const { query, onSnapshot } = r.firestore;
    const { cardsRef } = refs(r, workspaceId, projectId);
    unsubscribeSnapshot = onSnapshot(query(cardsRef), () => {
      listeners.forEach(listener => listener({ source: 'firebase', projectId, action: 'snapshot' }));
    });
    return unsubscribeSnapshot;
  }
};
