# ENTREGA 8 - Dashboard ejecutivo y reportes

## Objetivo

Consolidar la información operativa, financiera y de entregables de WonkUp Workspace en un dashboard ejecutivo y un módulo de reportes exportables.

## Incluye

- Dashboard ejecutivo por workspace y Panel Maestro.
- Indicadores de proyectos, avance, riesgos, entregables, horas y finanzas.
- Detección de proyectos que requieren atención.
- Próximos vencimientos de tareas y entregables.
- Tendencia mensual de ingresos, costos y horas.
- Comparativo de proyectos.
- Reporte de entregables.
- Reporte financiero restringido a administradores.
- Filtros por periodo y estado del proyecto.
- Exportación a CSV.
- Impresión y guardado como PDF en formato A4 horizontal.
- Restricciones por rol y alcance.
- Actualización automática cuando cambian Finanzas o Entregables en otra pestaña.

## Configuración vigente

Mantén en `js/config/runtime-config.js`:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock',
reportMode: 'aggregate'
```

Los reportes no almacenan una copia separada de los datos. Se generan en tiempo real a partir de Proyectos, Entregables, Finanzas, Horas y Tareas.

## Actualización en GitHub

1. Descarga el paquete **Solo cambios, raíz directa**.
2. Descomprime el archivo.
3. Abre la raíz del repositorio `wonkup-workspace`.
4. Confirma que ves `index.html`, `js`, `css` y `data`.
5. Selecciona **Add file > Upload files**.
6. Arrastra directamente el contenido extraído.
7. Permite reemplazar los archivos existentes.
8. Usa el commit:

```text
Entrega 8: dashboard ejecutivo y reportes
```

9. Espera el despliegue de GitHub Pages.
10. Cierra la pestaña antigua, vuelve a abrir la plataforma y realiza una recarga forzada.

## Pruebas principales

### WONKUP-ADMIN

- Abrir Panel Maestro > Dashboard.
- Comprobar indicadores consolidados.
- Abrir Reportes desde el menú lateral.
- Cambiar periodo y estado.
- Alternar entre Ejecutivo, Proyectos, Entregables y Finanzas.
- Descargar CSV.
- Abrir Imprimir / PDF.
- Abrir un proyecto desde la tabla comparativa.
- Confirmar que los datos cambian al registrar un ingreso, costo, hora o entregable.

### TAXI-LIDER

- Abrir Dashboard de Ágora Education.
- Abrir Reportes.
- Comprobar indicadores operativos y horas.
- Confirmar que el reporte financiero y la rentabilidad no aparecen.
- Exportar CSV sin columnas financieras privadas.

### Cliente e invitado

- Confirmar que Reportes no aparece en el menú.
- Confirmar que una URL directa a Reportes muestra acceso restringido.

## Criterios de cálculo

- **Proyecto en riesgo:** combina salud, bloqueo, tareas vencidas, entregables vencidos y alertas financieras.
- **Avance promedio:** promedio simple del porcentaje de los proyectos visibles.
- **Margen proyectado:** utilidad proyectada dividida entre total facturable.
- **Consumo de horas:** horas reales divididas entre horas planificadas.
- **Periodo:** limita las tendencias y movimientos cronológicos. La posición contractual y el estado actual del proyecto siguen siendo acumulados.

## Limitación del modo demostrativo

Los datos continúan en `localStorage`. Los reportes se sincronizan entre pestañas del mismo navegador, pero no entre equipos o dispositivos hasta conectar Firebase o Apps Script.
