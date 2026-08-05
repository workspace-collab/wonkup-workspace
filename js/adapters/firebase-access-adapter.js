import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=9.0.1';
import { ROLE_LABELS } from '../utils/permissions.js?v=9.0.0';

function sessionExpiry() {
  return new Date(Date.now() + (8 * 60 * 60 * 1000)).toISOString();
}

function normalizeScope(value, fallback = []) {
  return Array.isArray(value) && value.length ? [...new Set(value)] : [...fallback];
}

async function getProfile(client, uid) {
  const snapshot = await client.sdk.firestore.getDoc(
    client.sdk.firestore.doc(client.db, 'users', uid)
  );
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function getWorkspaceContext(client, profile, uid) {
  const requestedIds = normalizeScope(profile.workspaceIds).filter(id => id !== '*');
  if (profile.role === 'superadmin') {
    const snapshot = await client.sdk.firestore.getDocs(
      client.sdk.firestore.collection(client.db, 'workspaces')
    );
    return {
      workspaces: snapshot.docs.map(item => ({ id: item.id, ...item.data() })),
      workspaceRoles: { ...(profile.workspaceRoles || {}) }
    };
  }

  const workspaces = [];
  const workspaceRoles = {};
  for (const workspaceId of requestedIds) {
    try {
      const [workspaceSnapshot, membershipSnapshot] = await Promise.all([
        client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId)),
        client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'members', uid))
      ]);
      if (!workspaceSnapshot.exists() || !membershipSnapshot.exists() || membershipSnapshot.data().status !== 'active') continue;
      workspaces.push({ id: workspaceSnapshot.id, ...workspaceSnapshot.data() });
      workspaceRoles[workspaceId] = membershipSnapshot.data().role || profile.workspaceRoles?.[workspaceId] || profile.role;
    } catch {
      // A stale scope must not block the rest of the valid session.
    }
  }
  return { workspaces, workspaceRoles };
}

async function createSession(user) {
  const client = await getFirebaseClient();
  const profile = await getProfile(client, user.uid);
  if (!profile) {
    throw new Error(`La cuenta existe en Authentication, pero falta el perfil users/${user.uid} en Firestore.`);
  }
  if (profile.status !== 'active') {
    throw new Error('Tu perfil de WonkUp está inactivo o pendiente de activación.');
  }

  const role = profile.role || 'collaborator';
  const workspaceContext = await getWorkspaceContext(client, profile, user.uid);
  const workspaces = workspaceContext.workspaces;
  const workspaceIds = role === 'superadmin'
    ? ['*']
    : workspaces.map(item => item.id);
  const projectIds = role === 'superadmin'
    ? ['*']
    : normalizeScope(profile.projectIds).filter(id => id !== '*');
  globalThis.__wonkupCloudWorkspaces = workspaces;

  return {
    token: `firebase:${user.uid}`,
    source: 'firebase',
    issuedAt: new Date().toISOString(),
    expiresAt: sessionExpiry(),
    firebaseUid: user.uid,
    role,
    roleLabel: profile.roleLabel || ROLE_LABELS[role] || role,
    user: {
      id: profile.personId || user.uid,
      authUid: user.uid,
      name: profile.name || user.displayName || user.email || 'Usuario WonkUp',
      email: profile.email || user.email || '',
      initials: profile.initials || String(profile.name || user.email || 'WU').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
      photoURL: profile.photoURL || user.photoURL || '',
      status: profile.status
    },
    scopes: {
      workspaceIds,
      projectIds
    },
    workspaceRoles: { ...(profile.workspaceRoles || {}), ...workspaceContext.workspaceRoles },
    projectRoles: { ...(profile.projectRoles || {}) },
    workspaces
  };
}

function friendlyError(error) {
  const code = String(error?.code || '');
  const messages = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/user-disabled': 'La cuenta fue desactivada.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos antes de volver a ingresar.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase.',
    'auth/api-key-not-valid': 'La aplicacion cargo una API key de Firebase invalida. Recarga la version 9.0.1.'
  };
  return new Error(messages[code] || error?.message || 'No se pudo iniciar sesión.');
}

export const FirebaseAccessAdapter = {
  async signIn(email, password) {
    try {
      const client = await getFirebaseClient();
      const credential = await client.sdk.auth.signInWithEmailAndPassword(
        client.auth,
        String(email || '').trim(),
        String(password || '')
      );
      return await createSession(credential.user);
    } catch (error) {
      try {
        const client = await getFirebaseClient();
        if (client.auth.currentUser) await client.sdk.auth.signOut(client.auth);
      } catch {
        // Ignore cleanup errors.
      }
      throw friendlyError(error);
    }
  },

  async validateSession(session) {
    if (!session?.firebaseUid || session.source !== 'firebase') return null;
    try {
      const user = await waitForFirebaseAuth();
      if (!user || user.uid !== session.firebaseUid) return null;
      return await createSession(user);
    } catch {
      return null;
    }
  },

  async revokeSession() {
    const client = await getFirebaseClient();
    await client.sdk.auth.signOut(client.auth);
    globalThis.__wonkupCloudWorkspaces = [];
    return { revoked: true };
  },

  async sendPasswordReset(email) {
    try {
      const client = await getFirebaseClient();
      await client.sdk.auth.sendPasswordResetEmail(client.auth, String(email || '').trim());
      return { sent: true };
    } catch (error) {
      throw friendlyError(error);
    }
  }
};
