import { AccessService } from '../services/access-service.js?v=12.0.0';
import { setSession, setState } from '../state/store.js?v=12.0.0';
import { getDefaultRoute } from '../utils/permissions.js?v=12.0.0';
import { escapeHtml } from '../utils/format.js?v=12.0.0';
import { icon } from '../utils/icons.js?v=12.0.0';

export function renderAccess(container, options = {}) {
  const demoCodes = AccessService.getDemoCodes();
  const firebaseAvailable = AccessService.isFirebaseLoginAvailable();
  const firebaseStatus = AccessService.getFirebaseConfigurationStatus();
  const showAccountTab = firebaseAvailable || AccessService.authMode === 'firebase' || AccessService.authMode === 'hybrid';
  const showCodeTab = AccessService.authMode !== 'firebase';
  const defaultPanel = showCodeTab ? 'code' : 'account';
  const reason = options.reason === 'expired'
    ? '<div class="auth-alert" role="alert">Tu sesión terminó. Ingresa nuevamente para continuar.</div>'
    : '';

  container.innerHTML = `
    <section class="auth-page">
      <div class="auth-decoration auth-decoration-one"></div>
      <div class="auth-decoration auth-decoration-two"></div>

      <div class="auth-layout-grid">
        <article class="auth-intro">
          <div class="auth-brand">
            <span class="auth-brand-logo"><img src="./assets/brand/logo-wonkup.png" alt="" onerror="const p=this.parentElement; this.remove(); if(p) p.textContent='W';"></span>
            <div><strong>WonkUp Workspace</strong><small>Innovación y gestión de proyectos</small></div>
          </div>
          <span class="auth-kicker">ACCESO SEGURO</span>
          <h1>Todo tu portafolio, conectado en un solo lugar.</h1>
          <p>Ingresa únicamente a los workspaces y proyectos asignados a tu perfil.</p>
          <div class="auth-benefits" aria-label="Beneficios principales">
            <span>${icon('briefcase')} Gestión multiworkspace</span>
            <span>${icon('shield')} Accesos por rol y alcance</span>
            <span>${icon('users')} Equipo, clientes e invitados</span>
            <span>${icon('activity')} Sesiones controladas</span>
          </div>
        </article>

        <article class="auth-card">
          <div class="auth-card-header">
            <span class="auth-lock">${icon('lock')}</span>
            <div><h2>Acceder al Workspace</h2><p>${firebaseAvailable ? 'Usa tu cuenta WonkUp o un código autorizado.' : 'Usa tu enlace o código de invitación.'}</p></div>
          </div>
          ${reason}

          ${showCodeTab && showAccountTab ? `
            <div class="auth-tabs" role="tablist" aria-label="Método de acceso">
              <button type="button" role="tab" id="auth-tab-code" data-auth-tab="code" aria-controls="auth-panel-code" aria-selected="true">Código</button>
              <button type="button" role="tab" id="auth-tab-account" data-auth-tab="account" aria-controls="auth-panel-account" aria-selected="false">Cuenta WonkUp</button>
            </div>
          ` : ''}

          ${showCodeTab ? `
            <section class="auth-panel" id="auth-panel-code" data-auth-panel="code" role="tabpanel" aria-labelledby="auth-tab-code">
              <form id="access-form" novalidate>
                <label class="form-field" for="access-code">
                  <span>Código de acceso</span>
                  <input class="input auth-input" id="access-code" name="accessCode" autocomplete="one-time-code" placeholder="Ejemplo: WONKUP-ADMIN" required aria-required="true" aria-describedby="access-error">
                </label>
                <div class="form-error hidden" id="access-error" role="alert"></div>
                <button class="button button-primary auth-submit" id="access-submit" type="submit">
                  <span>Ingresar</span>${icon('arrowRight')}
                </button>
              </form>
              <p class="auth-security-note">El código se intercambia por una sesión temporal y no se guarda en el navegador.</p>

              ${demoCodes.length ? `
                <details class="demo-access">
                  <summary class="demo-access-title"><strong>Códigos de demostración</strong><span>Modo local</span></summary>
                  <div class="demo-code-list">
                    ${demoCodes.map(item => `
                      <button class="demo-code" type="button" data-demo-code="${escapeHtml(item.code)}">
                        <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>
                        <code>${escapeHtml(item.code)}</code>
                      </button>
                    `).join('')}
                  </div>
                </details>
              ` : ''}
            </section>
          ` : ''}

          ${showAccountTab ? `
            <section class="auth-panel ${defaultPanel === 'account' ? '' : 'hidden'}" id="auth-panel-account" data-auth-panel="account" role="tabpanel" aria-labelledby="auth-tab-account">
              ${firebaseAvailable ? `
                <form id="firebase-access-form" novalidate>
                  <label class="form-field" for="firebase-email"><span>Correo</span><input class="input auth-input" id="firebase-email" type="email" autocomplete="email" placeholder="nombre@empresa.com" required></label>
                  <label class="form-field" for="firebase-password"><span>Contraseña</span><input class="input auth-input" id="firebase-password" type="password" autocomplete="current-password" required minlength="6"></label>
                  <div class="form-error hidden" id="firebase-access-error" role="alert"></div>
                  <div class="auth-success hidden" id="firebase-access-success" role="status"></div>
                  <button class="button button-primary auth-submit" id="firebase-access-submit" type="submit"><span>Ingresar con mi cuenta</span>${icon('arrowRight')}</button>
                  <button class="text-button auth-forgot" id="firebase-reset-password" type="button">Recuperar contraseña</button>
                </form>
                <p class="auth-security-note">Firebase Authentication gestiona la identidad; Firestore aplica el alcance de cada usuario.</p>
              ` : `
                <div class="auth-cloud-pending">
                  <span>${icon('cloud')}</span>
                  <strong>Cloud Foundation pendiente de configuración</strong>
                  <p>Faltan los datos públicos de Firebase: ${escapeHtml(firebaseStatus.missing.join(', ') || 'configuración de acceso')}.</p>
                  <small>El acceso por código continúa funcionando mientras se completa la Entrega 9.</small>
                </div>
              `}
            </section>
          ` : ''}
        </article>
      </div>
    </section>`;

  bindTabs(container, defaultPanel);
  bindCodeAccess(container);
  bindFirebaseAccess(container, firebaseAvailable);
}

function completeLogin(session) {
  setSession(session);
  const firstWorkspace = session.scopes?.workspaceIds?.find(id => id !== '*') || 'all';
  setState({ selectedWorkspaceId: firstWorkspace, sidebarOpen: false });
  location.hash = getDefaultRoute(session);
}

function bindTabs(container, defaultPanel) {
  const tabs = [...container.querySelectorAll('[data-auth-tab]')];
  if (!tabs.length) return;
  const activate = panelName => {
    tabs.forEach(tab => {
      const active = tab.dataset.authTab === panelName;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    container.querySelectorAll('[data-auth-panel]').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.authPanel !== panelName);
    });
  };
  tabs.forEach(tab => tab.addEventListener('click', () => activate(tab.dataset.authTab)));
  activate(defaultPanel);
}

function bindCodeAccess(container) {
  const form = container.querySelector('#access-form');
  if (!form) return;
  const input = container.querySelector('#access-code');
  const submit = container.querySelector('#access-submit');
  const errorBox = container.querySelector('#access-error');

  container.querySelectorAll('[data-demo-code]').forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.dataset.demoCode;
      input.focus();
      input.setAttribute('aria-invalid', 'false');
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
      completeLogin(session);
    } catch (error) {
      showError(error.message || 'No se pudo validar el acceso.');
    } finally {
      setLoading(false);
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    input.setAttribute('aria-invalid', 'true');
  }

  function setLoading(loading) {
    submit.disabled = loading;
    submit.setAttribute('aria-busy', String(loading));
    submit.innerHTML = loading
      ? '<span class="spinner"></span><span>Validando...</span>'
      : `<span>Ingresar</span>${icon('arrowRight')}`;
  }
}

function bindFirebaseAccess(container, enabled) {
  if (!enabled) return;
  const form = container.querySelector('#firebase-access-form');
  const email = container.querySelector('#firebase-email');
  const password = container.querySelector('#firebase-password');
  const submit = container.querySelector('#firebase-access-submit');
  const errorBox = container.querySelector('#firebase-access-error');
  const successBox = container.querySelector('#firebase-access-success');
  const reset = container.querySelector('#firebase-reset-password');
  if (!form) return;

  const setMessage = (type, message) => {
    errorBox.classList.toggle('hidden', type !== 'error');
    successBox.classList.toggle('hidden', type !== 'success');
    if (type === 'error') errorBox.textContent = message;
    if (type === 'success') successBox.textContent = message;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!email.value.trim() || !password.value) {
      setMessage('error', 'Escribe tu correo y contraseña.');
      return;
    }
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span><span>Ingresando...</span>';
    setMessage('', '');
    try {
      const session = await AccessService.signInWithFirebase(email.value, password.value);
      completeLogin(session);
    } catch (error) {
      setMessage('error', error.message || 'No se pudo iniciar sesión.');
    } finally {
      submit.disabled = false;
      submit.innerHTML = `<span>Ingresar con mi cuenta</span>${icon('arrowRight')}`;
    }
  });

  reset?.addEventListener('click', async () => {
    const value = email.value.trim();
    if (!value) {
      setMessage('error', 'Escribe primero el correo de tu cuenta.');
      email.focus();
      return;
    }
    reset.disabled = true;
    setMessage('', '');
    try {
      await AccessService.sendPasswordReset(value);
      setMessage('success', 'Si la cuenta está habilitada, recibirás un correo para restablecer la contraseña.');
    } catch (error) {
      setMessage('error', error.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      reset.disabled = false;
    }
  });
}
