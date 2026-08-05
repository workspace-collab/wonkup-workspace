import { API_CONFIG } from '../config/api-config.js?v=10.0.0';

export async function postAppsScript(action, payload = {}) {
  if (!API_CONFIG.appsScriptUrl) {
    throw new Error('Falta configurar la URL del Web App de Google Apps Script.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);
  const body = new URLSearchParams({
    action,
    payload: JSON.stringify(payload)
  });

  try {
    const response = await fetch(API_CONFIG.appsScriptUrl, {
      method: 'POST',
      body,
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`La API respondió con estado ${response.status}.`);
    }

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'No se pudo completar la solicitud.');
    return result.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La API tardó demasiado en responder.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const AppsScriptAdapter = {
  exchangeCode(code) {
    return postAppsScript('auth.exchangeCode', { code });
  },

  validateSession(session) {
    return postAppsScript('auth.validate', { sessionToken: session?.token });
  },

  revokeSession(session) {
    return postAppsScript('auth.revoke', { sessionToken: session?.token });
  },

  listWorkspaces(session) {
    return postAppsScript('workspaces.list', { sessionToken: session?.token });
  }
};
