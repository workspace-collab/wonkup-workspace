# Firebase sin terminal — Ruta operativa

Esta guía usa únicamente:

- Firebase Console;
- GitHub desde el navegador;
- la propia pantalla Cloud Foundation de WonkUp Workspace.

## Etapa 1 — Publicar la Entrega 9 sin cambiar los datos

1. Sube el paquete de cambios directamente a la raíz del repositorio.
2. Conserva inicialmente:

```javascript
authMode: 'mock',
projectMode: 'mock',
foundationMode: 'diagnostic'
```

3. Comprueba que los códigos demo y todos los módulos anteriores continúan funcionando.
4. Ingresa con `WONKUP-ADMIN` y abre **Cloud Foundation**.

## Etapa 2 — Crear el proyecto Firebase

1. Abre Firebase Console.
2. Crea un proyecto exclusivo para WonkUp Workspace.
3. Google Analytics puede dejarse desactivado durante el piloto.
4. Registra una aplicación Web.
5. No actives Firebase Hosting; el frontend seguirá publicado en GitHub Pages.
6. Copia el objeto de configuración Web.

## Etapa 3 — Crear Cloud Firestore

1. Abre **Firestore Database**.
2. Selecciona modo de producción.
3. Para usuarios principalmente en Perú, la recomendación inicial es la región regional `southamerica-west1` — Santiago, salvo que el proyecto ya tenga otra ubicación predeterminada vinculada.
4. Revisa la decisión antes de crearla: la ubicación de una instancia no se puede cambiar después.
5. Abre **Rules**.
6. Copia el contenido de `firebase/firestore.rules`.
7. Publica las reglas.
8. Los índices compuestos de esta entrega son cero; `firebase/firestore.indexes.json` lo documenta.

## Etapa 4 — Activar Authentication

1. Abre **Authentication**.
2. En proveedores de acceso, habilita **Correo electrónico/contraseña**.
3. En configuración, define una política de contraseña. Recomendación piloto:
   - mínimo 10 caracteres;
   - mayúscula;
   - minúscula;
   - número;
   - símbolo.
4. Crea la primera cuenta administrativa.
5. Copia su UID.

## Etapa 5 — Crear el perfil superadmin

1. Abre Firestore > Data.
2. Crea la colección `users`.
3. Usa el UID de Authentication como ID del documento.
4. Copia los campos de `firebase/BOOTSTRAP_SUPERADMIN.json`.
5. Sustituye UID, correo, nombre, iniciales y fechas.
6. Verifica:

```text
role = superadmin
status = active
workspaceIds = ["*"]
projectIds = ["*"]
schemaVersion = 12
```

## Etapa 6 — Configurar WonkUp en modo diagnóstico

Edita `js/config/runtime-config.js` desde GitHub:

```javascript
authMode: 'hybrid',
projectMode: 'mock',
foundationMode: 'diagnostic'
```

Pega dentro de `firebase` únicamente los campos públicos mostrados por Firebase Console. Mantén:

```javascript
enableAppCheck: false,
enablePersistentCache: false
```

Guarda con un commit y espera GitHub Pages.

## Etapa 7 — Diagnosticar

1. Ingresa a WonkUp con la cuenta Firebase creada.
2. Abre **Cloud Foundation**.
3. Presiona **Probar conexión**.
4. Deben aparecer correctos:
   - configuración;
   - Firebase SDK;
   - aplicación;
   - Authentication;
   - perfil;
   - Firestore.
5. Un aviso por App Check desactivado es esperado en esta etapa.

## Etapa 8 — Respaldar y migrar

1. Presiona **Exportar respaldo** y conserva el JSON.
2. Selecciona los workspaces.
3. Mantén seleccionados inicialmente:
   - Workspaces;
   - Proyectos;
   - Clientes;
   - Personas;
   - Miembros de proyecto.
4. Presiona **Simular migración**.
5. Comprueba:
   - cantidad esperada;
   - cero rutas duplicadas;
   - workspaces correctos.
6. Presiona **Migrar a Firestore**.
7. La migración trabaja en lotes de hasta 400 documentos y usa actualización con `merge`, por lo que puede repetirse sin generar otra ruta para el mismo registro.
8. Presiona **Verificar datos**.

## Etapa 9 — Activar modo híbrido

Cuando la verificación sea correcta, cambia:

```javascript
authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
deliverableMode: 'hybrid',
canvasMode: 'hybrid',
foundationMode: 'connected'
```

Comportamiento:

- acceso por código: datos locales;
- acceso por cuenta Firebase: Proyectos, Kanban, Entregables y Canvas en Firestore; presencia Canvas en Realtime Database.

Prueba el mismo usuario Firebase desde dos navegadores o dispositivos. Crea o edita un proyecto en uno y confirma el cambio en el otro después de recargar.

## Etapa 10 — Activar usuarios reales

Para cada persona:

1. crea la cuenta en Authentication;
2. copia el UID;
3. abre Cloud Foundation > **Activar usuarios reales**;
4. completa correo, nombre y rol;
5. selecciona workspace y proyectos;
6. vincula una persona existente cuando corresponda;
7. presiona **Simular permisos**;
8. revisa las escrituras;
9. presiona **Activar usuario**.

## App Check — después de validar

No actives enforcement durante la primera conexión.

1. crea una clave de sitio reCAPTCHA Enterprise para el dominio de GitHub Pages;
2. registra la app en App Check;
3. pega `appCheckSiteKey`;
4. cambia `enableAppCheck` a `true`;
5. observa métricas;
6. activa enforcement cuando las solicitudes legítimas aparezcan verificadas.

## Reversión

Ante un problema operativo, cambia inmediatamente:

```javascript
authMode: 'mock',
projectMode: 'mock',
foundationMode: 'diagnostic'
```

La aplicación vuelve a los datos locales. Los documentos ya migrados permanecen en Firestore y pueden revisarse sin afectar el modo mock.

## Etapa 11 — Activar Realtime Database para la Entrega 12

1. Abre Firebase Console → Realtime Database.
2. Crea la base en modo bloqueado.
3. La instancia operativa de WonkUp es:

```text
https://wonkup-workspace-default-rtdb.firebaseio.com
```

4. Abre **Reglas**.
5. Copia `firebase/realtime-database.rules.json` y publica.
6. No agregues nodos manualmente en **Datos**.

## Etapa 12 — Migrar Canvas Engine

1. Sube el código 12.0.0.
2. Publica `firebase/firestore.rules`.
3. Publica `firebase/realtime-database.rules.json`.
4. Ingresa con la cuenta Firebase superadministradora.
5. Cloud Foundation → **Probar conexión**.
6. Confirma Firestore y Realtime Database.
7. En **Migración 12.1**:
   - exporta el respaldo de canvases;
   - selecciona workspaces;
   - simula la migración;
   - comprueba cero rutas duplicadas;
   - ejecuta y confirma;
   - verifica los conteos.
8. Prueba un mismo canvas desde dos navegadores.
9. Prueba un enlace público en ventana privada y luego revócalo.

### Reversión del Canvas

```javascript
canvasMode: 'mock'
```

Esta reversión cambia la fuente visible, pero no elimina los documentos migrados.

