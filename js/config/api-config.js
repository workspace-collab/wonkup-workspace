const runtimeConfig = globalThis.WONKUP_API_CONFIG || {};

export const API_CONFIG = Object.freeze({
  mode: runtimeConfig.mode || 'mock',
  kanbanMode: runtimeConfig.kanbanMode || 'mock',
  canvasMode: runtimeConfig.canvasMode || 'mock',
  deliverableMode: runtimeConfig.deliverableMode || 'mock',
  financeMode: runtimeConfig.financeMode || 'mock',
  appsScriptUrl: runtimeConfig.appsScriptUrl || '',
  requestTimeoutMs: Number(runtimeConfig.requestTimeoutMs || 15000),
  demoCodesVisible: runtimeConfig.demoCodesVisible ?? true,
  firebase: Object.freeze({
    apiKey: runtimeConfig.firebase?.apiKey || '',
    authDomain: runtimeConfig.firebase?.authDomain || '',
    projectId: runtimeConfig.firebase?.projectId || '',
    storageBucket: runtimeConfig.firebase?.storageBucket || '',
    messagingSenderId: runtimeConfig.firebase?.messagingSenderId || '',
    appId: runtimeConfig.firebase?.appId || '',
    databaseURL: runtimeConfig.firebase?.databaseURL || ''
  })
});
