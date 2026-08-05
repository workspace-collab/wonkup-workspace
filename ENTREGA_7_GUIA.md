# ENTREGA 7 - Finanzas, horas y rentabilidad

## Objetivo

Agregar control financiero por proyecto sin exponer costos internos al cliente y sin acoplar el nuevo módulo al núcleo de la aplicación.

## Funcionalidades

- Configuración comercial por proyecto.
- Moneda PEN o USD.
- Monto contratado, descuento e impuesto.
- Presupuesto interno.
- Horas planificadas y margen objetivo.
- Registro de adelantos, pagos parciales, pagos finales, ingresos adicionales y devoluciones.
- Estados pagado, pendiente, vencido y anulado.
- Registro de costos por categoría.
- Comprobantes mediante enlaces.
- Registro manual de horas.
- Temporizador de trabajo con pausa y persistencia local.
- Tarifas internas y facturables por integrante.
- Cálculo de costo laboral.
- Cálculo de utilidad y margen.
- Alertas de pagos vencidos, exceso de horas, presupuesto y margen.
- Sincronización entre pestañas mediante BroadcastChannel y localStorage.
- Adaptadores preparados para Apps Script y Firebase.

## Permisos

| Rol | Acceso |
|---|---|
| Superadministrador | Completo |
| Administrador de workspace | Completo dentro del workspace |
| Líder de proyecto | Resumen operativo, ingresos, costos y horas |
| Colaborador | Solo sus propias horas |
| Cliente | Sin acceso |
| Invitado | Sin acceso |

Las tarifas individuales, la utilidad y el margen solo se muestran a superadministradores y administradores de workspace.

## Configuración

Mantén:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock'
```

## Instalación

1. Descomprime el paquete de cambios.
2. Sube su contenido a la raíz del repositorio.
3. Permite reemplazar los archivos existentes.
4. Usa el commit:

```text
Entrega 7: finanzas, horas y rentabilidad
```

5. Espera GitHub Pages.
6. Cierra la pestaña anterior.
7. Abre nuevamente la aplicación y realiza una recarga forzada.

## Validación recomendada

### WONKUP-ADMIN

- Abrir TaxiChurro > Finanzas.
- Revisar resumen y alertas.
- Registrar y editar un ingreso.
- Anular un ingreso.
- Registrar, editar y eliminar un costo.
- Registrar horas manualmente.
- Iniciar, pausar y registrar el temporizador.
- Editar tarifas.
- Cambiar configuración.
- Revisar Rentabilidad.

### TAXI-LIDER

- Abrir TaxiChurro > Finanzas.
- Ver resumen operativo.
- Registrar ingresos, costos y horas.
- Confirmar que no aparece Rentabilidad ni Configuración.

### Cliente e invitado

- Confirmar que Finanzas no aparece.
- Confirmar que la ruta directa devuelve acceso prohibido.

## Limitaciones del modo demostrativo

- Los datos existen solo en el almacenamiento local del navegador.
- Los comprobantes se registran como enlaces.
- No se emiten facturas ni comprobantes tributarios.
- El temporizador no continúa si el dispositivo se apaga.
- La información no se sincroniza entre dispositivos hasta conectar un backend.

## Limpieza recomendada

Si en la raíz de GitHub todavía existe una carpeta accidental llamada `wonkup-workspace/` dentro del propio repositorio, elimínala manualmente. GitHub Pages usa los archivos de la raíz y esa copia antigua puede generar confusión, aunque no afecta el funcionamiento cuando la raíz está correcta.
