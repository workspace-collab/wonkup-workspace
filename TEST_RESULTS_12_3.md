# Resultados de pruebas — Ajuste 12.3

## Automatización

- Suite Node del proyecto: **52/52 pruebas aprobadas**.
- Pruebas específicas de acceso Canvas 12.3: **6/6 aprobadas**.
- Validación sintáctica de módulos JavaScript: aprobada.
- Validación sintáctica de Cloud Functions: aprobada.
- Smoke test Canvas Engine 5.9: aprobado.

## Cobertura específica

- Matriz lector/comentarista/editor.
- Cinco Cloud Functions presentes y protegidas.
- Índice privado de tokens sin acceso directo del cliente.
- Reglas de lectura, comentarios y edición granular.
- Exclusión de enlaces personalizados de snapshots públicos.
- Retorno al enlace después del inicio de sesión.
- Permanencia de enlaces públicos como solo lectura.
- Alta rápida, colores, drag-and-drop, impresión, temporizador y modo inmersivo sin regresiones.

## Pendiente de validación real

- Despliegue de Cloud Functions en `wonkup-workspace`.
- Publicación de reglas Firestore.
- Prueba con dos cuentas Firebase reales.
- Confirmación de revocación y vencimiento en producción Vercel.
