class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

globalThis.localStorage = new MemoryStorage();

const { MockProjectAdapter } = await import('../js/adapters/mock-project-adapter.js?v=8.1.0-test');

const session = {
  role: 'superadmin',
  user: { id: 'usr-rodrigo', name: 'Rodrigo' },
  scopes: { workspaceIds: ['*'], projectIds: ['*'] }
};

const client = await MockProjectAdapter.createClient({
  input: {
    workspaceId: 'w-agora',
    name: 'Cliente Prueba 8.1',
    contactName: 'Contacto Prueba',
    email: 'cliente81@example.com',
    phone: '999999999'
  },
  session
});
if (!client.id) throw new Error('No se creó el cliente.');
const clients = await MockProjectAdapter.listClients({ workspaceId: 'w-agora', session });
if (!clients.some(item => item.id === client.id)) throw new Error('El cliente nuevo no aparece en la lista.');

const user = await MockProjectAdapter.createUser({
  input: { workspaceId: 'w-agora', name: 'Persona Prueba', email: 'persona81@example.com' },
  session
});
if (!user.id || user.initials !== 'PP') throw new Error('No se creó correctamente la persona.');
const users = await MockProjectAdapter.listUsers({ workspaceId: 'w-agora', session });
if (!users.some(item => item.id === user.id)) throw new Error('La persona nueva no aparece en la lista.');

await MockProjectAdapter.assignMember({
  projectId: 'p-taxichurro',
  input: { userId: user.id, role: 'collaborator', allocation: 20 },
  session
});
const members = await MockProjectAdapter.listMembers({ projectId: 'p-taxichurro', session });
if (!members.some(item => item.userId === user.id && item.user.name === 'Persona Prueba')) {
  throw new Error('La persona nueva no pudo asignarse al proyecto.');
}

let duplicateRejected = false;
try {
  await MockProjectAdapter.createUser({
    input: { workspaceId: 'w-agora', name: 'Duplicada', email: 'PERSONA81@example.com' },
    session
  });
} catch (error) {
  duplicateRejected = /correo/.test(error.message);
}
if (!duplicateRejected) throw new Error('No se rechazó el correo duplicado.');

console.log('OK quick create 8.1');
