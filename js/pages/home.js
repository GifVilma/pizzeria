// js/pages/home.js
import { renderWhatsAppButton } from './whatsapp.js'; 

export function renderHomePage() {
  return `
    <!-- Sección de Introducción -->
    <section class="page-section intro">
      <div class="container">
        <img class="intro-img img-fluid mb-3 mb-lg-0 rounded" src="img/bpizza.jpeg" alt="La Buona Pizza Alausí">
        <div class="intro-text left-0 text-center bg-faded p-5 rounded">
          <h2 class="section-heading mb-4">
            <span class="section-heading-upper">Pizzas Artesanales</span>
            <span class="section-heading-lower">La Buona Pizza</span>
          </h2>
          <p class="mb-3">Elaboramos pizzas artesanales con la masa perfecta, salsa italiana casera e ingredientes 100% frescos en Alausí.</p>
          <div class="intro-button mx-auto">
            <a class="btn btn-primary btn-xl" href="#pizzas">Ver Nuestras Pizzas</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Sección de Compromiso / Llamada a la Acción (CTA) -->
    <section class="page-section cta">
      <div class="container">
        <div class="row">
          <div class="col-xl-9 mx-auto">
            <div class="cta-inner text-center rounded">
              <h2 class="section-heading mb-4">
                <span class="section-heading-upper">Compromiso de Calidad</span>
                <span class="section-heading-lower">Para Ti</span>
              </h2>
              <p class="mb-0">Cuando visitas nuestra web o pides a domicilio, estamos dedicados a brindarte un servicio amable, un ambiente acogedor y las mejores pizzas elaboradas con ingredientes locales de la más alta calidad.</p>
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