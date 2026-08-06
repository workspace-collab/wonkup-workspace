const runtimeConfig = globalThis.WONKUP_API_CONFIG || {};

function cleanSdkVersion(value) {
  const version = String(value || '12.16.0').trim();
  return /^\d+\.\d+\.\d+$/.test(version) ? version : '12.16.0';
}

export const API_CONFIG = Object.freeze({
  mode: runtimeConfig.mode || 'mock',
  authMode: runtimeConfig.authMode || runtimeConfig.mode || 'mock',
  projectMode: runtimeConfig.projectMode || runtimeConfig.mode || 'mock',
  kanbanMode: runtimeConfig.kanbanMode || 'mock',
  canvasMode: runtimeConfig.canvasMode || 'mock',
  deliverableMode: runtimeConfig.deliverableMode || 'mock',
  financeMode: runtimeConfig.financeMode || 'mock',
  reportMode: runtimeConfig.reportMode || 'aggregate',
  foundationMode: runtimeConfig.foundationMode || 'diagnostic',
  functionsRegion: runtimeConfig.functionsRegion || 'us-central1',
  appsScriptUrl: runtimeConfig.appsScriptUrl || '',
  requestTimeoutMs: Number(runtimeConfig.requestTimeoutMs || 15000),
  demoCodesVisible: runtimeConfig.demoCodesVisible ?? true,
  firebaseSdkVersion: cleanSdkVersion(runtimeConfig.firebaseSdkVersion),
  firebase: Object.freeze({
    apiKey: runtimeConfig.firebase?.apiKey || '',
    authDomain: runtimeConfig.firebase?.authDomain || '',
    projectId: runtimeConfig.firebase?.projectId || '',
    storageBucket: runtimeConfig.firebase?.storageBucket || '',
    messagingSenderId: runtimeConfig.firebase?.messagingSenderId || '',
    appId: runtimeConfig.firebase?.appId || '',
    databaseURL: runtimeConfig.firebase?.databaseURL || '',
    appCheckSiteKey: runtimeConfig.firebase?.appCheckSiteKey || '',
    enableAppCheck: Boolean(runtimeConfig.firebase?.enableAppCheck),
    enablePersistentCache: Boolean(runtimeConfig.firebase?.enablePersistentCache)
  })
});

export function firebaseConfigStatus() {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !API_CONFIG.firebase[key]);
  return {
    configured: missing.length === 0,
    missing,
    projectId: API_CONFIG.firebase.projectId || ''
  };
}
