# Entrega 12 — Canvas Engine colaborativo en Firebase

## Estado del paquete

Código preparado para despliegue y validación real. Realtime Database ya fue creada en `us-central1` con esta URL:

```text
https://wonkup-workspace-default-rtdb.firebaseio.com
```

La Entrega 11 queda cerrada y aprobada con el Hotfix 11.0.1.

## Alcance implementado

- `canvasMode: 'hybrid'`.
- Firestore para cuentas Firebase y `localStorage` para códigos demo.
- Adaptador Firebase completo para canvases, notas, comentarios, historial, versiones y enlaces.
- Sincronización entre navegadores mediante Firestore.
- Presencia por pestaña mediante Realtime Database.
- Enlaces públicos de solo lectura con snapshot sanitizado, vencimiento y revocación.
- Permisos basados en el rol específico del proyecto.
- Archivo lógico sin eliminación física.
- Migración 12.1 desde Cloud Foundation.
- Respaldo, simulación, confirmación doble y verificación.
- Versión de caché `12.0.0`.

## Instalación sin terminal

### 1. Respaldar la versión estable

Conserva el ZIP o una rama de la versión 11.0.1 antes de reemplazar archivos.

### 2. Subir el código

Descomprime el paquete de cambios y copia su contenido en la raíz del repositorio, respetando carpetas y reemplazando los archivos existentes.

No subas el ZIP como archivo único: GitHub Pages necesita los archivos descomprimidos.

### 3. Publicar reglas de Firestore

1. Firebase Console → Firestore Database → Reglas.
2. Reemplaza el contenido con `firebase/firestore.rules`.
3. Pulsa **Publicar**.

### 4. Publicar reglas de Realtime Database

1. Firebase Console → Realtime Database → Reglas.
2. Reemplaza el contenido con `firebase/realtime-database.rules.json`.
3. Pulsa **Publicar**.

No agregues datos manualmente en la pestaña Datos.

### 5. Esperar GitHub Pages

Espera la publicación y realiza una recarga forzada del navegador.

### 6. Diagnóstico previo

Ingresa con la cuenta Firebase superadministradora y abre **Cloud Foundation**. Pulsa **Probar conexión**. Deben aparecer disponibles:

- configuración Firebase;
- Authentication;
- perfil activo;
- Firestore;
- Realtime Database.

### 7. Migración 12.1

En Cloud Foundation → **Canvas Engine colaborativo**:

1. Pulsa **Exportar canvases** y conserva el JSON.
2. Selecciona los workspaces correctos.
3. Pulsa **Simular canvases**.
4. Confirma que no existan rutas duplicadas.
5. Revisa los conteos.
6. Pulsa **Migrar canvases**.
7. Pulsa nuevamente para confirmar la escritura.
8. No cierres ni recargues la pestaña.
9. Al finalizar, pulsa **Verificar canvases**.

El seed actual genera como referencia:

- 4 canvases;
- 11 notas;
- 5 eventos de historial;
- 4 versiones;
- 24 documentos totales;
- 0 rutas duplicadas.

Los conteos reales pueden variar si el navegador contiene canvases adicionales.

## Validación funcional

### Cuenta Firebase

1. Abre un canvas.
2. Crea una nota.
3. Modifica el texto y color.
4. Muévela a otra sección.
5. Agrega un comentario.
6. Crea un punto de control.
7. Abre el mismo canvas con otra cuenta interna o en otro navegador.
8. Confirma que los cambios aparezcan sin recargar manualmente.
9. Confirma que se muestre la presencia de participantes.

### Enlace público

1. Crea un enlace con vencimiento futuro.
2. Ábrelo en una ventana privada.
3. Confirma que solo se muestran el título, plantilla y notas.
4. Revoca el enlace.
5. Recarga la ventana privada y confirma que ya no abre.

### Código demo

1. Cierra sesión.
2. Ingresa con un código demo.
3. Confirma que los canvases siguen en modo local.
4. Crea y edita una nota.
5. Recarga y confirma que permanece en `localStorage`.

## Criterios de cierre

- Diagnóstico cloud correcto.
- Migración sin duplicados.
- Verificación con conteos esperados.
- Dos navegadores sincronizan notas y comentarios.
- Presencia visible y retirada al cerrar una pestaña.
- Enlace público vigente funciona y el revocado deja de abrir.
- Revisor, cliente e invitado no acceden al canvas interno.
- Código demo conserva el flujo local.
- Smoke test 5.9 sin regresiones.

## Reversión

Cambia temporalmente en `js/config/runtime-config.js`:

```javascript
canvasMode: 'mock'
```

No elimines colecciones ni vuelvas a ejecutar migraciones anteriores para revertir la interfaz.
