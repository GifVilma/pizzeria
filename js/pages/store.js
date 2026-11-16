// js/pages/store.js
import { renderWhatsAppButton } from './whatsapp.js'; 

export function renderStorePage() {
  return `
    <section class="page-section cta">
      <div class="container">
        <div class="row">
          <div class="col-xl-10 mx-auto">
            <div class="cta-inner text-center rounded p-4 p-lg-5">

              <!-- Encabezado Principal -->
              <h1 class="section-heading mb-4">
                <span class="section-heading-upper">La Buona Pizza</span>
                <span class="section-heading-lower">Combos de pizza en Alausí</span>
              </h1>

              <p class="mb-5 section-content">
                Los mejores paquetes diseñados para compartir al mejor precio en Alausí. Preparamos cada pizza al instante con ingredientes frescos de primera calidad.
              </p>

              <!-- Listado de Combos Especiales con Fotografía -->
              <h2 class="h3 section-heading-upper text-primary mb-4">🍕 Combos Especiales</h2>
              <div class="row text-left mb-5">

                <!-- Combo Pepperoni + Fingers -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h4 font-weight-bold text-dark mb-0">Pepperoni + Fingers de pollo</h3>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$9.00</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Pepperoni + Fingers de pollo (6 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/pizza-peperoni-fingers.png" alt="Pizza Pepperoni y fingers de pollo">
                  </div>
                </div>

                <!-- Combo Hawaiana + Papas Locas -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h4 font-weight-bold text-dark mb-0">Hawaiana + Papas Locas</h3>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$9.00</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Hawaiana + Papas Locas</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/pizza-hawaiana-patatas.png" alt="Pizza hawaiana y patatas locas">
                  </div>
                </div>

                <!-- Combo Barbacoa + Alitas -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h4 font-weight-bold text-primary mb-0">Barbacoa + Alitas BBQ</h3>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$12.50</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Barbacoa + Alitas BBQ (6 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/combo-bar-ali.jpg" alt="Pizza barbacoa con alitas BBQ">
                  </div>
                </div>

                <!-- Combo Carbonara + Fingers -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h4 font-weight-bold text-dark mb-0">Carbonara + Fingers de pollo</h3>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$9.00</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Carbonara + Fingers de pollo (6 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/pizza-carbonara-fingers.png" alt="Pizza carbonara y fingers de pollo">
                  </div>
                </div>

                <!-- Combo Especial La Buona -->
                <div class="col-12 mb-4">
                  <div class="bg-faded p-4 rounded shadow-sm text-center border border-warning" style="background-color: rgba(255, 248, 225, 0.95) !important;">
                    <h3 class="h4 font-weight-bold text-primary mb-2"> COMBO LA BUONA (Familiar Supremo) </h3>
                    <p class="mb-3 font-weight-bold text-dark">
                      1 Pizza Familiar a elección (Barbacoa, Hawaiana, Carbonara, Margarita o Pepperoni) + Alitas BBQ (6 ud.) + Papas Locas
                    </p>
                    <span class="h4 font-weight-bold text-danger d-block mb-3">$17.00</span>
                    <img class="img-fluid rounded shadow-sm mx-auto d-block" style="max-height: 260px; object-fit: cover;" src="img/combo-familiar.png" alt="Combo familiar La Buona con pizza, alitas BBQ y Papas Locas">
                  </div>
                </div>

              </div>

              <!-- Listado de Complementos -->
              <section id="complementos" aria-labelledby="complementos-titulo" aria-describedby="complementos-guarnicion">
              <h2 id="complementos-titulo" class="h3 section-heading-upper text-primary mb-4">🍗 Complementos</h2>
              <p id="complementos-guarnicion" class="section-content mb-4">Los cuatro complementos de esta sección incluyen patatas y ensalada.</p>
              <div class="row text-left mb-5">
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h3 class="h5 font-weight-bold mb-1">Alitas BBQ</h3>
                    <p class="small text-muted mb-2">Porción de 6 unidades</p>
                    <span class="font-weight-bold text-primary">$5.00</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/alitas.png" alt="Porción de alitas BBQ">
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h3 class="h5 font-weight-bold mb-1">Papas Locas</h3>
                    <p class="small text-muted mb-2">Pollo, carne y cerdo cubiertos con salsa especial La Buona y mayonesa al gusto.</p>
                    <span class="font-weight-bold text-primary">$4.00</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/papas-locas.jpeg" alt="Complemento del menú: papas locas">
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h3 class="h5 font-weight-bold mb-1">Fingers de pollo</h3>
                    <p class="small text-muted mb-2">Porción de 6 unidades</p>
                    <span class="font-weight-bold text-primary">$4.00</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/fingers-plato-blanco-1200.webp" alt="Fingers de pollo con patatas, presentados en un plato blanco">
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h3 class="h5 font-weight-bold mb-1">Combinado La Buona</h3>
                    <p class="small text-muted mb-2">Papas Locas + Fingers de pollo</p>
                    <span class="font-weight-bold text-primary">$6.50</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/papas_locas_fingers.png" alt="Combinado La Buona">
                  </div>
                </div>
              </div>

              </section>

              <section id="arroz" class="bg-faded p-3 rounded text-left mb-5" aria-labelledby="arroz-titulo">
                <h2 id="arroz-titulo" class="h5 font-weight-bold mb-2">Porción de arroz</h2>
                <span class="font-weight-bold text-primary">$1.00</span>
              </section>

              <!-- Detalles de Envío y Pago -->
              <div class="bg-faded p-4 rounded text-left mb-5">
                <h2 class="h4 font-weight-bold text-primary mb-3">🛵 Atención Directa & Delivery</h2>
                <p class="mb-2"><strong>Entregas a domicilio en todo Alausí.</strong></p>
                <p class="mb-2"><i class="fa fa-clock-o text-primary mr-2"></i><strong>Horarios:</strong> Martes a Viernes de 17:00 a 23:00 | Sábados y Domingos de 16:00 a 23:30 (Lunes cerrado).</p>
                <p class="mb-0"><i class="fa fa-credit-card text-primary mr-2"></i><strong>Métodos de Pago:</strong> Efectivo y transferencias bancarias directas.</p>
              </div>

              <!-- Botón Directo a WhatsApp -->
              <div class="text-center my-5">
                ${renderWhatsAppButton()}
              </div>


            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
