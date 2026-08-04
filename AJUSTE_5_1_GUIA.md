# AJUSTE 5.1 - Canvases especializados y colaboración mejorada

## Objetivo

Corregir los bloqueantes funcionales de la Entrega 5 y adaptar cada metodología a su geometría reconocida, sin convertir los prototipos HTML independientes en dependencias del producto.

## Cambios principales

### Diseños especializados

- Business Model Canvas con la distribución tradicional de nueve bloques de Osterwalder.
- Mapa de Empatía en dos columnas y tres filas.
- Lean Canvas con su disposición de cinco columnas y fila económica inferior.
- Lienzo de Propuesta de Valor dividido entre Mapa de Valor y Perfil del Cliente.
- Matriz de Priorización con ejes Deseabilidad y Factibilidad.
- Pitch Canvas conserva su estructura de la Entrega 5.

### Edición y navegación

- Se corrigió el flujo de **Nueva nota** para que no cambie de ruta.
- El botón **Abrir** del Toolkit ahora utiliza enlaces de navegación directos.
- Se añadió Modo enfoque para ocultar la barra lateral.
- Se añadió Pantalla completa mediante Fullscreen API.

### Avance de llenado

El porcentaje ya no utiliza un mínimo genérico que podía llegar rápidamente a 100%.

```text
70% = cobertura de secciones con información
30% = profundidad de notas según la meta de cada plantilla
```

### Compartir

- Vigencia de 1, 7, 15 o 30 días.
- Fecha y hora personalizada.
- Copia de enlace con respaldo cuando Clipboard API falla.
- Código QR visible.
- Lista de enlaces emitidos.
- Revocación de enlaces.

En modo mock, los datos continúan en el navegador que creó el enlace. El QR se genera visualmente, pero el acceso desde otro dispositivo requiere Firebase o un backend compartido.

### Exportación

- **Resumen A4 horizontal:** prioriza una sola hoja y limita contenido excedente.
- **Detalle A4 horizontal:** conserva toda la información y permite continuar en varias páginas.

### Historial y versiones

- Actividad separada de versiones restaurables.
- Puntos de control manuales.
- Hasta 20 snapshots locales.
- Restauración exclusiva para superadministrador.
- Restaurar una versión crea una versión nueva y respalda el estado actual.

## Configuración

Mantén:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

## Actualización en GitHub

1. Descarga el paquete de cambios.
2. Descomprímelo.
3. En GitHub usa **Add file > Upload files**.
4. Sube el contenido, permitiendo reemplazar archivos.
5. Commit recomendado:

```text
Ajuste 5.1: canvases especializados, QR y versiones
```

6. Espera GitHub Pages y recarga con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Pruebas prioritarias

- Abrir Mapa de Empatía y agregar una nota sin cambiar de ruta.
- Volver al Toolkit y abrir el mismo canvas nuevamente.
- Crear un BMC y verificar los nueve bloques en su posición.
- Crear Lean Canvas, Propuesta de Valor y Matriz de Priorización.
- Mover notas entre secciones.
- Confirmar que el porcentaje cambia al agregar y eliminar notas.
- Activar Modo enfoque.
- Activar Pantalla completa y salir con Escape.
- Generar enlace de 1 día y enlace con fecha personalizada.
- Copiar enlace.
- Visualizar QR.
- Revocar enlace.
- Exportar Resumen A4 y Detalle A4.
- Crear punto de control.
- Modificar notas y restaurar una versión como superadministrador.
- Confirmar que Pitch Canvas conserva su estructura.
