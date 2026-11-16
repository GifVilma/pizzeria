let apiPromise;
const scriptId = 'resenas-turnstile-api';

function loadTurnstile() {
  if (window.turnstile?.render) return Promise.resolve(window.turnstile);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      apiPromise = undefined;
      reject(new Error('No se pudo cargar la verificación antispam. Recarga la página para reintentar.'));
    };
    const timeout = setTimeout(fail, 12000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.turnstile?.render) return fail();
      clearTimeout(timeout);
      resolve(window.turnstile);
    };
    document.head.append(script);
  });
  return apiPromise;
}

export async function mountTurnstile({ container, siteKey, onToken, onStatus }) {
  if (!siteKey) throw new Error('Falta configurar la verificación antispam.');
  const api = await loadTurnstile();
  if (!container.isConnected) return null;
  let removed = false;
  const notify = (token, message) => {
    if (removed || !container.isConnected) return;
    onToken(token);
    onStatus(message);
  };
  const id = api.render(container, {
    sitekey: siteKey,
    size: container.getBoundingClientRect().width < 300 ? 'compact' : 'flexible',
    'response-field': false,
    callback: token => notify(token, 'Verificación completada.'),
    'expired-callback': () => notify('', 'La verificación ha caducado. Completa una nueva verificación.'),
    'timeout-callback': () => notify('', 'La verificación agotó el tiempo. Vuelve a verificarte.'),
    'error-callback': () => {
      notify('', 'No se pudo completar la verificación antispam. Comprueba la conexión o recarga la página.');
      return true;
    }
  });
  return {
    reset() {
      if (removed) return;
      notify('', 'Completa la verificación antispam para enviar.');
      api.reset(id);
    },
    remove() {
      if (removed) return;
      removed = true;
      onToken('');
      api.remove(id);
    }
  };
}
