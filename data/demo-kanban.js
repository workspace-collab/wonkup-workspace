export const demoKanban = {
  'p-taxichurro': [
    { id: 'backlog', name: 'Backlog', cards: [
      { id: 'k1', title: 'Integraci\u00f3n Yape', priority: 'medium', owner: 'RG', dueDate: '10 ago' },
      { id: 'k2', title: 'Chat con conductor', priority: 'low', owner: 'AG', dueDate: '14 ago' }
    ]},
    { id: 'todo', name: 'Por hacer', cards: [
      { id: 'k3', title: 'Dise\u00f1o de la app', priority: 'high', owner: 'BG', dueDate: '06 ago' },
      { id: 'k4', title: 'Registrar conductores', priority: 'medium', owner: 'KM', dueDate: '09 ago' }
    ]},
    { id: 'development', name: 'En desarrollo', cards: [
      { id: 'k5', title: 'Mapa en tiempo real', priority: 'high', owner: 'RG', dueDate: '07 ago' },
      { id: 'k6', title: 'Sistema de pagos', priority: 'high', owner: 'EG', dueDate: '12 ago' }
    ]},
    { id: 'review', name: 'En revisi\u00f3n', cards: [
      { id: 'k7', title: 'Notificaciones push', priority: 'medium', owner: 'BG', dueDate: '05 ago' }
    ]},
    { id: 'done', name: 'Completado', cards: [
      { id: 'k8', title: 'Login y registro', priority: 'low', owner: 'AG', dueDate: 'Listo' },
      { id: 'k9', title: 'Landing page', priority: 'low', owner: 'RG', dueDate: 'Listo' }
    ]}
  ],
  default: [
    { id: 'backlog', name: 'Backlog', cards: [{ id: 'd1', title: 'Definir nuevas tareas', priority: 'medium', owner: 'EG', dueDate: 'Pendiente' }]},
    { id: 'todo', name: 'Por hacer', cards: []},
    { id: 'development', name: 'En desarrollo', cards: []},
    { id: 'review', name: 'En revisi\u00f3n', cards: []},
    { id: 'done', name: 'Completado', cards: []}
  ]
};
