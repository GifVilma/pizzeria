// js/pages/resenas.js
import { renderWhatsAppButton } from './whatsapp.js'; 

// Reseñas iniciales de ejemplo basadas en el Portal de Reseñas Alausí
const initialReviews = [
  {
    nombre: "Carlos M.",
    puntuacion: 5,
    comentario: "¡La Pizza Barbacoa es simplemente la mejor de Alausí! La masa se nota que es artesanal y crujiente, y las carnes vienen bien jugosas.",
    creado: "20/09/2026",
    detalle: "Cliente verificado • Pedido a domicilio"
  },
  {
    nombre: "Lucía G.",
    puntuacion: 5,
    comentario: "Excelente servicio a domicilio y la masa artesanal es de otro nivel. Súper recomendados los combos familiares.",
    creado: "22/09/2026",
    detalle: "Cliente verificado • Pedido a domicilio"
  }
];

// Helper para construir el HTML de una reseña
function renderResenaItem(r) {
  const estrellas = "⭐".repeat(r.puntuacion || 5);
  return `
    <div class="bg-faded p-4 rounded mb-3 text-left">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h4 class="font-weight-bold mb-0 text-primary">${r.nombre}</h4>
        <span>${estrellas}</span>
      </div>
      <p class="mb-2 section-content">"${r.comentario}"</p>
      <small class="text-muted d-block">📅 ${r.creado} ${r.detalle ? '• ' + r.detalle : ''}</small>
    </div>
  `;
}

export function renderResenasPage() {
  // Obtener reseñas guardadas en el navegador o usar las iniciales
  const resenas = JSON.parse(localStorage.getItem('pizzeria_resenas')) || initialReviews;
  const resenasListHtml = resenas.map(renderResenaItem).join('');

  return `
    <section class="page-section cta">
      <div class="container">
        <div class="row">
          <div class="col-xl-10 mx-auto">
            <div class="cta-inner text-center rounded">

              <!-- Encabezado de la Sección -->
              <h2 class="section-heading mb-4">
                <span class="section-heading-upper">La Opinión de Nuestros Clientes</span>
                <span class="section-heading-lower">Reseñas &amp; Experiencias</span>
              </h2>

              <p class="mb-5">
                Descubre lo que la comunidad de Alausí dice sobre nuestras pizzas artesanales, combos y servicio a domicilio.
              </p>

              <!-- Mensaje de éxito tras enviar reseña -->
              <div id="review-success-alert" class="alert alert-success d-none text-left mb-4" role="alert">
                🎉 <strong>¡Gracias por tu opinión!</strong> Tu reseña ha sido registrada y publicada con éxito.
              </div>

              <div class="row text-left">
                <!-- Formulario de Publicación de Reseñas -->
                <div class="col-lg-6 mb-4">
                  <div class="bg-faded p-4 rounded">
                    <h3 class="section-heading-upper text-primary mb-2"> ¡Déjanos tu Reseña!</h3>
                    <p class="small text-muted mb-4">Tu opinión nos ayuda a seguir mejorando cada día.</p>

                    <form id="resenas-form">
                      <div class="form-group mb-3">
                        <label class="font-weight-bold">Nombre</label>
                        <input type="text" id="resena-nombre" class="form-control" placeholder="Ej: María Pérez" required>
                      </div>

                      <div class="form-group mb-3">
                        <label class="font-weight-bold">Puntuación</label>
                        <select id="resena-puntuacion" class="form-control">
                          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                          <option value="4">⭐⭐⭐⭐ (4/5)</option>
                          <option value="3">⭐⭐⭐ (3/5)</option>
                          <option value="2">⭐⭐ (2/5)</option>
                          <option value="1">⭐ (1/5)</option>
                        </select>
                      </div>

                      <div class="form-group mb-3">
                        <label class="font-weight-bold">Comentario</label>
                        <textarea id="resena-comentario" class="form-control" rows="3" placeholder="Escribe tu opinión sobre nuestras pizzas..." required></textarea>
                      </div>

                      <button type="submit" class="btn btn-primary btn-block">Publicar Reseña</button>
                    </form>
                  </div>
                </div>

                <!-- Contenedor de Reseñas Publicadas -->
                <div class="col-lg-6">
                  <h3 class="section-heading-upper text-primary mb-3">Reseñas Recientes</h3>
                  <div id="resenas-container">
                    ${resenasListHtml}
                  </div>
                </div>
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

// Vinculación de eventos interactivos para guardar nuevas reseñas
export function attachResenasEvents() {
  const form = document.getElementById('resenas-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('resena-nombre').value.trim();
    const puntuacion = parseInt(document.getElementById('resena-puntuacion').value, 10);
    const comentario = document.getElementById('resena-comentario').value.trim();

    const nuevaResena = {
      nombre,
      puntuacion,
      comentario,
      creado: new Date().toLocaleDateString('es-ES'),
      detalle: "Cliente verificado • Reseña web"
    };

    // Recuperar lista, agregar la nueva reseña arriba y guardar en LocalStorage
    const resenas = JSON.parse(localStorage.getItem('pizzeria_resenas')) || initialReviews;
    resenas.unshift(nuevaResena);
    localStorage.setItem('pizzeria_resenas', JSON.stringify(resenas));

    // Re-renderizar SOLO el contenedor de reseñas (sin recargar la página)
    const contenedor = document.getElementById('resenas-container');
    if (contenedor) {
      contenedor.innerHTML = resenas.map(renderResenaItem).join('');
    }

    // Mostrar alerta de éxito
    const alert = document.getElementById('review-success-alert');
    if (alert) alert.classList.remove('d-none');

    // Limpiar formulario
    form.reset();
  });
}
