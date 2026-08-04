import { demoKanbanBoards, defaultKanbanColumns } from '../../data/demo-kanban.js';
import { demoUsers } from '../../data/demo-users.js';
import { canAccessProject, canEditKanban } from '../utils/permissions.js';

const STORAGE_KEY = 'wonkup.e4.kanban';
const CHANNEL_NAME = 'wonkup-kanban';
const wait = (milliseconds = 90) => new Promise(resolve => setTimeout(resolve, milliseconds));
const clone = value => JSON.parse(JSON.stringify(value));
const subscribers = new Set();
const channel = 'BroadcastChannel' in globalThis ? new BroadcastChannel(CHANNEL_NAME) : null;

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readBoards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Use seeded data when storage is unavailable.
  }
  const seeded = clone(demoKanbanBoards);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch { /* noop */ }
  return seeded;
}

function writeBoards(boards, event = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  const payload = { source: 'mock', at: new Date().toISOString(), ...event };
  subscribers.forEach(listener => listener(payload));
  channel?.postMessage(payload);
  return clone(boards);
}

channel?.addEventListener('message', event => {
  subscribers.forEach(listener => listener(event.data || { source: 'broadcast' }));
});

window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return;
  subscribers.forEach(listener => listener({ source: 'storage', at: new Date().toISOString() }));
});

function requireAccess(session, projectId, workspaceId) {
  if (!canAccessProject(session, projectId, workspaceId)) {
    throw new Error('No tienes acceso a este tablero.');
  }
}

function requireEdit(session, projectId, workspaceId) {
  requireAccess(session, projectId, workspaceId);
  if (!canEditKanban(session)) throw new Error('Tu rol no permite modificar el Kanban.');
}

function actor(session) {
  return session?.user?.id || 'system';
}

function emptyBoard(projectId) {
  const createdAt = new Date().toISOString();
  return {
    id: `board-${projectId}`,
    projectId,
    name: 'Tablero principal',
    version: 1,
    updatedAt: createdAt,
    columns: clone(defaultKanbanColumns),
    cards: []
  };
}

function ensureBoard(boards, projectId) {
  if (!boards[projectId]) boards[projectId] = emptyBoard(projectId);
  boards[projectId].columns = [...(boards[projectId].columns || [])].sort((a, b) => a.order - b.order);
  boards[projectId].cards ||= [];
  return boards[projectId];
}

function addHistory(card, type, title, session, meta = {}) {
  card.history ||= [];
  card.history.unshift({
    id: uid('hist'),
    type,
    title,
    actorId: actor(session),
    createdAt: new Date().toISOString(),
    meta
  });
  card.history = card.history.slice(0, 100);
}

function normalizePositions(board, columnId) {
  board.cards
    .filter(card => !card.archived && card.columnId === columnId)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .forEach((card, index) => { card.position = (index + 1) * 1000; });
}

function findCard(board, cardId) {
  const card = board.cards.find(item => item.id === cardId && !item.archived);
  if (!card) throw new Error('Tarjeta no encontrada.');
  return card;
}

function enrich(board) {
  const usersById = Object.fromEntries(demoUsers.map(user => [user.id, user]));
  return {
    ...clone(board),
    cards: board.cards.filter(card => !card.archived).map(card => ({
      ...clone(card),
      assignee: usersById[card.assigneeId] || null,
      participants: (card.participantIds || []).map(id => usersById[id]).filter(Boolean),
      comments: (card.comments || []).map(comment => ({ ...comment, author: usersById[comment.authorId] || null })),
      history: (card.history || []).map(item => ({ ...item, actor: usersById[item.actorId] || null }))
    }))
  };
}

export const MockKanbanAdapter = {
  async getBoard({ projectId, workspaceId, session }) {
    await wait();
    requireAccess(session, projectId, workspaceId);
    const boards = readBoards();
    const existed = Boolean(boards[projectId]);
    const board = ensureBoard(boards, projectId);
    if (!existed) writeBoards(boards, { projectId, action: 'board:created' });
    return enrich(board);
  },

  async createCard({ projectId, workspaceId, input, session }) {
    await wait(130);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const columnId = input.columnId || board.columns[0]?.id;
    const cardsInColumn = board.cards.filter(card => !card.archived && card.columnId === columnId);
    const now = new Date().toISOString();
    const card = {
      id: uid('card'),
      columnId,
      position: (cardsInColumn.length + 1) * 1000,
      title: String(input.title || '').trim(),
      description: String(input.description || '').trim(),
      priority: input.priority || 'medium',
      assigneeId: input.assigneeId || '',
      participantIds: [...new Set(input.participantIds || [])],
      labels: clone(input.labels || []),
      startDate: input.startDate || '',
      dueDate: input.dueDate || '',
      estimatedHours: Number(input.estimatedHours || 0),
      actualHours: Number(input.actualHours || 0),
      visibility: input.visibility || 'internal',
      dependencies: [...new Set(input.dependencies || [])],
      checklist: [], comments: [], history: [], archived: false,
      createdAt: now, updatedAt: now
    };
    if (!card.title) throw new Error('Escribe un título para la tarjeta.');
    addHistory(card, 'created', 'Tarjeta creada', session);
    board.cards.push(card);
    board.updatedAt = now;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId: card.id, action: 'card:created' });
    return enrich(board).cards.find(item => item.id === card.id);
  },

  async updateCard({ projectId, workspaceId, cardId, patch, session }) {
    await wait(110);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const previousTitle = card.title;
    const allowed = ['title', 'description', 'priority', 'assigneeId', 'participantIds', 'labels', 'startDate', 'dueDate', 'estimatedHours', 'actualHours', 'visibility', 'dependencies'];
    allowed.forEach(key => {
      if (!(key in patch)) return;
      if (['estimatedHours', 'actualHours'].includes(key)) card[key] = Number(patch[key] || 0);
      else if (['participantIds', 'labels', 'dependencies'].includes(key)) card[key] = clone(patch[key] || []);
      else card[key] = patch[key];
    });
    card.title = String(card.title || '').trim();
    if (!card.title) throw new Error('El título no puede quedar vacío.');
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'updated', previousTitle === card.title ? 'Detalles actualizados' : `Título actualizado: ${card.title}`, session);
    board.updatedAt = card.updatedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'card:updated' });
    return enrich(board).cards.find(item => item.id === cardId);
  },

  async moveCard({ projectId, workspaceId, cardId, toColumnId, toIndex = 0, session }) {
    await wait(70);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const targetColumn = board.columns.find(column => column.id === toColumnId);
    if (!targetColumn) throw new Error('Columna de destino no encontrada.');
    const fromColumnId = card.columnId;
    const targetCards = board.cards
      .filter(item => !item.archived && item.id !== cardId && item.columnId === toColumnId)
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    if (targetColumn.wipLimit > 0 && targetCards.length >= targetColumn.wipLimit && fromColumnId !== toColumnId) {
      throw new Error(`La columna ${targetColumn.name} alcanzó su límite WIP de ${targetColumn.wipLimit}.`);
    }
    const safeIndex = Math.max(0, Math.min(Number(toIndex || 0), targetCards.length));
    targetCards.splice(safeIndex, 0, card);
    card.columnId = toColumnId;
    targetCards.forEach((item, index) => { item.position = (index + 1) * 1000; });
    normalizePositions(board, fromColumnId);
    card.updatedAt = new Date().toISOString();
    if (fromColumnId !== toColumnId) addHistory(card, 'moved', `Movida a ${targetColumn.name}`, session, { fromColumnId, toColumnId });
    else addHistory(card, 'reordered', `Reordenada en ${targetColumn.name}`, session, { toIndex: safeIndex });
    board.updatedAt = card.updatedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'card:moved' });
    return enrich(board);
  },

  async archiveCard({ projectId, workspaceId, cardId, session }) {
    await wait(90);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    card.archived = true;
    card.archivedAt = new Date().toISOString();
    card.archivedBy = actor(session);
    addHistory(card, 'archived', 'Tarjeta archivada', session);
    normalizePositions(board, card.columnId);
    board.updatedAt = card.archivedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'card:archived' });
    return { archived: true };
  },

  async addComment({ projectId, workspaceId, cardId, text, session }) {
    await wait(70);
    requireEdit(session, projectId, workspaceId);
    const cleanText = String(text || '').trim();
    if (!cleanText) throw new Error('Escribe un comentario.');
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const comment = { id: uid('com'), authorId: actor(session), text: cleanText, createdAt: new Date().toISOString() };
    card.comments ||= [];
    card.comments.push(comment);
    card.updatedAt = comment.createdAt;
    addHistory(card, 'commented', 'Comentario agregado', session);
    board.updatedAt = comment.createdAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'comment:created' });
    return enrich(board).cards.find(item => item.id === cardId);
  },

  async addChecklistItem({ projectId, workspaceId, cardId, text, session }) {
    await wait(60);
    requireEdit(session, projectId, workspaceId);
    const cleanText = String(text || '').trim();
    if (!cleanText) throw new Error('Escribe el elemento de la lista.');
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    card.checklist ||= [];
    card.checklist.push({ id: uid('chk'), text: cleanText, completed: false });
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', 'Elemento agregado a la checklist', session);
    board.updatedAt = card.updatedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'checklist:created' });
    return enrich(board).cards.find(item => item.id === cardId);
  },

  async toggleChecklistItem({ projectId, workspaceId, cardId, itemId, completed, session }) {
    await wait(50);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const item = (card.checklist || []).find(entry => entry.id === itemId);
    if (!item) throw new Error('Elemento no encontrado.');
    item.completed = Boolean(completed);
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', item.completed ? `Completado: ${item.text}` : `Reabierto: ${item.text}`, session);
    board.updatedAt = card.updatedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'checklist:toggled' });
    return enrich(board).cards.find(entry => entry.id === cardId);
  },

  async deleteChecklistItem({ projectId, workspaceId, cardId, itemId, session }) {
    await wait(50);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const before = (card.checklist || []).length;
    card.checklist = (card.checklist || []).filter(entry => entry.id !== itemId);
    if (card.checklist.length === before) throw new Error('Elemento no encontrado.');
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', 'Elemento eliminado de la checklist', session);
    board.updatedAt = card.updatedAt;
    board.version = Number(board.version || 0) + 1;
    writeBoards(boards, { projectId, cardId, action: 'checklist:deleted' });
    return enrich(board).cards.find(entry => entry.id === cardId);
  },

  async resetBoard({ projectId, workspaceId, session }) {
    await wait(80);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    if (demoKanbanBoards[projectId]) boards[projectId] = clone(demoKanbanBoards[projectId]);
    else boards[projectId] = emptyBoard(projectId);
    writeBoards(boards, { projectId, action: 'board:reset' });
    return enrich(boards[projectId]);
  },

  subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },

  async startRealtime() {
    return () => {};
  }
};
