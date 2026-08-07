# Ajuste 12.3 — Colaboración de Canvas por enlace autenticado

## Resultado

El botón **Compartir** permite conceder acceso a una persona con Cuenta WonkUp activa mediante uno de tres permisos:

- Solo lectura.
- Comentarista.
- Editor en tiempo real.

También conserva el enlace público anónimo de solo lectura.

## Instalación

### 1. Respaldo

Conserva la versión 12.2.1 y no repitas la migración de Canvas.

### 2. Actualizar GitHub/Vercel

Descomprime `WonkUp_Workspace_Ajuste_12_3_CAMBIOS.zip` y sube su contenido a la raíz del repositorio. Vercel debe desplegar automáticamente la rama de producción.

Commit sugerido:

```text
Ajuste 12.3: permisos lector, comentarista y editor en Canvas
```

### 3. Desplegar funciones y reglas

En Cloud Shell:

```bash
cd ~/wonkup-workspace
git pull
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules --project wonkup-workspace
```

Deben quedar desplegadas las cinco funciones de Canvas Share Access.

### 4. Validación funcional

1. Ingresa como superadministrador, administrador de workspace o líder del proyecto.
2. Abre un Canvas y pulsa **Compartir**.
3. En Personas con acceso, escribe el correo de una Cuenta WonkUp activa.
4. Selecciona Lector, Comentarista o Editor.
5. Copia el enlace personalizado.
6. Abre el enlace en otro navegador e inicia sesión con esa cuenta.
7. Confirma el comportamiento según la matriz de permisos.
8. Cambia el permiso y comprueba que el nuevo alcance se aplique.
9. Revoca el acceso y confirma que el enlace deje de abrir.

## Criterios de aceptación

- El enlace no funciona con una cuenta diferente.
- El lector no puede comentar ni editar.
- El comentarista puede comentar sin editar notas.
- El editor puede crear, editar, mover, cambiar color y archivar notas.
- Los cambios aparecen sin recargar en otra sesión abierta.
- La presencia muestra las conexiones activas.
- La revocación es inmediata.
- El enlace público continúa siendo anónimo y de solo lectura.

## Archivos principales

- `functions/index.js`
- `firebase/firestore.rules`
- `js/adapters/firebase-canvas-adapter.js`
- `js/services/canvas-service.js`
- `js/utils/permissions.js`
- `js/views/canvas-view.js`
- `js/views/access-view.js`
- `js/app.js`
- `css/components.css`
