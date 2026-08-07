import { API_CONFIG } from '../config/api-config.js?v=12.3.0';
import { MockDeliverableAdapter } from '../adapters/mock-deliverable-adapter.js?v=12.3.0';
import { FirebaseDeliverableAdapter } from '../adapters/firebase-deliverable-adapter.js?v=12.3.0';

export function deliverableDataSourceForSession(session) {
  if (API_CONFIG.deliverableMode === 'firebase') return 'firebase';
  if (API_CONFIG.deliverableMode === 'hybrid') return session?.source === 'firebase' ? 'firebase' : 'mock';
  return 'mock';
}

function adapter(options = {}) {
  return deliverableDataSourceForSession(options?.session) === 'firebase'
    ? FirebaseDeliverableAdapter
    : MockDeliverableAdapter;
}

export const DeliverableService = {
  mode: API_CONFIG.deliverableMode || 'mock',
  dataSource: options => deliverableDataSourceForSession(options?.session),
  listDeliverables: options => adapter(options).listDeliverables(options),
  getDeliverable: options => adapter(options).getDeliverable(options),
  createDeliverable: options => adapter(options).createDeliverable(options),
  updateDeliverable: options => adapter(options).updateDeliverable(options),
  addVersion: options => adapter(options).addVersion(options),
  requestReview: options => adapter(options).requestReview(options),
  approve: options => adapter(options).approve(options),
  requestChanges: options => adapter(options).requestChanges(options),
  addComment: options => adapter(options).addComment(options),
  toggleChecklist: options => adapter(options).toggleChecklist(options),
  archiveDeliverable: options => adapter(options).archiveDeliverable(options),
  restoreDeliverable: options => adapter(options).restoreDeliverable(options),
  subscribe(listener) {
    const stopMock = MockDeliverableAdapter.subscribe(listener);
    const stopFirebase = FirebaseDeliverableAdapter.subscribe(listener);
    return () => { stopMock?.(); stopFirebase?.(); };
  },
  startRealtime: options => adapter(options).startRealtime?.(options) || Promise.resolve(() => {}),
  resetDemo: () => MockDeliverableAdapter.resetDemo()
};
