export const demoAccessGrants = [
  {
    code: 'WONKUP-ADMIN',
    label: 'Superadministrador',
    description: 'Acceso al Panel Maestro y a todos los workspaces.',
    userId: 'usr-rodrigo',
    role: 'superadmin',
    workspaceIds: ['*'],
    projectIds: ['*'],
    status: 'active',
    expiresAt: '2027-12-31T23:59:59-05:00'
  },
  {
    code: 'AGORA-ADMIN',
    label: 'Administrador de Ágora',
    description: 'Gestiona el workspace Ágora Education y sus proyectos.',
    userId: 'usr-edinson',
    role: 'workspace_admin',
    workspaceIds: ['w-agora'],
    projectIds: ['*'],
    status: 'active',
    expiresAt: '2027-12-31T23:59:59-05:00'
  },
  {
    code: 'TAXI-LIDER',
    label: 'Líder de TaxiChurro',
    description: 'Acceso operativo al proyecto TaxiChurro.',
    userId: 'usr-brenda',
    role: 'project_lead',
    workspaceIds: ['w-agora'],
    projectIds: ['p-taxichurro'],
    status: 'active',
    expiresAt: '2027-12-31T23:59:59-05:00'
  },
  {
    code: 'TAXI-CLIENTE',
    label: 'Cliente TaxiChurro',
    description: 'Acceso al portal de TaxiChurro para revisar, comentar y aprobar entregables.',
    userId: 'usr-cliente-taxi',
    role: 'client',
    workspaceIds: ['w-agora'],
    projectIds: ['p-taxichurro'],
    status: 'active',
    expiresAt: '2027-12-31T23:59:59-05:00'
  },
  {
    code: 'HUELLITAS-INVITADO',
    label: 'Invitado Huellitas',
    description: 'Consulta del portal de Huellitas y sus entregables visibles, sin capacidad de aprobación.',
    userId: 'usr-invitado',
    role: 'guest',
    workspaceIds: ['w-agora'],
    projectIds: ['p-huellitas'],
    status: 'active',
    expiresAt: '2027-12-31T23:59:59-05:00'
  }
];
