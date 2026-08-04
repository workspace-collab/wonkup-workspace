import { AccessService } from '../services/access-service.js';
import { setSession, setState } from '../state/store.js';
import { getDefaultRoute } from '../utils/permissions.js';
import { escapeHtml } from '../utils/format.js';
import { icon } from '../utils/icons.js';

export function renderAccess(container, options = {}) {
  const demoCodes = AccessService.getDemoCodes();
  const reason = options.reason === 'expired'
    ? '<div class="auth-alert">Tu sesión terminó. Ingresa nuevamente para continuar.</div>'
    : '';

  container.innerHTML = `
    <section class="auth-page">
      <div class="auth-decoration auth-decoration-one"></div>
      <div class="auth-decoration auth-decoration-two"></div>

      <div class="auth-layout-grid">
        <article class="auth-intro">
          <div class="auth-brand">
            <span class="auth-brand-logo"><img src="./assets/brand/logo-wonkup.png" alt="" onerror="this.remove(); this.parentElement.textContent='W';"></span>
            <div><strong>WonkUp Workspace</strong><small>Innovación y gestión de proyectos</small></div>
          </div>
          <span class="auth-kicker">ENTREGA 2 · ACCESO Y WORKSPACES</span>
          <h1>Todo tu portafolio, conectado en un solo lugar.</h1>
          <p>Ingresa con un código autorizado para acceder únicamente a los workspaces y proyectos asignados a tu rol.</p>
          <div class="auth-benefits">
            <span>${icon('briefcase')} Gestión multiworkspace</span>
            <span>${icon('shield')} Accesos con alcance y vencimiento</span>
            <span>${icon('users')} Roles internos y de cliente</span>
            <span>${icon('activity')} Sesión temporal en el navegador</span>
          </div>
        </article>

        <article class="auth-card">
          <div class="auth-card-header">
            <span class="auth-lock">${icon('lock')}</span>
            <div><h2>Acceder al Workspace</h2><p>Usa tu enlace o código de invitación.</p></div>
          </div>
          ${reason}
          <form id="access-form" novalidate>
            <label class="form-field" for="access-code">
              <span>Código de acceso</span>
              <input class="input auth-input" id="access-code" name="accessCode" autocomplete="one-time-code" placeholder="Ejemplo: WONKUP-ADMIN" required>
            </label>
            <div class="form-error hidden" id="access-error" role="alert"></div>
            <button class="button button-primary auth-submit" id="access-submit" type="submit">
              <span>Ingresar</span>${icon('arrowRight')}
            </button>
          </form>
          <p class="auth-security-note">El código se intercambia por una sesión temporal y no se guarda en el navegador.</p>

          ${demoCodes.length ? `
            <div class="demo-access">
              <div class="demo-access-title"><strong>Códigos de demostración</strong><span>Modo local</span></div>
              <div class="demo-code-list">
                ${demoCodes.map(item => `
                  <button class="demo-code" type="button" data-demo-code="${escapeHtml(item.code)}">
                    <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>
                    <code>${escapeHtml(item.code)}</code>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </article>
      </div>
    </section>`;

  const form = container.querySelector('#access-form');
  const input = container.querySelector('#access-code');
  const submit = container.querySelector('#access-submit');
  const errorBox = container.querySelector('#access-error');

  container.querySelectorAll('[data-demo-code]').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.dataset.demoCode;
      input.focus();
      errorBox.classList.add('hidden');
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const code = input.value.trim();
    if (!code) {
      showError('Escribe un código de acceso.');
      input.focus();
      return;
    }

    setLoading(true);
    try {
      const session = await AccessService.exchangeCode(code);
      setSession(session);
      const firstWorkspace = session.scopes?.workspaceIds?.find(id => id !== '*') || 'all';
      setState({ selectedWorkspaceId: firstWorkspace, sidebarOpen: false });
      location.hash = getDefaultRoute(session);
    } catch (error) {
      showError(error.message || 'No se pudo validar el acceso.');
    } finally {
      setLoading(false);
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function setLoading(loading) {
    submit.disabled = loading;
    submit.innerHTML = loading
      ? '<span class="spinner"></span><span>Validando...</span>'
      : `<span>Ingresar</span>${icon('arrowRight')}`;
  }
}
