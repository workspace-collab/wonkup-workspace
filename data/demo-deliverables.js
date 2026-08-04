export const demoDeliverables = [
  {
    id: 'del-taxi-prototype', workspaceId: 'w-agora', projectId: 'p-taxichurro',
    title: 'Prototipo navegable de TaxiChurro', type: 'prototype',
    description: 'Flujo principal para solicitar un mototaxi, revisar disponibilidad y confirmar el servicio.',
    status: 'in_review', visibility: 'client', priority: 'high', dueDate: '2026-08-10',
    ownerId: 'usr-brenda', ownerName: 'Brenda', archived: false,
    checklist: [
      { id: 'chk-taxi-1', label: 'Flujo de solicitud completo', done: true },
      { id: 'chk-taxi-2', label: 'Versión móvil revisada', done: true },
      { id: 'chk-taxi-3', label: 'Validación final del cliente', done: false }
    ],
    versions: [
      { id: 'ver-taxi-proto-2', number: 2, label: 'Versión 2', fileName: 'Prototipo TaxiChurro v2', fileType: 'Figma', size: '', url: 'https://www.figma.com/', notes: 'Ajustes de navegación y pantallas del conductor.', createdAt: '2026-08-03T16:20:00-05:00', createdBy: 'Brenda' },
      { id: 'ver-taxi-proto-1', number: 1, label: 'Versión 1', fileName: 'Prototipo TaxiChurro v1', fileType: 'Figma', size: '', url: 'https://www.figma.com/', notes: 'Primera propuesta navegable.', createdAt: '2026-07-29T11:00:00-05:00', createdBy: 'Brenda' }
    ],
    comments: [
      { id: 'com-taxi-1', text: 'La pantalla de confirmación se entiende bien. Falta revisar el mensaje cuando no hay conductores.', authorId: 'usr-cliente-taxi', authorName: 'Cliente TaxiChurro', role: 'client', createdAt: '2026-08-04T10:15:00-05:00' }
    ],
    history: [
      { id: 'hist-taxi-1', action: 'review_requested', label: 'Enviado a revisión del cliente', actor: 'Brenda', createdAt: '2026-08-03T16:25:00-05:00' },
      { id: 'hist-taxi-2', action: 'version_added', label: 'Versión 2 registrada', actor: 'Brenda', createdAt: '2026-08-03T16:20:00-05:00' }
    ],
    createdAt: '2026-07-29T11:00:00-05:00', updatedAt: '2026-08-04T10:15:00-05:00'
  },
  {
    id: 'del-taxi-demo', workspaceId: 'w-agora', projectId: 'p-taxichurro',
    title: 'Versión demostrativa web', type: 'website',
    description: 'Aplicación demostrativa para pruebas internas y revisión del flujo completo.',
    status: 'changes_requested', visibility: 'client', priority: 'critical', dueDate: '2026-08-18',
    ownerId: 'usr-edinson', ownerName: 'Edinson', archived: false,
    checklist: [
      { id: 'chk-demo-1', label: 'Página de inicio', done: true },
      { id: 'chk-demo-2', label: 'Solicitud de servicio', done: true },
      { id: 'chk-demo-3', label: 'Correcciones del cliente', done: false }
    ],
    versions: [
      { id: 'ver-taxi-demo-1', number: 1, label: 'Demo 1', fileName: 'TaxiChurro Demo', fileType: 'Sitio web', size: '', url: 'https://workspace-collab.github.io/wonkup-workspace/', notes: 'Primera versión funcional para revisión.', createdAt: '2026-08-02T18:00:00-05:00', createdBy: 'Edinson' }
    ],
    comments: [
      { id: 'com-demo-1', text: 'Solicitamos que el precio referencial sea más visible antes de confirmar.', authorId: 'usr-cliente-taxi', authorName: 'Cliente TaxiChurro', role: 'client', createdAt: '2026-08-04T09:40:00-05:00' }
    ],
    history: [
      { id: 'hist-demo-1', action: 'changes_requested', label: 'Cambios solicitados por el cliente', actor: 'Cliente TaxiChurro', createdAt: '2026-08-04T09:40:00-05:00' }
    ],
    createdAt: '2026-08-02T18:00:00-05:00', updatedAt: '2026-08-04T09:40:00-05:00'
  },
  {
    id: 'del-taxi-manual', workspaceId: 'w-agora', projectId: 'p-taxichurro',
    title: 'Manual breve de uso', type: 'document',
    description: 'Guía para explicar al equipo y a los usuarios cómo utilizar la versión demostrativa.',
    status: 'draft', visibility: 'client', priority: 'medium', dueDate: '2026-08-25',
    ownerId: 'usr-edinson', ownerName: 'Edinson', archived: false,
    checklist: [
      { id: 'chk-manual-1', label: 'Estructura del documento', done: true },
      { id: 'chk-manual-2', label: 'Capturas de pantalla', done: false },
      { id: 'chk-manual-3', label: 'Revisión ortográfica', done: false }
    ],
    versions: [], comments: [], history: [],
    createdAt: '2026-08-01T12:00:00-05:00', updatedAt: '2026-08-01T12:00:00-05:00'
  },
  {
    id: 'del-huellitas-research', workspaceId: 'w-agora', projectId: 'p-huellitas',
    title: 'Síntesis de investigación con familias', type: 'document',
    description: 'Hallazgos de entrevistas sobre mascotas perdidas, encontradas y procesos de adopción.',
    status: 'approved', visibility: 'client', priority: 'medium', dueDate: '2026-08-01',
    ownerId: 'usr-brenda', ownerName: 'Brenda', archived: false,
    checklist: [
      { id: 'chk-hue-1', label: 'Entrevistas consolidadas', done: true },
      { id: 'chk-hue-2', label: 'Hallazgos priorizados', done: true },
      { id: 'chk-hue-3', label: 'Aprobación del equipo', done: true }
    ],
    versions: [
      { id: 'ver-hue-1', number: 1, label: 'Documento final', fileName: 'Investigación Huellitas', fileType: 'Google Drive', size: '', url: 'https://drive.google.com/', notes: 'Resumen final de entrevistas.', createdAt: '2026-07-31T15:00:00-05:00', createdBy: 'Brenda' }
    ],
    comments: [],
    history: [
      { id: 'hist-hue-1', action: 'approved', label: 'Entregable aprobado', actor: 'Edinson', createdAt: '2026-08-01T10:00:00-05:00' }
    ],
    approvedAt: '2026-08-01T10:00:00-05:00', approvedBy: 'Edinson',
    createdAt: '2026-07-25T09:00:00-05:00', updatedAt: '2026-08-01T10:00:00-05:00'
  },
  {
    id: 'del-compraya-brand', workspaceId: 'w-agora', projectId: 'p-compraya',
    title: 'Propuesta visual de CompraYa', type: 'design',
    description: 'Sistema visual inicial para la vitrina de comercios y productos locales.',
    status: 'in_review', visibility: 'client', priority: 'medium', dueDate: '2026-08-12',
    ownerId: 'usr-rodrigo', ownerName: 'Rodrigo', archived: false,
    checklist: [
      { id: 'chk-comp-1', label: 'Paleta y tipografías', done: true },
      { id: 'chk-comp-2', label: 'Pantalla principal', done: true },
      { id: 'chk-comp-3', label: 'Aprobación de identidad', done: false }
    ],
    versions: [
      { id: 'ver-comp-1', number: 1, label: 'Propuesta 1', fileName: 'CompraYa Identidad', fileType: 'Figma', size: '', url: 'https://www.figma.com/', notes: 'Primera propuesta visual.', createdAt: '2026-08-03T12:00:00-05:00', createdBy: 'Rodrigo' }
    ],
    comments: [], history: [],
    createdAt: '2026-08-03T12:00:00-05:00', updatedAt: '2026-08-03T12:00:00-05:00'
  },
  {
    id: 'del-selvaviva-landing', workspaceId: 'w-agora', projectId: 'p-selvaviva',
    title: 'Landing de Selva Viva', type: 'website',
    description: 'Primera versión de la experiencia digital para biodiversidad y cultura de la Selva Central.',
    status: 'draft', visibility: 'client', priority: 'medium', dueDate: '2026-08-20',
    ownerId: 'usr-edinson', ownerName: 'Edinson', archived: false,
    checklist: [
      { id: 'chk-selva-1', label: 'Contenido principal', done: true },
      { id: 'chk-selva-2', label: 'Galería visual', done: false },
      { id: 'chk-selva-3', label: 'Adaptación móvil', done: false }
    ],
    versions: [], comments: [], history: [],
    createdAt: '2026-08-02T08:00:00-05:00', updatedAt: '2026-08-02T08:00:00-05:00'
  }
];
