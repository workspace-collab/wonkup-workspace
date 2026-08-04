export const demoNotifications = [
  {
    id: 'notification-001',
    workspaceId: 'w-agora',
    projectId: 'p-taxichurro',
    type: 'wip',
    visibility: 'internal',
    title: 'TaxiChurro alcanzó un límite WIP',
    message: 'Revisa la columna En revisión antes de agregar más tareas.',
    createdAt: '2026-08-03T23:35:00-05:00',
    href: '#/w/w-agora/p/p-taxichurro/kanban'
  },
  {
    id: 'notification-002',
    workspaceId: 'w-agora',
    projectId: 'p-taxichurro',
    type: 'assignment',
    visibility: 'internal',
    title: 'Tarea asignada',
    message: 'Se te asignó Diseño de la app.',
    createdAt: '2026-08-03T22:20:00-05:00',
    href: '#/w/w-agora/p/p-taxichurro/kanban'
  },
  {
    id: 'notification-003',
    workspaceId: 'w-agora',
    projectId: 'p-compraya',
    type: 'comment',
    visibility: 'internal',
    title: 'Nuevo comentario en CompraYa',
    message: 'Hay una observación pendiente de revisión.',
    createdAt: '2026-08-03T20:40:00-05:00',
    href: '#/w/w-agora/p/p-compraya/summary'
  },
  {
    id: 'notification-004',
    workspaceId: 'w-agora',
    projectId: 'p-taxichurro',
    type: 'review',
    visibility: 'client',
    title: 'Entregable listo para revisión',
    message: 'El prototipo navegable de TaxiChurro está disponible.',
    createdAt: '2026-08-04T16:20:00-05:00',
    href: '#/portal/w/w-agora/p/p-taxichurro/deliverables'
  }
];
