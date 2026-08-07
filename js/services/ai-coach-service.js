import { getFirebaseClient } from '../cloud/firebase-client.js?v=12.5.0';

function friendlyError(error) {
  const code = String(error?.code || '');
  const raw = String(error?.message || 'No se pudo consultar WonkUp AI Coach.');
  const message = raw.replace(/^FirebaseError:\s*/i, '').replace(/^functions\/[a-z-]+:\s*/i, '').trim();
  const wrapped = new Error(message || 'No se pudo consultar WonkUp AI Coach.');
  wrapped.code = code;
  return wrapped;
}

async function callCoach(data) {
  try {
    const client = await getFirebaseClient();
    const callable = client.sdk.functions.httpsCallable(client.functions, 'wonkupCanvasAiCoach');
    const response = await callable(data);
    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
}


async function callAcceptance(data) {
  try {
    const client = await getFirebaseClient();
    const callable = client.sdk.functions.httpsCallable(client.functions, 'wonkupRecordAiAcceptance');
    const response = await callable(data);
    return response.data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export const AiCoachService = {
  async askQuestions({ instance, sectionId, session }) {
    if (!session?.firebaseUid) throw new Error('Inicia sesión con una Cuenta WonkUp para usar la IA.');
    return callCoach({
      action: 'questions',
      workspaceId: instance.workspaceId,
      projectId: instance.projectId,
      canvasId: instance.id,
      sectionId
    });
  },

  async suggestNotes({ instance, sectionId, userInput = '', session }) {
    if (!session?.firebaseUid) throw new Error('Inicia sesión con una Cuenta WonkUp para usar la IA.');
    return callCoach({
      action: 'suggest',
      workspaceId: instance.workspaceId,
      projectId: instance.projectId,
      canvasId: instance.id,
      sectionId,
      userInput
    });
  },

  async reviewSection({ instance, sectionId, session }) {
    if (!session?.firebaseUid) throw new Error('Inicia sesión con una Cuenta WonkUp para usar la IA.');
    return callCoach({
      action: 'review',
      workspaceId: instance.workspaceId,
      projectId: instance.projectId,
      canvasId: instance.id,
      sectionId
    });
  },

  async recordAcceptance(interactionId, acceptedCount) {
    if (!interactionId) return { ok: false, skipped: true };
    return callAcceptance({ interactionId, acceptedCount });
  }
};
