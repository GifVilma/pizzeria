// js/pages/resenas.js
import { renderWhatsAppButton } from './whatsapp.js';
import { fetchResenasAprobadas, enviarResena, isResenasSubmissionConfigured, ResenasConfigurationError } from '../services/resenas-api.js';
import { supabaseConfig } from '../config/supabase.js';
import { mountTurnstile } from '../services/turnstile.js';

// Los datos de Supabase son texto, nunca HTML.
function renderResenaItem(review) {
  const card = document.createElement('div');
  card.className = 'bg-faded p-4 rounded mb-3 text-left';
  const heading = document.createElement('div');
  heading.className = 'd-flex justify-content-between align-items-center mb-2';
  const name = document.createElement('h3');
  name.className = 'h4 font-weight-bold mb-0 text-primary';
  name.textContent = review.nombre;
  const stars = document.createElement('span');
  stars.textContent = '⭐'.repeat(review.estrellas);
  stars.setAttribute('role', 'img');
  stars.setAttribute('aria-label', `${review.estrellas} de 5 estrellas`);
  heading.append(name, stars);
  const comment = document.createElement('p');
  comment.className = 'mb-2 section-content';
  comment.textContent = `“${review.comentario}”`;
  const date = document.createElement('small');
  date.className = 'text-muted d-block';
  date.textContent = `📅 ${new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil'
  }).format(new Date(review.created_at))}`;
  card.append(heading, comment, date);
  return card;
}

export function renderResenasPage() {
  return `
    <section class="page-section cta">
      <div class="container">
        <div class="row">
          <div class="col-xl-10 mx-auto">
            <div class="cta-inner text-center rounded">
              <h1 class="section-heading mb-4">
                <span class="section-heading-lower">Reseñas de La Buona Pizza Alausí</span>
              </h1>
              <p class="mb-5">Descubre las opiniones aprobadas sobre nuestras pizzas artesanales, combos y servicio a domicilio en Alausí.</p>
              <div class="row text-left">
                <div class="col-lg-6 mb-4">
                  <div class="bg-faded p-4 rounded">
                    <h2 class="h3 section-heading-upper text-primary mb-2">¡Déjanos tu Reseña!</h2>
                    <p class="small text-muted mb-4">Tu opinión nos ayuda a seguir mejorando cada día.</p>
                    <p id="resenas-envio-info" class="alert alert-info" role="status">
                      Tu opinión quedará pendiente de aprobación antes de publicarse.
                    </p>
                    <form id="resenas-form" aria-describedby="resenas-envio-info">
                      <fieldset id="resenas-fields" disabled>
                        <legend class="sr-only">Enviar una opinión</legend>
                        <div class="form-group mb-3">
                          <label for="resena-nombre" class="font-weight-bold">Nombre</label>
                          <input type="text" id="resena-nombre" name="nombre" class="form-control" placeholder="Ej: María Pérez" autocomplete="given-name" required>
                        </div>
                        <div class="form-group mb-3">
                          <label for="resena-puntuacion" class="font-weight-bold">Puntuación</label>
                          <select id="resena-puntuacion" name="estrellas" class="form-control" required>
                            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value="4">⭐⭐⭐⭐ (4/5)</option>
                            <option value="3">⭐⭐⭐ (3/5)</option>
                            <option value="2">⭐⭐ (2/5)</option>
                            <option value="1">⭐ (1/5)</option>
                          </select>
                        </div>
                        <div class="form-group mb-3">
                          <label for="resena-comentario" class="font-weight-bold">Comentario</label>
                          <textarea id="resena-comentario" name="comentario" class="form-control" rows="3" placeholder="Escribe tu opinión sobre nuestras pizzas..." required></textarea>
                        </div>
                        <div id="resenas-turnstile" class="mb-3"></div>
                        <p id="resenas-verificacion" class="small text-muted" role="status" aria-live="polite">Cargando verificación antispam…</p>
                        <button id="resenas-submit" type="submit" class="btn btn-primary btn-block" disabled>Enviar reseña</button>
                      </fieldset>
                    </form>
                  </div>
                </div>
                <div class="col-lg-6">
                  <h2 class="h3 section-heading-upper text-primary mb-3">Reseñas Recientes</h2>
                  <div id="resenas-container" aria-busy="true">
                    <p role="status">Cargando reseñas aprobadas…</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="text-center my-5">
      ${renderWhatsAppButton()}
    </div>
  `;
}

export function attachResenasEvents() {
  const form = document.getElementById('resenas-form');
  const container = document.getElementById('resenas-container');
  if (!form || !container || form.dataset.bound) return;
  form.dataset.bound = 'true';
  const fields = document.getElementById('resenas-fields');
  const submit = document.getElementById('resenas-submit');
  const info = document.getElementById('resenas-envio-info');
  const verification = document.getElementById('resenas-verificacion');
  const widgetContainer = document.getElementById('resenas-turnstile');
  let token = '';
  let sending = false;
  let disposed = false;
  let widget;
  const configured = isResenasSubmissionConfigured();
  const updateButton = () => { submit.disabled = disposed || !configured || sending || !token; };
  const showMessage = (message, success = false) => {
    info.textContent = message;
    info.className = `alert ${success ? 'alert-success' : 'alert-info'}`;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (disposed || sending) return;
    if (!configured || !widget || !token) {
      showMessage('Completa la verificación antispam antes de enviar.');
      return;
    }
    if (!form.reportValidity()) return;
    const nombre = form.elements.namedItem('nombre').value.trim();
    const comentario = form.elements.namedItem('comentario').value.trim();
    const estrellas = Number(form.elements.namedItem('estrellas').value);
    if (!nombre || !comentario || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
      showMessage('Completa el nombre, el comentario y una valoración de 1 a 5 estrellas.');
      return;
    }
    sending = true;
    fields.disabled = true;
    updateButton();
    submit.textContent = 'Enviando…';
    showMessage('Enviando tu opinión…');
    try {
      await enviarResena({ nombre, estrellas, comentario, turnstileToken: token });
      if (disposed || !form.isConnected) return;
      form.reset();
      showMessage('¡Gracias por tu opinión! La hemos recibido y está pendiente de aprobación.', true);
    } catch (error) {
      if (!disposed && form.isConnected) showMessage(error.message);
    } finally {
      sending = false;
      token = '';
      if (!disposed && form.isConnected) {
        fields.disabled = !configured;
        submit.textContent = 'Enviar reseña';
        updateButton();
        try { widget?.reset(); } catch {
          verification.textContent = 'Recarga la página para volver a verificarte.';
        }
      }
    }
  });

  if (configured) {
    void mountTurnstile({
      container: widgetContainer,
      siteKey: supabaseConfig.turnstileSiteKey,
      onToken(value) { token = value; updateButton(); },
      onStatus(message) { verification.textContent = message; }
    }).then(instance => {
      if (disposed) { instance?.remove(); return; }
      widget = instance;
      fields.disabled = !instance;
      updateButton();
    }).catch(() => {
      if (disposed) return;
      token = '';
      updateButton();
      verification.textContent = 'No se pudo cargar la verificación antispam. Recarga la página para reintentar.';
    });
  } else {
    verification.textContent = 'El envío no está disponible: falta completar la configuración.';
  }
  const isCurrentView = () => container.isConnected &&
    document.getElementById('resenas-container') === container;

  async function loadReviews() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    container.setAttribute('aria-busy', 'true');
    const loading = document.createElement('p');
    loading.setAttribute('role', 'status');
    loading.textContent = 'Cargando reseñas aprobadas…';
    container.replaceChildren(loading);
    try {
      const reviews = await fetchResenasAprobadas({ signal: controller.signal });
      if (!isCurrentView()) return;
      if (reviews.length) {
        container.replaceChildren(...reviews.map(renderResenaItem));
      } else {
        const empty = document.createElement('p');
        empty.setAttribute('role', 'status');
        empty.textContent = 'Todavía no hay reseñas aprobadas para mostrar.';
        container.replaceChildren(empty);
      }
    } catch (error) {
      if (!isCurrentView()) return;
      const message = document.createElement('p');
      message.setAttribute('role', 'status');
      message.textContent = error instanceof ResenasConfigurationError
        ? 'Las reseñas estarán disponibles cuando se complete la configuración de la conexión.'
        : 'No se pudieron cargar las reseñas. Puedes volver a intentarlo.';
      container.replaceChildren(message);
      if (!(error instanceof ResenasConfigurationError)) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn-primary btn-sm';
        retry.textContent = 'Reintentar';
        retry.addEventListener('click', loadReviews, { once: true });
        container.append(retry);
      }
    } finally {
      clearTimeout(timeout);
      if (isCurrentView()) container.setAttribute('aria-busy', 'false');
    }
  }
  void loadReviews();
  return () => {
    disposed = true;
    token = '';
    widget?.remove();
  };
}
