import { API_CONFIG } from '../config/api-config.js?v=12.0.0';
import { MockKanbanAdapter } from '../adapters/mock-kanban-adapter.js?v=12.0.0';
import { FirebaseKanbanAdapter } from '../adapters/firebase-kanban-adapter.js?v=12.0.0';

export function kanbanDataSourceForSession(session) {
  if (API_CONFIG.kanbanMode === 'firebase') return 'firebase';
  if (API_CONFIG.kanbanMode === 'hybrid') return session?.source === 'firebase' ? 'firebase' : 'mock';
  return 'mock';
}

function adapter(options = {}) {
  return kanbanDataSourceForSession(options?.session) === 'firebase'
    ? FirebaseKanbanAdapter
    : MockKanbanAdapter;
}

export const KanbanService = {
  mode: API_CONFIG.kanbanMode,
  dataSource: options => kanbanDataSourceForSession(options?.session),
  getBoard: options => adapter(options).getBoard(options),
  createCard: options => adapter(options).createCard(options),
  updateCard: options => adapter(options).updateCard(options),
  moveCard: options => adapter(options).moveCard(options),
  archiveCard: options => adapter(options).archiveCard(options),
  restoreCard: options => adapter(options).restoreCard(options),
  deleteCard: options => adapter(options).deleteCard(options),
  addComment: options => adapter(options).addComment(options),
  addChecklistItem: options => adapter(options).addChecklistItem(options),
  toggleChecklistItem: options => adapter(options).toggleChecklistItem(options),
  deleteChecklistItem: options => adapter(options).deleteChecklistItem(options),
  updateBoardColumns: options => adapter(options).updateBoardColumns(options),
  applyTemplate: options => adapter(options).applyTemplate(options),
  resetBoard: options => adapter(options).resetBoard(options),
  subscribe(listener) {
    const stopMock = MockKanbanAdapter.subscribe(listener);
    const stopFirebase = FirebaseKanbanAdapter.subscribe(listener);
    return () => {
      stopMock?.();
      stopFirebase?.();
    };
  },
  startRealtime: options => adapter(options).startRealtime?.(options) || Promise.resolve(() => {})
};
