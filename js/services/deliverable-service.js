import { API_CONFIG } from '../config/api-config.js?v=9.0.0';
import { MockDeliverableAdapter } from '../adapters/mock-deliverable-adapter.js?v=9.0.0';

function adapter() {
  // Apps Script/Firebase adapters will follow the same contract in a later integration phase.
  return MockDeliverableAdapter;
}

export const DeliverableService = {
  mode: API_CONFIG.deliverableMode || 'mock',
  listDeliverables: options => adapter().listDeliverables(options),
  getDeliverable: options => adapter().getDeliverable(options),
  createDeliverable: options => adapter().createDeliverable(options),
  updateDeliverable: options => adapter().updateDeliverable(options),
  addVersion: options => adapter().addVersion(options),
  requestReview: options => adapter().requestReview(options),
  approve: options => adapter().approve(options),
  requestChanges: options => adapter().requestChanges(options),
  addComment: options => adapter().addComment(options),
  toggleChecklist: options => adapter().toggleChecklist(options),
  archiveDeliverable: options => adapter().archiveDeliverable(options),
  restoreDeliverable: options => adapter().restoreDeliverable(options),
  subscribe: listener => adapter().subscribe(listener),
  resetDemo: () => adapter().resetDemo()
};
