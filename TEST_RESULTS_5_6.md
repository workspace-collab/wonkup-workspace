# Resultados de prueba - Ajuste 5.6

## Entorno

- Chromium headless.
- Grafo completo de módulos del repositorio real.
- Adaptadores mock.
- Resolución: 1600 x 1100.
- Ruta exacta de TaxiChurro.

## Flujo ejecutado

```text
WONKUP-ADMIN
Proyecto TaxiChurro
Pestaña Canvases
Abrir Lean Canvas
Activar pantalla completa
```

## Prueba de estrés

| Prueba | Resultado |
|---|---|
| Ruta inicial correcta | APROBADA |
| Motor visible 5.6.0 | APROBADA |
| Pantalla completa activa | APROBADA |
| Crear 20 notas consecutivas | APROBADA |
| Permanecer en el mismo hash después de cada alta | APROBADA |
| Mantener visible el canvas después de cada alta | APROBADA |
| Mover la misma nota 20 veces | APROBADA |
| Permanecer en el mismo hash después de cada movimiento | APROBADA |
| Mantener visible el canvas después de cada movimiento | APROBADA |
| Editar con el lápiz después de mover | APROBADA |
| Volver a renderizar la ruta y conservar la nota | APROBADA |
| Errores JavaScript durante el flujo | 0 |

## Comando reproducible

Requiere Python, Playwright y Chromium:

```bash
python3 tests/canvas-engine-smoke.py
```

## Alcance

Esta prueba valida el repositorio y el flujo funcional en Chromium. La publicación final en GitHub Pages debe comprobarse después de subir los archivos, porque el entorno de desarrollo no puede navegar directamente a servidores locales o a GitHub Pages.
