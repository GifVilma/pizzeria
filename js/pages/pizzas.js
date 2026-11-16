// js/pages/pizzas.js
import { renderWhatsAppButton } from './whatsapp.js'; 

export function renderPizzasPage() {
  const pizzas = [
    {
      nombreUpper: "La favorita de nuestros clientes",
      nombreLower: "Pizza Barbacoa (Insignia)",
      descripcion: "Una combinación irresistible de pollo, cerdo y carne jugosa bañada en salsa barbacoa, con abundante mozzarella fundida. ¡Perfecta para los amantes del sabor intenso!.<br>Precios: Pequeña $7.00 | Mediana $9.00 | Familiar $11.00 | Extra Familiar $14.00.",
      imagen: "img/pizza-barbacoa.jpg",
      alignTitle: "ml-auto",
      alignDesc: "mr-auto"
    },
    {
      nombreUpper: "Especialidad Tradicional",
      nombreLower: "Pizza Hawaiana",
      descripcion: "El delicioso contraste del jamón y la piña con salsa de tomate y mozzarella derretida. Un clásico para disfrutar en casa.<br>Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "img/pizza-hawayana.jpg",
      alignTitle: "mr-auto",
      alignDesc: "ml-auto"
    },
    {
      nombreUpper: "Sabor Cremoso & Delicioso",
      nombreLower: "Pizza Carbonara",
      descripcion: "Cerdo fresco, suave crema carbonara y mozzarella fundida en una pizza cremosa y llena de sabor.<br>Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "img/pizza-carbonara.jpg",  
      alignTitle: "ml-auto",
      alignDesc: "mr-auto"
    },
    {
      nombreUpper: "Sabor Clásico Italiano",
      nombreLower: "Pizza Margarita",
      descripcion: "La sencillez que enamora: salsa de tomate, albahaca fresca y mozzarella. Una pizza clásica que siempre apetece.<br>Precios: Pequeña $5.50 | Mediana $6.50 | Familiar $8.00 | Extra Familiar $10.50.",
      imagen: "img/pizza-margarita.jpg",
      alignTitle: "mr-auto",
      alignDesc: "ml-auto"
    },
    {
      nombreUpper: "Especialidad Crocante",
      nombreLower: "Pizza Pepperoni",
      descripcion: "Pepperoni lleno de sabor y mozzarella fundida sobre una deliciosa base de pizza. ¡Un favorito para compartir!<br>Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "img/pizza-peperoni.jpg",
      alignTitle: "ml-auto",
      alignDesc: "mr-auto"
    }
  ];

  const pizzasHtml = pizzas.map(p => `
    <section class="page-section">
      <div class="container">
        <div class="product-item">
          <div class="product-item-title d-flex">
            <div class="bg-faded p-5 d-flex ${p.alignTitle} rounded">
              <h2 class="section-heading mb-0">
                <span class="section-heading-upper">${p.nombreUpper}</span>
                <span class="section-heading-lower">${p.nombreLower}</span>
              </h2>
            </div>
          </div>
          <img class="product-item-img mx-auto d-flex rounded img-fluid mb-3 mb-lg-0" src="${p.imagen}" alt="${p.nombreLower}">
          <div class="product-item-description d-flex ${p.alignDesc}">
            <div class="bg-faded p-5 rounded">
              <p class="mb-0">${p.descripcion}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `).join('');

  // Retornamos el catálogo completo concatenando el botón estructurado al final
  return `
    <header class="container mt-5">
      <div class="bg-faded p-4 rounded text-center">
        <h1 class="section-heading mb-0">
          <span class="section-heading-lower">Carta de pizzas artesanales en Alausí</span>
        </h1>
      </div>
    </header>
    ${pizzasHtml}
    <div class="container">
      <p id="pizzas-suplemento" class="bg-faded rounded px-3 py-2 mb-0 text-center">Opcional: doble de ingredientes por $2,50 adicionales, disponible para todas las pizzas y tamaños.</p>
    </div>
    <!-- Botón Directo a WhatsApp -->
    <div class="text-center my-5">
      ${renderWhatsAppButton()}
    </div>
  `;
}