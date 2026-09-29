// js/pages/pizzas.js

export function renderPizzasPage() {
  const pizzas = [
    {
      nombreUpper: "La favorita de nuestros clientes",
      nombreLower: "Pizza Barbacoa (Insignia)",
      descripcion: "Pollo, cerdo y carne jugosa en salsa barbacoa, y mucho queso mozzarella. Precios: Pequeña $7.00 | Mediana $9.00 | Familiar $11.00 | Extra Familiar $14.00.",
      imagen: "img/pizza-barbacoa.jpg",
      alignTitle: "ml-auto",
      alignDesc: "mr-auto"
    },
    {
      nombreUpper: "Especialidad Tradicional",
      nombreLower: "Pizza Hawaiana",
      descripcion: "Jamón, piña, salsa de tomate y queso mozzarella. Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
      alignTitle: "mr-auto",
      alignDesc: "ml-auto"
    },
    {
      nombreUpper: "Sabor Cremoso & Delicioso",
      nombreLower: "Pizza Carbonara",
      descripcion: "Cerdo fresco, crema carbonara y queso mozzarella. Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      alignTitle: "ml-auto",
      alignDesc: "mr-auto"
    },
    {
      nombreUpper: "Sabor Clásico Italiano",
      nombreLower: "Pizza Margarita",
      descripcion: "Salsa de tomate, albahaca fresca y queso mozzarella. Precios: Pequeña $5.00 | Mediana $6.50 | Familiar $8.00 | Extra Familiar $10.50.",
      imagen: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      alignTitle: "mr-auto",
      alignDesc: "ml-auto"
    },
    {
      nombreUpper: "Especialidad Crocante",
      nombreLower: "Pizza Pepperoni",
      descripcion: "Pepperoni y queso mozzarella horneados a la perfección. Precios: Pequeña $5.50 | Mediana $7.00 | Familiar $8.50 | Extra Familiar $11.50.",
      imagen: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
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

  return pizzasHtml;
}