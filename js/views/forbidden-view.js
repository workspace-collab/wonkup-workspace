import { icon } from '../utils/icons.js';
import { getDefaultRoute } from '../utils/permissions.js';

export function renderForbidden(container, session) {
  container.innerHTML = `
    <section class="page">
      <div class="empty-state access-denied">
        <div class="empty-state-icon">${icon('lock')}</div>
        <h1>Acceso no autorizado</h1>
        <p>Tu rol no tiene permiso para abrir esta sección o el recurso no forma parte de tu invitación.</p>
        <a class="button button-primary" href="${getDefaultRoute(session)}">Volver a mi espacio</a>
      </div>
    </section>`;
}
