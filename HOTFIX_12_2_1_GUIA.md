# Hotfix 12.2.1 - Dashboard de colaboradores multiworkspace

## Incidencia corregida
Un usuario colaborador con proyectos asignados en mas de un workspace podia recibir `permission-denied` al abrir el dashboard. El frontend intentaba leer cada `projectId` global dentro del workspace activo, incluso cuando el proyecto pertenecia a otro workspace.

## Correccion
- Filtra los proyectos por `projectWorkspaceIds`.
- Verifica la membresia activa del usuario antes de leer el documento del proyecto.
- Aplica el mismo control al abrir un proyecto por ID.
- Actualiza la cadena de cache del frontend a `12.2.1`.

## Instalacion en Vercel
1. Descomprimir `WonkUp_Workspace_Hotfix_12_2_1_CAMBIOS.zip`.
2. Subir su contenido a la raiz del repositorio, conservando rutas y reemplazando archivos.
3. Confirmar que Vercel despliegue el commit en produccion.
4. Cerrar sesion e ingresar nuevamente con la cuenta colaboradora.
5. Abrir el dashboard de cada workspace asignado.

## Firebase
No requiere cambiar reglas de Firestore, Realtime Database ni Cloud Functions.
