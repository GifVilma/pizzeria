// Transformación de presentación durante la generación; las fuentes de la carta
// y los originales siguen siendo la referencia. No se ejecuta en el navegador.
import manifest from '../img/optimized/manifest.json' with { type: 'json' };
export { manifest as imageManifest };

function sizesFor(tag, html, entry) {
  if (tag.includes('intro-img') || tag.includes('product-item-img')) {
    return `(min-width: 992px) ${Math.min(entry.width, 800)}px, (min-width: 768px) 690px, (min-width: 576px) 510px, calc(100vw - 30px)`;
  }
  if (html.includes('id="complementos"')) {
    if (entry.source === '/img/combo-familiar.png') return '(min-width: 768px) 462px, (min-width: 576px) 444px, calc(100vw - 144px)';
    if (['/img/alitas.png', '/img/papas-locas.jpeg', '/img/fingers-plato-blanco-1200.webp', '/img/papas_locas_fingers.png'].includes(entry.source)) {
      return '(min-width: 1200px) 218px, (min-width: 992px) 220px, (min-width: 768px) 170px, (min-width: 576px) 414px, calc(100vw - 126px)';
    }
    return '(min-width: 1200px) 341px, (min-width: 992px) 346px, (min-width: 768px) 274px, (min-width: 576px) 398px, calc(100vw - 142px)';
  }
  if (html.includes('blog-article')) {
    return `(min-width: 992px) ${Math.min(entry.width, 800)}px, (min-width: 768px) 578px, (min-width: 576px) 398px, calc(100vw - 94px)`;
  }
  return '(min-width: 1200px) 280px, (min-width: 992px) 300px, (min-width: 768px) 478px, (min-width: 576px) 350px, calc(100vw - 190px)';
}

export function optimizeHtmlImages(html) {
  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/g, tag => {
    if (tag.includes('data-original-src=')) return tag;
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    const entry = manifest[src];
    if (!entry) throw new Error(`Falta inventariar una imagen: ${src}`);
    const primary = imageIndex++ === 0;
    // Mantener el límite y proporción original de la fotografía familiar. Con
    // atributos width/height, max-height por sí solo podría recortar su caja.
    const maxHeight = tag.match(/max-height:\s*(\d+)px/);
    if (maxHeight) {
      const maxWidth = Number(maxHeight[1]) * entry.width / entry.height;
      tag = tag.replace(/style="([^"]*)"/, (_, style) => `style="${style} max-width: min(100%, ${maxWidth.toFixed(6)}px);"`);
    }
    const dimensions = ` width="${entry.width}" height="${entry.height}"`;
    const loading = ` loading="${primary ? 'eager' : 'lazy'}" decoding="async"${primary ? ' fetchpriority="high"' : ''}`;
    const image = tag.replace(/>$/, `${dimensions}${loading} data-original-src="${src}">`);
    if (!entry.variants.length) return image;
    const srcset = entry.variants.map(v => `${v.path} ${v.width}w`).join(', ');
    return `<picture class="optimized-picture"><source type="image/webp" srcset="${srcset}" sizes="${sizesFor(tag, html, entry)}">${image}</picture>`;
  });
}
