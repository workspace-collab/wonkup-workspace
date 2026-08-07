function startupMessage(error) {
  const message = String(error?.message || error || 'Error desconocido al iniciar la aplicación.');
  return message.length > 700 ? `${message.slice(0, 700)}…` : message;
}

export function renderStartupFailure(error) {
  const host = document.querySelector('#app') || document.body;
  const wrapper = document.createElement('main');
  wrapper.className = 'startup-failure';
  wrapper.setAttribute('role', 'alert');

  const card = document.createElement('section');
  card.className = 'startup-failure-card';

  const mark = document.createElement('span');
  mark.className = 'startup-failure-mark';
  mark.textContent = '!';

  const title = document.createElement('h1');
  title.textContent = 'WonkUp no pudo iniciar';

  const description = document.createElement('p');
  description.textContent = 'La interfaz no se cargó completamente. El diagnóstico evita que la pantalla quede en blanco y permite identificar el archivo afectado.';

  const detail = document.createElement('pre');
  detail.className = 'startup-failure-detail';
  detail.textContent = startupMessage(error);

  const actions = document.createElement('div');
  actions.className = 'startup-failure-actions';

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button button-primary';
  retry.textContent = 'Volver a intentar';
  retry.addEventListener('click', () => location.reload());

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button button-secondary';
  copy.textContent = 'Copiar diagnóstico';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(detail.textContent);
      copy.textContent = 'Diagnóstico copiado';
    } catch {
      detail.focus();
    }
  });

  actions.append(retry, copy);
  card.append(mark, title, description, detail, actions);
  wrapper.append(card);
  host.replaceChildren(wrapper);
}

export async function startWonkUp() {
  const entry = globalThis.WONKUP_APP_ENTRY || './app.js?v=12.2.1';
  try {
    await import(entry);
  } catch (error) {
    console.error('WonkUp startup failure', error);
    renderStartupFailure(error);
  }
}

startWonkUp();
