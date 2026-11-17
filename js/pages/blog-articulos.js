import { renderWhatsAppButton } from './whatsapp.js';

// Fuente editorial compartida por el listado y el generador. No se atribuyen
// fechas de publicación ni hechos históricos sin confirmación del negocio.
export const blogArticles = [
  {
    slug: 'pizza-a-domicilio-alausi',
    title: 'Pizza a domicilio en Alausí: cómo elegir tu pedido en La Buona Pizza',
    seoTitle: 'Pizza a domicilio en Alausí: qué pedir | La Buona Pizza',
    description: 'Elige tu pizza a domicilio en Alausí: compara sabores, tamaños, precios, combos y complementos de La Buona Pizza y prepara tu pedido por WhatsApp.',
    category: 'Guía de pedidos',
    summary: 'Compara las cinco pizzas de nuestra carta, sus tamaños, combos y complementos, y prepara un pedido claro por WhatsApp.',
    image: '/img/optimized/bpizza-800.webp',
    imageAlt: 'Pizza artesanal de La Buona Pizza Alausí',
    content: `
      <p>Elegir una pizza resulta más fácil cuando puedes comparar ingredientes, tamaños y acompañamientos. Quizá ya tengas un sabor favorito o quieras probar algo diferente. En ambos casos, revisar la carta antes de escribir ayuda a preparar un pedido claro.</p>
      <p>En La Buona Pizza Alausí elaboramos pizzas artesanales y ofrecemos exclusivamente entrega a domicilio en Alausí, Ecuador. No tenemos un establecimiento abierto para atención presencial. Puedes consultar las opciones en nuestra web y coordinar tu pedido por WhatsApp.</p>
      <p>Esta guía reúne las pizzas, combos y complementos de nuestra carta para ayudarte a decidir.</p>
      <h2 class="h3 mt-4">Empieza por elegir el sabor</h2>
      <p>Nuestra carta incluye cinco variedades. Antes de escoger un tamaño, piensa qué ingredientes te apetecen y pregunta a quienes compartirán el pedido contigo.</p>
      <h3 class="h4 mt-3">Margarita, Hawaiana y Pepperoni</h3>
      <p>La <strong>Margarita</strong> combina salsa de tomate, albahaca fresca y mozzarella. Es una opción para quienes prefieren una combinación sencilla en la que destacan esos ingredientes.</p>
      <p>La <strong>Hawaiana</strong> lleva jamón, piña, salsa de tomate y mozzarella. Si disfrutas el contraste entre dulce y salado, puede ser tu elección.</p>
      <p>La <strong>Pepperoni</strong> reúne pepperoni y mozzarella fundida. Puedes pedirla por separado o elegir el combo que la acompaña con fingers de pollo.</p>
      <h3 class="h4 mt-3">Barbacoa y Carbonara</h3>
      <p>La <strong>Barbacoa</strong> combina pollo, cerdo y carne con salsa barbacoa y mozzarella. Es una alternativa para quienes buscan varios tipos de carne y el sabor característico de esa salsa.</p>
      <p>La <strong>Carbonara</strong> lleva cerdo, crema carbonara y mozzarella. Su combinación cremosa ofrece un perfil diferente al de las pizzas con salsa de tomate.</p>
      <p>Puedes comparar las variedades en <a href="/pizzas/">nuestra carta de pizzas</a>. Si necesitas aclarar algún ingrediente, consúltanos antes de confirmar tu elección.</p>
      <h2 class="h3 mt-4">Compara tamaños y precios</h2>
      <p>Todas las pizzas están disponibles en cuatro tamaños: pequeña, mediana, familiar y extrafamiliar. El precio depende de la variedad y del tamaño elegido.</p>
      <div class="table-responsive">
        <table class="table table-bordered table-sm">
          <caption>Precios de las pizzas por tamaño, en dólares estadounidenses.</caption>
          <thead><tr><th scope="col">Pizza</th><th scope="col">Pequeña</th><th scope="col">Mediana</th><th scope="col">Familiar</th><th scope="col">Extrafamiliar</th></tr></thead>
          <tbody>
            <tr><th scope="row">Margarita</th><td>$5.50</td><td>$6.50</td><td>$8.00</td><td>$10.50</td></tr>
            <tr><th scope="row">Hawaiana</th><td>$5.50</td><td>$7.00</td><td>$8.50</td><td>$11.50</td></tr>
            <tr><th scope="row">Carbonara</th><td>$5.50</td><td>$7.00</td><td>$8.50</td><td>$11.50</td></tr>
            <tr><th scope="row">Pepperoni</th><td>$5.50</td><td>$7.00</td><td>$8.50</td><td>$11.50</td></tr>
            <tr><th scope="row">Barbacoa</th><td>$7.00</td><td>$9.00</td><td>$11.00</td><td>$14.00</td></tr>
          </tbody>
        </table>
      </div>
      <p>Puedes solicitar <strong>doble de ingredientes por $2.50 adicionales al precio del tamaño de pizza elegido</strong>. Esta opción está disponible para los cuatro tamaños y no modifica los precios base de la tabla. Indícalo expresamente en tu mensaje para que esa opción quede incluida en la consulta.</p>
      <p>Para escoger, compara el precio de tu variedad favorita y piensa si añadirás acompañamientos. Los nombres de los tamaños no indican por sí solos cuántas personas comerán: depende del apetito y del resto del pedido. Si necesitas conocer las dimensiones, pregunta antes de decidir.</p>
      <h2 class="h3 mt-4">Revisa los combos y lo que incluyen</h2>
      <p>Los combos reúnen una pizza con acompañamientos definidos. Comprueba el tamaño y la composición de cada uno:</p>
      <ul>
        <li><strong>Pepperoni + fingers de pollo:</strong> una pizza mediana Pepperoni y seis fingers de pollo por <strong>$9.00</strong>.</li>
        <li><strong>Hawaiana + Papas Locas:</strong> una pizza mediana Hawaiana y Papas Locas por <strong>$9.00</strong>.</li>
        <li><strong>Barbacoa + alitas BBQ:</strong> una pizza mediana Barbacoa y seis alitas BBQ por <strong>$12.50</strong>.</li>
        <li><strong>Carbonara + fingers de pollo:</strong> una pizza mediana Carbonara y seis fingers de pollo por <strong>$9.00</strong>.</li>
      </ul>
      <p>El <strong>Combo La Buona</strong>, de <strong>$17.00</strong>, incluye una pizza familiar a elección entre Barbacoa, Hawaiana, Carbonara, Margarita o Pepperoni, más seis alitas BBQ y Papas Locas.</p>
      <p>Si eliges este último, recuerda indicar la variedad de pizza familiar. Encontrarás las fotografías y composiciones en <a href="/combos/">combos y complementos</a>.</p>
      <p>Compara estas opciones con lo que realmente quieres pedir. Si buscas únicamente una pizza, puedes elegirla por separado; si también te apetecen los acompañamientos incluidos, revisa el combo correspondiente.</p>
      <h2 class="h3 mt-4">Completa tu pedido con acompañamientos</h2>
      <p>La carta también permite consultar estos cuatro complementos por separado. Los cuatro incluyen patatas y ensalada:</p>
      <ul>
        <li><strong>Alitas BBQ:</strong> porción de seis unidades, <strong>$5.00</strong>.</li>
        <li><strong>Papas Locas:</strong> pollo, carne y cerdo cubiertos con salsa especial La Buona y mayonesa al gusto, <strong>$4.00</strong>.</li>
        <li><strong>Fingers de pollo:</strong> porción de seis unidades, <strong>$4.00</strong>.</li>
        <li><strong>Combinado La Buona:</strong> Papas Locas y fingers de pollo, <strong>$6.50</strong>.</li>
      </ul>
      <p>La indicación de patatas y ensalada corresponde únicamente a esos cuatro complementos; no se aplica al arroz ni se extiende automáticamente a los combos.</p>
      <h3 class="h4 mt-3">Porción de arroz</h3>
      <p>También puedes pedir una <strong>porción de arroz por $1.00</strong>.</p>
      <p>Antes de añadirlos, revisa lo que ya incluye tu combo. Así evitarás duplicar un producto por confusión y podrás calcular el subtotal de tu elección.</p>
      <p>Si estás organizando un pedido entre varias personas, anota primero las pizzas y después los complementos. Separarlos en el mensaje ayuda a identificar cantidades y elecciones.</p>
      <h2 class="h3 mt-4">Cómo realizar el pedido por WhatsApp</h2>
      <p>Un mensaje claro debe incluir el nombre del producto, el tamaño y la cantidad. Para los combos, utiliza su nombre e indica las elecciones que correspondan.</p>
      <p>Por ejemplo:</p>
      <blockquote class="blockquote"><p>Hola, quisiera una pizza Hawaiana mediana y una porción de seis fingers de pollo. El subtotal de estos productos es $11.00. ¿Podrían confirmar disponibilidad y las condiciones de entrega?</p></blockquote>
      <p>Ese subtotal corresponde únicamente a los productos del ejemplo. Consulta el importe final y las condiciones de reparto para tu ubicación antes de confirmar.</p>
      <p>Comparte la dirección y las referencias de entrega por la conversación privada de WhatsApp. Aprovecha también para aclarar dudas sobre ingredientes o detalles del pedido.</p>
      <p>La carta indica pagos en efectivo y transferencias bancarias. Confirma los detalles al coordinar la compra y espera la respuesta del negocio para comprobar que el pedido y la entrega han quedado acordados.</p>
      <h2 class="h3 mt-4">Elige tu combinación y consúltanos</h2>
      <p>Empieza por el sabor, compara tamaños y decide si prefieres una pizza por separado, un combo o algún complemento. Con esa información tendrás preparada tu consulta y será más sencillo revisar el pedido.</p>`
  },
  {
    slug: 'masa-artesanal',
    title: 'Secretos de Nuestra Masa Artesanal',
    seoTitle: 'Masa artesanal y pizzas en Alausí | La Buona Pizza',
    description: 'Descubre qué tener en cuenta al elegir una pizza artesanal en Alausí y qué consultar sobre la masa y los ingredientes antes de hacer tu pedido.',
    category: 'Recetas y tradición',
    summary: 'La masa también cuenta al elegir una pizza. Te proponemos preguntas útiles para conocer mejor tu pedido, sin atribuir procesos de elaboración no confirmados.',
    image: '/img/optimized/masa-madre-736.webp',
    imageAlt: 'Imagen de la publicación sobre masa artesanal de La Buona Pizza Alausí',
    content: `
      <p>Cuando pensamos en una pizza, solemos empezar por el queso, la salsa o nuestros ingredientes favoritos. La masa también forma parte de esa elección. En La Buona Pizza Alausí presentamos nuestras pizzas como artesanales y queremos ayudarte a consultar la información que necesitas antes de pedir.</p>
      <h2 class="h3 mt-4">Qué puedes preguntar sobre la masa</h2>
      <p>Si te interesa conocer la elaboración, pregúntanos por sus ingredientes y preparación. También puedes consultar las dimensiones de cada tamaño y aclarar cualquier duda concreta que influya en tu elección.</p>
      <p>No hace falta dar por supuestas una receta, una harina o unas horas de fermentación para disfrutar de una pizza. Lo útil es contar con información confirmada y elegir según tus preferencias.</p>
      <h2 class="h3 mt-4">Piensa en el conjunto de la pizza</h2>
      <p>La carta describe las combinaciones disponibles. Margarita reúne salsa de tomate, albahaca fresca y mozzarella; Hawaiana añade el contraste del jamón y la piña. Carbonara combina cerdo, crema carbonara y mozzarella. También puedes consultar Barbacoa y Pepperoni.</p>
      <p>Revisa <a href="/pizzas/">los ingredientes y tamaños de nuestras pizzas</a> y elige la combinación que te apetece. Las fotografías pueden orientarte sobre su presentación, pero no sustituyen una consulta sobre ingredientes o medidas.</p>
      <h2 class="h3 mt-4">Prepara las preguntas antes de pedir</h2>
      <p>Anota el nombre de la pizza, el tamaño y la cantidad. Después añade las dudas que quieras resolver. Un mensaje concreto facilita que podamos identificar lo que buscas y aclararlo antes de confirmar.</p>
      <p>Si también quieres acompañamientos, consulta <a href="/combos/">los combos y complementos</a> y comprueba qué incluye cada opción para evitar duplicarlos.</p>
      <h2 class="h3 mt-4">Una consulta directa para elegir con tranquilidad</h2>
      <p>Nuestro servicio es exclusivamente a domicilio en Alausí, Ecuador. Puedes utilizar WhatsApp para consultar la carta y los detalles de tu pedido, compartir la ubicación de entrega y esperar la confirmación del negocio.</p>
      <p>Seguiremos reservando los detalles específicos del proceso de elaboración para información que podamos confirmar. Esta guía no atribuye a nuestra masa propiedades digestivas ni una técnica concreta de fermentación.</p>`
  }
];

export function articlePath(article) { return `/blog/${article.slug}/`; }

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function renderBlogArticlePage(article) {
  return `
    <section class="page-section cta"><div class="container"><div class="row"><div class="col-xl-10 mx-auto">
      <article class="cta-inner blog-article rounded p-4 p-lg-5">
        <p><a class="blog-back-link" href="/blog/">Volver al blog</a></p>
        <header class="text-center">
          <p class="text-primary font-weight-bold">${escapeHtml(article.category)}</p>
          <h1 class="section-heading mb-4"><span class="section-heading-lower">${escapeHtml(article.title)}</span></h1>
          ${article.notice ? `<aside class="alert alert-warning text-left" role="note">${escapeHtml(article.notice)}</aside>` : ''}
          <img class="img-fluid rounded mb-4" src="${article.image}" alt="${escapeHtml(article.imageAlt)}">
        </header>
        <div class="text-left section-content">${article.content}</div>
        <div class="bg-faded p-4 rounded text-center mt-4">
          <p>Consulta la carta actual y coordina tu pedido a domicilio.</p>
          <a class="btn btn-primary btn-xl" href="https://wa.me/593980491815" target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
        </div>
      </article>
    </div></div></div></section>
    <div class="text-center my-5">${renderWhatsAppButton()}</div>`;
}
