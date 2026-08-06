import { demoNotifications } from '../../data/demo-notifications.js?v=12.0.1';
import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=12.0.1';
import { canAccessProject, canAccessWorkspace, canViewMaster, isReadOnlyRole } from '../utils/permissions.js?v=12.0.1';

const STORAGE_PREFIX = 'wonkup.notifications.read.';
const cloudCache = new Map();
const listeners = new Set();
let stopCloudRealtime = null;
let activeCloudUid = '';

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

function emit(session) {
  listeners.forEach(listener => listener(NotificationService.list(session)));
}

function normalizeCloud(snapshot) {
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function cloudContext(session) {
  if (session?.source !== 'firebase') return null;
  const client = await getFirebaseClient();
  const user = client.auth.currentUser || await waitForFirebaseAuth();
  if (!user || user.uid !== session.firebaseUid) return null;
  return { client, user };
}

export const NotificationService = {
  list(session) {
    if (session?.source === 'firebase') {
      return (cloudCache.get(session.firebaseUid) || []).map(item => ({ ...item, read: Boolean(item.read) }));
    }
    const read = readIds(session);
    return demoNotifications
      .filter(item => visible(item, session))
      .map(item => ({ ...item, read: read.has(item.id) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  unreadCount(session) {
    return this.list(session).filter(item => !item.read).length;
  },

  async hydrate(session) {
    const context = await cloudContext(session);
    if (!context) return this.list(session);
    const { client, user } = context;
    const { collection, query, orderBy, limit, getDocs } = client.sdk.firestore;
    const reference = collection(client.db, 'users', user.uid, 'notifications');
    const snapshot = await getDocs(query(reference, orderBy('createdAt', 'desc'), limit(40)));
    cloudCache.set(user.uid, normalizeCloud(snapshot));
    emit(session);
    return this.list(session);
  },

  async startRealtime(session) {
    const context = await cloudContext(session);
    if (!context) return () => {};
    const { client, user } = context;
    if (activeCloudUid === user.uid && stopCloudRealtime) return stopCloudRealtime;
    stopCloudRealtime?.();
    activeCloudUid = user.uid;
    const { collection, query, orderBy, limit, onSnapshot } = client.sdk.firestore;
    const reference = collection(client.db, 'users', user.uid, 'notifications');
    stopCloudRealtime = onSnapshot(
      query(reference, orderBy('createdAt', 'desc'), limit(40)),
      snapshot => {
        cloudCache.set(user.uid, normalizeCloud(snapshot));
        emit(session);
      },
      () => {}
    );
    return stopCloudRealtime;
  },

  stopRealtime() {
    stopCloudRealtime?.();
    stopCloudRealtime = null;
    activeCloudUid = '';
  },

  async markRead(notificationId, session) {
    if (session?.source === 'firebase') {
      const context = await cloudContext(session);
      if (!context) return;
      const list = cloudCache.get(session.firebaseUid) || [];
      cloudCache.set(session.firebaseUid, list.map(item => item.id === notificationId ? { ...item, read: true, readAt: new Date().toISOString() } : item));
      emit(session);
      const { client, user } = context;
      await client.sdk.firestore.updateDoc(
        client.sdk.firestore.doc(client.db, 'users', user.uid, 'notifications', notificationId),
        { read: true, readAt: new Date().toISOString() }
      );
      return;
    }
    const read = readIds(session);
    read.add(notificationId);
    writeIds(session, read);
  },

  async markAllRead(session) {
    if (session?.source === 'firebase') {
      const context = await cloudContext(session);
      if (!context) return;
      const unread = (cloudCache.get(session.firebaseUid) || []).filter(item => !item.read);
      cloudCache.set(session.firebaseUid, (cloudCache.get(session.firebaseUid) || []).map(item => ({ ...item, read: true, readAt: new Date().toISOString() })));
      emit(session);
      const { client, user } = context;
      for (let index = 0; index < unread.length; index += 20) {
        const batch = client.sdk.firestore.writeBatch(client.db);
        unread.slice(index, index + 20).forEach(item => batch.update(
          client.sdk.firestore.doc(client.db, 'users', user.uid, 'notifications', item.id),
          { read: true, readAt: new Date().toISOString() }
        ));
        await batch.commit();
      }
      return;
    }
    const read = readIds(session);
    this.list(session).forEach(item => read.add(item.id));
    writeIds(session, read);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
