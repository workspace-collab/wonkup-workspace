export const CANVAS_NOTE_COLORS = Object.freeze([
  { id: 'sky', name: 'Cielo', background: '#dff1ff', border: '#83c8ff', text: '#17324d' },
  { id: 'gold', name: 'Dorado', background: '#fff4c2', border: '#f1c22d', text: '#3d3211' },
  { id: 'mint', name: 'Menta', background: '#def7e8', border: '#6cc58d', text: '#173b28' },
  { id: 'rose', name: 'Coral', background: '#ffe2df', border: '#ef8d84', text: '#4a201d' },
  { id: 'violet', name: 'Violeta', background: '#eee8ff', border: '#aa98ef', text: '#2f2756' },
  { id: 'neutral', name: 'Neutral', background: '#f1f4f8', border: '#c9d1dd', text: '#243144' }
]);

const section = (id, title, prompt, tone = 'sky', options = {}) => ({
  id,
  title,
  prompt,
  tone,
  emoji: options.emoji || '',
  area: options.area || id,
  group: options.group || '',
  step: options.step || '',
  colSpan: options.colSpan || 1
});

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
    layout: 'empathy',
    columns: 2,
    sections: [
      section('thinks-feels', '¿Qué piensa y siente?', 'Sus valores, preocupaciones reales, metas y aspiraciones.', 'gold', { emoji: '🧠', area: 'thinks' }),
      section('sees', '¿Qué ve?', 'Su entorno, amigos, mercado y competencia.', 'sky', { emoji: '👁️', area: 'sees' }),
      section('hears', '¿Qué oye?', 'Lo que dicen personas influyentes, familia, jefes o redes.', 'violet', { emoji: '👂', area: 'hears' }),
      section('says-does', '¿Qué dice y hace?', 'Su comportamiento en público, actitud y acciones.', 'rose', { emoji: '💬', area: 'says' }),
      section('pains', 'Esfuerzos y dolores', 'Frustraciones, obstáculos, miedos y riesgos que enfrenta.', 'rose', { emoji: '💔', area: 'pains' }),
      section('gains', 'Resultados y ganancias', 'Deseos, necesidades, medidas de éxito y metas.', 'mint', { emoji: '🏆', area: 'gains' })
    ],
    completionRule: { targetNotesPerSection: 2, sectionWeight: 0.7, depthWeight: 0.3 }
  },
  {
    id: 'value-proposition',
    name: 'Lienzo de Propuesta de Valor',
    shortName: 'Propuesta de Valor',
    description: 'Conecta el perfil del cliente con los productos, aliviadores y creadores de valor.',
    icon: 'target',
    color: '#f1c22d',
    category: 'Definición',
    recommendedOrder: 20,
    layout: 'value-proposition',
    columns: 2,
    groups: [
      { id: 'value-map', title: 'El mapa de valor', emoji: '🎁', tone: 'sky' },
      { id: 'customer-profile', title: 'El perfil del cliente', emoji: '👤', tone: 'gold' }
    ],
    sections: [
      section('products-services', 'Productos y servicios', 'Qué ofreces de forma física, digital o como servicio.', 'sky', { emoji: '💼', group: 'value-map', area: 'products' }),
      section('gain-creators', 'Creadores de alegrías', 'Cómo tus productos crean beneficios o valor adicional.', 'sky', { emoji: '📈', group: 'value-map', area: 'gain-creators' }),
      section('pain-relievers', 'Aliviadores de dolores', 'Cómo eliminas frustraciones, riesgos o molestias.', 'sky', { emoji: '💊', group: 'value-map', area: 'pain-relievers' }),
      section('customer-gains', 'Alegrías', 'Resultados positivos y beneficios que el cliente busca.', 'gold', { emoji: '🤗', group: 'customer-profile', area: 'gains' }),
      section('customer-pains', 'Dolores', 'Malos resultados, riesgos, obstáculos o temores.', 'gold', { emoji: '😕', group: 'customer-profile', area: 'pains' }),
      section('customer-jobs', 'Trabajos del cliente', 'Tareas funcionales, sociales o emocionales que intenta realizar.', 'gold', { emoji: '🗒️', group: 'customer-profile', area: 'jobs' })
    ],
    completionRule: { targetNotesPerSection: 2, sectionWeight: 0.7, depthWeight: 0.3 }
  },
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    shortName: 'Lean Canvas',
    description: 'Estructura una idea mediante problema, solución, propuesta, métricas, canales y economía.',
    icon: 'grid',
    color: '#7c69d8',
    category: 'Modelo de negocio',
    recommendedOrder: 30,
    layout: 'lean',
    columns: 10,
    sections: [
      section('problem', 'Problema', 'Los tres problemas principales del cliente objetivo.', 'gold', { emoji: '⚠️', area: 'problem', step: 'Paso 1: El problema' }),
      section('solution', 'Solución', 'Características esenciales del producto mínimo viable.', 'sky', { emoji: '⚙️', area: 'solution' }),
      section('unique-value', 'Propuesta única de valor', 'Mensaje claro que explica por qué eres diferente y valioso.', 'violet', { emoji: '💎', area: 'unique' }),
      section('unfair-advantage', 'Ventaja injusta', 'Algo difícil de copiar o comprar fácilmente.', 'violet', { emoji: '⭐', area: 'advantage' }),
      section('customer-segments', 'Segmentos / primeros adoptantes', 'Público objetivo y adoptantes tempranos.', 'sky', { emoji: '👥', area: 'segments', step: 'Paso 2: El cliente' }),
      section('key-metrics', 'Métricas clave', 'Indicadores que muestran aprendizaje y tracción.', 'sky', { emoji: '📈', area: 'metrics' }),
      section('channels', 'Canales', 'Ruta para llegar y atender a los segmentos de clientes.', 'violet', { emoji: '🚀', area: 'channels' }),
      section('cost-structure', 'Estructura de costos', 'Costos de desarrollo, marketing, personal e infraestructura.', 'rose', { emoji: '💸', area: 'costs' }),
      section('revenue-streams', 'Fuentes de ingreso', 'Suscripción, venta, comisiones u otras fuentes.', 'mint', { emoji: '💰', area: 'revenue' })
    ],
    completionRule: { targetNotesPerSection: 2, sectionWeight: 0.7, depthWeight: 0.3 }
  },
  {
    id: 'business-model',
    name: 'Business Model Canvas',
    shortName: 'Modelo de Negocio',
    description: 'Diseña el modelo de negocio mediante los nueve bloques de Osterwalder.',
    icon: 'briefcase',
    color: '#36a269',
    category: 'Modelo de negocio',
    recommendedOrder: 40,
    layout: 'business-model',
    columns: 10,
    sections: [
      section('key-partners', 'Socios clave', '¿Quiénes son nuestros socios y proveedores clave?', 'violet', { emoji: '🤝', area: 'partners' }),
      section('key-activities', 'Actividades clave', '¿Qué acciones clave requiere nuestra propuesta?', 'sky', { emoji: '🛠️', area: 'activities' }),
      section('value-propositions', 'Propuesta de valor', '¿Qué valor entregamos y qué problema resolvemos?', 'sky', { emoji: '🎁', area: 'value', step: 'Paso 2: La solución' }),
      section('customer-relationships', 'Relaciones con clientes', '¿Qué tipo de relación espera cada segmento?', 'rose', { emoji: '❤️', area: 'relationships' }),
      section('customer-segments', 'Segmentos de clientes', '¿Para quién creamos valor?', 'gold', { emoji: '👥', area: 'segments', step: 'Paso 1: El cliente' }),
      section('key-resources', 'Recursos clave', '¿Qué recursos físicos, humanos o intelectuales requerimos?', 'mint', { emoji: '🧩', area: 'resources' }),
      section('channels', 'Canales', '¿Cómo llegamos a nuestros segmentos de clientes?', 'violet', { emoji: '🚀', area: 'channels' }),
      section('cost-structure', 'Estructura de costos', '¿Cuáles son los costos más importantes del modelo?', 'rose', { emoji: '💸', area: 'costs' }),
      section('revenue-streams', 'Fuentes de ingreso', '¿Por qué valor están dispuestos a pagar?', 'mint', { emoji: '💰', area: 'revenue' })
    ],
    completionRule: { targetNotesPerSection: 2, sectionWeight: 0.7, depthWeight: 0.3 }
  },
  {
    id: 'prioritization',
    name: 'Matriz de Priorización',
    shortName: 'Priorización',
    description: 'Ordena ideas por deseabilidad y factibilidad para decidir qué implementar, investigar, validar o descartar.',
    icon: 'layers',
    color: '#f59e0b',
    category: 'Decisión',
    recommendedOrder: 50,
    layout: 'prioritization',
    columns: 2,
    axes: { vertical: 'Deseabilidad', horizontal: 'Factibilidad' },
    sections: [
      section('strategic-bets', 'Investigar', 'Muy deseable, pero difícil de implementar hoy.', 'sky', { emoji: '🕵️', area: 'investigate' }),
      section('quick-wins', 'Implementar', 'Muy deseable y fácil de construir.', 'mint', { emoji: '⚡', area: 'implement' }),
      section('avoid', 'Descartar', 'Poco deseable y difícil de realizar.', 'rose', { emoji: '🗑️', area: 'discard' }),
      section('fill-ins', 'Validar', 'Es fácil de hacer, pero no sabemos si el mercado lo desea.', 'gold', { emoji: '🧪', area: 'validate' })
    ],
    completionRule: { targetNotesPerSection: 2, sectionWeight: 0.7, depthWeight: 0.3 }
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
    layout: 'generic',
    columns: 3,
    sections: [
      section('hook', 'Gancho', 'Frase, dato o historia que capta atención.', 'gold', { emoji: '🪝' }),
      section('problem', 'Problema', 'Qué ocurre, a quién afecta y por qué importa.', 'rose', { emoji: '⚠️' }),
      section('solution', 'Solución', 'Qué propones y cómo funciona.', 'sky', { emoji: '💡' }),
      section('market', 'Oportunidad', 'Tamaño, contexto y segmento prioritario.', 'mint', { emoji: '📊' }),
      section('business-model', 'Modelo', 'Cómo se crea, entrega y captura valor.', 'violet', { emoji: '💼' }),
      section('traction', 'Evidencia', 'Validaciones, resultados, métricas y aprendizajes.', 'mint', { emoji: '📈' }),
      section('competition', 'Diferenciación', 'Alternativas y ventaja relevante.', 'gold', { emoji: '🏁' }),
      section('team', 'Equipo', 'Por qué este equipo puede ejecutarlo.', 'sky', { emoji: '👥' }),
      section('ask', 'Petición', 'Qué necesitas y cuál es el siguiente paso.', 'rose', { emoji: '🎯' })
    ],
    completionRule: { targetNotesPerSection: 1, sectionWeight: 0.7, depthWeight: 0.3 }
  }
];

export function getCanvasTemplate(templateId) {
  return canvasTemplates.find(template => template.id === templateId) || null;
}

export function getCanvasNoteColor(colorId) {
  return CANVAS_NOTE_COLORS.find(color => color.id === colorId) || CANVAS_NOTE_COLORS[0];
}
