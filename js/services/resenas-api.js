import { supabaseConfig } from '../config/supabase.js';

export class ResenasConfigurationError extends Error {}

function getProjectUrl(config) {
  let projectUrl;
  try {
    projectUrl = new URL(config.projectUrl);
  } catch {
    throw new ResenasConfigurationError('Falta configurar la Project URL de Supabase.');
  }
  if (projectUrl.protocol !== 'https:' || projectUrl.username || projectUrl.password ||
      !config.publishableKey?.startsWith('sb_publishable_')) {
    throw new ResenasConfigurationError('Configura una URL HTTPS y una publishable key de Supabase.');
  }
  return projectUrl;
}

export function isResenasSubmissionConfigured(config = supabaseConfig) {
  try {
    getProjectUrl(config);
    return typeof config.turnstileSiteKey === 'string' && !!config.turnstileSiteKey.trim();
  } catch {
    return false;
  }
}

export async function fetchResenasAprobadas({ signal, config = supabaseConfig } = {}) {
  const url = new URL('/rest/v1/resenas', getProjectUrl(config).origin);
  url.search = new URLSearchParams({
    select: 'id,created_at,nombre,estrellas,comentario',
    aprobada: 'eq.true', order: 'created_at.desc,id.desc', limit: '20'
  });
  const response = await fetch(url, {
    method: 'GET',
    headers: { apikey: config.publishableKey, Accept: 'application/json' },
    credentials: 'omit', cache: 'no-store', signal
  });
  if (!response.ok) throw new Error('No se pudieron consultar las reseñas.');
  const reviews = await response.json();
  if (!Array.isArray(reviews) || !reviews.every(review => review &&
      typeof review.nombre === 'string' && typeof review.comentario === 'string' &&
      Number.isInteger(review.estrellas) && review.estrellas >= 1 && review.estrellas <= 5 &&
      typeof review.created_at === 'string' && Number.isFinite(Date.parse(review.created_at)))) {
    throw new Error('Respuesta de reseñas no válida.');
  }
  return reviews;
}

export class ResenasSubmissionError extends Error {}
let submissionPending = false;

// El único destino de escritura es la Edge Function que valida Turnstile.
export async function enviarResena(values, { config = supabaseConfig } = {}) {
  if (!isResenasSubmissionConfigured(config)) {
    throw new ResenasConfigurationError('El envío de reseñas todavía no está configurado.');
  }
  const nombre = typeof values.nombre === 'string' ? values.nombre.trim() : '';
  const comentario = typeof values.comentario === 'string' ? values.comentario.trim() : '';
  if (!nombre || !comentario || !Number.isInteger(values.estrellas) ||
      values.estrellas < 1 || values.estrellas > 5) {
    throw new ResenasSubmissionError('Completa el nombre, el comentario y una valoración de 1 a 5 estrellas.');
  }
  if (typeof values.turnstileToken !== 'string' || !values.turnstileToken.trim()) {
    throw new ResenasSubmissionError('Completa la verificación antispam antes de enviar.');
  }
  if (submissionPending) throw new ResenasSubmissionError('Ya hay una reseña enviándose. Espera a que termine.');
  submissionPending = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(new URL('/functions/v1/enviar-resena', getProjectUrl(config).origin), {
      method: 'POST',
      headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ nombre, estrellas: values.estrellas, comentario, turnstileToken: values.turnstileToken }),
      signal: controller.signal
    });
    if (!response.ok) {
      const messages = {
        400: 'No se pudo aceptar la reseña. Revisa los campos y repite la verificación antispam.',
        401: 'No se pudo autorizar el envío. Recarga la página y vuelve a verificarte.',
        403: 'La verificación del envío fue rechazada. Repite la verificación antispam.',
        409: 'Este envío ya se ha recibido o está duplicado. No lo repitas.',
        422: 'Revisa el nombre, la valoración y el comentario: los datos no cumplen los requisitos.',
        429: 'Se han realizado demasiados intentos. Espera antes de volver a enviar.'
      };
      throw new ResenasSubmissionError(messages[response.status] ||
        'El servidor no pudo completar el envío. Si el problema persiste, inténtalo más tarde.');
    }
    const text = await response.text();
    if (text) {
      let result;
      try { result = JSON.parse(text); } catch {
        throw new Error('Respuesta no válida');
      }
      if (result?.error || result?.success === false) {
        throw new ResenasSubmissionError('No se pudo aceptar la reseña. Revisa los datos y repite la verificación antispam.');
      }
    }
  } catch (error) {
    if (error instanceof ResenasSubmissionError) throw error;
    // No repetir automáticamente: una respuesta perdida no demuestra que no se guardó.
    throw new ResenasSubmissionError('No hemos podido confirmar la recepción. El envío podría haberse recibido; compruébalo antes de repetirlo.');
  } finally {
    clearTimeout(timeout);
    submissionPending = false;
  }
}
