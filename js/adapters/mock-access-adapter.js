import { demoAccessGrants } from '../../data/demo-access.js?v=11.0.1';
import { demoUsers } from '../../data/demo-users.js?v=11.0.1';

const wait = (milliseconds = 280) => new Promise(resolve => setTimeout(resolve, milliseconds));

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '-');
}

function createToken() {
  if (globalThis.crypto?.randomUUID) return `mock-${crypto.randomUUID()}`;
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function roleLabel(role) {
  const labels = {
    superadmin: 'Superadministrador',
    workspace_admin: 'Administrador de workspace',
    project_lead: 'Líder de proyecto',
    collaborator: 'Colaborador',
    client: 'Cliente',
    guest: 'Invitado'
  };
  return labels[role] || role;
}

export const MockAccessAdapter = {
  async exchangeCode(code) {
    await wait();
    const normalized = normalizeCode(code);
    const grant = demoAccessGrants.find(item => item.code === normalized);

    if (!grant || grant.status !== 'active') {
      throw new Error('El código no existe, está inactivo o fue revocado.');
    }

    const grantExpiry = new Date(grant.expiresAt).getTime();
    if (!Number.isFinite(grantExpiry) || grantExpiry <= Date.now()) {
      throw new Error('El código de acceso ha expirado.');
    }

    const user = demoUsers.find(item => item.id === grant.userId);
    if (!user || user.status !== 'active') {
      throw new Error('El usuario asociado no está disponible.');
    }

    const sessionExpiry = Math.min(grantExpiry, Date.now() + (8 * 60 * 60 * 1000));

    return {
      token: createToken(),
      source: 'mock',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(sessionExpiry).toISOString(),
      role: grant.role,
      roleLabel: roleLabel(grant.role),
      user: { ...user },
      scopes: {
        workspaceIds: [...grant.workspaceIds],
        projectIds: [...grant.projectIds]
      }
    };
  },

  async validateSession(session) {
    await wait(90);
    if (!session?.token || !session?.expiresAt) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
  },

  async revokeSession() {
    await wait(80);
    return { revoked: true };
  }
};
