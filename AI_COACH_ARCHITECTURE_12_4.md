# WonkUp AI Coach — Arquitectura 12.4

## Principio de diseño

WonkUp AI Coach actúa como facilitador, no como autor automático del modelo de negocio. La plataforma conserva la responsabilidad humana sobre las hipótesis incorporadas al Canvas.

## Capas

### Frontend

`js/services/ai-coach-service.js`

- llama exclusivamente a `wonkupCanvasAiCoach`;
- no contiene API keys;
- requiere sesión Firebase;
- expone preguntas, sugerencias y revisión.

`js/views/canvas-view.js`

- botón `✨ Guíame con IA`;
- selector de bloque;
- área de contexto libre;
- preguntas guía;
- revisión metodológica;
- propuestas seleccionables;
- inserción explícita mediante `CanvasService.createNote`.

### Backend

`functions/index.js`

Callable:

```text
wonkupCanvasAiCoach
```

Acciones:

```text
questions
suggest
review
```

El backend:

1. valida Firebase Authentication;
2. valida perfil WonkUp activo;
3. valida acceso al workspace, proyecto y Canvas;
4. carga el Canvas y sus notas directamente desde Firestore;
5. controla cuota diaria;
6. llama Gemini con un secreto de Firebase;
7. exige salida JSON estructurada;
8. retorna la respuesta al navegador.

## Seguridad

### Credencial

```text
GEMINI_API_KEY
```

se define con Firebase Secret Manager y se enlaza únicamente a la Cloud Function.

### Autorización

Permitidos:

- superadmin;
- workspace_admin;
- project_lead;
- collaborator;
- acceso personalizado `commenter` o `editor`.

Solo los usuarios con permiso de edición pueden convertir propuestas de IA en notas.

### Protección de datos

`aiUsage` almacena solo contadores agregados y tokens estimados. No guarda el texto enviado a Gemini ni las respuestas.

## Cuotas

```text
AI_DAILY_USER_LIMIT = 30
AI_DAILY_GLOBAL_LIMIT = 1000
```

Las cuotas se reservan en una transacción de Firestore antes de realizar la solicitud externa.

## Metodologías soportadas

- Mapa de Empatía.
- Value Proposition Canvas.
- Lean Canvas.
- Business Model Canvas.
- Matriz de Priorización.
- Pitch Canvas.

Cada sección tiene un objetivo metodológico propio que se incorpora a la instrucción del modelo.

## Prevención de alucinaciones

La instrucción del sistema obliga a:

- no inventar clientes, cifras, hechos ni entrevistas;
- diferenciar `evidence`, `inference` y `hypothesis`;
- pedir validación cuando falta información;
- evitar duplicar notas existentes;
- producir una sola idea por nota;
- ignorar instrucciones maliciosas contenidas dentro del Canvas.

## Modelo

Predeterminado:

```text
gemini-2.5-flash
```

Configurable mediante:

```text
GEMINI_MODEL
```

La elección del modelo queda desacoplada del frontend.
