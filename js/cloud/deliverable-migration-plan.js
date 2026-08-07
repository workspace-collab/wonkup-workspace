import { demoDeliverables } from '../../data/demo-deliverables.js?v=12.5.0';
import { getLocalFoundationSnapshot } from './migration-plan.js?v=12.5.0';

const STORAGE_KEY = 'wonkup.e6.deliverables';
const clone = value => JSON.parse(JSON.stringify(value));

function readLocalDeliverables() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // El conjunto demo permanece como respaldo seguro.
  }
  return clone(demoDeliverables);
}

function iso(value, fallback = new Date().toISOString()) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function normalizeChecklist(checklist = []) {
  return (Array.isArray(checklist) ? checklist : []).map((item, index) => ({
    id: String(item?.id || `dchk-${index + 1}`),
    label: String(item?.label || '').trim().slice(0, 180),
    done: Boolean(item?.done)
  })).filter(item => item.label);
}

function normalizeDeliverable(item, index) {
  const now = new Date().toISOString();
  const id = String(item?.id || `deliverable-${item?.projectId || 'project'}-${index + 1}`);
  return {
    ...clone(item || {}),
    id,
    workspaceId: String(item?.workspaceId || ''),
    projectId: String(item?.projectId || ''),
    title: String(item?.title || 'Entregable').trim() || 'Entregable',
    type: String(item?.type || 'document'),
    description: String(item?.description || ''),
    status: ['draft', 'in_review', 'changes_requested', 'approved'].includes(item?.status) ? item.status : 'draft',
    visibility: item?.visibility === 'internal' ? 'internal' : 'client',
    priority: String(item?.priority || 'medium'),
    dueDate: String(item?.dueDate || ''),
    ownerId: String(item?.ownerId || ''),
    ownerName: String(item?.ownerName || 'Responsable'),
    archived: Boolean(item?.archived),
    checklist: normalizeChecklist(item?.checklist),
    versions: Array.isArray(item?.versions) ? clone(item.versions).slice(0, 40) : [],
    comments: Array.isArray(item?.comments) ? clone(item.comments).slice(-200) : [],
    history: Array.isArray(item?.history) ? clone(item.history).slice(0, 200) : [],
    schemaVersion: 11,
    createdAt: iso(item?.createdAt, now),
    updatedAt: iso(item?.updatedAt, now)
  };
}

export function getLocalDeliverableSnapshot() {
  const foundation = getLocalFoundationSnapshot();
  return {
    schemaVersion: 11,
    exportedAt: new Date().toISOString(),
    workspaces: clone(foundation.workspaces),
    projects: clone(foundation.projects),
    deliverables: readLocalDeliverables()
  };
}

export function buildDeliverableMigrationPlan(snapshot = getLocalDeliverableSnapshot(), options = {}) {
  const selectedWorkspaceIds = new Set(
    options.workspaceIds?.length
      ? options.workspaceIds
      : snapshot.workspaces.map(item => item.id)
  );
  const selectedProjectIds = new Set(options.projectIds || []);
  const validProjectIds = new Set(snapshot.projects
    .filter(project => selectedWorkspaceIds.has(project.workspaceId))
    .filter(project => !selectedProjectIds.size || selectedProjectIds.has(project.id))
    .map(project => project.id));

  const deliverables = snapshot.deliverables
    .filter(item => selectedWorkspaceIds.has(item.workspaceId))
    .filter(item => validProjectIds.has(item.projectId))
    .map(normalizeDeliverable);

  const operations = deliverables.map(item => ({
    group: 'deliverables',
    path: `workspaces/${item.workspaceId}/projects/${item.projectId}/deliverables/${item.id}`,
    data: item
  }));
  const paths = operations.map(item => item.path);
  const duplicates = [...new Set(paths.filter((path, index) => paths.indexOf(path) !== index))];
  const projectIds = [...new Set(deliverables.map(item => item.projectId))];

  return {
    schemaVersion: 11,
    selectedWorkspaceIds: [...selectedWorkspaceIds],
    selectedProjectIds: projectIds,
    deliverables,
    operations,
    duplicates,
    counts: {
      projects: projectIds.length,
      deliverables: deliverables.length,
      versions: deliverables.reduce((sum, item) => sum + item.versions.length, 0),
      comments: deliverables.reduce((sum, item) => sum + item.comments.length, 0),
      total: operations.length
    }
  };
}
