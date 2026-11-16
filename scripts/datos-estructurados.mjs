// Metadatos técnicos: los textos editoriales y comerciales siguen en sus módulos.
export function structuredData({ page, origin, image, article }) {
  const url = origin + page.path;
  const businessId = origin + '/#negocio';
  const websiteId = origin + '/#website';
  const pageId = url + '#webpage';
  const area = { '@type': 'City', name: 'Alausí', containedInPlace: { '@type': 'Country', name: 'Ecuador' } };
  const business = {
    '@type': 'FoodEstablishment', '@id': businessId,
    name: 'La Buona Pizza Alausí', url: origin + '/', telephone: '+593980491815',
    description: 'Pizzería con servicio exclusivamente a domicilio en Alausí, Ecuador. Sin atención presencial al público.',
    areaServed: area, hasMenu: [origin + '/pizzas/', origin + '/combos/']
  };
  const webPage = {
    '@type': ['pizzas', 'combos', 'blog'].includes(page.key) ? 'CollectionPage' : 'WebPage',
    '@id': pageId, url, name: page.title, description: page.description,
    inLanguage: 'es-EC', isPartOf: { '@id': websiteId }, about: { '@id': businessId }
  };
  const graph = [business, {
    '@type': 'WebSite', '@id': websiteId, url: origin + '/',
    name: 'La Buona Pizza Alausí', inLanguage: 'es-EC', publisher: { '@id': businessId }
  }, webPage];
  if (page.key === 'home') {
    const serviceId = origin + '/#entrega-a-domicilio';
    graph.push({
      '@type': 'Service', '@id': serviceId, name: 'Pizza a domicilio en Alausí',
      serviceType: 'Entrega de pizzas a domicilio', provider: { '@id': businessId },
      areaServed: area, url: origin + '/'
    });
    webPage.mainEntity = { '@id': serviceId };
  }
  if (article) {
    const articleId = url + '#article';
    const breadcrumbId = url + '#breadcrumb';
    graph.push({
      '@type': 'BlogPosting', '@id': articleId, url,
      headline: article.title, description: article.description, image: image,
      inLanguage: 'es-EC', mainEntityOfPage: { '@id': pageId },
      isPartOf: { '@id': origin + '/blog/#webpage' }
    }, {
      // Refleja Inicio > Blog > artículo: navegación principal y enlace «Volver al blog».
      '@type': 'BreadcrumbList', '@id': breadcrumbId,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: origin + '/blog/' },
        { '@type': 'ListItem', position: 3, name: article.title, item: url }
      ]
    });
    webPage.mainEntity = { '@id': articleId };
    webPage.breadcrumb = { '@id': breadcrumbId };
  }
  // Impide que un texto futuro pueda cerrar el elemento script.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
