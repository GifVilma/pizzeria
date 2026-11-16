// Las páginas ya contienen su HTML. JavaScript solo mejora la interacción.
import { initBackToTop } from './ui/volver-arriba.js';
const labelledMenus = new WeakSet();

export function initMenuLabel() {
  const button = document.getElementById('menu-toggle');
  if (button?.tagName !== 'BUTTON' || labelledMenus.has(button)) return;
  const update = () => button.setAttribute('aria-label',
    button.getAttribute('aria-expanded') === 'true' ? 'Cerrar menú' : 'Abrir menú');
  const observer = new MutationObserver(update);
  observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });
  labelledMenus.add(button);
  update();
}

export function getLegacyDestination(pathname, hash) {
  if (!['/', '/index.html'].includes(pathname)) return null;
  const routes = { home: '/', pizzas: '/pizzas/', store: '/combos/', resenas: '/resenas/', blog: '/blog/' };
  return routes[hash.replace(/^#/, '').trim()] || null;
}

export function initPage({ loadReviews = () => import('./pages/resenas.js') } = {}) {
  const redirect = getLegacyDestination(window.location.pathname, window.location.hash);
  if (redirect) { window.location.replace(redirect); return; }
  initBackToTop();
  initMenuLabel();

  document.querySelectorAll('#navbar-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.jQuery) window.jQuery('#navbarResponsive').collapse('hide');
    });
  });

  if (document.body.dataset.page !== 'resenas') return;
  let cleanup;
  let active = true;
  const attach = async () => {
    try {
      const { attachResenasEvents } = await loadReviews();
      if (active) cleanup = attachResenasEvents();
    } catch {
      if (!active) return;
      const container = document.getElementById('resenas-container');
      if (container) {
        container.textContent = 'No se pudieron cargar las reseñas. Recarga la página para reintentar.';
        container.setAttribute('aria-busy', 'false');
      }
    }
  };
  void attach();
  window.addEventListener('pagehide', () => {
    active = false;
    cleanup?.();
    cleanup = undefined;
    const form = document.getElementById('resenas-form');
    if (form) delete form.dataset.bound;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { active = true; void attach(); }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initPage());
  window.addEventListener('hashchange', () => {
    const target = getLegacyDestination(window.location.pathname, window.location.hash);
    if (target) window.location.replace(target);
  });
}
