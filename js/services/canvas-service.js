import { API_CONFIG } from '../config/api-config.js?v=12.0.0';
import { MockCanvasAdapter } from '../adapters/mock-canvas-adapter.js?v=12.0.0';
import { FirebaseCanvasAdapter } from '../adapters/firebase-canvas-adapter.js?v=12.0.0';

export function canvasDataSourceForSession(session) {
  if (API_CONFIG.canvasMode === 'firebase') return 'firebase';
  if (API_CONFIG.canvasMode === 'hybrid') return session?.source === 'firebase' ? 'firebase' : 'mock';
  return 'mock';
}

function adapter(options = {}) {
  return canvasDataSourceForSession(options?.session) === 'firebase'
    ? FirebaseCanvasAdapter
    : MockCanvasAdapter;
}

export const CanvasService = {
  mode: API_CONFIG.canvasMode,
  dataSource: options => canvasDataSourceForSession(options?.session),
  listInstances: options => adapter(options).listInstances(options),
  getInstance: options => adapter(options).getInstance(options),
  createInstance: options => adapter(options).createInstance(options),
  updateInstance: options => adapter(options).updateInstance(options),
  archiveInstance: options => adapter(options).archiveInstance(options),
  restoreInstance: options => adapter(options).restoreInstance(options),
  deleteInstance: options => adapter(options).deleteInstance(options),
  createNote: options => adapter(options).createNote(options),
  updateNote: options => adapter(options).updateNote(options),
  moveNote: options => adapter(options).moveNote(options),
  deleteNote: options => adapter(options).deleteNote(options),
  addComment: options => adapter(options).addComment(options),
  linkNote: options => adapter(options).linkNote(options),
  createShareToken: options => adapter(options).createShareToken(options),
  listShareTokens: options => adapter(options).listShareTokens(options),
  revokeShareToken: options => adapter(options).revokeShareToken(options),
  async getSharedInstance(options) {
    if (API_CONFIG.canvasMode === 'mock') return MockCanvasAdapter.getSharedInstance(options);
    try {
      return await FirebaseCanvasAdapter.getSharedInstance(options);
    } catch (cloudError) {
      try {
        return await MockCanvasAdapter.getSharedInstance(options);
      } catch {
        throw cloudError;
      }
    }
  },
  listVersions: options => adapter(options).listVersions(options),
  createVersion: options => adapter(options).createVersion(options),
  restoreVersion: options => adapter(options).restoreVersion(options),
  subscribe(listener) {
    const stopMock = MockCanvasAdapter.subscribe(listener);
    const stopFirebase = FirebaseCanvasAdapter.subscribe(listener);
    return () => { stopMock?.(); stopFirebase?.(); };
  },
  startRealtime: options => adapter(options).startRealtime?.(options) || Promise.resolve(() => {}),
  startPresence: options => adapter(options).startPresence(options),
  resetDemo: options => MockCanvasAdapter.resetDemo(options)
};
