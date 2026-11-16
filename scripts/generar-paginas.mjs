// Generación estática desde los módulos actuales. No contiene datos comerciales.
import { readFile, mkdir, writeFile, lstat, access } from 'node:fs/promises';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeHtmlImages, imageManifest } from './imagenes-html.mjs';
import { structuredData } from './datos-estructurados.mjs';
import { renderHomePage } from '../js/pages/home.js';
import { renderPizzasPage } from '../js/pages/pizzas.js';
import { renderStorePage } from '../js/pages/store.js';
import { renderBlogPage } from '../js/pages/blog.js';
import { blogArticles, articlePath, renderBlogArticlePage } from '../js/pages/blog-articulos.js';
import { renderResenasPage } from '../js/pages/resenas.js';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const previewDirectory = join(projectRoot, '.tmp', 'seo-preview');
const siteOrigin = 'https://www.labuonapizzaalausi.online';
const legacyLinks = { '#home': '/', '#pizzas': '/pizzas/', '#store': '/combos/', '#resenas': '/resenas/', '#blog': '/blog/' };

export function normalizeHtmlEntities(html) {
  return html.replace(/&nbsp(?![a-zA-Z0-9;])/g, '&nbsp;').replace(/[ \t]+$/gm, '');
}

// Solo se adaptan URLs de recursos y enlaces: los textos e imágenes no cambian.
export function normalizePageContent(html) {
  const normalized = normalizeHtmlEntities(html)
    .replace(/\b(src|href)="((?:img|css|js)\/)/g, '$1="/$2')
    .replace(/href="(#[a-z]+)"/g, (match, hash) => legacyLinks[hash] ? `href="${legacyLinks[hash]}"` : match);
  return optimizeHtmlImages(normalized);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

const pageDefinitions = [
  { file: 'index.html', path: '/', key: 'home', title: 'Pizza a domicilio en Alausí | La Buona Pizza', description: 'Pizzas artesanales a domicilio en Alausí, Ecuador. Consulta nuestra carta, tamaños y combos, y coordina tu pedido con La Buona Pizza por WhatsApp.', render: renderHomePage },
  { file: 'pizzas/index.html', path: '/pizzas/', key: 'pizzas', title: 'Pizzas artesanales en Alausí: carta | La Buona Pizza', description: 'Elige tu pizza artesanal en Alausí: consulta ingredientes, cuatro tamaños y precios de la carta de La Buona Pizza. Pide a domicilio por WhatsApp.', render: renderPizzasPage },
  { file: 'combos/index.html', path: '/combos/', key: 'combos', title: 'Combos de pizza a domicilio en Alausí | La Buona Pizza', description: 'Consulta los combos de pizza y complementos de La Buona Pizza Alausí: ingredientes, tamaños incluidos y precios para organizar tu pedido a domicilio.', render: renderStorePage },
  { file: 'resenas/index.html', path: '/resenas/', key: 'resenas', title: 'Reseñas de La Buona Pizza Alausí | Pizza a domicilio', description: 'Lee las opiniones aprobadas sobre La Buona Pizza Alausí y comparte tu experiencia con nuestras pizzas a domicilio. Las reseñas se revisan antes de publicarse.', render: renderResenasPage },
  { file: 'blog/index.html', path: '/blog/', key: 'blog', title: 'Blog de pizzas artesanales en Alausí | La Buona Pizza', description: 'Explora el blog de La Buona Pizza Alausí: publicaciones sobre nuestras pizzas y masa artesanal. Consulta también la carta para preparar tu pedido a domicilio.', render: renderBlogPage },
  ...blogArticles.map(article => ({
    file: `blog/${article.slug}/index.html`, path: articlePath(article), key: article.slug,
    navKey: 'blog', title: article.seoTitle, description: article.description, type: 'article',
    article,
    socialImage: { path: article.image, alt: article.imageAlt },
    render: () => renderBlogArticlePage(article)
  })),
  { file: '404.html', path: '/404.html', key: '404', title: 'Página no encontrada | La Buona Pizza Alausí', description: 'Accede al inicio, pizzas, combos, reseñas y blog de La Buona Pizza Alausí.', render: () => `
    <section class="page-section cta"><div class="container"><div class="cta-inner text-center rounded">
      <h1 class="h2 section-heading mb-4">Página no encontrada</h1>
      <p>No encontramos esta página. Puedes continuar en una de nuestras secciones:</p>
      <p><a href="/">Inicio</a> · <a href="/pizzas/">Pizzas</a> · <a href="/combos/">Combos</a> · <a href="/resenas/">Reseñas</a> · <a href="/blog/">Blog</a></p>
    </div></div></section>` }
];

const socialImages = {
  home: { path: '/img/bpizza.jpeg', alt: 'Pizza artesanal de La Buona Pizza Alausí' },
  pizzas: { path: '/img/pizza-barbacoa.jpg', alt: 'Pizza Barbacoa de la carta de La Buona Pizza Alausí' },
  combos: { path: '/img/combo-familiar.png', alt: 'Combo La Buona con pizza familiar, alitas BBQ y Papas Locas' },
  resenas: { path: '/img/bpizza.jpeg', alt: 'Pizza artesanal de La Buona Pizza Alausí' },
  blog: { path: '/img/masa-madre.jpg', alt: 'Imagen de la publicación sobre masa artesanal de La Buona Pizza Alausí' }
};

export async function renderSitePages({ preview = false } = {}) {
  const template = await readFile(join(projectRoot, 'templates/base.html'), 'utf8');
  const definitions = preview ? pageDefinitions.filter(page => ['pizzas', 'combos'].includes(page.key)) : pageDefinitions;
  const output = new Map();
  for (const page of definitions) {
    const url = `${siteOrigin}${page.path}`;
    const socialImage = page.socialImage || socialImages[page.key] || socialImages.home;
    const values = {
      ICON: imageManifest['/img/favicon-logo.png'].variants[0]?.path || '/img/favicon-logo.png',
      ICON_TYPE: imageManifest['/img/favicon-logo.png'].variants.length ? 'image/webp' : 'image/png',
      OG_TYPE: page.type || 'website',
      TITLE: escapeHtml(page.title), DESCRIPTION: escapeHtml(page.description), URL: url,
      IMAGE: `${siteOrigin}${socialImage.path}`, IMAGE_ALT: escapeHtml(socialImage.alt),
      IMAGE_WIDTH: String(imageManifest[socialImage.path].width), IMAGE_HEIGHT: String(imageManifest[socialImage.path].height),
      JSON_LD: preview || page.key === '404' ? '' : `<script type="application/ld+json">${structuredData({ page, origin: siteOrigin, image: `${siteOrigin}${socialImage.path}`, article: page.article })}</script>`,
      CANONICAL: preview || page.key === '404' ? '' : `<link rel="canonical" href="${url}">`,
      ROBOTS: preview ? '<meta name="robots" content="noindex, nofollow">' : page.key === '404' ? '<meta name="robots" content="noindex, follow">' : '',
      PAGE: page.key, CONTENT: normalizePageContent(page.render())
    };
    for (const key of ['home', 'pizzas', 'combos', 'resenas', 'blog']) values[`ACTIVE_${key.toUpperCase()}`] = key === (page.navKey || page.key) ? 'active' : '';
    let html = normalizeHtmlEntities(template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Marcador desconocido: ${key}`);
      return values[key];
    }));
    html = html.replace(/(<a class="nav-link[^>]*href="([^"]+)")/g, (match, tag, href) => href === page.path ? `${tag} aria-current="page"` : match);
    if (page.navKey === 'blog') html = html.replace('href="/blog/"', 'href="/blog/" aria-current="location"');
    if (preview) html = html.replace(/<script\b[^>]*src="\/js\/app\.js"[^>]*>[\s\S]*?<\/script>/g, '');
    output.set(preview ? `${page.key}.html` : page.file, html);
  }
  return output;
}

export function renderPreviewPages() { return renderSitePages({ preview: true }); }

async function rejectSymlink(path) {
  try {
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`La salida no admite enlaces simbólicos: ${relative(projectRoot, path)}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

async function validateLocalResources(pages) {
  for (const html of pages.values()) {
    for (const source of html.matchAll(/\bsrcset="([^"]+)"/g)) {
      for (const candidate of source[1].split(',')) {
        await access(join(projectRoot, candidate.trim().split(/\s+/)[0]));
      }
    }
    for (const match of html.matchAll(/\b(?:src|href)="\/?((?:img|css|js)\/[^"?#]+)"/g)) {
      const target = resolve(projectRoot, match[1]);
      const rel = relative(projectRoot, target);
      if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Recurso fuera del proyecto.');
      await access(target);
    }
  }
}

async function writePages(pages, directory) {
  await validateLocalResources(pages);
  const targets = [...pages.keys()].map(name => join(directory, name));
  for (const target of targets) {
    const rel = relative(projectRoot, target);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Destino fuera del proyecto.');
    const segments = rel.split('/');
    for (let i = 1; i <= segments.length; i++) await rejectSymlink(join(projectRoot, ...segments.slice(0, i)));
  }
  for (const [name, html] of pages) {
    const target = join(directory, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
  }
  return targets;
}

export async function generatePreview() { return writePages(await renderPreviewPages(), previewDirectory); }
export function renderSitemap() {
  const entries = pageDefinitions.filter(page => page.key !== '404')
    .map(page => `  <url><loc>${siteOrigin}${page.path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export async function generateSite() {
  const pages = await renderSitePages();
  pages.set('sitemap.xml', renderSitemap());
  return writePages(pages, projectRoot);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !['--preview', '--site'].includes(args[0])) throw new Error('Usa --preview o --site.');
    for (const path of await (args[0] === '--site' ? generateSite() : generatePreview())) console.log(`Generado: ${relative(projectRoot, path)}`);
  } catch (error) { console.error(`No se pudo generar: ${error.message}`); process.exitCode = 1; }
}
