import { demoCanvasInstances } from '../../data/demo-canvases.js?v=12.5.0';
import { getLocalFoundationSnapshot } from './migration-plan.js?v=12.5.0';

const STORAGE_KEY = 'wonkup.e5.canvases';
const SCHEMA_VERSION = 12;
const clone = value => JSON.parse(JSON.stringify(value));

function safeId(value, fallback) {
  return String(value || fallback).trim().replace(/[\\/]/g, '-').slice(0, 180) || fallback;
}

function iso(value, fallback = new Date().toISOString()) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function readLocalCanvases() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // The bundled seed remains the safe fallback for preview and tests.
  }
  return clone(demoCanvasInstances);
}

function normalizeComment(comment, note, canvas, index) {
  const createdAt = iso(comment?.createdAt, note.createdAt);
  return {
    id: safeId(comment?.id, `comment-${note.id}-${index + 1}`),
    noteId: note.id,
    canvasId: canvas.id,
    authorId: String(comment?.authorId || comment?.actorId || canvas.createdBy || 'system'),
    authorUid: String(comment?.authorUid || ''),
    authorName: String(comment?.authorName || comment?.author?.name || 'Usuario WonkUp').slice(0, 160),
    text: String(comment?.text || '').trim().slice(0, 800) || 'Comentario migrado',
    createdAt,
    schemaVersion: SCHEMA_VERSION
  };
}

function normalizeNote(note, canvas, index) {
  const createdAt = iso(note?.createdAt, canvas.createdAt);
  const id = safeId(note?.id, `note-${canvas.id}-${index + 1}`);
  const normalized = {
    id,
    canvasId: canvas.id,
    workspaceId: canvas.workspaceId,
    projectId: canvas.projectId,
    sectionId: String(note?.sectionId || 'general').slice(0, 120),
    text: String(note?.text || '').trim().slice(0, 1200) || 'Nota migrada',
    colorId: String(note?.colorId || 'sky').slice(0, 40),
    colorHex: /^#[0-9a-f]{6}$/i.test(String(note?.colorHex || '')) ? String(note.colorHex).toLowerCase() : '',
    authorId: String(note?.authorId || canvas.createdBy || 'system'),
    authorUid: String(note?.authorUid || ''),
    authorName: String(note?.authorName || note?.author?.name || 'Usuario WonkUp').slice(0, 160),
    createdAt,
    updatedAt: iso(note?.updatedAt, createdAt),
    position: Number.isFinite(Number(note?.position)) ? Number(note.position) : (index + 1) * 1000,
    commentCount: Array.isArray(note?.comments) ? note.comments.length : 0,
    sourceCanvasId: String(note?.sourceCanvasId || ''),
    sourceNoteId: String(note?.sourceNoteId || ''),
    archived: Boolean(note?.archived),
    archivedAt: note?.archived ? iso(note?.archivedAt) : '',
    archivedBy: String(note?.archivedBy || ''),
    schemaVersion: SCHEMA_VERSION
  };
  return {
    note: normalized,
    comments: (Array.isArray(note?.comments) ? note.comments : [])
      .map((comment, commentIndex) => normalizeComment(comment, normalized, canvas, commentIndex))
  };
}

function normalizeHistory(entry, canvas, index) {
  return {
    id: safeId(entry?.id, `history-${canvas.id}-${index + 1}`),
    canvasId: canvas.id,
    workspaceId: canvas.workspaceId,
    projectId: canvas.projectId,
    type: String(entry?.type || 'migrated').slice(0, 80),
    title: String(entry?.title || 'Actividad migrada').slice(0, 180),
    actorId: String(entry?.actorId || canvas.createdBy || 'system'),
    actorUid: String(entry?.actorUid || ''),
    actorName: String(entry?.actorName || entry?.actor?.name || 'Usuario WonkUp').slice(0, 160),
    createdAt: iso(entry?.createdAt, canvas.updatedAt),
    meta: clone(entry?.meta && typeof entry.meta === 'object' ? entry.meta : {}),
    schemaVersion: SCHEMA_VERSION
  };
}

function snapshotNotes(sourceNotes, canvas) {
  return (Array.isArray(sourceNotes) ? sourceNotes : []).map((source, index) => {
    const { note, comments } = normalizeNote(source, canvas, index);
    return {
      id: note.id,
      sectionId: note.sectionId,
      text: note.text,
      colorId: note.colorId,
      colorHex: note.colorHex,
      authorId: note.authorId,
      authorUid: note.authorUid,
      authorName: note.authorName,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      position: note.position,
      sourceCanvasId: note.sourceCanvasId,
      sourceNoteId: note.sourceNoteId,
      comments
    };
  });
}

function normalizeVersion(snapshot, canvas, index) {
  const createdAt = iso(snapshot?.createdAt, canvas.updatedAt);
  return {
    id: safeId(snapshot?.id, `version-${canvas.id}-${index + 1}`),
    canvasId: canvas.id,
    workspaceId: canvas.workspaceId,
    projectId: canvas.projectId,
    version: Math.max(1, Number(snapshot?.version || index + 1)),
    label: String(snapshot?.label || `Punto de control ${index + 1}`).slice(0, 120),
    createdAt,
    createdBy: String(snapshot?.createdBy || canvas.createdBy || 'system'),
    createdByUid: String(snapshot?.createdByUid || ''),
    createdByName: String(snapshot?.createdByName || snapshot?.actor?.name || 'Usuario WonkUp').slice(0, 160),
    title: String(snapshot?.title || canvas.title).slice(0, 140),
    templateId: String(snapshot?.templateId || canvas.templateId),
    notes: snapshotNotes(snapshot?.notes || [], canvas),
    schemaVersion: SCHEMA_VERSION
  };
}

function normalizeShare(link, canvas, index) {
  const expiresAt = iso(link?.expiresAt, new Date(Date.now() + 7 * 86400000).toISOString());
  const code = safeId(link?.code, `SHARE${canvas.id}${index + 1}`).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 48);
  return {
    id: safeId(link?.id, `share-${canvas.id}-${index + 1}`),
    code: code.length >= 16 ? code : `${code}${'0'.repeat(16)}`.slice(0, 16),
    canvasId: canvas.id,
    workspaceId: canvas.workspaceId,
    projectId: canvas.projectId,
    label: String(link?.label || 'Enlace migrado').slice(0, 80),
    createdBy: String(link?.createdBy || canvas.createdBy || 'system'),
    createdByUid: String(link?.createdByUid || ''),
    createdByName: String(link?.createdByName || 'Usuario WonkUp').slice(0, 160),
    createdAt: iso(link?.createdAt, canvas.updatedAt),
    expiresAt,
    active: link?.active !== false && new Date(expiresAt).getTime() > Date.now(),
    revokedAt: link?.revokedAt ? iso(link.revokedAt) : '',
    revokedBy: String(link?.revokedBy || ''),
    revokedByUid: String(link?.revokedByUid || ''),
    schemaVersion: SCHEMA_VERSION
  };
}

function normalizeCanvas(source, index) {
  const createdAt = iso(source?.createdAt);
  const id = safeId(source?.id, `canvas-${index + 1}`);
  const notesWithComments = (Array.isArray(source?.notes) ? source.notes : [])
    .map((note, noteIndex) => normalizeNote(note, {
      id,
      workspaceId: String(source?.workspaceId || ''),
      projectId: String(source?.projectId || ''),
      createdBy: String(source?.createdBy || 'system'),
      createdAt,
      updatedAt: iso(source?.updatedAt, createdAt)
    }, noteIndex));
  const notes = notesWithComments.map(item => item.note);
  const canvas = {
    id,
    workspaceId: String(source?.workspaceId || ''),
    projectId: String(source?.projectId || ''),
    templateId: String(source?.templateId || 'empathy-map'),
    title: String(source?.title || 'Canvas').trim().slice(0, 140) || 'Canvas',
    status: source?.status === 'archived' ? 'archived' : 'active',
    createdBy: String(source?.createdBy || 'system'),
    createdByUid: String(source?.createdByUid || ''),
    createdAt,
    updatedAt: iso(source?.updatedAt, createdAt),
    updatedBy: String(source?.updatedBy || source?.createdByUid || ''),
    version: Math.max(1, Number(source?.version || 1)),
    noteCount: notes.filter(note => !note.archived).length,
    activeSectionCount: new Set(notes.filter(note => !note.archived).map(note => note.sectionId)).size,
    historyCount: Array.isArray(source?.history) ? source.history.length : 0,
    versionCount: Math.max(1, Array.isArray(source?.snapshots) ? source.snapshots.length : 0),
    shareCount: (Array.isArray(source?.shareTokens) ? source.shareTokens : []).filter(link => link?.active !== false).length,
    archivedAt: source?.status === 'archived' ? iso(source?.archivedAt, source?.updatedAt) : '',
    archivedBy: String(source?.archivedBy || ''),
    restoredAt: source?.restoredAt ? iso(source.restoredAt) : '',
    restoredBy: String(source?.restoredBy || ''),
    schemaVersion: SCHEMA_VERSION
  };
  const history = (Array.isArray(source?.history) ? source.history : [])
    .slice(0, 150)
    .map((entry, historyIndex) => normalizeHistory(entry, canvas, historyIndex));
  if (!history.length) history.push(normalizeHistory({ type: 'migrated', title: 'Canvas migrado a Firestore' }, canvas, 0));
  canvas.historyCount = history.length;
  const versions = (Array.isArray(source?.snapshots) && source.snapshots.length
    ? source.snapshots
    : [{
        id: `version-initial-${canvas.id}`,
        version: canvas.version,
        label: 'Versión inicial migrada',
        createdAt: canvas.updatedAt,
        createdBy: canvas.createdBy,
        title: canvas.title,
        templateId: canvas.templateId,
        notes: source?.notes || []
      }])
    .slice(0, 20)
    .map((version, versionIndex) => normalizeVersion(version, canvas, versionIndex));
  canvas.versionCount = versions.length;
  const shares = (Array.isArray(source?.shareTokens) ? source.shareTokens : [])
    .slice(0, 50)
    .map((link, shareIndex) => normalizeShare(link, canvas, shareIndex));
  canvas.shareCount = shares.filter(link => link.active).length;
  return {
    canvas,
    notesWithComments,
    history,
    versions,
    shares
  };
}

function sanitizedPublicShare(canvas, notes, share) {
  return {
    id: share.code,
    code: share.code,
    active: share.active,
    workspaceId: canvas.workspaceId,
    projectId: canvas.projectId,
    canvasId: canvas.id,
    title: canvas.title,
    templateId: canvas.templateId,
    version: canvas.version,
    noteCount: notes.filter(note => !note.archived).length,
    activeSectionCount: new Set(notes.filter(note => !note.archived).map(note => note.sectionId)).size,
    notes: notes.filter(note => !note.archived).map(note => ({
      id: note.id,
      sectionId: note.sectionId,
      text: note.text,
      colorId: note.colorId,
      colorHex: note.colorHex,
      position: note.position,
      sourceCanvasId: note.sourceCanvasId,
      sourceNoteId: note.sourceNoteId
    })),
    expiresAt: share.expiresAt,
    createdAt: share.createdAt,
    updatedAt: canvas.updatedAt,
    schemaVersion: SCHEMA_VERSION
  };
}

export function getLocalCanvasSnapshot() {
  const foundation = getLocalFoundationSnapshot();
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workspaces: clone(foundation.workspaces),
    projects: clone(foundation.projects),
    canvases: readLocalCanvases()
  };
}

export function buildCanvasMigrationPlan(snapshot = getLocalCanvasSnapshot(), options = {}) {
  const selectedWorkspaceIds = new Set(options.workspaceIds?.length
    ? options.workspaceIds
    : snapshot.workspaces.map(item => item.id));
  const selectedProjectIds = new Set(options.projectIds || []);
  const validProjects = new Set(snapshot.projects
    .filter(project => selectedWorkspaceIds.has(project.workspaceId))
    .filter(project => !selectedProjectIds.size || selectedProjectIds.has(project.id))
    .map(project => `${project.workspaceId}:${project.id}`));

  const operations = [];
  const canvases = [];
  (Array.isArray(snapshot.canvases) ? snapshot.canvases : []).forEach((source, index) => {
    if (!validProjects.has(`${source?.workspaceId}:${source?.projectId}`)) return;
    const normalized = normalizeCanvas(source, index);
    const { canvas, notesWithComments, history, versions, shares } = normalized;
    const base = `workspaces/${canvas.workspaceId}/projects/${canvas.projectId}/canvases/${canvas.id}`;
    operations.push({ group: 'canvases', path: base, data: canvas });
    notesWithComments.forEach(({ note, comments }) => {
      operations.push({ group: 'notes', path: `${base}/notes/${note.id}`, data: note });
      comments.forEach(comment => operations.push({
        group: 'comments',
        path: `${base}/notes/${note.id}/comments/${comment.id}`,
        data: comment
      }));
    });
    history.forEach(entry => operations.push({ group: 'history', path: `${base}/history/${entry.id}`, data: entry }));
    versions.forEach(version => operations.push({ group: 'versions', path: `${base}/versions/${version.id}`, data: version }));
    shares.forEach(share => {
      operations.push({ group: 'shareLinks', path: `${base}/shareLinks/${share.id}`, data: share });
      operations.push({
        group: 'publicShares',
        path: `canvasShares/${share.code}`,
        data: sanitizedPublicShare(canvas, notesWithComments.map(item => item.note), share)
      });
    });
    canvases.push({
      workspaceId: canvas.workspaceId,
      projectId: canvas.projectId,
      canvasId: canvas.id,
      title: canvas.title,
      notes: notesWithComments.length,
      comments: notesWithComments.reduce((sum, item) => sum + item.comments.length, 0),
      history: history.length,
      versions: versions.length,
      shares: shares.length
    });
  });

  const paths = operations.map(item => item.path);
  const duplicates = [...new Set(paths.filter((path, index) => paths.indexOf(path) !== index))];
  return {
    schemaVersion: SCHEMA_VERSION,
    selectedWorkspaceIds: [...selectedWorkspaceIds],
    selectedProjectIds: [...new Set(canvases.map(item => item.projectId))],
    canvases,
    operations,
    duplicates,
    counts: {
      canvases: operations.filter(item => item.group === 'canvases').length,
      notes: operations.filter(item => item.group === 'notes').length,
      comments: operations.filter(item => item.group === 'comments').length,
      history: operations.filter(item => item.group === 'history').length,
      versions: operations.filter(item => item.group === 'versions').length,
      shareLinks: operations.filter(item => item.group === 'shareLinks').length,
      publicShares: operations.filter(item => item.group === 'publicShares').length,
      total: operations.length
    }
  };
}
