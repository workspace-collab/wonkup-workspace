import { API_CONFIG } from '../config/api-config.js';
import { MockAccessAdapter } from '../adapters/mock-access-adapter.js';
import { AppsScriptAdapter } from '../adapters/apps-script-adapter.js';
import { demoAccessGrants } from '../../data/demo-access.js';

function adapter() {
  return API_CONFIG.mode === 'apps-script' ? AppsScriptAdapter : MockAccessAdapter;
}

export const AccessService = {
  mode: API_CONFIG.mode,

  exchangeCode(code) {
    return adapter().exchangeCode(code);
  },

  validateSession(session) {
    return adapter().validateSession(session);
  },

  revokeSession(session) {
    return adapter().revokeSession(session);
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
