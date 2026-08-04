const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.has(key) ? memory.get(key) : null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key)
};
globalThis.window = { addEventListener() {} };

const { MockDeliverableAdapter } = await import('../js/adapters/mock-deliverable-adapter.js');
const admin = {
  role: 'superadmin', user: { id: 'usr-test-admin', name: 'Admin Test' },
  scopes: { workspaceIds: ['*'], projectIds: ['*'] }
};
const client = {
  role: 'client', user: { id: 'usr-test-client', name: 'Cliente Test' },
  scopes: { workspaceIds: ['w-agora'], projectIds: ['p-taxichurro'] }
};

MockDeliverableAdapter.resetDemo();
const created = await MockDeliverableAdapter.createDeliverable({
  workspaceId: 'w-agora', projectId: 'p-taxichurro', session: admin,
  input: { title: 'Prueba Entrega 6', type: 'prototype', visibility: 'client', dueDate: '2026-08-30', checklist: ['Contenido listo'] }
});
if (!created.id || created.status !== 'draft') throw new Error('Create failed');

const versioned = await MockDeliverableAdapter.addVersion({
  deliverableId: created.id, session: admin,
  input: { fileName: 'Demo', fileType: 'Sitio web', url: 'https://example.com', notes: 'Versión de prueba' }
});
if (versioned.versions.length !== 1) throw new Error('Version failed');

const review = await MockDeliverableAdapter.requestReview({ deliverableId: created.id, session: admin });
if (review.status !== 'in_review') throw new Error('Review failed');

const approved = await MockDeliverableAdapter.approve({ deliverableId: created.id, session: client });
if (approved.status !== 'approved') throw new Error('Approve failed');

await MockDeliverableAdapter.addComment({ deliverableId: created.id, text: 'Comentario de control', session: client });
const commented = await MockDeliverableAdapter.getDeliverable({ deliverableId: created.id, session: admin });
if (!commented.comments.some(item => item.text === 'Comentario de control')) throw new Error('Comment failed');

await MockDeliverableAdapter.archiveDeliverable({ deliverableId: created.id, session: admin });
const archived = await MockDeliverableAdapter.getDeliverable({ deliverableId: created.id, session: admin });
if (!archived.archived) throw new Error('Archive failed');
await MockDeliverableAdapter.restoreDeliverable({ deliverableId: created.id, session: admin });
const restored = await MockDeliverableAdapter.getDeliverable({ deliverableId: created.id, session: admin });
if (restored.archived) throw new Error('Restore failed');

console.log(JSON.stringify({ created: true, version: true, review: true, approved: true, comment: true, archiveRestore: true }));
process.exit(0);
