import { API_CONFIG, firebaseConfigStatus } from '../config/api-config.js?v=12.4.0';
import { loadFirebaseSdk } from './firebase-sdk-loader.js?v=12.4.0';

const CLIENT_PROMISE_KEY = '__WONKUP_FIREBASE_CLIENT_PROMISE__';

function publicFirebaseConfig() {
  const source = API_CONFIG.firebase;
  return {
    apiKey: source.apiKey,
    authDomain: source.authDomain,
    projectId: source.projectId,
    storageBucket: source.storageBucket || undefined,
    messagingSenderId: source.messagingSenderId || undefined,
    appId: source.appId,
    databaseURL: source.databaseURL || undefined
  };
}

function cleanUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ''));
}

function isAlreadyInitializedError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('initializefirestore() has already been called')
    || message.includes('already been called with different options')
    || message.includes('failed-precondition');
}

export async function getFirebaseClient() {
  const existingPromise = globalThis[CLIENT_PROMISE_KEY];
  if (existingPromise) return existingPromise;

  let sharedPromise;
  sharedPromise = (async () => {
    const status = firebaseConfigStatus();
    if (!status.configured) {
      throw new Error(`Firebase todavía no está configurado. Faltan: ${status.missing.join(', ')}.`);
    }

    const sdk = await loadFirebaseSdk({ appCheck: API_CONFIG.firebase.enableAppCheck });
    const config = cleanUndefined(publicFirebaseConfig());
    const app = sdk.app.getApps().length
      ? sdk.app.getApp()
      : sdk.app.initializeApp(config);

    let appCheck = null;
    if (API_CONFIG.firebase.enableAppCheck) {
      if (!API_CONFIG.firebase.appCheckSiteKey) {
        throw new Error('App Check está activado, pero falta appCheckSiteKey.');
      }
      appCheck = sdk.appCheck.initializeAppCheck(app, {
        provider: new sdk.appCheck.ReCaptchaEnterpriseProvider(API_CONFIG.firebase.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }

    const auth = sdk.auth.getAuth(app);
    const realtimeDb = API_CONFIG.firebase.databaseURL
      ? sdk.database.getDatabase(app, API_CONFIG.firebase.databaseURL)
      : null;
    const functions = sdk.functions.getFunctions(app, API_CONFIG.functionsRegion);
    await sdk.auth.setPersistence(auth, sdk.auth.browserLocalPersistence);

    const firestoreSettings = API_CONFIG.firebase.enablePersistentCache
      ? {
          ignoreUndefinedProperties: true,
          localCache: sdk.firestore.persistentLocalCache({
            tabManager: sdk.firestore.persistentMultipleTabManager()
          })
        }
      : {
          ignoreUndefinedProperties: true,
          localCache: sdk.firestore.memoryLocalCache()
        };

    let db;
    try {
      db = sdk.firestore.initializeFirestore(app, firestoreSettings);
    } catch (error) {
      if (!isAlreadyInitializedError(error)) throw error;
      db = sdk.firestore.getFirestore(app);
    }

    return {
      sdk,
      app,
      auth,
      db,
      realtimeDb,
      functions,
      appCheck,
      config,
      persistentCache: API_CONFIG.firebase.enablePersistentCache
    };
  })().catch(error => {
    if (globalThis[CLIENT_PROMISE_KEY] === sharedPromise) {
      delete globalThis[CLIENT_PROMISE_KEY];
    }
    throw error;
  });

  globalThis[CLIENT_PROMISE_KEY] = sharedPromise;
  return sharedPromise;
}

export async function waitForFirebaseAuth() {
  const { auth, sdk } = await getFirebaseClient();
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
    return auth.currentUser;
  }
  return new Promise(resolve => {
    const unsubscribe = sdk.auth.onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    }, () => {
      unsubscribe();
      resolve(null);
    });
  });
}

export function resetFirebaseClientForTesting() {
  delete globalThis[CLIENT_PROMISE_KEY];
}
