import { API_CONFIG } from '../config/api-config.js?v=9.0.4';
import { MockCanvasAdapter } from '../adapters/mock-canvas-adapter.js?v=9.0.4';
import { FirebaseCanvasAdapter } from '../adapters/firebase-canvas-adapter.js?v=9.0.4';

function adapter() {
  return API_CONFIG.canvasMode === 'firebase' ? FirebaseCanvasAdapter : MockCanvasAdapter;
}

export const CanvasService = {
  mode: API_CONFIG.canvasMode,
  listInstances: options => adapter().listInstances(options),
  getInstance: options => adapter().getInstance(options),
  createInstance: options => adapter().createInstance(options),
  updateInstance: options => adapter().updateInstance(options),
  archiveInstance: options => adapter().archiveInstance(options),
  restoreInstance: options => adapter().restoreInstance(options),
  deleteInstance: options => adapter().deleteInstance(options),
  createNote: options => adapter().createNote(options),
  updateNote: options => adapter().updateNote(options),
  moveNote: options => adapter().moveNote(options),
  deleteNote: options => adapter().deleteNote(options),
  addComment: options => adapter().addComment(options),
  linkNote: options => adapter().linkNote(options),
  createShareToken: options => adapter().createShareToken(options),
  listShareTokens: options => adapter().listShareTokens(options),
  revokeShareToken: options => adapter().revokeShareToken(options),
  getSharedInstance: options => adapter().getSharedInstance(options),
  listVersions: options => adapter().listVersions(options),
  createVersion: options => adapter().createVersion(options),
  restoreVersion: options => adapter().restoreVersion(options),
  subscribe: listener => adapter().subscribe(listener),
  startPresence: options => adapter().startPresence(options),
  resetDemo: options => adapter().resetDemo(options)
};
