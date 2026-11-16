// js/pages/blog.js
import { renderWhatsAppButton } from './whatsapp.js';
import { blogArticles, articlePath } from './blog-articulos.js';

export function renderBlogPage() {
  const postsHtml = blogArticles.map(post => `
    <article class="mb-5">
      <div class="bg-faded p-4 p-lg-5 rounded">
        <div class="row align-items-center">
          <div class="col-lg-5 mb-4 mb-lg-0">
            <img class="img-fluid rounded shadow-sm" src="${post.image}" alt="${post.title}">
          </div>
          <div class="col-lg-7 text-left">
            <p class="text-primary font-weight-bold mb-1">
              <small>${post.category}</small>
            </p>
            <h2 class="section-heading mb-3">
              <span class="section-heading-lower" style="font-size: 2rem; line-height: 2.2rem;">${post.title}</span>
            </h2>
            <p class="mb-4">${post.summary}</p>
            <a href="${articlePath(post)}" class="btn btn-primary btn-sm" aria-label="Leer artículo: ${post.title}">Leer artículo completo</a>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  return `
    <section class="page-section cta">
      <div class="container">
        <div class="row">
          <div class="col-xl-10 mx-auto">
            <div class="cta-inner text-center rounded">

              <!-- Encabezado del Blog -->
              <h1 class="section-heading mb-5">
                <span class="section-heading-lower">Blog de La Buona Pizza Alausí</span>
              </h1>

              <!-- Lista de Entradas -->
              <div class="text-left">
                ${postsHtml}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Botón Directo a WhatsApp -->
        <div class="text-center my-5">
          ${renderWhatsAppButton()}
        </div>
  `;
}
