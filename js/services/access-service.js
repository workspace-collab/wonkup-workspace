import { API_CONFIG, firebaseConfigStatus } from '../config/api-config.js?v=12.4.0';
import { MockAccessAdapter } from '../adapters/mock-access-adapter.js?v=12.4.0';
import { AppsScriptAdapter } from '../adapters/apps-script-adapter.js?v=12.4.0';
import { FirebaseAccessAdapter } from '../adapters/firebase-access-adapter.js?v=12.4.0';
import { demoAccessGrants } from '../../data/demo-access.js?v=12.4.0';

function codeAdapter() {
  return API_CONFIG.mode === 'apps-script' ? AppsScriptAdapter : MockAccessAdapter;
}

function firebaseEnabled() {
  return ['firebase', 'hybrid'].includes(API_CONFIG.authMode) && firebaseConfigStatus().configured;
}

export const AccessService = {
  mode: API_CONFIG.mode,
  authMode: API_CONFIG.authMode,

  exchangeCode(code) {
    return codeAdapter().exchangeCode(code);
  },

  signInWithFirebase(email, password) {
    if (!firebaseEnabled()) throw new Error('El acceso con cuenta todavía no está configurado.');
    return FirebaseAccessAdapter.signIn(email, password);
  },

  sendPasswordReset(email) {
    if (!firebaseEnabled()) throw new Error('Firebase Authentication todavía no está configurado.');
    return FirebaseAccessAdapter.sendPasswordReset(email);
  },

  validateSession(session) {
    if (session?.source === 'firebase') return FirebaseAccessAdapter.validateSession(session);
    return codeAdapter().validateSession(session);
  },

  revokeSession(session) {
    if (session?.source === 'firebase') return FirebaseAccessAdapter.revokeSession(session);
    return codeAdapter().revokeSession(session);
  },

  isFirebaseLoginAvailable() {
    return firebaseEnabled();
  },

  getFirebaseConfigurationStatus() {
    return firebaseConfigStatus();
  },

  getDemoCodes() {
    if (!API_CONFIG.demoCodesVisible || API_CONFIG.mode !== 'mock') return [];
    return demoAccessGrants.map(({ code, label, description, role }) => ({
      code,
      label,
      description,
      role
    }));
  }
};
