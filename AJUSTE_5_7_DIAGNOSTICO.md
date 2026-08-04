# AJUSTE 5.7 - Diagnóstico de experiencia

## Problemas observados

- Compartir exigía generar manualmente un enlace antes de acceder al QR y la copia.
- La administración y revocación ocupaban el flujo principal.
- Exportar requería un modal adicional para una acción frecuente.
- Crear una nota siempre abría un diálogo, incluso cuando la sección ya estaba definida.
- El color estaba rotulado permanentemente dentro del post-it.
- Escape era una tecla reservada por la Fullscreen API y podía sacar al navegador de pantalla completa antes de cerrar el diálogo.

## Decisiones aplicadas

- Enlace principal automático y reutilizable.
- Opciones de vigencia y administración progresivamente reveladas.
- Impresión resumen directa; detalle disponible en configuración.
- Editor inline para notas rápidas.
- Barra contextual de colores y eliminación en hover/focus.
- Menú de tres puntos para las funciones avanzadas.
- Sustitución de fullscreen nativo por modo inmersivo CSS controlado por la aplicación.

## Alcance de revocar

Revocar no elimina el canvas. Solo invalida un enlace de consulta específico. Es útil cuando:

- el enlace fue enviado a la persona equivocada;
- terminó el plazo de revisión;
- el contenido cambió y se desea emitir un enlace nuevo;
- se necesita retirar acceso antes de la fecha de vencimiento.
