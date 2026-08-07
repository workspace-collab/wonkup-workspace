import { CloudFoundationService } from '../services/cloud-foundation-service.js?v=12.5.0';
import { escapeHtml } from '../utils/format.js?v=12.5.0';
import { icon } from '../utils/icons.js?v=12.5.0';
import { showToast } from '../components/toast.js?v=12.5.0';

let active = true;

function statusBadge(status) {
  const labels = { ok: 'Correcto', error: 'Error', warning: 'Pendiente', pending: 'Sin probar' };
  return `<span class="cloud-status cloud-status-${status}">${labels[status] || status}</span>`;
}

function configItem(label, value, ok = true) {
  return `<div class="cloud-config-item"><span>${ok ? icon('check') : icon('alert')}</span><div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value || 'No configurado')}</strong></div></div>`;
}

function architectureCard(iconName, title, subtitle, state) {
  return `<article class="cloud-architecture-card"><span>${icon(iconName)}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></div>${statusBadge(state)}</article>`;
}

function migrationCounts(plan) {
  const counts = plan.counts;
  return `
    <div class="cloud-count"><strong>${counts.workspaces}</strong><span>Workspaces</span></div>
    <div class="cloud-count"><strong>${counts.projects}</strong><span>Proyectos</span></div>
    <div class="cloud-count"><strong>${counts.clients}</strong><span>Clientes</span></div>
    <div class="cloud-count"><strong>${counts.people}</strong><span>Personas</span></div>
    <div class="cloud-count"><strong>${counts.projectMembers}</strong><span>Asignaciones</span></div>
    <div class="cloud-count cloud-count-total"><strong>${counts.total}</strong><span>Documentos</span></div>`;
}

function kanbanMigrationCounts(plan) {
  const counts = plan?.counts || { projectsScanned: 0, boards: 0, cards: 0, total: 0 };
  return `<div class="cloud-count"><strong>${counts.projectsScanned}</strong><span>Proyectos revisados</span></div><div class="cloud-count"><strong>${counts.boards}</strong><span>Tableros</span></div><div class="cloud-count"><strong>${counts.cards}</strong><span>Tarjetas</span></div><div class="cloud-count cloud-count-total"><strong>${counts.total}</strong><span>Documentos</span></div>`;
}

function deliverableMigrationCounts(plan) {
  const counts = plan?.counts || { projects: 0, deliverables: 0, versions: 0, comments: 0, total: 0 };
  return `<div class="cloud-count"><strong>${counts.projects}</strong><span>Proyectos</span></div><div class="cloud-count"><strong>${counts.deliverables}</strong><span>Entregables</span></div><div class="cloud-count"><strong>${counts.versions}</strong><span>Versiones</span></div><div class="cloud-count"><strong>${counts.comments}</strong><span>Comentarios</span></div><div class="cloud-count cloud-count-total"><strong>${counts.total}</strong><span>Documentos</span></div>`;
}

function canvasMigrationCounts(plan) {
  const counts = plan?.counts || { canvases: 0, notes: 0, comments: 0, versions: 0, shareLinks: 0, total: 0 };
  return `<div class="cloud-count"><strong>${counts.canvases}</strong><span>Lienzos</span></div><div class="cloud-count"><strong>${counts.notes}</strong><span>Notas</span></div><div class="cloud-count"><strong>${counts.comments}</strong><span>Comentarios</span></div><div class="cloud-count"><strong>${counts.versions}</strong><span>Versiones</span></div><div class="cloud-count"><strong>${counts.shareLinks}</strong><span>Enlaces</span></div><div class="cloud-count cloud-count-total"><strong>${counts.total}</strong><span>Documentos</span></div>`;
}

function activationCounts(plan = null) {
  const counts = plan?.counts || { profiles: 0, workspaceMemberships: 0, projectMemberships: 0, projectAssignments: 0, peopleLinks: 0, total: 0 };
  return `<div class="cloud-activation-count"><strong>${counts.profiles}</strong><span>Perfil</span></div><div class="cloud-activation-count"><strong>${counts.workspaceMemberships}</strong><span>Workspaces</span></div><div class="cloud-activation-count"><strong>${counts.projectMemberships}</strong><span>Proyectos</span></div><div class="cloud-activation-count"><strong>${counts.projectAssignments}</strong><span>Índices</span></div><div class="cloud-activation-count"><strong>${counts.peopleLinks}</strong><span>Vínculos</span></div><div class="cloud-activation-count is-total"><strong>${counts.total}</strong><span>Escrituras</span></div>`;
}

function activationRoleOptions() {
  return [
    ['workspace_admin', 'Administrador de workspace'],
    ['project_lead', 'Líder de proyecto'],
    ['collaborator', 'Colaborador'],
    ['reviewer', 'Revisor'],
    ['client', 'Cliente'],
    ['guest', 'Invitado']
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

export async function renderCloudFoundation(container, session) {
  active = true;
  const configuration = CloudFoundationService.getConfiguration();
  const preview = CloudFoundationService.getMigrationPreview();
  const kanbanPreview = CloudFoundationService.getKanbanMigrationPreview();
  const deliverablePreview = CloudFoundationService.getDeliverableMigrationPreview();
  const canvasPreview = CloudFoundationService.getCanvasMigrationPreview();
  const profileTemplate = CloudFoundationService.getBootstrapProfileTemplate();
  const activationDirectory = CloudFoundationService.getActivationDirectory();

  container.innerHTML = `
    <section class="page cloud-foundation-page">
      <header class="page-header cloud-page-header">
        <div><span class="eyebrow">AJUSTE 12.2</span><h1>Cloud Foundation</h1><p>Supervisa Firebase, migraciones y servicios seguros del Workspace.</p></div>
        <div class="cloud-header-badges"><span class="badge badge-neutral">SDK ${escapeHtml(configuration.sdkVersion)}</span><span class="badge ${configuration.configured ? 'badge-success' : 'badge-warning'}">${configuration.configured ? 'Configuración detectada' : 'Modo diagnóstico'}</span></div>
      </header>

      <div class="cloud-safety-banner">
        <span>${icon('shield')}</span>
        <div><strong>Migración controlada y reversible</strong><p>Proyectos, Kanban, Entregables y Lienzos operan en modo híbrido para cuentas Firebase. Los códigos demo conservan localStorage y Finanzas permanece local.</p></div>
      </div>

      <section class="cloud-architecture-grid" aria-label="Arquitectura objetivo">
        ${architectureCard('monitor', 'GitHub Pages', 'Frontend estático', 'ok')}
        ${architectureCard('lock', 'Firebase Authentication', configuration.authMode === 'mock' ? 'Preparado, aún inactivo' : configuration.authMode, configuration.authMode === 'mock' ? 'warning' : 'ok')}
        ${architectureCard('database', 'Cloud Firestore', ['firebase', 'hybrid'].includes(configuration.projectMode) ? `Proyectos ${configuration.projectMode} · Kanban ${configuration.kanbanMode} · Entregables ${configuration.deliverableMode} · Lienzos ${configuration.canvasMode}` : 'Preparado para migración', ['firebase', 'hybrid'].includes(configuration.projectMode) ? 'ok' : 'warning')}
        ${architectureCard('activity', 'Realtime Database', configuration.databaseConfigured ? 'Presencia colaborativa del lienzo' : 'Falta databaseURL', configuration.databaseConfigured ? 'ok' : 'warning')}
        ${architectureCard('users', 'Cloud Functions', `Usuarios e invitaciones · ${configuration.functionsRegion}`, 'ok')}
        ${architectureCard('cloud', 'Apps Script', 'Drive, Gmail y Calendar en fase posterior', 'pending')}
      </section>

      <div class="cloud-layout">
        <div class="cloud-main-column">
          <section class="panel cloud-panel" id="cloud-diagnostics-panel">
            <div class="panel-heading"><div><span class="panel-kicker">CONEXIÓN</span><h2>Diagnóstico técnico</h2><p>Comprueba configuración, SDK, identidad, reglas y acceso a Firestore.</p></div><button class="button button-primary" id="run-cloud-diagnostics" type="button">${icon('activity')} Probar conexión</button></div>
            <div class="cloud-config-grid">
              ${configItem('Proyecto Firebase', configuration.projectId || 'Pendiente', Boolean(configuration.projectId))}
              ${configItem('Auth mode', configuration.authMode, configuration.authMode !== 'mock')}
              ${configItem('Project mode', configuration.projectMode, ['firebase', 'hybrid'].includes(configuration.projectMode))}
              ${configItem('Kanban mode', configuration.kanbanMode, ['firebase', 'hybrid'].includes(configuration.kanbanMode))}
              ${configItem('Entregables mode', configuration.deliverableMode, ['firebase', 'hybrid'].includes(configuration.deliverableMode))}
              ${configItem('Modo Lienzos', configuration.canvasMode, ['firebase', 'hybrid'].includes(configuration.canvasMode))}
              ${configItem('Realtime Database', configuration.databaseURL || 'No configurada', configuration.databaseConfigured)}
              ${configItem('Functions region', configuration.functionsRegion, Boolean(configuration.functionsRegion))}
              ${configItem('App Check', configuration.appCheckEnabled ? 'Activado' : 'Pendiente', configuration.appCheckEnabled)}
              ${configItem('Caché persistente', configuration.persistentCacheEnabled ? 'Activada' : 'Desactivada', true)}
              ${configItem('Campos faltantes', configuration.missing.length ? configuration.missing.join(', ') : 'Ninguno', !configuration.missing.length)}
            </div>
            <div class="cloud-diagnostics-results" id="cloud-diagnostics-results"><div class="cloud-empty-result">Ejecuta la prueba cuando hayas completado la configuración pública de Firebase.</div></div>
          </section>

          <section class="panel cloud-panel" id="cloud-account-panel">
            <div class="panel-heading"><div><span class="panel-kicker">IDENTIDAD DE ADMINISTRACIÓN</span><h2>Cuenta Firebase para la migración</h2><p>Esta autenticación es independiente del código demo que usas para revisar el Workspace.</p></div></div>
            <div id="cloud-account-content"><div class="cloud-loading"><span class="spinner spinner-blue"></span> Consultando sesión Firebase...</div></div>
          </section>

          <section class="panel cloud-panel" id="cloud-migration-panel">
            <div class="panel-heading"><div><span class="panel-kicker">MIGRACIÓN 9.1</span><h2>Workspaces y Proyectos</h2><p>Primera migración idempotente: puede repetirse sin duplicar documentos.</p></div><span class="badge badge-neutral">Schema v9</span></div>

            <div class="cloud-backup-row"><div><strong>1. Respaldo obligatorio</strong><span>Descarga una copia JSON de los datos locales antes de migrar.</span></div><button class="button button-secondary" id="export-cloud-backup" type="button">${icon('download')} Exportar respaldo</button></div>

            <div class="cloud-migration-section">
              <strong>2. Selecciona los workspaces</strong>
              <div class="cloud-workspace-options">
                ${preview.selectedWorkspaceIds.map(workspaceId => `<label class="cloud-check-card"><input type="checkbox" data-cloud-workspace value="${escapeHtml(workspaceId)}" checked><span><strong>${escapeHtml(workspaceId)}</strong><small>Incluir en la migración</small></span></label>`).join('')}
              </div>
            </div>

            <div class="cloud-migration-section">
              <strong>3. Selecciona los conjuntos de datos</strong>
              <div class="cloud-module-options">
                <label><input type="checkbox" data-cloud-module="workspaces" checked> Workspaces</label>
                <label><input type="checkbox" data-cloud-module="projects" checked> Proyectos</label>
                <label><input type="checkbox" data-cloud-module="clients" checked> Clientes</label>
                <label><input type="checkbox" data-cloud-module="people" checked> Personas</label>
                <label><input type="checkbox" data-cloud-module="projectMembers" checked> Miembros de proyecto</label>
              </div>
            </div>

            <div class="cloud-count-grid" id="cloud-migration-counts">${migrationCounts(preview)}</div>
            <div class="cloud-migration-actions">
              <button class="button button-secondary" id="preview-cloud-migration" type="button">${icon('eye')} Simular migración</button>
              <button class="button button-primary" id="execute-cloud-migration" type="button">${icon('upload')} Migrar a Firestore</button>
              <button class="button button-secondary" id="verify-cloud-migration" type="button">${icon('check')} Verificar datos</button>
            </div>
            <div class="cloud-operation-result hidden" id="cloud-operation-result" role="status"></div>
          </section>

          <section class="panel cloud-panel" id="cloud-kanban-migration-panel">
            <div class="panel-heading"><div><span class="panel-kicker">MIGRACIÓN 10.1</span><h2>Kanban colaborativo</h2><p>Migra los tableros locales a Firestore con rutas deterministas y sincronización en tiempo real.</p></div><span class="badge badge-neutral">Schema v10</span></div>
            <div class="cloud-backup-row"><div><strong>1. Respaldo del Kanban</strong><span>Descarga los tableros y tarjetas almacenados en este navegador.</span></div><button class="button button-secondary" id="export-kanban-backup" type="button">${icon('download')} Exportar Kanban</button></div>
            <div class="cloud-migration-section">
              <strong>2. Workspaces con proyectos</strong>
              <div class="cloud-workspace-options">
                ${kanbanPreview.selectedWorkspaceIds.map(workspaceId => `<label class="cloud-check-card"><input type="checkbox" data-kanban-workspace value="${escapeHtml(workspaceId)}" checked><span><strong>${escapeHtml(workspaceId)}</strong><small>Buscar tableros locales</small></span></label>`).join('')}
              </div>
            </div>
            <div class="cloud-count-grid cloud-kanban-count-grid" id="kanban-migration-counts">${kanbanMigrationCounts(kanbanPreview)}</div>
            <div class="cloud-migration-actions">
              <button class="button button-secondary" id="preview-kanban-migration" type="button">${icon('eye')} Simular Kanban</button>
              <button class="button button-primary" id="execute-kanban-migration" type="button">${icon('upload')} Migrar Kanban</button>
              <button class="button button-secondary" id="verify-kanban-migration" type="button">${icon('check')} Verificar Kanban</button>
            </div>
            <div class="cloud-operation-result hidden" id="kanban-operation-result" role="status"></div>
          </section>

          <section class="panel cloud-panel" id="cloud-deliverable-migration-panel">
            <div class="panel-heading"><div><span class="panel-kicker">MIGRACIÓN 11.1</span><h2>Entregables y aprobaciones</h2><p>Migra versiones, comentarios, checklist y estados de aprobación a Firestore.</p></div><span class="badge badge-neutral">Schema v11</span></div>
            <div class="cloud-backup-row"><div><strong>1. Respaldo de entregables</strong><span>Descarga los entregables almacenados en este navegador antes de migrar.</span></div><button class="button button-secondary" id="export-deliverable-backup" type="button">${icon('download')} Exportar entregables</button></div>
            <div class="cloud-migration-section">
              <strong>2. Workspaces con proyectos</strong>
              <div class="cloud-workspace-options">
                ${deliverablePreview.selectedWorkspaceIds.map(workspaceId => `<label class="cloud-check-card"><input type="checkbox" data-deliverable-workspace value="${escapeHtml(workspaceId)}" checked><span><strong>${escapeHtml(workspaceId)}</strong><small>Buscar entregables locales</small></span></label>`).join('')}
              </div>
            </div>
            <div class="cloud-count-grid" id="deliverable-migration-counts">${deliverableMigrationCounts(deliverablePreview)}</div>
            <div class="cloud-migration-actions">
              <button class="button button-secondary" id="preview-deliverable-migration" type="button">${icon('eye')} Simular entregables</button>
              <button class="button button-primary" id="execute-deliverable-migration" type="button">${icon('upload')} Migrar entregables</button>
              <button class="button button-secondary" id="verify-deliverable-migration" type="button">${icon('check')} Verificar entregables</button>
            </div>
            <div class="cloud-operation-result hidden" id="deliverable-operation-result" role="status"></div>
          </section>

          <section class="panel cloud-panel" id="cloud-canvas-migration-panel">
            <div class="panel-heading"><div><span class="panel-kicker">MIGRACIÓN 12.1</span><h2>Motor de Lienzos colaborativo</h2><p>Migra lienzos, notas, comentarios, historial, versiones y enlaces sanitizados a Firestore.</p></div><span class="badge badge-neutral">Schema v12</span></div>
            <div class="cloud-backup-row"><div><strong>1. Respaldo de lienzos</strong><span>Descarga los lienzos almacenados en este navegador antes de migrar.</span></div><button class="button button-secondary" id="export-canvas-backup" type="button">${icon('download')} Exportar lienzos</button></div>
            <div class="cloud-migration-section">
              <strong>2. Workspaces con proyectos</strong>
              <div class="cloud-workspace-options">
                ${canvasPreview.selectedWorkspaceIds.map(workspaceId => `<label class="cloud-check-card"><input type="checkbox" data-canvas-workspace value="${escapeHtml(workspaceId)}" checked><span><strong>${escapeHtml(workspaceId)}</strong><small>Buscar lienzos locales</small></span></label>`).join('')}
              </div>
            </div>
            <div class="cloud-count-grid" id="canvas-migration-counts">${canvasMigrationCounts(canvasPreview)}</div>
            <div class="cloud-migration-actions">
              <button class="button button-secondary" id="preview-canvas-migration" type="button">${icon('eye')} Simular lienzos</button>
              <button class="button button-primary" id="execute-canvas-migration" type="button">${icon('upload')} Migrar lienzos</button>
              <button class="button button-secondary" id="verify-canvas-migration" type="button">${icon('check')} Verificar lienzos</button>
            </div>
            <div class="cloud-operation-result hidden" id="canvas-operation-result" role="status"></div>
          </section>

          <section class="panel cloud-panel" id="cloud-user-activation-panel">
            <div class="panel-heading"><div><span class="panel-kicker">CONTINGENCIA</span><h2>Activación manual por UID</h2><p>Usa este formulario solo para recuperar o vincular una identidad creada fuera del módulo principal.</p></div><a class="button button-primary" href="#/master/users">${icon('users')} Abrir Usuarios</a></div>
            <div class="cloud-activation-notice">${icon('alert')}<span>El flujo recomendado ahora es <strong>Administración → Usuarios</strong>. Allí WonkUp crea la cuenta y envía el correo de acceso automáticamente.</span></div>
            <form class="cloud-activation-form" id="cloud-user-activation-form" novalidate>
              <div class="cloud-activation-grid">
                <label><span>UID de Firebase *</span><input class="input" id="activation-uid" maxlength="128" placeholder="Ej. P5s...abc" required></label>
                <label><span>Correo *</span><input class="input" id="activation-email" type="email" maxlength="254" placeholder="persona@empresa.com" required></label>
                <label><span>Nombre completo *</span><input class="input" id="activation-name" maxlength="120" required></label>
                <label><span>Rol *</span><select class="select" id="activation-role">${activationRoleOptions()}</select></label>
                <label><span>Persona existente</span><select class="select" id="activation-person"><option value="">Sin vínculo de directorio</option>${activationDirectory.people.map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)} · ${escapeHtml(person.email || person.id)}</option>`).join('')}</select></label>
                <label><span>Dedicación en proyectos (%)</span><input class="input" id="activation-allocation" type="number" min="0" max="100" step="5" value="20"></label>
              </div>

              <fieldset class="cloud-activation-fieldset"><legend>Workspaces autorizados *</legend><div class="cloud-workspace-options">${activationDirectory.workspaces.map(workspace => `<label class="cloud-check-card"><input type="checkbox" data-activation-workspace value="${escapeHtml(workspace.id)}"><span><strong>${escapeHtml(workspace.name)}</strong><small>${escapeHtml(workspace.id)}</small></span></label>`).join('')}</div></fieldset>
              <fieldset class="cloud-activation-fieldset"><legend>Proyectos autorizados</legend><p>Los administradores de workspace no necesitan asignación proyecto por proyecto. Los demás roles sí.</p><div class="cloud-activation-projects">${activationDirectory.projects.map(project => `<label class="cloud-project-check" data-activation-project-card data-workspace-id="${escapeHtml(project.workspaceId)}"><input type="checkbox" data-activation-project value="${escapeHtml(project.id)}"><span><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.workspaceId)} · ${escapeHtml(project.code || project.id)}</small></span></label>`).join('')}</div></fieldset>
              <div class="form-error hidden" id="cloud-activation-error" role="alert"></div>
              <div class="cloud-activation-counts" id="cloud-activation-counts">${activationCounts()}</div>
              <div class="cloud-migration-actions"><button class="button button-secondary" id="preview-user-activation" type="button">${icon('eye')} Simular permisos</button><button class="button button-primary" id="execute-user-activation" type="button" ${configuration.configured ? '' : 'disabled title="Configura Firebase primero"'}>${icon('userPlus')} Activar usuario</button></div>
              <div class="cloud-operation-result hidden" id="cloud-activation-result" role="status"></div>
            </form>
          </section>
        </div>

        <aside class="cloud-side-column">
          <section class="panel cloud-panel cloud-steps-panel">
            <div class="panel-heading"><div><span class="panel-kicker">SIN TERMINAL</span><h2>Ruta de activación</h2></div></div>
            <ol class="cloud-steps">
              <li><span>1</span><div><strong>Crear proyecto Firebase</strong><small>Registrar la aplicación Web desde Firebase Console.</small></div></li>
              <li><span>2</span><div><strong>Completar runtime-config.js</strong><small>Pegar únicamente la configuración pública.</small></div></li>
              <li><span>3</span><div><strong>Activar Email/Password y Firestore</strong><small>Todo desde el navegador.</small></div></li>
              <li><span>4</span><div><strong>Publicar reglas</strong><small>Copiar firebase/firestore.rules en la consola.</small></div></li>
              <li><span>5</span><div><strong>Crear superadministrador</strong><small>Authentication + documento users/UID.</small></div></li>
              <li><span>6</span><div><strong>Respaldar y migrar</strong><small>Usar esta misma pantalla.</small></div></li>
              <li><span>7</span><div><strong>Activar modo híbrido</strong><small>Las cuentas Firebase usan Firestore; los códigos demo conservan localStorage.</small></div></li><li><span>8</span><div><strong>Migrar Kanban</strong><small>Tableros y tarjetas sincronizados en tiempo real.</small></div></li><li><span>9</span><div><strong>Migrar entregables</strong><small>Versiones, comentarios y aprobaciones compartidas.</small></div></li><li><span>10</span><div><strong>Migrar Lienzos</strong><small>Notas, versiones, enlaces y presencia colaborativa.</small></div></li>
            </ol>
          </section>

          <section class="panel cloud-panel">
            <div class="panel-heading"><div><span class="panel-kicker">BOOTSTRAP</span><h2>Perfil superadmin</h2><p>Crea este documento manualmente una sola vez.</p></div></div>
            <div class="cloud-code-label"><span>${escapeHtml(profileTemplate.documentPath)}</span><button type="button" data-copy-cloud="#cloud-profile-code">Copiar</button></div>
            <pre class="cloud-code" id="cloud-profile-code">${escapeHtml(JSON.stringify(profileTemplate.data, null, 2))}</pre>
          </section>

          <section class="panel cloud-panel">
            <div class="panel-heading"><div><span class="panel-kicker">ACTIVACIÓN</span><h2>Configuración final</h2><p>Se aplica solo después de migrar y verificar.</p></div></div>
            <div class="cloud-code-label"><span>runtime-config.js</span><button type="button" data-copy-cloud="#cloud-runtime-code">Copiar</button></div>
            <pre class="cloud-code" id="cloud-runtime-code">${escapeHtml(CloudFoundationService.getRuntimeSnippet())}</pre>
          </section>
        </aside>
      </div>
    </section>`;

  bindCloudEvents(container, session);
  await refreshCloudAccount(container);
}

function migrationOptions(container) {
  const workspaceIds = [...container.querySelectorAll('[data-cloud-workspace]:checked')].map(input => input.value);
  const include = {};
  container.querySelectorAll('[data-cloud-module]').forEach(input => { include[input.dataset.cloudModule] = input.checked; });
  return { workspaceIds, include };
}


function kanbanMigrationOptions(container) {
  return {
    workspaceIds: [...container.querySelectorAll('[data-kanban-workspace]:checked')].map(input => input.value)
  };
}

function deliverableMigrationOptions(container) {
  return {
    workspaceIds: [...container.querySelectorAll('[data-deliverable-workspace]:checked')].map(input => input.value)
  };
}

function canvasMigrationOptions(container) {
  return {
    workspaceIds: [...container.querySelectorAll('[data-canvas-workspace]:checked')].map(input => input.value)
  };
}

function renderDeliverablePlan(container, plan) {
  container.querySelector('#deliverable-migration-counts').innerHTML = deliverableMigrationCounts(plan);
  const result = container.querySelector('#deliverable-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Simulación de entregables preparada</strong><span>${plan.counts.deliverables} entregable(s), ${plan.counts.versions} versión(es), ${plan.counts.comments} comentario(s) y ${plan.counts.total} documentos. ${plan.duplicates.length ? `${plan.duplicates.length} rutas duplicadas detectadas.` : 'No se detectaron rutas duplicadas.'}</span>`;
}

function renderCanvasPlan(container, plan) {
  container.querySelector('#canvas-migration-counts').innerHTML = canvasMigrationCounts(plan);
  const result = container.querySelector('#canvas-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Simulación de Lienzos preparada</strong><span>${plan.counts.canvases} lienzo(s), ${plan.counts.notes} nota(s), ${plan.counts.comments} comentario(s), ${plan.counts.versions} versión(es) y ${plan.counts.total} documentos. ${plan.duplicates.length ? `${plan.duplicates.length} rutas duplicadas detectadas.` : 'No se detectaron rutas duplicadas.'}</span>`;
}

function renderKanbanPlan(container, plan) {
  container.querySelector('#kanban-migration-counts').innerHTML = kanbanMigrationCounts(plan);
  const result = container.querySelector('#kanban-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Simulación Kanban preparada</strong><span>${plan.counts.boards} tablero(s), ${plan.counts.cards} tarjeta(s) y ${plan.counts.total} documentos. ${plan.duplicates.length ? `${plan.duplicates.length} rutas duplicadas detectadas.` : 'No se detectaron rutas duplicadas.'}</span>`;
}

function renderPlan(container, plan) {
  container.querySelector('#cloud-migration-counts').innerHTML = migrationCounts(plan);
  const result = container.querySelector('#cloud-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Simulación preparada</strong><span>${plan.counts.total} documentos en ${plan.selectedWorkspaceIds.length} workspace(s). ${plan.duplicates.length ? `${plan.duplicates.length} rutas duplicadas detectadas.` : 'No se detectaron rutas duplicadas.'}</span>`;
}

async function refreshCloudAccount(container) {
  const slot = container.querySelector('#cloud-account-content');
  if (!slot || !active) return;
  const configuration = CloudFoundationService.getConfiguration();
  if (!configuration.configured) {
    slot.innerHTML = `<div class="cloud-account-warning">${icon('alert')}<div><strong>Completa primero la configuración de Firebase</strong><span>Faltan: ${escapeHtml(configuration.missing.join(', '))}.</span></div></div>`;
    return;
  }

  try {
    const account = await CloudFoundationService.getAccount();
    if (!active) return;
    if (account) {
      slot.innerHTML = `<div class="cloud-account-card"><span class="cloud-account-avatar">${escapeHtml((account.profile?.initials || account.email || 'FB').slice(0, 2).toUpperCase())}</span><div><small>Cuenta conectada</small><strong>${escapeHtml(account.profile?.name || account.email || account.uid)}</strong><span>${escapeHtml(account.email)} · ${escapeHtml(account.profile?.role || 'Perfil Firestore pendiente')}</span></div><button class="button button-secondary button-compact" id="cloud-signout" type="button">Cerrar sesión Firebase</button></div>${account.profile ? '' : `<div class="cloud-account-warning">${icon('alert')}<div><strong>Falta el perfil Firestore</strong><span>Crea el documento users/${escapeHtml(account.uid)} con la plantilla de la derecha.</span></div></div>`}`;
      slot.querySelector('#cloud-signout')?.addEventListener('click', async () => {
        await CloudFoundationService.signOut();
        showToast('Sesión Firebase cerrada.');
        await refreshCloudAccount(container);
      });
      return;
    }

    slot.innerHTML = `<form class="cloud-login-form" id="cloud-login-form" novalidate><label><span>Correo del superadministrador</span><input class="input" id="cloud-login-email" type="email" autocomplete="email" required></label><label><span>Contraseña</span><input class="input" id="cloud-login-password" type="password" autocomplete="current-password" required></label><div class="form-error hidden" id="cloud-login-error" role="alert"></div><button class="button button-primary" id="cloud-login-submit" type="submit">${icon('lock')} Conectar cuenta Firebase</button></form>`;
    const form = slot.querySelector('#cloud-login-form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = slot.querySelector('#cloud-login-email').value.trim();
      const password = slot.querySelector('#cloud-login-password').value;
      const errorBox = slot.querySelector('#cloud-login-error');
      const submit = slot.querySelector('#cloud-login-submit');
      if (!email || !password) {
        errorBox.textContent = 'Escribe correo y contraseña.';
        errorBox.classList.remove('hidden');
        return;
      }
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner"></span> Conectando...';
      errorBox.classList.add('hidden');
      try {
        await CloudFoundationService.signIn(email, password);
        showToast('Cuenta Firebase conectada.');
        await refreshCloudAccount(container);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.remove('hidden');
        submit.disabled = false;
        submit.innerHTML = `${icon('lock')} Conectar cuenta Firebase`;
      }
    });
  } catch (error) {
    slot.innerHTML = `<div class="cloud-account-warning">${icon('alert')}<div><strong>No se pudo consultar Authentication</strong><span>${escapeHtml(error.message)}</span></div></div>`;
  }
}

function activationInput(container) {
  return {
    uid: container.querySelector('#activation-uid')?.value || '',
    email: container.querySelector('#activation-email')?.value || '',
    name: container.querySelector('#activation-name')?.value || '',
    role: container.querySelector('#activation-role')?.value || 'collaborator',
    personId: container.querySelector('#activation-person')?.value || '',
    allocation: Number(container.querySelector('#activation-allocation')?.value || 0),
    workspaceIds: [...container.querySelectorAll('[data-activation-workspace]:checked')].map(input => input.value),
    projectIds: [...container.querySelectorAll('[data-activation-project]:checked:not(:disabled)')].map(input => input.value)
  };
}

function refreshActivationProjectAvailability(container) {
  const selected = new Set([...container.querySelectorAll('[data-activation-workspace]:checked')].map(input => input.value));
  container.querySelectorAll('[data-activation-project-card]').forEach(card => {
    const enabled = selected.has(card.dataset.workspaceId);
    card.classList.toggle('is-disabled', !enabled);
    const input = card.querySelector('[data-activation-project]');
    input.disabled = !enabled;
    if (!enabled) input.checked = false;
  });
}

function renderActivationPreview(container, plan) {
  container.querySelector('#cloud-activation-counts').innerHTML = activationCounts(plan);
  const result = container.querySelector('#cloud-activation-result');
  result.classList.remove('hidden', 'is-error');
  result.classList.add('is-success');
  result.innerHTML = `<strong>Plan de permisos preparado</strong><span>${plan.counts.total} escrituras para ${escapeHtml(plan.input.email)}. No se detectaron rutas duplicadas.</span><details><summary>Ver rutas Firestore</summary><pre>${escapeHtml(plan.operations.map(operation => operation.path).join('\n'))}</pre></details>`;
  const error = container.querySelector('#cloud-activation-error');
  error.classList.add('hidden');
  error.textContent = '';
}

function showActivationError(container, message) {
  const error = container.querySelector('#cloud-activation-error');
  error.textContent = message;
  error.classList.remove('hidden');
  const result = container.querySelector('#cloud-activation-result');
  result.classList.add('hidden');
}

function bindCloudEvents(container) {
  container.querySelectorAll('[data-copy-cloud]').forEach(button => {
    button.addEventListener('click', async () => {
      const target = container.querySelector(button.dataset.copyCloud);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        button.textContent = 'Copiado';
        setTimeout(() => { button.textContent = 'Copiar'; }, 1200);
      } catch {
        showToast('No se pudo copiar automáticamente. Selecciona el texto manualmente.');
      }
    });
  });

  const refreshKanbanPreview = () => renderKanbanPlan(container, CloudFoundationService.getKanbanMigrationPreview(kanbanMigrationOptions(container)));
  container.querySelectorAll('[data-kanban-workspace]').forEach(input => input.addEventListener('change', refreshKanbanPreview));
  container.querySelector('#preview-kanban-migration')?.addEventListener('click', refreshKanbanPreview);
  container.querySelector('#export-kanban-backup')?.addEventListener('click', () => {
    CloudFoundationService.exportKanbanBackup();
    showToast('Respaldo Kanban descargado.');
  });
  container.querySelector('#execute-kanban-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const options = kanbanMigrationOptions(container);
    const plan = CloudFoundationService.getKanbanMigrationPreview(options);
    const result = container.querySelector('#kanban-operation-result');
    if (!plan.counts.total) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = '<strong>No hay tableros para migrar</strong><span>Abre primero un Kanban con el código demo o selecciona otro workspace.</span>';
      return;
    }
    if (button.dataset.confirmKanban !== 'true') {
      button.dataset.confirmKanban = 'true';
      button.innerHTML = `${icon('alert')} Confirmar Kanban`;
      result.classList.remove('hidden', 'is-error', 'is-success');
      result.innerHTML = `<strong>Confirmación requerida</strong><span>Pulsa nuevamente para escribir ${plan.counts.total} documentos Kanban con merge.</span>`;
      clearTimeout(button._confirmationTimer);
      button._confirmationTimer = setTimeout(() => {
        delete button.dataset.confirmKanban;
        button.innerHTML = `${icon('upload')} Migrar Kanban`;
      }, 20000);
      return;
    }
    clearTimeout(button._confirmationTimer);
    delete button.dataset.confirmKanban;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Migrando...';
    result.classList.remove('hidden', 'is-error', 'is-success');
    result.innerHTML = `<strong>Migración Kanban en curso</strong><span>Escribiendo ${plan.counts.boards} tableros y ${plan.counts.cards} tarjetas.</span>`;
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const migrated = await CloudFoundationService.migrateKanban(options);
      result.classList.remove('is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Kanban migrado</strong><span>${migrated.plan.counts.boards} tablero(s), ${migrated.plan.counts.cards} tarjeta(s) y ${migrated.committed} escrituras confirmadas.</span>`;
      showToast('Migración Kanban completada.');
    } catch (error) {
      result.classList.remove('is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se completó la migración Kanban</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('upload')} Migrar Kanban`;
    }
  });
  container.querySelector('#verify-kanban-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const result = container.querySelector('#kanban-operation-result');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Verificando...';
    try {
      const report = await CloudFoundationService.verifyKanbanMigration(kanbanMigrationOptions(container).workspaceIds);
      const boards = report.reduce((sum, item) => sum + item.boards, 0);
      const cards = report.reduce((sum, item) => sum + item.cards, 0);
      result.classList.remove('hidden', 'is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Verificación Kanban</strong><span>${boards} tablero(s) y ${cards} tarjeta(s) encontrados en Firestore.</span><div class="cloud-verification-list">${report.map(item => `<span><b>${escapeHtml(item.workspaceName)}</b>: ${item.boards} tableros y ${item.cards} tarjetas.</span>`).join('')}</div>`;
    } catch (error) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se pudo verificar</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('check')} Verificar Kanban`;
    }
  });

  const refreshDeliverablePreview = () => renderDeliverablePlan(container, CloudFoundationService.getDeliverableMigrationPreview(deliverableMigrationOptions(container)));
  container.querySelectorAll('[data-deliverable-workspace]').forEach(input => input.addEventListener('change', refreshDeliverablePreview));
  container.querySelector('#preview-deliverable-migration')?.addEventListener('click', refreshDeliverablePreview);
  container.querySelector('#export-deliverable-backup')?.addEventListener('click', () => {
    CloudFoundationService.exportDeliverableBackup();
    showToast('Respaldo de entregables descargado.');
  });
  container.querySelector('#execute-deliverable-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const options = deliverableMigrationOptions(container);
    const plan = CloudFoundationService.getDeliverableMigrationPreview(options);
    const result = container.querySelector('#deliverable-operation-result');
    if (!plan.counts.total) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = '<strong>No hay entregables para migrar</strong><span>Crea o abre entregables con un código demo, o selecciona otro workspace.</span>';
      return;
    }
    if (button.dataset.confirmDeliverables !== 'true') {
      button.dataset.confirmDeliverables = 'true';
      button.innerHTML = `${icon('alert')} Confirmar entregables`;
      result.classList.remove('hidden', 'is-error', 'is-success');
      result.innerHTML = `<strong>Confirmación requerida</strong><span>Pulsa nuevamente para escribir ${plan.counts.total} documentos con merge.</span>`;
      clearTimeout(button._confirmationTimer);
      button._confirmationTimer = setTimeout(() => {
        delete button.dataset.confirmDeliverables;
        button.innerHTML = `${icon('upload')} Migrar entregables`;
      }, 20000);
      return;
    }
    clearTimeout(button._confirmationTimer);
    delete button.dataset.confirmDeliverables;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Migrando...';
    result.classList.remove('hidden', 'is-error', 'is-success');
    result.innerHTML = `<strong>Migración de entregables en curso</strong><span>Escribiendo ${plan.counts.deliverables} entregables.</span>`;
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const migrated = await CloudFoundationService.migrateDeliverables(options);
      result.classList.remove('is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Entregables migrados</strong><span>${migrated.plan.counts.deliverables} entregable(s) y ${migrated.committed} escrituras confirmadas.</span>`;
      showToast('Migración de entregables completada.');
    } catch (error) {
      result.classList.remove('is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se completó la migración de entregables</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('upload')} Migrar entregables`;
    }
  });
  container.querySelector('#verify-deliverable-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const result = container.querySelector('#deliverable-operation-result');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Verificando...';
    try {
      const report = await CloudFoundationService.verifyDeliverableMigration(deliverableMigrationOptions(container).workspaceIds);
      const deliverables = report.reduce((sum, item) => sum + item.deliverables, 0);
      const versions = report.reduce((sum, item) => sum + item.versions, 0);
      const comments = report.reduce((sum, item) => sum + item.comments, 0);
      result.classList.remove('hidden', 'is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Verificación de entregables</strong><span>${deliverables} entregable(s), ${versions} versión(es) y ${comments} comentario(s) encontrados en Firestore.</span><div class="cloud-verification-list">${report.map(item => `<span><b>${escapeHtml(item.workspaceName)}</b>: ${item.deliverables} entregables.</span>`).join('')}</div>`;
    } catch (error) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se pudo verificar</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('check')} Verificar entregables`;
    }
  });

  const refreshCanvasPreview = () => renderCanvasPlan(container, CloudFoundationService.getCanvasMigrationPreview(canvasMigrationOptions(container)));
  container.querySelectorAll('[data-canvas-workspace]').forEach(input => input.addEventListener('change', refreshCanvasPreview));
  container.querySelector('#preview-canvas-migration')?.addEventListener('click', refreshCanvasPreview);
  container.querySelector('#export-canvas-backup')?.addEventListener('click', () => {
    CloudFoundationService.exportCanvasBackup();
    showToast('Respaldo de lienzos descargado.');
  });
  container.querySelector('#execute-canvas-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const options = canvasMigrationOptions(container);
    const plan = CloudFoundationService.getCanvasMigrationPreview(options);
    const result = container.querySelector('#canvas-operation-result');
    if (!plan.counts.total) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = '<strong>No hay lienzos para migrar</strong><span>Abre el Toolkit con un código demo o selecciona otro workspace.</span>';
      return;
    }
    if (button.dataset.confirmCanvas !== 'true') {
      button.dataset.confirmCanvas = 'true';
      button.innerHTML = `${icon('alert')} Confirmar lienzos`;
      result.classList.remove('hidden', 'is-error', 'is-success');
      result.innerHTML = `<strong>Confirmación requerida</strong><span>Pulsa nuevamente para escribir ${plan.counts.total} documentos de Lienzos con merge.</span>`;
      clearTimeout(button._confirmationTimer);
      button._confirmationTimer = setTimeout(() => {
        delete button.dataset.confirmCanvas;
        button.innerHTML = `${icon('upload')} Migrar lienzos`;
      }, 20000);
      return;
    }
    clearTimeout(button._confirmationTimer);
    delete button.dataset.confirmCanvas;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Migrando...';
    result.classList.remove('hidden', 'is-error', 'is-success');
    result.innerHTML = `<strong>Migración de Lienzos en curso</strong><span>Escribiendo ${plan.counts.canvases} lienzos y ${plan.counts.notes} notas.</span>`;
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const migrated = await CloudFoundationService.migrateCanvas(options);
      result.classList.remove('is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Motor de Lienzos migrado</strong><span>${migrated.plan.counts.canvases} lienzo(s), ${migrated.plan.counts.notes} nota(s) y ${migrated.committed} escrituras confirmadas.</span>`;
      showToast('Migración del Motor de Lienzos completada.');
    } catch (error) {
      result.classList.remove('is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se completó la migración de Lienzos</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('upload')} Migrar lienzos`;
    }
  });
  container.querySelector('#verify-canvas-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const result = container.querySelector('#canvas-operation-result');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Verificando...';
    try {
      const report = await CloudFoundationService.verifyCanvasMigration(canvasMigrationOptions(container).workspaceIds);
      const totals = report.reduce((sum, item) => ({
        canvases: sum.canvases + item.canvases,
        notes: sum.notes + item.notes,
        comments: sum.comments + item.comments,
        versions: sum.versions + item.versions,
        shareLinks: sum.shareLinks + item.shareLinks
      }), { canvases: 0, notes: 0, comments: 0, versions: 0, shareLinks: 0 });
      result.classList.remove('hidden', 'is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Verificación de Lienzos</strong><span>${totals.canvases} lienzo(s), ${totals.notes} nota(s), ${totals.comments} comentario(s), ${totals.versions} versión(es) y ${totals.shareLinks} enlace(s) encontrados.</span><div class="cloud-verification-list">${report.map(item => `<span><b>${escapeHtml(item.workspaceName)}</b>: ${item.canvases} lienzos y ${item.notes} notas.</span>`).join('')}</div>`;
    } catch (error) {
      result.classList.remove('hidden', 'is-success');
      result.classList.add('is-error');
      result.innerHTML = `<strong>No se pudo verificar</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('check')} Verificar lienzos`;
    }
  });

  refreshActivationProjectAvailability(container);
  container.querySelectorAll('[data-activation-workspace]').forEach(input => input.addEventListener('change', () => refreshActivationProjectAvailability(container)));
  container.querySelector('#preview-user-activation')?.addEventListener('click', () => {
    try {
      renderActivationPreview(container, CloudFoundationService.getUserActivationPreview(activationInput(container)));
    } catch (error) {
      showActivationError(container, error.message);
    }
  });
  container.querySelector('#execute-user-activation')?.addEventListener('click', async event => {
    let plan;
    try {
      plan = CloudFoundationService.getUserActivationPreview(activationInput(container));
      renderActivationPreview(container, plan);
    } catch (error) {
      showActivationError(container, error.message);
      return;
    }
    const confirmed = typeof globalThis.confirm === 'function'
      ? globalThis.confirm(`Activar a ${plan.input.email} en WonkUp?\n\nSe crearán o actualizarán ${plan.counts.total} documentos. La cuenta debe existir previamente en Firebase Authentication.`)
      : true;
    if (!confirmed) return;
    const button = event.currentTarget;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Activando...';
    try {
      const result = await CloudFoundationService.activateUser(activationInput(container));
      renderActivationPreview(container, result.plan);
      const output = container.querySelector('#cloud-activation-result');
      output.innerHTML = `<strong>Usuario activado</strong><span>${escapeHtml(result.plan.input.email)} ya tiene perfil y membresías. ${result.committed} escrituras confirmadas.</span>`;
      showToast('Usuario habilitado en Cloud Foundation.');
    } catch (error) {
      showActivationError(container, error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('userPlus')} Activar usuario`;
    }
  });

  container.querySelector('#run-cloud-diagnostics')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const results = container.querySelector('#cloud-diagnostics-results');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Probando...';
    results.innerHTML = '<div class="cloud-loading"><span class="spinner spinner-blue"></span> Ejecutando diagnóstico...</div>';
    const report = await CloudFoundationService.runDiagnostics();
    if (!active) return;
    results.innerHTML = `<div class="cloud-diagnostic-list">${report.checks.map(check => `<div class="cloud-diagnostic-row"><span class="cloud-diagnostic-icon cloud-diagnostic-${check.status}">${check.status === 'ok' ? icon('check') : icon(check.status === 'error' ? 'alert' : 'clock')}</span><div><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></div>${statusBadge(check.status)}</div>`).join('')}</div><div class="cloud-diagnostic-summary ${report.ok ? 'is-success' : 'is-error'}"><strong>${report.ok ? 'Base técnica disponible' : 'Hay bloqueos pendientes'}</strong><span>Diagnóstico completado en ${report.durationMs} ms.</span></div>`;
    button.disabled = false;
    button.innerHTML = `${icon('activity')} Probar conexión`;
    await refreshCloudAccount(container);
  });

  container.querySelector('#export-cloud-backup')?.addEventListener('click', () => {
    CloudFoundationService.exportLocalBackup();
    showToast('Respaldo JSON descargado.');
  });

  const refreshPreview = () => renderPlan(container, CloudFoundationService.getMigrationPreview(migrationOptions(container)));
  container.querySelectorAll('[data-cloud-workspace], [data-cloud-module]').forEach(input => input.addEventListener('change', refreshPreview));
  container.querySelector('#preview-cloud-migration')?.addEventListener('click', refreshPreview);

  container.querySelector('#execute-cloud-migration')?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const options = migrationOptions(container);
    const plan = CloudFoundationService.getMigrationPreview(options);
    if (!plan.counts.total) {
      showOperationError(container, 'Selecciona al menos un conjunto de datos y un workspace.');
      return;
    }

    // Confirmación visible de dos pasos. Evita depender de diálogos nativos que algunos
    // navegadores ocultan o presentan fuera del área capturada por el usuario.
    if (button.dataset.confirmMigration !== 'true') {
      button.dataset.confirmMigration = 'true';
      button.innerHTML = `${icon('alert')} Confirmar migración`;
      showOperationConfirmation(container, `Pulsa nuevamente “Confirmar migración” para escribir ${plan.counts.total} documentos. La operación usa merge y no elimina información existente.`);
      globalThis.clearTimeout(button._confirmationTimer);
      button._confirmationTimer = globalThis.setTimeout(() => {
        delete button.dataset.confirmMigration;
        button.innerHTML = `${icon('upload')} Migrar a Firestore`;
      }, 20000);
      return;
    }

    globalThis.clearTimeout(button._confirmationTimer);
    delete button.dataset.confirmMigration;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Migrando...';
    showOperationPending(container, `Iniciando la escritura de ${plan.counts.total} documentos. No cierres ni recargues esta pestaña.`);

    try {
      // Permite que el navegador pinte el estado "Migrando" antes de iniciar Firestore.
      await new Promise(resolve => requestAnimationFrame(resolve));
      const result = await CloudFoundationService.migrate(options);
      showOperationSuccess(container, `Migración ${result.migrationId} completada. ${result.committed} escrituras confirmadas.`);
      showToast('Migración inicial completada.');
    } catch (error) {
      console.error('Cloud Foundation migration error', error);
      showOperationError(container, error?.message || 'No se pudo completar la migración.');
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('upload')} Migrar a Firestore`;
    }
  });

  container.querySelector('#verify-cloud-migration')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Verificando...';
    try {
      const report = await CloudFoundationService.verifyMigration(migrationOptions(container).workspaceIds);
      const result = container.querySelector('#cloud-operation-result');
      result.classList.remove('hidden', 'is-error');
      result.classList.add('is-success');
      result.innerHTML = `<strong>Verificación de Firestore</strong><div class="cloud-verification-list">${report.map(item => `<span><b>${escapeHtml(item.workspaceName || item.workspaceId)}</b>: ${item.projects} proyectos, ${item.clients} clientes y ${item.people} personas.</span>`).join('')}</div>`;
    } catch (error) {
      showOperationError(container, error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('check')} Verificar datos`;
    }
  });
}


function showOperationConfirmation(container, message) {
  const result = container.querySelector('#cloud-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Confirmación requerida</strong><span>${escapeHtml(message)}</span>`;
}

function showOperationPending(container, message) {
  const result = container.querySelector('#cloud-operation-result');
  result.classList.remove('hidden', 'is-error', 'is-success');
  result.innerHTML = `<strong>Migración en curso</strong><span>${escapeHtml(message)}</span>`;
}

function showOperationError(container, message) {
  const result = container.querySelector('#cloud-operation-result');
  result.classList.remove('hidden', 'is-success');
  result.classList.add('is-error');
  result.innerHTML = `<strong>No se completó la operación</strong><span>${escapeHtml(message)}</span>`;
}

function showOperationSuccess(container, message) {
  const result = container.querySelector('#cloud-operation-result');
  result.classList.remove('hidden', 'is-error');
  result.classList.add('is-success');
  result.innerHTML = `<strong>Operación completada</strong><span>${escapeHtml(message)}</span>`;
}

export function cleanupCloudFoundationView() {
  active = false;
}
