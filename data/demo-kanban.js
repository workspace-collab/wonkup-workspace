const now = '2026-08-03T20:00:00-05:00';

const columns = [
  { id: 'backlog', name: 'Backlog', order: 10, wipLimit: 0, tone: 'gray' },
  { id: 'todo', name: 'Por hacer', order: 20, wipLimit: 6, tone: 'gold' },
  { id: 'analysis', name: 'En análisis', order: 30, wipLimit: 4, tone: 'violet' },
  { id: 'design', name: 'En diseño', order: 40, wipLimit: 4, tone: 'sky' },
  { id: 'development', name: 'En desarrollo', order: 50, wipLimit: 5, tone: 'blue' },
  { id: 'review', name: 'En revisión', order: 60, wipLimit: 3, tone: 'orange' },
  { id: 'client', name: 'Esperando cliente', order: 70, wipLimit: 3, tone: 'yellow' },
  { id: 'blocked', name: 'Bloqueado', order: 80, wipLimit: 3, tone: 'red' },
  { id: 'done', name: 'Completado', order: 90, wipLimit: 0, tone: 'green' }
];

function history(id, title, actorId = 'usr-rodrigo', createdAt = now) {
  return { id, type: 'created', title, actorId, createdAt };
}

export const demoKanbanBoards = {
  'p-taxichurro': {
    id: 'board-p-taxichurro',
    projectId: 'p-taxichurro',
    name: 'Tablero principal',
    version: 1,
    updatedAt: now,
    columns,
    cards: [
      {
        id: 'card-taxi-001', columnId: 'backlog', position: 1000,
        title: 'Integración con Yape',
        description: 'Definir la experiencia de pago y el flujo de confirmación para pasajeros y conductores.',
        priority: 'medium', assigneeId: 'usr-rodrigo', participantIds: ['usr-edinson'],
        labels: [{ id: 'payments', name: 'Pagos', color: '#f1c22d' }],
        startDate: '2026-08-05', dueDate: '2026-08-12', estimatedHours: 12, actualHours: 0,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [
          { id: 'chk-001', text: 'Revisar restricciones de integración', completed: true },
          { id: 'chk-002', text: 'Diseñar flujo de confirmación', completed: false }
        ],
        comments: [{ id: 'com-001', authorId: 'usr-edinson', text: 'Validar primero el alcance del MVP.', createdAt: '2026-08-03T18:20:00-05:00' }],
        history: [history('hist-001', 'Tarjeta creada')],
        createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-002', columnId: 'backlog', position: 2000,
        title: 'Chat con conductor', description: 'Mensajería básica para coordinar el punto de recojo.',
        priority: 'low', assigneeId: 'usr-brenda', participantIds: [],
        labels: [{ id: 'communication', name: 'Comunicación', color: '#7c69d8' }],
        startDate: '', dueDate: '2026-08-18', estimatedHours: 8, actualHours: 0,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [], comments: [], history: [history('hist-002', 'Tarjeta creada', 'usr-brenda')], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-003', columnId: 'todo', position: 1000,
        title: 'Diseño de la app', description: 'Completar las pantallas principales del prototipo móvil.',
        priority: 'high', assigneeId: 'usr-brenda', participantIds: ['usr-rodrigo'],
        labels: [{ id: 'ux', name: 'UX/UI', color: '#50a8f3' }],
        startDate: '2026-08-01', dueDate: '2026-08-08', estimatedHours: 18, actualHours: 6,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [
          { id: 'chk-003', text: 'Inicio y registro', completed: true },
          { id: 'chk-004', text: 'Solicitud de viaje', completed: false },
          { id: 'chk-005', text: 'Seguimiento del viaje', completed: false }
        ], comments: [], history: [history('hist-003', 'Tarjeta creada', 'usr-brenda')], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-004', columnId: 'analysis', position: 1000,
        title: 'Registrar conductores', description: 'Definir requisitos, validaciones y datos mínimos del conductor.',
        priority: 'medium', assigneeId: 'usr-edinson', participantIds: ['usr-rodrigo'],
        labels: [{ id: 'research', name: 'Análisis', color: '#7c69d8' }],
        startDate: '2026-08-02', dueDate: '2026-08-10', estimatedHours: 10, actualHours: 3,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [], comments: [], history: [history('hist-004', 'Tarjeta creada', 'usr-edinson')], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-005', columnId: 'development', position: 1000,
        title: 'Mapa en tiempo real', description: 'Prototipo de ubicación del conductor y estimación de llegada.',
        priority: 'high', assigneeId: 'usr-rodrigo', participantIds: ['usr-brenda'],
        labels: [{ id: 'development', name: 'Desarrollo', color: '#2f8fe9' }, { id: 'maps', name: 'Mapas', color: '#36a269' }],
        startDate: '2026-07-28', dueDate: '2026-08-09', estimatedHours: 24, actualHours: 14,
        visibility: 'internal', dependencies: ['card-taxi-003'], archived: false,
        checklist: [
          { id: 'chk-006', text: 'Permisos de ubicación', completed: true },
          { id: 'chk-007', text: 'Marcadores del mapa', completed: true },
          { id: 'chk-008', text: 'Actualizar posición', completed: false }
        ], comments: [{ id: 'com-002', authorId: 'usr-brenda', text: 'El mapa ya se adapta a móvil.', createdAt: '2026-08-03T19:10:00-05:00' }],
        history: [history('hist-005', 'Tarjeta creada'), { id: 'hist-006', type: 'moved', title: 'Movida a En desarrollo', actorId: 'usr-rodrigo', createdAt: '2026-08-02T16:00:00-05:00' }], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-006', columnId: 'review', position: 1000,
        title: 'Notificaciones push', description: 'Validar mensajes y momentos de envío en el flujo del viaje.',
        priority: 'medium', assigneeId: 'usr-brenda', participantIds: [],
        labels: [{ id: 'qa', name: 'Revisión', color: '#f59e0b' }],
        startDate: '2026-07-30', dueDate: '2026-08-06', estimatedHours: 6, actualHours: 5,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [], comments: [], history: [history('hist-007', 'Tarjeta creada', 'usr-brenda')], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-007', columnId: 'client', position: 1000,
        title: 'Validación del prototipo v2', description: 'Esperar comentarios del cliente sobre el prototipo navegable.',
        priority: 'high', assigneeId: 'usr-rodrigo', participantIds: [],
        labels: [{ id: 'client', name: 'Cliente', color: '#f1c22d' }],
        startDate: '2026-08-03', dueDate: '2026-08-07', estimatedHours: 2, actualHours: 1,
        visibility: 'client', dependencies: ['card-taxi-003'], archived: false,
        checklist: [{ id: 'chk-009', text: 'Enviar enlace de revisión', completed: true }], comments: [],
        history: [history('hist-008', 'Tarjeta creada')], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-008', columnId: 'done', position: 1000,
        title: 'Login y registro', description: 'Pantallas y validaciones iniciales completadas.',
        priority: 'low', assigneeId: 'usr-brenda', participantIds: ['usr-rodrigo'],
        labels: [{ id: 'development', name: 'Desarrollo', color: '#2f8fe9' }],
        startDate: '2026-07-20', dueDate: '2026-07-28', estimatedHours: 14, actualHours: 13,
        visibility: 'internal', dependencies: [], archived: false,
        checklist: [{ id: 'chk-010', text: 'Flujo completado', completed: true }], comments: [],
        history: [history('hist-009', 'Tarjeta creada'), { id: 'hist-010', type: 'completed', title: 'Marcada como completada', actorId: 'usr-brenda', createdAt: '2026-07-28T17:00:00-05:00' }], createdAt: now, updatedAt: now
      },
      {
        id: 'card-taxi-009', columnId: 'done', position: 2000,
        title: 'Landing page', description: 'Página informativa y CTA para captar conductores.',
        priority: 'low', assigneeId: 'usr-rodrigo', participantIds: [],
        labels: [{ id: 'marketing', name: 'Marketing', color: '#36a269' }],
        startDate: '2026-07-15', dueDate: '2026-07-24', estimatedHours: 12, actualHours: 11,
        visibility: 'client', dependencies: [], archived: false,
        checklist: [], comments: [], history: [history('hist-011', 'Tarjeta creada')], createdAt: now, updatedAt: now
      }
    ]
  }
};

export const defaultKanbanColumns = columns;

// Compatibility for the dashboard/demo service used by earlier deliveries.
export const demoKanban = Object.fromEntries(
  Object.entries(demoKanbanBoards).map(([projectId, board]) => [
    projectId,
    board.columns.map(column => ({
      id: column.id,
      name: column.name,
      cards: board.cards.filter(card => card.columnId === column.id).map(card => ({
        id: card.id,
        title: card.title,
        priority: card.priority,
        owner: 'SR',
        dueDate: card.dueDate || 'Pendiente'
      }))
    }))
  ])
);

demoKanban.default = defaultKanbanColumns.map(column => ({ id: column.id, name: column.name, cards: [] }));
