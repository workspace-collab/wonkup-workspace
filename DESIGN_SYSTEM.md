# WonkUp Workspace - Sistema visual base

## Principios

1. La identidad WonkUp debe ser reconocible sin comprometer accesibilidad.
2. Los colores de marca y los colores de acción tienen usos distintos.
3. Los componentes deben mantener métricas consistentes.
4. El color nunca será el único medio para comunicar un estado.
5. En móvil se priorizan objetivos táctiles de 44 a 48 px.

## Colores de marca

| Token | Valor | Uso |
|---|---:|---|
| `--wonkup-sky` | `#50A8F3` | Marca, fondos decorativos, gráficos y acentos |
| `--wonkup-gold` | `#F1C22D` | Acento, identidad y destacados |
| `--wonkup-navy` | `#0B142C` | Sidebar, header y texto de alto contraste |
| `--wonkup-navy-dark` | `#060C1D` | Fondos oscuros profundos |

## Colores semánticos

| Token | Valor claro | Uso |
|---|---:|---|
| `--action-primary` | `#0868B8` | Botón primario con texto blanco |
| `--success` | `#18794E` | Confirmación y estado positivo |
| `--warning` | `#805800` | Advertencias y atención |
| `--danger` | `#B42318` | Error y acción destructiva |
| `--text` | `#172033` | Texto principal |
| `--text-muted` | `#4F5F73` | Texto secundario |
| `--text-soft` | `#66758A` | Metadatos y ayuda |

No usar texto blanco pequeño sobre `#50A8F3` ni sobre `#258EE9`.

## Escala tipográfica

| Token | Tamaño | Uso |
|---|---:|---|
| `--font-size-xs` | 12 px | Metadatos mínimos |
| `--font-size-sm` | 14 px | Ayuda, badges y textos auxiliares |
| `--font-size-md` | 16 px | Texto normal y formularios |
| `--font-size-lg` | 18 px | Texto destacado |
| `--font-size-xl` | 20 px | Subtítulos |
| `--font-size-2xl` | 24 px | Encabezados de sección |
| `--font-size-3xl` | 32 px | Títulos de página |
| `--font-size-4xl` | 40 px | Títulos principales |

No utilizar texto funcional menor a 12 px.

## Radios

| Token | Tamaño | Uso |
|---|---:|---|
| `--radius-xs` | 4 px | Controles compactos |
| `--radius-sm` | 8 px | Campos y botones |
| `--radius-md` | 12 px | Tarjetas |
| `--radius-lg` | 16 px | Paneles y modales |
| `--radius-pill` | 999 px | Cápsulas y badges |

## Controles

| Nivel | Altura mínima | Uso |
|---|---:|---|
| Compacto | 32 px | Solo escritorio y baja frecuencia |
| Estándar | 40 px | Formularios y acciones secundarias |
| Táctil | 44 px | Acciones frecuentes y móvil |
| Principal móvil | 48 px | CTA principal |

Todos los objetivos deben alcanzar al menos 24 x 24 CSS px; los controles frecuentes en móvil deben alcanzar 44 x 44 px.

## Estados requeridos

Cada componente interactivo debe considerar, cuando corresponda:

- default;
- hover;
- focus-visible;
- active;
- disabled;
- loading;
- error;
- empty.

## Accesibilidad

- Texto normal: contraste mínimo 4.5:1.
- Texto grande: contraste mínimo 3:1.
- Indicador de foco visible.
- Menús con `aria-expanded` y `aria-controls`.
- Tabs activas con `aria-current=page`.
- Formularios con etiquetas y errores asociados.
- Modales con foco contenido y restaurado.
- Movimiento reducido mediante `prefers-reduced-motion`.
