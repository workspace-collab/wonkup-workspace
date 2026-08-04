import { API_CONFIG } from '../config/api-config.js';
import { MockKanbanAdapter } from '../adapters/mock-kanban-adapter.js';
import { FirebaseKanbanAdapter } from '../adapters/firebase-kanban-adapter.js';

function adapter() {
  return API_CONFIG.kanbanMode === 'firebase' ? FirebaseKanbanAdapter : MockKanbanAdapter;
}

export const KanbanService = {
  mode: API_CONFIG.kanbanMode,
  getBoard: options => adapter().getBoard(options),
  createCard: options => adapter().createCard(options),
  updateCard: options => adapter().updateCard(options),
  moveCard: options => adapter().moveCard(options),
  archiveCard: options => adapter().archiveCard(options),
  addComment: options => adapter().addComment(options),
  addChecklistItem: options => adapter().addChecklistItem(options),
  toggleChecklistItem: options => adapter().toggleChecklistItem(options),
  deleteChecklistItem: options => adapter().deleteChecklistItem(options),
  resetBoard: options => adapter().resetBoard(options),
  subscribe: listener => adapter().subscribe(listener),
  startRealtime: options => adapter().startRealtime ? adapter().startRealtime(options) : Promise.resolve(() => {})
};
