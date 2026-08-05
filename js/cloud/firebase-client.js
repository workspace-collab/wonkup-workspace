import { API_CONFIG, firebaseConfigStatus } from '../config/api-config.js?v=9.0.0';
import { loadFirebaseSdk } from './firebase-sdk-loader.js?v=9.0.0';

let clientPromise = null;

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

export async function getFirebaseClient() {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
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

    const db = sdk.firestore.initializeFirestore(app, firestoreSettings);

    return {
      sdk,
      app,
      auth,
      db,
      appCheck,
      config,
      persistentCache: API_CONFIG.firebase.enablePersistentCache
    };
  })().catch(error => {
    clientPromise = null;
    throw error;
  });

  return clientPromise;
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
  clientPromise = null;
}
