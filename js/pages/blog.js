// js/pages/blog.js
import { renderWhatsAppButton } from './whatsapp.js'; 

export function renderBlogPage() {
  const posts = [
    {
      tituloUpper: "Novedad en el Menú",
      tituloLower: "¡Nueva Pizza Carnívora Alausí!",
      fecha: "25 de Septiembre, 2026",
      categoria: "Especiales",
      resumen: "Hemos lanzado nuestra combinación más potente con cuatro tipos de carnes seleccionadas: carne molida sazonada, pepperoni, salchicha italiana y tocineta crocante.",
      imagen: "img/pizza-carnivora.png"
    },
    {
      tituloUpper: "Tradición e Historia",
      tituloLower: "Secretos de Nuestra Masa Artesanal",
      fecha: "18 de Septiembre, 2026",
      categoria: "Recetas & Tradición",
      resumen: "Utilizamos harina de alta fuerza y dejamos fermentar la masa durante 24 horas a temperatura controlada para garantizar una textura crujiente por fuera, suave por dentro y de fácil digestión.",
      imagen: "img/masa-madre.jpg"
    }
  ];

  const postsHtml = posts.map(post => `
    <article class="mb-5">
      <div class="bg-faded p-5 rounded">
        <div class="row align-items-center">
          <div class="col-lg-5 mb-4 mb-lg-0">
            <img class="img-fluid rounded shadow-sm" src="${post.imagen}" alt="${post.tituloLower}">
          </div>
          <div class="col-lg-7 text-left">
            <p class="text-primary font-weight-bold mb-1">
              <small>📅 ${post.fecha} • 🏷️ ${post.categoria}</small>
            </p>
            <h2 class="section-heading mb-3">
              <span class="section-heading-upper">${post.tituloUpper}</span>
              <span class="section-heading-lower" style="font-size: 2rem; line-height: 2.2rem;">${post.tituloLower}</span>
            </h2>
            <p class="mb-4">${post.resumen}</p>
            <a href="#contact" class="btn btn-primary btn-sm">Leer Más / Comentar</a>
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
              <h2 class="section-heading mb-5">
                <span class="section-heading-upper">Noticias & Historias</span>
                <span class="section-heading-lower">Blog La Buona Pizza</span>
              </h2>

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
