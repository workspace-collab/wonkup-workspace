import { demoNotifications } from '../../data/demo-notifications.js';
import { canAccessProject, canAccessWorkspace, canViewMaster, isReadOnlyRole } from '../utils/permissions.js';

const STORAGE_PREFIX = 'wonkup.notifications.read.';

function readIds(session) {
  try {
    return new Set(JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${session?.user?.id || 'anonymous'}`) || '[]'));
  } catch {
    return new Set();
  }
}

function writeIds(session, ids) {
  localStorage.setItem(`${STORAGE_PREFIX}${session?.user?.id || 'anonymous'}`, JSON.stringify([...ids]));
}

function visible(notification, session) {
  if (isReadOnlyRole(session) && notification.visibility !== 'client') return false;
  if (canViewMaster(session)) return true;
  if (notification.projectId) return canAccessProject(session, notification.projectId, notification.workspaceId);
  return canAccessWorkspace(session, notification.workspaceId);
}

export const NotificationService = {
  list(session) {
    const read = readIds(session);
    return demoNotifications
      .filter(item => visible(item, session))
      .map(item => ({ ...item, read: read.has(item.id) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  unreadCount(session) {
    return this.list(session).filter(item => !item.read).length;
  },

  markRead(notificationId, session) {
    const read = readIds(session);
    read.add(notificationId);
    writeIds(session, read);
  },

  markAllRead(session) {
    const read = readIds(session);
    this.list(session).forEach(item => read.add(item.id));
    writeIds(session, read);
  }
};
