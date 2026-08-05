// Configuracion publica del frontend. No coloques claves privadas ni secretos aqui.
// Hotfix 9.0.5: Firebase real, modo hibrido y migracion resiliente.
globalThis.WONKUP_API_CONFIG = {
  mode: 'mock',
  release: '9.0.5',
  authMode: 'hybrid',
  projectMode: 'hybrid',
  kanbanMode: 'mock',
  canvasMode: 'mock',
  deliverableMode: 'mock',
  financeMode: 'mock',
  reportMode: 'aggregate',
  foundationMode: 'connected',
  appsScriptUrl: '',
  requestTimeoutMs: 15000,
  demoCodesVisible: true,
  firebaseSdkVersion: '12.16.0',
  firebase: {
    apiKey: 'AIzaSyD_hvX5wW1IYTN2qajNqhCEPiv29yoAkrM',
    authDomain: 'wonkup-workspace.firebaseapp.com',
    projectId: 'wonkup-workspace',
    storageBucket: 'wonkup-workspace.firebasestorage.app',
    messagingSenderId: '915017099491',
    appId: '1:915017099491:web:9cfe62ad8d220f3167fdd6',
    databaseURL: '',
    appCheckSiteKey: '',
    enableAppCheck: false,
    enablePersistentCache: false
  }
};
