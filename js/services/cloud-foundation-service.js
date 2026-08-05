import { API_CONFIG, firebaseConfigStatus } from '../config/api-config.js?v=9.0.0';
import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=9.0.1';
import { getFirebaseSdkUrls } from '../cloud/firebase-sdk-loader.js?v=9.0.0';
import { buildFoundationMigrationPlan, getLocalFoundationSnapshot } from '../cloud/migration-plan.js?v=9.0.0';
import { buildUserActivationPlan } from '../cloud/user-activation-plan.js?v=9.0.0';

const clone = value => JSON.parse(JSON.stringify(value));

function messageFromFirebaseError(error) {
  const code = String(error?.code || '');
  const messages = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/too-many-requests': 'Firebase bloqueó temporalmente los intentos. Espera unos minutos.',
    'auth/user-disabled': 'La cuenta fue desactivada.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa internet y dominios autorizados.',
    'permission-denied': 'Las reglas de Firestore rechazaron la operación.',
    'unavailable': 'Firestore no está disponible temporalmente.'
  };
  return messages[code] || error?.message || 'No se pudo completar la operación en Firebase.';
}

async function readCurrentProfile() {
  const { auth, db, sdk } = await getFirebaseClient();
  const user = auth.currentUser || await waitForFirebaseAuth();
  if (!user) return { user: null, profile: null };
  const reference = sdk.firestore.doc(db, 'users', user.uid);
  const snapshot = await sdk.firestore.getDoc(reference);
  return {
    user,
    profile: snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  };
}

async function commitInChunks(client, operations, metadata = {}) {
  const chunkSize = 400;
  let committed = 0;
  for (let index = 0; index < operations.length; index += chunkSize) {
    const chunk = operations.slice(index, index + chunkSize);
    const batch = client.sdk.firestore.writeBatch(client.db);
    chunk.forEach(operation => {
      batch.set(
        client.sdk.firestore.doc(client.db, ...operation.path.split('/')),
        { ...operation.data, ...metadata },
        { merge: true }
      );
    });
    await batch.commit();
    committed += chunk.length;
  }
  return committed;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const CloudFoundationService = {
  getConfiguration() {
    return {
      ...firebaseConfigStatus(),
      authMode: API_CONFIG.authMode,
      projectMode: API_CONFIG.projectMode,
      foundationMode: API_CONFIG.foundationMode,
      sdkVersion: API_CONFIG.firebaseSdkVersion,
      appCheckEnabled: API_CONFIG.firebase.enableAppCheck,
      persistentCacheEnabled: API_CONFIG.firebase.enablePersistentCache,
      urls: getFirebaseSdkUrls()
    };
  },

  getBootstrapProfileTemplate({ uid = 'PEGA_AQUI_EL_UID', email = 'admin@wonkup.pe', name = 'Administrador WonkUp' } = {}) {
    return {
      documentPath: `users/${uid}`,
      data: {
        uid,
        name,
        email,
        initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
        role: 'superadmin',
        roleLabel: 'Superadministrador',
        status: 'active',
        workspaceIds: ['*'],
        projectIds: ['*'],
        workspaceRoles: {},
        projectRoles: {},
        schemaVersion: 9,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  },

  getRuntimeSnippet() {
    return `authMode: 'hybrid',\nprojectMode: 'hybrid',\nfoundationMode: 'connected',\nfirebase: {\n  apiKey: '...',\n  authDomain: 'TU_PROYECTO.firebaseapp.com',\n  projectId: 'TU_PROYECTO',\n  storageBucket: 'TU_PROYECTO.firebasestorage.app',\n  messagingSenderId: '...',\n  appId: '...',\n  databaseURL: '',\n  appCheckSiteKey: '',\n  enableAppCheck: false,\n  enablePersistentCache: false\n}`;
  },

  getMigrationPreview(options = {}) {
    return buildFoundationMigrationPlan(getLocalFoundationSnapshot(), options);
  },

  getActivationDirectory() {
    const snapshot = getLocalFoundationSnapshot();
    return {
      workspaces: clone(snapshot.workspaces),
      projects: clone(snapshot.projects),
      people: clone(snapshot.people)
    };
  },

  getUserActivationPreview(input = {}) {
    return buildUserActivationPlan(getLocalFoundationSnapshot(), input);
  },

  async activateUser(input = {}) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión con el superadministrador de Firebase.');
      if (account.profile.status !== 'active' || account.profile.role !== 'superadmin') {
        throw new Error('Solo un perfil superadmin activo puede habilitar usuarios.');
      }
      const plan = this.getUserActivationPreview(input);
      if (plan.duplicates.length) throw new Error('El plan de activación contiene rutas duplicadas.');
      const activationId = `activation-${Date.now()}`;
      const metadata = {
        activatedAt: new Date().toISOString(),
        activatedBy: account.uid,
        activationId
      };
      const committed = await commitInChunks(client, plan.operations, metadata);
      await client.sdk.firestore.setDoc(
        client.sdk.firestore.doc(client.db, 'system', 'schema', 'userActivations', activationId),
        {
          id: activationId,
          uid: plan.input.uid,
          email: plan.input.email,
          role: plan.input.role,
          workspaceIds: plan.input.workspaceIds,
          projectIds: plan.input.projectIds,
          counts: plan.counts,
          executedAt: client.sdk.firestore.serverTimestamp(),
          executedBy: account.uid,
          source: 'github-pages-browser'
        }
      );
      return { ok: true, activationId, committed: committed + 1, plan: clone(plan) };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  exportLocalBackup() {
    const snapshot = getLocalFoundationSnapshot();
    downloadJson(`wonkup-backup-cloud-foundation-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
    return snapshot;
  },

  async signIn(email, password) {
    try {
      const { auth, sdk } = await getFirebaseClient();
      const credential = await sdk.auth.signInWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
      const profile = await readCurrentProfile();
      return {
        uid: credential.user.uid,
        email: credential.user.email || '',
        displayName: credential.user.displayName || '',
        profile: profile.profile
      };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async signOut() {
    try {
      const { auth, sdk } = await getFirebaseClient();
      await sdk.auth.signOut(auth);
      return { signedOut: true };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async getAccount() {
    try {
      const result = await readCurrentProfile();
      if (!result.user) return null;
      return {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        profile: result.profile
      };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async runDiagnostics() {
    const startedAt = Date.now();
    const configuration = this.getConfiguration();
    const checks = [];
    const push = (id, label, status, detail) => checks.push({ id, label, status, detail });

    if (!configuration.configured) {
      push('config', 'Configuración pública', 'error', `Faltan: ${configuration.missing.join(', ')}.`);
      return { ok: false, checks, durationMs: Date.now() - startedAt, account: null };
    }
    push('config', 'Configuración pública', 'ok', `Proyecto ${configuration.projectId}.`);

    try {
      const client = await getFirebaseClient();
      push('sdk', 'Firebase Web SDK', 'ok', `SDK ${configuration.sdkVersion} cargado mediante módulos del navegador.`);
      push('app', 'Aplicación Firebase', 'ok', `App ${client.app.name} inicializada.`);
      push('cache', 'Caché local', 'ok', client.persistentCache ? 'IndexedDB multiventana activado.' : 'Caché en memoria; recomendado para información sensible.');
      push('appCheck', 'App Check', configuration.appCheckEnabled ? 'ok' : 'warning', configuration.appCheckEnabled ? 'Inicializado con reCAPTCHA Enterprise.' : 'Preparado, pero aún no activado.');

      const account = await this.getAccount();
      if (!account) {
        push('auth', 'Firebase Authentication', 'warning', 'Conexión disponible, pero no hay una cuenta autenticada.');
        push('firestore', 'Cloud Firestore', 'pending', 'Inicia sesión para probar reglas y lecturas.');
        return { ok: true, checks, durationMs: Date.now() - startedAt, account: null };
      }

      push('auth', 'Firebase Authentication', 'ok', `${account.email || account.uid} autenticado.`);
      if (!account.profile) {
        push('profile', 'Perfil de acceso', 'error', `No existe users/${account.uid}.`);
        return { ok: false, checks, durationMs: Date.now() - startedAt, account };
      }
      push('profile', 'Perfil de acceso', 'ok', `Rol ${account.profile.role || 'sin definir'} y estado ${account.profile.status || 'sin definir'}.`);

      const { db, sdk } = client;
      try {
        const schema = await sdk.firestore.getDoc(sdk.firestore.doc(db, 'system', 'schema'));
        push('firestore', 'Cloud Firestore', 'ok', schema.exists() ? `Esquema ${schema.data().version || 'registrado'} accesible.` : 'Firestore accesible; esquema aún no migrado.');
      } catch (error) {
        push('firestore', 'Cloud Firestore', 'error', messageFromFirebaseError(error));
      }

      const ok = checks.every(item => item.status !== 'error');
      return { ok, checks, durationMs: Date.now() - startedAt, account };
    } catch (error) {
      push('sdk', 'Firebase Web SDK', 'error', messageFromFirebaseError(error));
      return { ok: false, checks, durationMs: Date.now() - startedAt, account: null };
    }
  },

  async migrate(options = {}) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account) throw new Error('Primero inicia sesión con una cuenta de Firebase.');
      if (!account.profile) throw new Error(`Crea primero el documento users/${account.uid}.`);
      if (account.profile.status !== 'active') throw new Error('El perfil de Firebase no está activo.');
      if (account.profile.role !== 'superadmin') throw new Error('La migración inicial requiere un perfil superadmin.');

      const plan = this.getMigrationPreview(options);
      if (plan.duplicates.length) throw new Error('El plan contiene rutas duplicadas y no es seguro ejecutarlo.');
      if (!plan.operations.length) throw new Error('No hay documentos seleccionados para migrar.');

      const migrationId = `migration-${Date.now()}`;
      const commonMetadata = {
        migratedAt: new Date().toISOString(),
        migratedBy: account.uid,
        migrationId
      };
      const committed = await commitInChunks(client, plan.operations, commonMetadata);

      const membershipOperations = plan.selectedWorkspaceIds.map(workspaceId => ({
        path: `workspaces/${workspaceId}/members/${account.uid}`,
        data: {
          id: account.uid,
          authUid: account.uid,
          userId: account.profile.personId || '',
          workspaceId,
          role: 'superadmin',
          status: 'active',
          schemaVersion: 9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      await commitInChunks(client, membershipOperations, commonMetadata);

      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema'), {
        version: 9,
        name: 'WonkUp Cloud Foundation',
        status: 'active',
        migratedAt: client.sdk.firestore.serverTimestamp(),
        migratedBy: account.uid,
        lastMigrationId: migrationId
      }, { merge: true });
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema', 'migrations', migrationId), {
        id: migrationId,
        schemaVersion: 9,
        counts: plan.counts,
        workspaceIds: plan.selectedWorkspaceIds,
        executedAt: client.sdk.firestore.serverTimestamp(),
        executedBy: account.uid,
        source: 'github-pages-browser'
      });
      await batch.commit();

      return {
        ok: true,
        migrationId,
        committed: committed + membershipOperations.length + 2,
        plan: clone(plan)
      };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async verifyMigration(workspaceIds = []) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión y verifica el perfil de acceso.');
      const ids = workspaceIds.length
        ? workspaceIds
        : (account.profile.workspaceIds || []).filter(id => id !== '*');

      let resolvedIds = ids;
      if (!resolvedIds.length && account.profile.role === 'superadmin') {
        const workspacesSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
        resolvedIds = workspacesSnapshot.docs.map(item => item.id);
      }

      const result = [];
      for (const workspaceId of resolvedIds) {
        const workspace = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId));
        const projects = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects'));
        const clients = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'clients'));
        const people = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'people'));
        result.push({
          workspaceId,
          workspaceExists: workspace.exists(),
          workspaceName: workspace.exists() ? workspace.data().name : '',
          projects: projects.size,
          clients: clients.size,
          people: people.size
        });
      }
      return result;
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  }
};
