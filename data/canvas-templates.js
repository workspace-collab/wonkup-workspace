export const CANVAS_NOTE_COLORS = Object.freeze([
  { id: 'sky', name: 'Cielo', background: '#dff1ff', border: '#83c8ff', text: '#17324d' },
  { id: 'gold', name: 'Dorado', background: '#fff4c2', border: '#f1c22d', text: '#3d3211' },
  { id: 'mint', name: 'Menta', background: '#def7e8', border: '#6cc58d', text: '#173b28' },
  { id: 'rose', name: 'Coral', background: '#ffe2df', border: '#ef8d84', text: '#4a201d' },
  { id: 'violet', name: 'Violeta', background: '#eee8ff', border: '#aa98ef', text: '#2f2756' },
  { id: 'neutral', name: 'Neutral', background: '#f1f4f8', border: '#c9d1dd', text: '#243144' }
]);

const section = (id, title, prompt, tone = 'sky', colSpan = 1) => ({ id, title, prompt, tone, colSpan });

export const canvasTemplates = [
  {
    id: 'empathy-map',
    name: 'Mapa de Empatía',
    shortName: 'Empatía',
    description: 'Comprende lo que el usuario piensa, siente, ve, oye, dice y hace.',
    icon: 'users',
    color: '#50a8f3',
    category: 'Descubrimiento',
    recommendedOrder: 10,
    columns: 3,
    sections: [
      section('thinks-feels', 'Piensa y siente', '¿Qué le importa realmente? ¿Qué le preocupa y qué desea?', 'sky'),
      section('sees', 'Ve', '¿Qué observa en su entorno, mercado y comunidad?', 'mint'),
      section('hears', 'Oye', '¿Qué escucha de amigos, familia, referentes o medios?', 'violet'),
      section('says-does', 'Dice y hace', '¿Qué expresa y cómo se comporta en público?', 'gold'),
      section('pains', 'Esfuerzos y dolores', '¿Qué obstáculos, miedos, frustraciones y riesgos enfrenta?', 'rose'),
      section('gains', 'Resultados y ganancias', '¿Qué espera conseguir y cómo define el éxito?', 'mint')
    ],
    completionRule: { minimumNotes: 6, minimumSections: 4 }
  },
  {
    id: 'value-proposition',
    name: 'Lienzo de Propuesta de Valor',
    shortName: 'Propuesta de Valor',
    description: 'Conecta trabajos, dolores y alegrías del cliente con productos, aliviadores y creadores de valor.',
    icon: 'target',
    color: '#f1c22d',
    category: 'Definición',
    recommendedOrder: 20,
    columns: 3,
    sections: [
      section('customer-jobs', 'Trabajos del cliente', '¿Qué intenta lograr el cliente en su vida o trabajo?', 'sky'),
      section('customer-pains', 'Dolores', '¿Qué le molesta, limita o genera riesgos?', 'rose'),
      section('customer-gains', 'Alegrías', '¿Qué resultados y beneficios espera?', 'mint'),
      section('products-services', 'Productos y servicios', '¿Qué ofreces concretamente?', 'violet'),
      section('pain-relievers', 'Aliviadores de dolor', '¿Cómo reduces obstáculos, costos, riesgos o frustraciones?', 'gold'),
      section('gain-creators', 'Creadores de alegría', '¿Cómo produces beneficios o resultados deseados?', 'mint')
    ],
    completionRule: { minimumNotes: 6, minimumSections: 6 }
  },
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    shortName: 'Lean Canvas',
    description: 'Estructura una idea de negocio mediante problema, solución, propuesta, métricas, canales y economía.',
    icon: 'grid',
    color: '#7c69d8',
    category: 'Modelo de negocio',
    recommendedOrder: 30,
    columns: 5,
    sections: [
      section('problem', 'Problema', 'Tres problemas principales y alternativas actuales.', 'rose'),
      section('solution', 'Solución', 'Características esenciales de la solución para cada problema.', 'sky'),
      section('unique-value', 'Propuesta única de valor', 'Mensaje claro, diferente y convincente.', 'gold'),
      section('unfair-advantage', 'Ventaja especial', '¿Qué es difícil de copiar o comprar?', 'violet'),
      section('customer-segments', 'Segmentos de clientes', 'Usuarios, clientes y primeros adoptantes.', 'mint'),
      section('key-metrics', 'Métricas clave', 'Indicadores que evidencian aprendizaje y tracción.', 'sky'),
      section('channels', 'Canales', 'Cómo llegarás, venderás y atenderás.', 'violet'),
      section('cost-structure', 'Estructura de costos', 'Costos fijos, variables y críticos.', 'rose'),
      section('revenue-streams', 'Fuentes de ingreso', 'Cómo y cuánto pagará el cliente.', 'mint')
    ],
    completionRule: { minimumNotes: 9, minimumSections: 7 }
  },
  {
    id: 'business-model',
    name: 'Business Model Canvas',
    shortName: 'Modelo de Negocio',
    description: 'Diseña el modelo de negocio completo mediante nueve bloques interdependientes.',
    icon: 'briefcase',
    color: '#36a269',
    category: 'Modelo de negocio',
    recommendedOrder: 40,
    columns: 5,
    sections: [
      section('key-partners', 'Socios clave', 'Proveedores, aliados y redes necesarias.', 'violet'),
      section('key-activities', 'Actividades clave', 'Acciones esenciales para operar la propuesta.', 'sky'),
      section('value-propositions', 'Propuestas de valor', 'Beneficios que resuelven necesidades concretas.', 'gold'),
      section('customer-relationships', 'Relaciones con clientes', 'Cómo captar, atender y fidelizar.', 'rose'),
      section('customer-segments', 'Segmentos de clientes', 'Grupos de personas u organizaciones atendidas.', 'mint'),
      section('key-resources', 'Recursos clave', 'Activos humanos, físicos, intelectuales y financieros.', 'sky'),
      section('channels', 'Canales', 'Comunicación, venta, distribución y soporte.', 'violet'),
      section('cost-structure', 'Estructura de costos', 'Principales costos del modelo.', 'rose'),
      section('revenue-streams', 'Fuentes de ingreso', 'Mecanismos y precios que generan ingresos.', 'mint')
    ],
    completionRule: { minimumNotes: 9, minimumSections: 7 }
  },
  {
    id: 'prioritization',
    name: 'Matriz de Priorización',
    shortName: 'Priorización',
    description: 'Ordena ideas por impacto y esfuerzo para decidir qué ejecutar, validar o descartar.',
    icon: 'layers',
    color: '#f59e0b',
    category: 'Decisión',
    recommendedOrder: 50,
    columns: 2,
    sections: [
      section('quick-wins', 'Alto impacto · Bajo esfuerzo', 'Victorias rápidas que conviene ejecutar primero.', 'mint'),
      section('strategic-bets', 'Alto impacto · Alto esfuerzo', 'Iniciativas estratégicas que requieren planificación.', 'gold'),
      section('fill-ins', 'Bajo impacto · Bajo esfuerzo', 'Tareas complementarias para momentos disponibles.', 'sky'),
      section('avoid', 'Bajo impacto · Alto esfuerzo', 'Ideas que conviene replantear, postergar o descartar.', 'rose')
    ],
    completionRule: { minimumNotes: 4, minimumSections: 3 }
  },
  {
    id: 'pitch-canvas',
    name: 'Pitch Canvas',
    shortName: 'Pitch',
    description: 'Construye un relato persuasivo desde el gancho inicial hasta la petición final.',
    icon: 'lightbulb',
    color: '#dc5a5a',
    category: 'Comunicación',
    recommendedOrder: 60,
    columns: 3,
    sections: [
      section('hook', 'Gancho', 'Frase, dato o historia que capta atención.', 'gold'),
      section('problem', 'Problema', 'Qué ocurre, a quién afecta y por qué importa.', 'rose'),
      section('solution', 'Solución', 'Qué propones y cómo funciona.', 'sky'),
      section('market', 'Oportunidad', 'Tamaño, contexto y segmento prioritario.', 'mint'),
      section('business-model', 'Modelo', 'Cómo se crea, entrega y captura valor.', 'violet'),
      section('traction', 'Evidencia', 'Validaciones, resultados, métricas y aprendizajes.', 'mint'),
      section('competition', 'Diferenciación', 'Alternativas y ventaja relevante.', 'gold'),
      section('team', 'Equipo', 'Por qué este equipo puede ejecutarlo.', 'sky'),
      section('ask', 'Petición', 'Qué necesitas y cuál es el siguiente paso.', 'rose')
    ],
    completionRule: { minimumNotes: 9, minimumSections: 7 }
  }
];

export function getCanvasTemplate(templateId) {
  return canvasTemplates.find(template => template.id === templateId) || null;
}

export function getCanvasNoteColor(colorId) {
  return CANVAS_NOTE_COLORS.find(color => color.id === colorId) || CANVAS_NOTE_COLORS[0];
}
