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
              <h2 class="section-heading mb-4">
                <span class="section-heading-upper">Ahorra y Disfruta en Familia</span>
                <span class="section-heading-lower">Combos Promocionales</span>
              </h2>

              <p class="mb-5 section-content">
                Los mejores paquetes diseñados para compartir al mejor precio en Alausí. Preparamos cada pizza al instante con ingredientes frescos de primera calidad.
              </p>

              <!-- Listado de Combos Especiales con Fotografía -->
              <h3 class="section-heading-upper text-primary mb-4">🍕 Combos Especiales</h3>
              <div class="row text-left mb-5">

                <!-- Combo 1 -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4 class="font-weight-bold text-dark mb-0">Combo 1</h4>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$10.50</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Margarita + Pizzolinos de Queso (6 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/combo-mar-piz.jpg" alt="Piza Margarita y Pizzolinos">
                  </div>
                </div>

                <!-- Combo 2 -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4 class="font-weight-bold text-dark mb-0">Combo 2</h4>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$11.50</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Hawaiana + Pan de Ajo (4 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/combo-haw-ajo.jpg" alt="pizza hawayana y pan de ajo">
                  </div>
                </div>

                <!-- Combo 3 -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4 class="font-weight-bold text-primary mb-0"> Combo 3 (¡Súper Popular!)</h4>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$12.50</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Barbacoa + Alitas BBQ jugosas</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/combo-bar-ali.jpg" alt="Pizza Barbacoa">
                  </div>
                </div>

                <!-- Combo 4 -->
                <div class="col-md-6 mb-4">
                  <div class="bg-faded p-4 rounded h-100 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4 class="font-weight-bold text-dark mb-0">Combo 4</h4>
                        <span class="badge badge-warning p-2 font-weight-bold" style="font-size: 1rem;">$11.50</span>
                      </div>
                      <p class="mb-3">1 Pizza Mediana Carbonara + Pan de Ajo (4 ud.)</p>
                    </div>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/combo-car-ajo.jpg" alt="Pizza carbonara y pan de ajo">
                  </div>
                </div>

                <!-- Combo Especial La Buona -->
                <div class="col-12 mb-4">
                  <div class="bg-faded p-4 rounded shadow-sm text-center border border-warning" style="background-color: rgba(255, 248, 225, 0.95) !important;">
                    <h4 class="font-weight-bold text-primary mb-2"> COMBO LA BUONA (Familiar Supremo) </h4>
                    <p class="mb-3 font-weight-bold text-dark">
                      1 Pizza Familiar a elección (Barbacoa, Hawaiana, Carbonara o Margarita) + Alitas BBQ + Pizzolinos de Queso (6 ud.) + Pan de Ajo (4 ud.)
                    </p>
                    <span class="h4 font-weight-bold text-danger d-block mb-3">$17.00</span>
                    <img class="img-fluid rounded shadow-sm mx-auto d-block" style="max-height: 260px; object-fit: cover;" src="img/combo-familiar.jpg" alt="Combo La Buona" onerror="this.src='https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'">
                  </div>
                </div>

              </div>

              <!-- Listado de Complementos -->
              <h3 class="section-heading-upper text-primary mb-4">🍗 Complementos</h3>
              <div class="row text-left mb-5">
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h5 class="font-weight-bold mb-1">Pizzolinos de Queso</h5>
                    <p class="small text-muted mb-2">Porción de 6 unidades</p>
                    <span class="font-weight-bold text-primary">$2.00</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/pizzolinos.jpg" alt="Pizzolinos">
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h5 class="font-weight-bold mb-1">Pan de Ajo</h5>
                    <p class="small text-muted mb-2">Porción de 4 unidades</p>
                    <span class="font-weight-bold text-primary">$1.50</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/pan-ajo.png" alt="Pan de ajo">
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="bg-faded p-3 rounded text-center">
                    <h5 class="font-weight-bold mb-1">Alitas BBQ</h5>
                    <p class="small text-muted mb-2">Bañadas en salsa especial</p>
                    <span class="font-weight-bold text-primary">$5.00</span>
                    <img class="img-fluid rounded mt-2 shadow-sm" src="img/alitas.png" alt="Alitas">
                  </div>
                </div>
              </div>

              <!-- Detalles de Envío y Pago -->
              <div class="bg-faded p-4 rounded text-left mb-5">
                <h4 class="font-weight-bold text-primary mb-3">🛵 Atención Directa & Delivery</h4>
                <p class="mb-2"><strong>Entregas a domicilio en todo Alausí</strong> y servicio de comida para llevar.</p>
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
