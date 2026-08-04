const runtimeConfig = globalThis.WONKUP_API_CONFIG || {};

export const API_CONFIG = Object.freeze({
  mode: runtimeConfig.mode || 'mock',
  appsScriptUrl: runtimeConfig.appsScriptUrl || '',
  requestTimeoutMs: Number(runtimeConfig.requestTimeoutMs || 15000),
  demoCodesVisible: runtimeConfig.demoCodesVisible ?? true
});
