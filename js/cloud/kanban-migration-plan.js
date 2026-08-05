import { demoKanbanBoards, defaultKanbanColumns } from '../../data/demo-kanban.js?v=11.0.1';
import { getKanbanTemplate } from '../../data/kanban-templates.js?v=11.0.1';
import { getLocalFoundationSnapshot } from './migration-plan.js?v=11.0.1';

const STORAGE_KEY = 'wonkup.e4.1.kanban';
const LEGACY_STORAGE_KEY = 'wonkup.e4.kanban';
const clone = value => JSON.parse(JSON.stringify(value));

function readLocalBoards() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = globalThis.localStorage?.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return JSON.parse(legacy);
  } catch {
    // The bundled demo board remains available as a safe fallback.
  }
  return clone(demoKanbanBoards);
}

function iso(value, fallback = new Date().toISOString()) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function normalizeColumns(board) {
  const template = getKanbanTemplate(board?.templateId || 'basic-4');
  const source = Array.isArray(board?.columns) && board.columns.length
    ? board.columns
    : (template?.columns || defaultKanbanColumns);
  return source.map((column, index) => ({
    id: String(column.id || `column-${index + 1}`),
    name: String(column.name || `Columna ${index + 1}`).trim(),
    order: Number(column.order || (index + 1) * 10),
    wipLimit: Math.max(0, Number(column.wipLimit || 0)),
    tone: String(column.tone || 'gray'),
    isDone: Boolean(column.isDone),
    active: column.active !== false && !column.archived,
    archived: Boolean(column.archived || column.active === false)
  }));
}

function normalizeCard(card, { workspaceId, projectId, index }) {
  const now = new Date().toISOString();
  const id = String(card?.id || `card-${projectId}-${index + 1}`);
  return {
    ...clone(card || {}),
    id,
    workspaceId,
    projectId,
    columnId: String(card?.columnId || 'backlog'),
    position: Number(card?.position || (index + 1) * 1000),
    title: String(card?.title || 'Tarjeta').trim() || 'Tarjeta',
    description: String(card?.description || ''),
    priority: ['high', 'medium', 'low'].includes(card?.priority) ? card.priority : 'medium',
    assigneeId: String(card?.assigneeId || ''),
    participantIds: [...new Set(Array.isArray(card?.participantIds) ? card.participantIds.map(String) : [])],
    labels: Array.isArray(card?.labels) ? clone(card.labels) : [],
    startDate: String(card?.startDate || ''),
    dueDate: String(card?.dueDate || ''),
    estimatedHours: Number(card?.estimatedHours || 0),
    actualHours: Number(card?.actualHours || 0),
    visibility: ['internal', 'client', 'restricted'].includes(card?.visibility) ? card.visibility : 'internal',
    dependencies: [...new Set(Array.isArray(card?.dependencies) ? card.dependencies.map(String) : [])],
    checklist: Array.isArray(card?.checklist) ? clone(card.checklist) : [],
    comments: Array.isArray(card?.comments) ? clone(card.comments) : [],
    history: Array.isArray(card?.history) ? clone(card.history).slice(0, 100) : [],
    archived: Boolean(card?.archived),
    columnBeforeArchive: String(card?.columnBeforeArchive || ''),
    positionBeforeArchive: Number(card?.positionBeforeArchive || 0),
    archivedAt: String(card?.archivedAt || ''),
    archivedBy: String(card?.archivedBy || ''),
    restoredAt: String(card?.restoredAt || ''),
    restoredBy: String(card?.restoredBy || ''),
    schemaVersion: 10,
    createdAt: iso(card?.createdAt, now),
    updatedAt: iso(card?.updatedAt, now)
  };
}

function normalizeBoard(board, project) {
  const now = new Date().toISOString();
  return {
    id: String(board?.id || `board-${project.id}`),
    workspaceId: project.workspaceId,
    projectId: project.id,
    name: String(board?.name || 'Tablero principal').trim() || 'Tablero principal',
    templateId: String(board?.templateId || 'basic-4'),
    columns: normalizeColumns(board),
    version: Math.max(1, Number(board?.version || 1)),
    schemaVersion: 10,
    createdAt: iso(board?.createdAt || board?.updatedAt, now),
    updatedAt: iso(board?.updatedAt, now)
  };
}

export function getLocalKanbanSnapshot() {
  const foundation = getLocalFoundationSnapshot();
  return {
    schemaVersion: 10,
    exportedAt: new Date().toISOString(),
    projects: clone(foundation.projects),
    workspaces: clone(foundation.workspaces),
    boards: readLocalBoards()
  };
}

export function buildKanbanMigrationPlan(snapshot = getLocalKanbanSnapshot(), options = {}) {
  const selectedWorkspaceIds = new Set(
    options.workspaceIds?.length
      ? options.workspaceIds
      : snapshot.workspaces.map(item => item.id)
  );
  const selectedProjectIds = new Set(options.projectIds || []);
  const projects = snapshot.projects.filter(project => (
    selectedWorkspaceIds.has(project.workspaceId)
      && (!selectedProjectIds.size || selectedProjectIds.has(project.id))
  ));

  const operations = [];
  const boardSummaries = [];
  projects.forEach(project => {
    const source = snapshot.boards?.[project.id];
    if (!source) return;
    const board = normalizeBoard(source, project);
    const cards = (source.cards || []).map((card, index) => normalizeCard(card, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      index
    }));
    operations.push({
      group: 'boards',
      path: `workspaces/${project.workspaceId}/projects/${project.id}/boards/main`,
      data: board
    });
    cards.forEach(card => operations.push({
      group: 'cards',
      path: `workspaces/${project.workspaceId}/projects/${project.id}/boards/main/cards/${card.id}`,
      data: card
    }));
    boardSummaries.push({
      workspaceId: project.workspaceId,
      projectId: project.id,
      projectName: project.name || project.id,
      boardId: board.id,
      cards: cards.length
    });
  });

  const paths = operations.map(item => item.path);
  const duplicates = [...new Set(paths.filter((path, index) => paths.indexOf(path) !== index))];
  return {
    schemaVersion: 10,
    selectedWorkspaceIds: [...selectedWorkspaceIds],
    selectedProjectIds: projects.map(item => item.id),
    projects: projects.map(item => ({ id: item.id, workspaceId: item.workspaceId, name: item.name || item.id })),
    boards: boardSummaries,
    operations,
    duplicates,
    counts: {
      boards: boardSummaries.length,
      cards: operations.filter(item => item.group === 'cards').length,
      projectsScanned: projects.length,
      total: operations.length
    }
  };
}
