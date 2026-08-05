// Configuración pública del frontend. No coloques claves privadas ni secretos aquí.
// Entrega 9: Cloud Foundation. Se mantiene en modo local hasta completar la guía.
globalThis.WONKUP_API_CONFIG = {
  mode: 'mock',
  authMode: 'mock',
  projectMode: 'mock',
  kanbanMode: 'mock',
  canvasMode: 'mock',
  deliverableMode: 'mock',
  financeMode: 'mock',
  reportMode: 'aggregate',
  foundationMode: 'diagnostic',
  appsScriptUrl: '',
  requestTimeoutMs: 15000,
  demoCodesVisible: true,
  firebaseSdkVersion: '12.16.0',
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    databaseURL: '',
    appCheckSiteKey: '',
    enableAppCheck: false,
    // Desactivado por defecto porque el Workspace maneja información financiera.
    // Actívalo solo en equipos de confianza y después de revisar la guía.
    enablePersistentCache: false
  }
};
