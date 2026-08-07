import { getFirebaseClient } from '../cloud/firebase-client.js?v=12.5.0';

function messageFromError(error) {
  const code = String(error?.code || '');
  const messages = {
    'functions/unauthenticated': 'Tu sesión de Firebase no está disponible. Ingresa nuevamente.',
    'functions/permission-denied': 'Solo el superadministrador puede administrar cuentas.',
    'functions/not-found': 'Las funciones de usuarios aún no están desplegadas.',
    'functions/unavailable': 'El servicio de usuarios no está disponible temporalmente.',
    'functions/already-exists': 'Este correo ya tiene una cuenta WonkUp.',
    'functions/invalid-argument': error?.message || 'Revisa los datos del formulario.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/too-many-requests': 'Firebase limitó temporalmente el envío de correos. Espera unos minutos.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.'
  };
  return messages[code] || error?.message || 'No se pudo completar la operación.';
}

async function callFunction(name, data = {}) {
  try {
    const client = await getFirebaseClient();
    const callable = client.sdk.functions.httpsCallable(client.functions, name);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    const wrapped = new Error(messageFromError(error));
    wrapped.code = error?.code || '';
    wrapped.cause = error;
    throw wrapped;
  }
}

export const ManagedUsersService = {
  health() {
    return callFunction('wonkupUserAdminHealth');
  },

  list() {
    return callFunction('wonkupListManagedUsers');
  },

  invite(input) {
    return callFunction('wonkupInviteUser', input);
  },

  update(input) {
    return callFunction('wonkupUpdateManagedUser', input);
  },

  setStatus(uid, status) {
    return callFunction('wonkupSetManagedUserStatus', { uid, status });
  },

  async sendInvitationEmail(email) {
    try {
      const { auth, sdk } = await getFirebaseClient();
      auth.languageCode = 'es';
      await sdk.auth.sendPasswordResetEmail(auth, String(email || '').trim().toLowerCase());
      return { ok: true };
    } catch (error) {
      const wrapped = new Error(messageFromError(error));
      wrapped.code = error?.code || '';
      wrapped.cause = error;
      throw wrapped;
    }
  }
};
