export const KANBAN_TONES = [
  'gray', 'gold', 'violet', 'sky', 'blue', 'orange', 'yellow', 'red', 'green'
];

export const kanbanTemplates = [
  {
    id: 'basic-4',
    name: 'Básico',
    description: 'Flujo simple para organizar trabajo cotidiano.',
    columns: [
      { id: 'backlog', name: 'Backlog', wipLimit: 0, tone: 'gray', isDone: false },
      { id: 'todo', name: 'Por hacer', wipLimit: 6, tone: 'gold', isDone: false },
      { id: 'doing', name: 'En curso', wipLimit: 4, tone: 'blue', isDone: false },
      { id: 'done', name: 'Completado', wipLimit: 0, tone: 'green', isDone: true }
    ]
  },
  {
    id: 'agile-5',
    name: 'Ágil',
    description: 'Incluye una etapa de revisión antes del cierre.',
    columns: [
      { id: 'backlog', name: 'Backlog', wipLimit: 0, tone: 'gray', isDone: false },
      { id: 'todo', name: 'Por hacer', wipLimit: 6, tone: 'gold', isDone: false },
      { id: 'doing', name: 'En curso', wipLimit: 4, tone: 'blue', isDone: false },
      { id: 'review', name: 'En revisión', wipLimit: 3, tone: 'orange', isDone: false },
      { id: 'done', name: 'Completado', wipLimit: 0, tone: 'green', isDone: true }
    ]
  },
  {
    id: 'digital-product-6',
    name: 'Producto digital',
    description: 'Flujo recomendado para diseño y desarrollo de productos.',
    columns: [
      { id: 'backlog', name: 'Backlog', wipLimit: 0, tone: 'gray', isDone: false },
      { id: 'analysis', name: 'Análisis', wipLimit: 4, tone: 'violet', isDone: false },
      { id: 'design', name: 'Diseño', wipLimit: 4, tone: 'sky', isDone: false },
      { id: 'development', name: 'Desarrollo', wipLimit: 5, tone: 'blue', isDone: false },
      { id: 'review', name: 'Revisión', wipLimit: 3, tone: 'orange', isDone: false },
      { id: 'done', name: 'Completado', wipLimit: 0, tone: 'green', isDone: true }
    ]
  },
  {
    id: 'wonkup-9',
    name: 'WonkUp completo',
    description: 'Flujo integral para proyectos con cliente y varias especialidades.',
    columns: [
      { id: 'backlog', name: 'Backlog', wipLimit: 0, tone: 'gray', isDone: false },
      { id: 'todo', name: 'Por hacer', wipLimit: 6, tone: 'gold', isDone: false },
      { id: 'analysis', name: 'En análisis', wipLimit: 4, tone: 'violet', isDone: false },
      { id: 'design', name: 'En diseño', wipLimit: 4, tone: 'sky', isDone: false },
      { id: 'development', name: 'En desarrollo', wipLimit: 5, tone: 'blue', isDone: false },
      { id: 'review', name: 'En revisión', wipLimit: 3, tone: 'orange', isDone: false },
      { id: 'client', name: 'Esperando cliente', wipLimit: 3, tone: 'yellow', isDone: false },
      { id: 'blocked', name: 'Bloqueado', wipLimit: 0, tone: 'red', isDone: false },
      { id: 'done', name: 'Completado', wipLimit: 0, tone: 'green', isDone: true }
    ]
  }
];

export function getKanbanTemplate(templateId) {
  return kanbanTemplates.find(template => template.id === templateId) || kanbanTemplates[0];
}
