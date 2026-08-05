# TEST RESULTS - ENTREGA 7

## Verificaciones completadas

- Sintaxis JavaScript: aprobada en 68 archivos.
- Importaciones relativas: aprobadas.
- Balance de llaves CSS: aprobado.
- Importación aislada de `finance-view.js`: aprobada.
- Integridad del adaptador mock: aprobada.
- Cálculos de facturación: aprobados.
- Cálculos de costos y horas: aprobados.
- Persistencia de configuración: aprobada.
- Restricción de ingresos para colaborador: aprobada.
- Restricción de costos para colaborador: aprobada.
- Filtrado de horas propias: aprobado.
- Acceso de líder de proyecto: aprobado.
- Restricción de rentabilidad para líder: aprobada.
- Acceso completo de superadministrador: aprobado.

## Prueba funcional del adaptador

Resultado:

```json
{
  "status": "passed",
  "totalBillable": 9000,
  "received": 5200,
  "directCosts": 1310,
  "actualHours": 70,
  "collaboratorOwnHours": 48,
  "alerts": 1
}
```

## Revisión visual automatizada

No se pudo ejecutar la aplicación en Chromium porque la política administrada del entorno bloquea tanto `127.0.0.1` como enlaces `file://`. El navegador devolvió:

```text
Your organization doesn't allow you to view this site
```

Por ello, la revisión visual y los clics reales deben validarse en GitHub Pages. No se considera aprobada visualmente hasta la confirmación del usuario.
