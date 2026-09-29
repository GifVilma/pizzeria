// js/app.js

import { renderHomePage } from './pages/home.js';
import { renderPizzasPage } from './pages/pizzas.js';
import { renderStorePage } from './pages/store.js';
import { renderBlogPage } from './pages/blog.js';
import { renderResenasPage, attachResenasEvents } from './pages/resenas.js';

const routes = {
  home:    { render: renderHomePage },
  pizzas:  { render: renderPizzasPage },
  store:   { render: renderStorePage },
  blog:    { render: renderBlogPage },
  resenas: { render: renderResenasPage, attachEvents: attachResenasEvents }
};

function router() {
  let hash = window.location.hash.replace('#', '').trim();

  // Si el hash no existe o es inválido, redirige limpiamente a home
  if (!routes[hash]) {
    hash = 'home';
    if (window.location.hash !== '#home') {
      window.location.hash = 'home';
    }
  }

  const route = routes[hash];

  // 1. Marca la pestaña activa en el navbar estático
  document.querySelectorAll('#navbar-links .nav-item').forEach(li => {
    const link = li.querySelector('a');
    const target = link?.getAttribute('href')?.replace('#', '');
    li.classList.toggle('active', target === hash);
  });

  // 2. Inyecta el contenido de la página seleccionada
  const appContent = document.getElementById('app-content');
  if (appContent) {
    appContent.innerHTML = route.render();
  }

  // 3. Carga eventos si la vista los requiere (ej: Reseñas)
  if (route.attachEvents) {
    route.attachEvents();
  }

  // 4. Cierra el menú desplegable en pantallas móviles tras hacer clic
  if (window.jQuery && $('#navbarResponsive').length) {
    $('#navbarResponsive').collapse('hide');
  }

  window.scrollTo(0, 0);
}

function init() {
  window.addEventListener('hashchange', router);
  router();
}

document.addEventListener('DOMContentLoaded', init);