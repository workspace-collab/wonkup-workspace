function unavailable() {
  throw new Error('Configura Firebase y Firebase Authentication antes de activar canvasMode: firebase.');
}

export const FirebaseCanvasAdapter = {
  listInstances: unavailable,
  getInstance: unavailable,
  createInstance: unavailable,
  updateInstance: unavailable,
  archiveInstance: unavailable,
  restoreInstance: unavailable,
  deleteInstance: unavailable,
  createNote: unavailable,
  updateNote: unavailable,
  moveNote: unavailable,
  deleteNote: unavailable,
  addComment: unavailable,
  linkNote: unavailable,
  createShareToken: unavailable,
  listShareTokens: unavailable,
  revokeShareToken: unavailable,
  listVersions: unavailable,
  createVersion: unavailable,
  restoreVersion: unavailable,
  getSharedInstance: unavailable,
  subscribe: () => () => {},
  startPresence: () => () => {},
  resetDemo: unavailable
};
