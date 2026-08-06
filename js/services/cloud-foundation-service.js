import { API_CONFIG, firebaseConfigStatus } from '../config/api-config.js?v=12.2.0';
import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=12.2.0';
import { getFirebaseSdkUrls } from '../cloud/firebase-sdk-loader.js?v=12.2.0';
import { buildFoundationMigrationPlan, getLocalFoundationSnapshot } from '../cloud/migration-plan.js?v=12.2.0';
import { buildUserActivationPlan } from '../cloud/user-activation-plan.js?v=12.2.0';
import { buildKanbanMigrationPlan, getLocalKanbanSnapshot } from '../cloud/kanban-migration-plan.js?v=12.2.0';
import { buildDeliverableMigrationPlan, getLocalDeliverableSnapshot } from '../cloud/deliverable-migration-plan.js?v=12.2.0';
import { buildCanvasMigrationPlan, getLocalCanvasSnapshot } from '../cloud/canvas-migration-plan.js?v=12.2.0';

const clone = value => JSON.parse(JSON.stringify(value));
const FIRESTORE_RULE_SAFE_BATCH_SIZE = 4;

function messageFromFirebaseError(error) {
  if (error?.wonkupMessage) return error.wonkupMessage;
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

async function commitInChunks(client, operations, metadata = {}, { stage = 'Datos', chunkSize = FIRESTORE_RULE_SAFE_BATCH_SIZE } = {}) {
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
    try {
      await batch.commit();
      committed += chunk.length;
    } catch (error) {
      const paths = chunk.map(operation => operation.path).join(', ');
      const code = String(error?.code || 'unknown');
      const wrapped = new Error(`Firestore rechazó la etapa ${stage}. Código: ${code}. Rutas: ${paths}.`);
      wrapped.code = code;
      wrapped.wonkupMessage = wrapped.message;
      wrapped.cause = error;
      throw wrapped;
    }
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
      kanbanMode: API_CONFIG.kanbanMode,
      deliverableMode: API_CONFIG.deliverableMode,
      canvasMode: API_CONFIG.canvasMode,
      databaseURL: API_CONFIG.firebase.databaseURL || '',
      databaseConfigured: Boolean(API_CONFIG.firebase.databaseURL),
      foundationMode: API_CONFIG.foundationMode,
      functionsRegion: API_CONFIG.functionsRegion,
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
        schemaVersion: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  },

  getRuntimeSnippet() {
    return `authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
deliverableMode: 'hybrid',
canvasMode: 'hybrid',
foundationMode: 'connected',
functionsRegion: 'us-central1',
firebase: {
  apiKey: '...',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.firebasestorage.app',
  messagingSenderId: '...',
  appId: '...',
  databaseURL: 'https://TU_PROYECTO-default-rtdb.firebaseio.com',
  appCheckSiteKey: '',
  enableAppCheck: false,
  enablePersistentCache: false
}`;
  },

  getMigrationPreview(options = {}) {
    return buildFoundationMigrationPlan(getLocalFoundationSnapshot(), options);
  },


  getKanbanMigrationPreview(options = {}) {
    return buildKanbanMigrationPlan(getLocalKanbanSnapshot(), options);
  },

  getDeliverableMigrationPreview(options = {}) {
    return buildDeliverableMigrationPlan(getLocalDeliverableSnapshot(), options);
  },


  getCanvasMigrationPreview(options = {}) {
    return buildCanvasMigrationPlan(getLocalCanvasSnapshot(), options);
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


  exportKanbanBackup() {
    const snapshot = getLocalKanbanSnapshot();
    downloadJson(`wonkup-backup-kanban-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
    return snapshot;
  },

  exportDeliverableBackup() {
    const snapshot = getLocalDeliverableSnapshot();
    downloadJson(`wonkup-backup-entregables-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
    return snapshot;
  },


  exportCanvasBackup() {
    const snapshot = getLocalCanvasSnapshot();
    downloadJson(`wonkup-backup-canvases-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
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
      push('realtime', 'Realtime Database', client.realtimeDb ? 'ok' : 'error', client.realtimeDb ? `Presencia Canvas conectada a ${configuration.databaseURL}.` : 'Falta databaseURL para la presencia colaborativa.');
      try {
        const health = client.sdk.functions.httpsCallable(client.functions, 'wonkupUserAdminHealth');
        const response = await health({});
        push('functions', 'Cloud Functions', 'ok', `Usuarios e invitaciones ${response.data?.release || ''} en ${configuration.functionsRegion}.`);
      } catch (error) {
        push('functions', 'Cloud Functions', 'warning', 'Usuarios e invitaciones aún no desplegado o sin sesión superadmin.');
      }
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
      const operationsByGroup = plan.operations.reduce((groups, operation) => {
        (groups[operation.group] ||= []).push(operation);
        return groups;
      }, {});
      let committed = 0;

      committed += await commitInChunks(client, operationsByGroup.workspaces || [], commonMetadata, { stage: 'Workspaces' });

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
      committed += await commitInChunks(client, membershipOperations, commonMetadata, { stage: 'Membresías del superadministrador' });
      committed += await commitInChunks(client, operationsByGroup.clients || [], commonMetadata, { stage: 'Clientes' });
      committed += await commitInChunks(client, operationsByGroup.people || [], commonMetadata, { stage: 'Personas' });
      committed += await commitInChunks(client, operationsByGroup.projects || [], commonMetadata, { stage: 'Proyectos' });
      committed += await commitInChunks(client, operationsByGroup.projectMembers || [], commonMetadata, { stage: 'Miembros de proyecto' });

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
        committed: committed + 2,
        plan: clone(plan)
      };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async migrateKanban(options = {}) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión con el superadministrador de Firebase.');
      if (account.profile.status !== 'active' || account.profile.role !== 'superadmin') {
        throw new Error('La migración del Kanban requiere un perfil superadmin activo.');
      }
      const plan = this.getKanbanMigrationPreview(options);
      if (plan.duplicates.length) throw new Error('El plan Kanban contiene rutas duplicadas.');
      if (!plan.operations.length) throw new Error('No se encontraron tableros locales para migrar.');

      const migrationId = `kanban-migration-${Date.now()}`;
      const metadata = {
        migratedAt: new Date().toISOString(),
        migratedBy: account.uid,
        migrationId
      };
      const boards = plan.operations.filter(operation => operation.group === 'boards');
      const cards = plan.operations.filter(operation => operation.group === 'cards');
      let committed = 0;
      committed += await commitInChunks(client, boards, metadata, { stage: 'Tableros Kanban' });
      committed += await commitInChunks(client, cards, metadata, { stage: 'Tarjetas Kanban' });

      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema'), {
        version: 10,
        kanbanSchemaVersion: 10,
        kanbanMode: 'hybrid',
        kanbanMigratedAt: client.sdk.firestore.serverTimestamp(),
        kanbanMigratedBy: account.uid,
        lastKanbanMigrationId: migrationId
      }, { merge: true });
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema', 'migrations', migrationId), {
        id: migrationId,
        module: 'kanban',
        schemaVersion: 10,
        counts: plan.counts,
        workspaceIds: plan.selectedWorkspaceIds,
        projectIds: plan.selectedProjectIds,
        executedAt: client.sdk.firestore.serverTimestamp(),
        executedBy: account.uid,
        source: 'github-pages-browser'
      });
      await batch.commit();
      return { ok: true, migrationId, committed: committed + 2, plan: clone(plan) };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async migrateDeliverables(options = {}) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión con el superadministrador de Firebase.');
      if (account.profile.status !== 'active' || account.profile.role !== 'superadmin') {
        throw new Error('La migración de entregables requiere un perfil superadmin activo.');
      }
      const plan = this.getDeliverableMigrationPreview(options);
      if (plan.duplicates.length) throw new Error('El plan de entregables contiene rutas duplicadas.');
      if (!plan.operations.length) throw new Error('No se encontraron entregables locales para migrar.');

      const migrationId = `deliverables-migration-${Date.now()}`;
      const metadata = { migratedAt: new Date().toISOString(), migratedBy: account.uid, migrationId };
      const committed = await commitInChunks(client, plan.operations, metadata, { stage: 'Entregables' });

      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema'), {
        version: 11,
        deliverableSchemaVersion: 11,
        deliverableMode: 'hybrid',
        deliverablesMigratedAt: client.sdk.firestore.serverTimestamp(),
        deliverablesMigratedBy: account.uid,
        lastDeliverableMigrationId: migrationId
      }, { merge: true });
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema', 'migrations', migrationId), {
        id: migrationId,
        module: 'deliverables',
        schemaVersion: 11,
        counts: plan.counts,
        workspaceIds: plan.selectedWorkspaceIds,
        projectIds: plan.selectedProjectIds,
        executedAt: client.sdk.firestore.serverTimestamp(),
        executedBy: account.uid,
        source: 'github-pages-browser'
      });
      await batch.commit();
      return { ok: true, migrationId, committed: committed + 2, plan: clone(plan) };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async migrateCanvas(options = {}) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión con el superadministrador de Firebase.');
      if (account.profile.status !== 'active' || account.profile.role !== 'superadmin') {
        throw new Error('La migración del Canvas Engine requiere un perfil superadmin activo.');
      }
      const plan = this.getCanvasMigrationPreview(options);
      if (plan.duplicates.length) throw new Error('El plan de canvases contiene rutas duplicadas.');
      if (!plan.operations.length) throw new Error('No se encontraron canvases locales para migrar.');

      const migrationId = `canvas-migration-${Date.now()}`;
      const metadata = { migratedAt: new Date().toISOString(), migratedBy: account.uid, migrationId };
      const timestampGroups = new Set(['shareLinks', 'publicShares']);
      const operations = plan.operations.map(operation => {
        if (!timestampGroups.has(operation.group)) return operation;
        const expiresAt = new Date(operation.data.expiresAt || '');
        if (!Number.isFinite(expiresAt.getTime())) throw new Error(`Vencimiento inválido en ${operation.path}.`);
        return {
          ...operation,
          data: {
            ...operation.data,
            expiresAt: client.sdk.firestore.Timestamp.fromDate(expiresAt)
          }
        };
      });
      const grouped = operations.reduce((result, operation) => {
        (result[operation.group] ||= []).push(operation);
        return result;
      }, {});
      const stages = [
        ['canvases', 'Canvases'],
        ['notes', 'Notas de canvas'],
        ['comments', 'Comentarios de canvas'],
        ['history', 'Historial de canvas'],
        ['versions', 'Versiones de canvas'],
        ['shareLinks', 'Enlaces internos de canvas'],
        ['publicShares', 'Snapshots públicos de canvas']
      ];
      let committed = 0;
      for (const [group, stage] of stages) {
        committed += await commitInChunks(client, grouped[group] || [], metadata, { stage });
      }

      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema'), {
        version: 12,
        canvasSchemaVersion: 12,
        canvasMode: 'hybrid',
        canvasMigratedAt: client.sdk.firestore.serverTimestamp(),
        canvasMigratedBy: account.uid,
        lastCanvasMigrationId: migrationId
      }, { merge: true });
      batch.set(client.sdk.firestore.doc(client.db, 'system', 'schema', 'migrations', migrationId), {
        id: migrationId,
        module: 'canvas',
        schemaVersion: 12,
        counts: plan.counts,
        workspaceIds: plan.selectedWorkspaceIds,
        projectIds: plan.selectedProjectIds,
        executedAt: client.sdk.firestore.serverTimestamp(),
        executedBy: account.uid,
        source: 'github-pages-browser'
      });
      await batch.commit();
      return { ok: true, migrationId, committed: committed + 2, plan: clone(plan) };
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async verifyCanvasMigration(workspaceIds = []) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión y verifica el perfil de acceso.');
      let ids = workspaceIds.filter(Boolean);
      if (!ids.length && account.profile.role === 'superadmin') {
        const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
        ids = snapshot.docs.map(item => item.id);
      }
      const report = [];
      for (const workspaceId of ids) {
        const workspaceSnapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId));
        const projectsSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects'));
        const totals = { canvases: 0, notes: 0, comments: 0, history: 0, versions: 0, shareLinks: 0 };
        const projects = [];
        for (const projectDoc of projectsSnapshot.docs) {
          const canvasesSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'canvases'));
          if (!canvasesSnapshot.size) continue;
          const projectCounts = { canvases: canvasesSnapshot.size, notes: 0, comments: 0, history: 0, versions: 0, shareLinks: 0 };
          for (const canvasDoc of canvasesSnapshot.docs) {
            const base = canvasDoc.ref;
            const [notesSnapshot, historySnapshot, versionsSnapshot, sharesSnapshot] = await Promise.all([
              client.sdk.firestore.getDocs(client.sdk.firestore.collection(base, 'notes')),
              client.sdk.firestore.getDocs(client.sdk.firestore.collection(base, 'history')),
              client.sdk.firestore.getDocs(client.sdk.firestore.collection(base, 'versions')),
              client.sdk.firestore.getDocs(client.sdk.firestore.collection(base, 'shareLinks'))
            ]);
            projectCounts.notes += notesSnapshot.size;
            projectCounts.history += historySnapshot.size;
            projectCounts.versions += versionsSnapshot.size;
            projectCounts.shareLinks += sharesSnapshot.size;
            for (const noteDoc of notesSnapshot.docs) {
              const commentsSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(noteDoc.ref, 'comments'));
              projectCounts.comments += commentsSnapshot.size;
            }
          }
          Object.keys(totals).forEach(key => { totals[key] += projectCounts[key]; });
          projects.push({ projectId: projectDoc.id, projectName: projectDoc.data().name || projectDoc.id, ...projectCounts });
        }
        report.push({
          workspaceId,
          workspaceName: workspaceSnapshot.exists() ? workspaceSnapshot.data().name : workspaceId,
          ...totals,
          projects
        });
      }
      return report;
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async verifyDeliverableMigration(workspaceIds = []) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión y verifica el perfil de acceso.');
      let ids = workspaceIds.filter(Boolean);
      if (!ids.length && account.profile.role === 'superadmin') {
        const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
        ids = snapshot.docs.map(item => item.id);
      }
      const report = [];
      for (const workspaceId of ids) {
        const workspaceSnapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId));
        const projectsSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects'));
        let deliverables = 0;
        let versions = 0;
        let comments = 0;
        const projects = [];
        for (const projectDoc of projectsSnapshot.docs) {
          const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'deliverables'));
          if (!snapshot.size) continue;
          const items = snapshot.docs.map(item => item.data());
          deliverables += snapshot.size;
          versions += items.reduce((sum, item) => sum + (Array.isArray(item.versions) ? item.versions.length : 0), 0);
          comments += items.reduce((sum, item) => sum + (Array.isArray(item.comments) ? item.comments.length : 0), 0);
          projects.push({ projectId: projectDoc.id, projectName: projectDoc.data().name || projectDoc.id, deliverables: snapshot.size });
        }
        report.push({
          workspaceId,
          workspaceName: workspaceSnapshot.exists() ? workspaceSnapshot.data().name : workspaceId,
          deliverables,
          versions,
          comments,
          projects
        });
      }
      return report;
    } catch (error) {
      throw new Error(messageFromFirebaseError(error));
    }
  },

  async verifyKanbanMigration(workspaceIds = []) {
    try {
      const client = await getFirebaseClient();
      const account = await this.getAccount();
      if (!account?.profile) throw new Error('Inicia sesión y verifica el perfil de acceso.');
      let ids = workspaceIds.filter(Boolean);
      if (!ids.length && account.profile.role === 'superadmin') {
        const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
        ids = snapshot.docs.map(item => item.id);
      }
      const report = [];
      for (const workspaceId of ids) {
        const workspaceSnapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId));
        const projectsSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects'));
        let boards = 0;
        let cards = 0;
        const projects = [];
        for (const projectDoc of projectsSnapshot.docs) {
          const boardRef = client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'projects', projectDoc.id, 'boards', 'main');
          const boardSnapshot = await client.sdk.firestore.getDoc(boardRef);
          if (!boardSnapshot.exists()) continue;
          const cardsSnapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(boardRef, 'cards'));
          boards += 1;
          cards += cardsSnapshot.size;
          projects.push({ projectId: projectDoc.id, projectName: projectDoc.data().name || projectDoc.id, cards: cardsSnapshot.size });
        }
        report.push({
          workspaceId,
          workspaceName: workspaceSnapshot.exists() ? workspaceSnapshot.data().name : workspaceId,
          boards,
          cards,
          projects
        });
      }
      return report;
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
