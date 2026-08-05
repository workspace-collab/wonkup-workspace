import { demoKanbanBoards, defaultKanbanColumns } from '../../data/demo-kanban.js?v=11.0.0';
import { getKanbanTemplate } from '../../data/kanban-templates.js?v=11.0.0';
import { demoUsers } from '../../data/demo-users.js?v=11.0.0';
import {
  canAccessProject,
  canConfigureKanban,
  canDeleteKanbanCard,
  canEditKanban
} from '../utils/permissions.js?v=11.0.0';

const STORAGE_KEY = 'wonkup.e4.1.kanban';
const LEGACY_STORAGE_KEY = 'wonkup.e4.kanban';
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

function migrateBoard(board) {
  const migrated = clone(board);
  migrated.templateId ||= 'wonkup-9';
  migrated.columns = (migrated.columns || clone(defaultKanbanColumns)).map((column, index) => ({
    ...column,
    order: Number(column.order || (index + 1) * 10),
    wipLimit: Math.max(0, Number(column.wipLimit || 0)),
    tone: column.tone || 'gray',
    isDone: Boolean(column.isDone || column.id === 'done'),
    active: column.active !== false && !column.archived,
    archived: Boolean(column.archived || column.active === false)
  }));
  migrated.cards ||= [];
  migrated.cards = migrated.cards.map(card => ({
    ...card,
    archived: Boolean(card.archived),
    columnBeforeArchive: card.columnBeforeArchive || '',
    positionBeforeArchive: Number(card.positionBeforeArchive || 0),
    archivedAt: card.archivedAt || '',
    archivedBy: card.archivedBy || '',
    restoredAt: card.restoredAt || '',
    restoredBy: card.restoredBy || ''
  }));
  return migrated;
}

function readBoards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = Object.fromEntries(Object.entries(JSON.parse(legacy)).map(([key, board]) => [key, migrateBoard(board)]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // Use seeded data when storage is unavailable.
  }
  const seeded = Object.fromEntries(Object.entries(clone(demoKanbanBoards)).map(([key, board]) => [key, migrateBoard(board)]));
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
  if (![STORAGE_KEY, LEGACY_STORAGE_KEY].includes(event.key)) return;
  subscribers.forEach(listener => listener({ source: 'storage', at: new Date().toISOString() }));
});

function requireAccess(session, projectId, workspaceId) {
  if (!canAccessProject(session, projectId, workspaceId)) throw new Error('No tienes acceso a este tablero.');
}

function requireEdit(session, projectId, workspaceId) {
  requireAccess(session, projectId, workspaceId);
  if (!canEditKanban(session)) throw new Error('Tu rol no permite modificar el Kanban.');
}

function requireConfigure(session, projectId, workspaceId) {
  requireAccess(session, projectId, workspaceId);
  if (!canConfigureKanban(session)) throw new Error('Tu rol no permite configurar el tablero.');
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
    templateId: 'basic-4',
    version: 1,
    updatedAt: createdAt,
    columns: clone(getKanbanTemplate('basic-4').columns).map((column, index) => ({
      ...column,
      order: (index + 1) * 10,
      active: true,
      archived: false
    })),
    cards: []
  };
}

function ensureBoard(boards, projectId) {
  if (!boards[projectId]) boards[projectId] = emptyBoard(projectId);
  boards[projectId] = migrateBoard(boards[projectId]);
  boards[projectId].columns.sort((a, b) => a.order - b.order);
  return boards[projectId];
}

function activeColumns(board) {
  return board.columns.filter(column => column.active !== false && !column.archived).sort((a, b) => a.order - b.order);
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

function findCard(board, cardId, { includeArchived = false } = {}) {
  const card = board.cards.find(item => item.id === cardId && (includeArchived || !item.archived));
  if (!card) throw new Error('Tarjeta no encontrada.');
  return card;
}

function ensureWip(board, columnId, ignoreCardId = '') {
  const column = activeColumns(board).find(item => item.id === columnId);
  if (!column) throw new Error('La columna de destino no está disponible.');
  const count = board.cards.filter(card => !card.archived && card.id !== ignoreCardId && card.columnId === columnId).length;
  if (column.wipLimit > 0 && count >= column.wipLimit) {
    throw new Error(`La columna ${column.name} alcanzó su límite WIP de ${column.wipLimit}.`);
  }
  return column;
}

function usersById() {
  return Object.fromEntries(demoUsers.map(user => [user.id, user]));
}

function enrichCard(card, people) {
  return {
    ...clone(card),
    assignee: people[card.assigneeId] || null,
    participants: (card.participantIds || []).map(id => people[id]).filter(Boolean),
    comments: (card.comments || []).map(comment => ({ ...comment, author: people[comment.authorId] || null })),
    history: (card.history || []).map(item => ({ ...item, actor: people[item.actorId] || null }))
  };
}

function enrich(board) {
  const people = usersById();
  const columns = activeColumns(board);
  const archivedColumns = board.columns.filter(column => !columns.some(active => active.id === column.id));
  return {
    ...clone(board),
    columns: clone(columns),
    archivedColumns: clone(archivedColumns),
    cards: board.cards.filter(card => !card.archived).map(card => enrichCard(card, people)),
    archivedCards: board.cards.filter(card => card.archived).map(card => enrichCard(card, people))
  };
}

function touchBoard(board) {
  board.updatedAt = new Date().toISOString();
  board.version = Number(board.version || 0) + 1;
}

function normalizeColumnInput(columns, board) {
  if (!Array.isArray(columns)) throw new Error('La configuración de columnas no es válida.');
  const normalized = columns.map((column, index) => ({
    id: String(column.id || uid('column')).trim(),
    name: String(column.name || '').trim(),
    order: (index + 1) * 10,
    wipLimit: Math.max(0, Number(column.wipLimit || 0)),
    tone: String(column.tone || 'gray'),
    isDone: Boolean(column.isDone),
    active: column.active !== false,
    archived: column.active === false
  }));
  if (normalized.filter(column => column.active).length < 2) throw new Error('El tablero debe tener al menos dos columnas activas.');
  if (normalized.some(column => !column.name)) throw new Error('Todas las columnas deben tener un nombre.');
  if (new Set(normalized.map(column => column.id)).size !== normalized.length) throw new Error('Los identificadores de columna deben ser únicos.');
  if (!normalized.some(column => column.active && column.isDone)) throw new Error('Marca una columna activa como etapa final.');

  const activeIds = new Set(normalized.filter(column => column.active).map(column => column.id));
  const occupiedInactive = board.cards.find(card => !card.archived && !activeIds.has(card.columnId));
  if (occupiedInactive) throw new Error('No puedes desactivar una columna que todavía contiene tarjetas. Muévelas primero.');
  return normalized;
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
    const columnId = input.columnId || activeColumns(board)[0]?.id;
    ensureWip(board, columnId);
    const cardsInColumn = board.cards.filter(card => !card.archived && card.columnId === columnId);
    const now = new Date().toISOString();
    const card = {
      id: uid('card'), columnId, position: (cardsInColumn.length + 1) * 1000,
      title: String(input.title || '').trim(), description: String(input.description || '').trim(),
      priority: input.priority || 'medium', assigneeId: input.assigneeId || '',
      participantIds: [...new Set(input.participantIds || [])], labels: clone(input.labels || []),
      startDate: input.startDate || '', dueDate: input.dueDate || '',
      estimatedHours: Number(input.estimatedHours || 0), actualHours: Number(input.actualHours || 0),
      visibility: input.visibility || 'internal', dependencies: [...new Set(input.dependencies || [])],
      checklist: [], comments: [], history: [], archived: false,
      columnBeforeArchive: '', positionBeforeArchive: 0, archivedAt: '', archivedBy: '', restoredAt: '', restoredBy: '',
      createdAt: now, updatedAt: now
    };
    if (!card.title) throw new Error('Escribe un título para la tarjeta.');
    addHistory(card, 'created', 'Tarjeta creada', session);
    board.cards.push(card);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId: card.id, action: 'card:created' });
    return enrichCard(card, usersById());
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
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'card:updated' });
    return enrichCard(card, usersById());
  },

  async moveCard({ projectId, workspaceId, cardId, toColumnId, toIndex = 0, session }) {
    await wait(70);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const fromColumnId = card.columnId;
    const targetColumn = fromColumnId === toColumnId
      ? activeColumns(board).find(column => column.id === toColumnId)
      : ensureWip(board, toColumnId, cardId);
    if (!targetColumn) throw new Error('Columna de destino no encontrada.');
    const targetCards = board.cards
      .filter(item => !item.archived && item.id !== cardId && item.columnId === toColumnId)
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    const safeIndex = Math.max(0, Math.min(Number(toIndex || 0), targetCards.length));
    targetCards.splice(safeIndex, 0, card);
    card.columnId = toColumnId;
    targetCards.forEach((item, index) => { item.position = (index + 1) * 1000; });
    normalizePositions(board, fromColumnId);
    card.updatedAt = new Date().toISOString();
    if (fromColumnId !== toColumnId) addHistory(card, 'moved', `Movida a ${targetColumn.name}`, session, { fromColumnId, toColumnId });
    else addHistory(card, 'reordered', 'Orden actualizado', session, { columnId: toColumnId });
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'card:moved' });
    return enrich(board);
  },

  async archiveCard({ projectId, workspaceId, cardId, session }) {
    await wait(90);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const now = new Date().toISOString();
    card.columnBeforeArchive = card.columnId;
    card.positionBeforeArchive = Number(card.position || 0);
    card.archived = true;
    card.archivedAt = now;
    card.archivedBy = actor(session);
    card.restoredAt = '';
    card.restoredBy = '';
    card.updatedAt = now;
    addHistory(card, 'archived', 'Tarjeta archivada', session, { columnId: card.columnBeforeArchive });
    normalizePositions(board, card.columnId);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'card:archived' });
    return enrich(board);
  },

  async restoreCard({ projectId, workspaceId, cardId, columnId = '', session }) {
    await wait(100);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId, { includeArchived: true });
    if (!card.archived) throw new Error('La tarjeta no está archivada.');
    const available = activeColumns(board);
    const destinationId = columnId || (available.some(column => column.id === card.columnBeforeArchive) ? card.columnBeforeArchive : available[0]?.id);
    const destination = ensureWip(board, destinationId, cardId);
    const existing = board.cards.filter(item => !item.archived && item.columnId === destination.id);
    const now = new Date().toISOString();
    card.columnId = destination.id;
    card.position = (existing.length + 1) * 1000;
    card.archived = false;
    card.restoredAt = now;
    card.restoredBy = actor(session);
    card.updatedAt = now;
    addHistory(card, 'restored', `Tarjeta restaurada en ${destination.name}`, session);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'card:restored' });
    return enrich(board);
  },

  async deleteCard({ projectId, workspaceId, cardId, session }) {
    await wait(100);
    requireAccess(session, projectId, workspaceId);
    if (!canDeleteKanbanCard(session)) throw new Error('Solo un administrador puede eliminar tarjetas definitivamente.');
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const index = board.cards.findIndex(card => card.id === cardId && card.archived);
    if (index < 0) throw new Error('Solo se pueden eliminar definitivamente tarjetas archivadas.');
    board.cards.splice(index, 1);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'card:deleted' });
    return enrich(board);
  },

  async addComment({ projectId, workspaceId, cardId, text, session }) {
    await wait(80);
    requireEdit(session, projectId, workspaceId);
    const value = String(text || '').trim();
    if (!value) throw new Error('Escribe un comentario.');
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    card.comments ||= [];
    card.comments.push({ id: uid('comment'), authorId: actor(session), text: value, createdAt: new Date().toISOString() });
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'commented', 'Comentario agregado', session);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'comment:created' });
    return enrichCard(card, usersById());
  },

  async addChecklistItem({ projectId, workspaceId, cardId, text, session }) {
    await wait(75);
    requireEdit(session, projectId, workspaceId);
    const value = String(text || '').trim();
    if (!value) throw new Error('Escribe el elemento de la checklist.');
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    card.checklist ||= [];
    card.checklist.push({ id: uid('check'), text: value, completed: false });
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', 'Elemento agregado a la checklist', session);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'checklist:created' });
    return enrichCard(card, usersById());
  },

  async toggleChecklistItem({ projectId, workspaceId, cardId, itemId, completed, session }) {
    await wait(60);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const item = (card.checklist || []).find(entry => entry.id === itemId);
    if (!item) throw new Error('Elemento no encontrado.');
    item.completed = Boolean(completed);
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', item.completed ? 'Elemento de checklist completado' : 'Elemento de checklist reabierto', session);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'checklist:toggled' });
    return enrichCard(card, usersById());
  },

  async deleteChecklistItem({ projectId, workspaceId, cardId, itemId, session }) {
    await wait(60);
    requireEdit(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const card = findCard(board, cardId);
    const before = (card.checklist || []).length;
    card.checklist = (card.checklist || []).filter(entry => entry.id !== itemId);
    if (card.checklist.length === before) throw new Error('Elemento no encontrado.');
    card.updatedAt = new Date().toISOString();
    addHistory(card, 'checklist', 'Elemento eliminado de la checklist', session);
    touchBoard(board);
    writeBoards(boards, { projectId, cardId, action: 'checklist:deleted' });
    return enrichCard(card, usersById());
  },

  async updateBoardColumns({ projectId, workspaceId, columns, name = '', session }) {
    await wait(130);
    requireConfigure(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    board.columns = normalizeColumnInput(columns, board);
    board.name = String(name || board.name || 'Tablero principal').trim().slice(0, 100) || 'Tablero principal';
    board.templateId = 'custom';
    touchBoard(board);
    writeBoards(boards, { projectId, action: 'board:configured' });
    return enrich(board);
  },

  async applyTemplate({ projectId, workspaceId, templateId, session }) {
    await wait(140);
    requireConfigure(session, projectId, workspaceId);
    const boards = readBoards();
    const board = ensureBoard(boards, projectId);
    const template = getKanbanTemplate(templateId);
    const newColumns = clone(template.columns).map((column, index) => ({
      ...column,
      order: (index + 1) * 10,
      active: true,
      archived: false
    }));
    const validIds = new Set(newColumns.map(column => column.id));
    const fallbackId = newColumns[0].id;
    board.cards.filter(card => !card.archived).forEach(card => {
      if (!validIds.has(card.columnId)) {
        card.columnId = fallbackId;
        card.position = 999999;
        addHistory(card, 'moved', `Movida a ${newColumns[0].name} por cambio de plantilla`, session);
      }
    });
    board.columns = newColumns;
    board.templateId = template.id;
    newColumns.forEach(column => normalizePositions(board, column.id));
    touchBoard(board);
    writeBoards(boards, { projectId, action: 'board:template-applied', templateId });
    return enrich(board);
  },

  async resetBoard({ projectId, workspaceId, session }) {
    await wait(80);
    requireConfigure(session, projectId, workspaceId);
    const boards = readBoards();
    boards[projectId] = demoKanbanBoards[projectId] ? migrateBoard(clone(demoKanbanBoards[projectId])) : emptyBoard(projectId);
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
