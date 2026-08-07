import { getFirebaseClient } from '../cloud/firebase-client.js?v=12.5.0';

function friendlyError(error, fallback = 'No se pudo completar la operación de IA.') {
  const raw = String(error?.message || fallback);
  const message = raw.replace(/^FirebaseError:\s*/i, '').replace(/^functions\/[a-z-]+:\s*/i, '').trim();
  const wrapped = new Error(message || fallback);
  wrapped.code = String(error?.code || '');
  return wrapped;
}

async function callFunction(name, data = {}) {
  try {
    const client = await getFirebaseClient();
    const callable = client.sdk.functions.httpsCallable(client.functions, name);
    const response = await callable(data);
    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export const AiUsageService = {
  summary(filters = {}) {
    return callFunction('wonkupAiUsageSummary', filters);
  },

  updateSettings(input = {}) {
    return callFunction('wonkupUpdateAiSettings', input);
  }
};
