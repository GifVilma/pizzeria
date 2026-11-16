import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { renderSitePages, renderPreviewPages, renderSitemap, projectRoot } from '../scripts/generar-paginas.mjs';
import { blogArticles, articlePath } from '../js/pages/blog-articulos.js';
import { structuredData } from '../scripts/datos-estructurados.mjs';

const origin = 'https://www.labuonapizzaalausi.online';
const paths = ['/', '/pizzas/', '/combos/', '/resenas/', '/blog/', ...blogArticles.map(articlePath)];
const fileFor = path => path === '/' ? 'index.html' : path.slice(1) + 'index.html';
const scripts = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
const nodeType = (graph, type) => graph.filter(node => node['@type'] === type);

await test('SEO técnico, rastreo y datos estructurados', async t => {
  const pages = await renderSitePages();
  const graphs = paths.map(path => {
    const matches = scripts(pages.get(fileFor(path)));
    assert.equal(matches.length, 1, path);
    const data = JSON.parse(matches[0][1]);
    assert.equal(data['@context'], 'https://schema.org');
    return data['@graph'];
  });

  await t.test('Sitemap: exactamente siete URLs existentes y sus canonical; robots permite recursos', async () => {
    const sitemap = await readFile(join(projectRoot, 'sitemap.xml'), 'utf8');
    assert.equal(sitemap, renderSitemap());
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    assert.deepEqual(urls, paths.map(path => origin + path));
    assert.equal(new Set(urls).size, 7);
    for (const path of paths) {
      const html = pages.get(fileFor(path));
      assert.ok(html.includes(`<link rel="canonical" href="${origin + path}">`));
      assert.doesNotMatch(html, /noindex/);
    }
    const robots = await readFile(join(projectRoot, 'robots.txt'), 'utf8');
    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
    assert.ok(robots.includes('Sitemap: ' + origin + '/sitemap.xml'));
  });

  await t.test('JSON-LD: grafo consistente, entidades únicas y referencias resolubles', () => {
    const knownIds = new Set(graphs.flat().map(node => node['@id']));
    const allowed = new Set(['FoodEstablishment', 'WebSite', 'WebPage', 'CollectionPage', 'Service', 'BlogPosting', 'BreadcrumbList']);
    const business = JSON.stringify(graphs[0][0]);
    for (const [index, graph] of graphs.entries()) {
      assert.equal(new Set(graph.map(node => node['@id'])).size, graph.length);
      assert.equal(JSON.stringify(nodeType(graph, 'FoodEstablishment')[0]), business);
      for (const node of graph) {
        assert.ok(allowed.has(node['@type']));
        assert.ok(node['@id'].startsWith(origin + '/'));
        for (const key of ['about', 'publisher', 'provider', 'mainEntity', 'mainEntityOfPage', 'isPartOf', 'breadcrumb']) {
          if (node[key]) assert.ok(knownIds.has(node[key]['@id']), node[key]['@id']);
        }
      }
      const page = graph.find(node => node['@id'] === origin + paths[index] + '#webpage');
      assert.equal(page.url, origin + paths[index]);
      assert.equal(page.inLanguage, 'es-EC');
    }
  });

  await t.test('Negocio y servicio: domicilio en Alausí, teléfono confirmado y menús existentes', () => {
    for (const graph of graphs) {
      const [business] = nodeType(graph, 'FoodEstablishment');
      assert.equal(business.telephone, '+593980491815');
      assert.match(business.description, /exclusivamente a domicilio/);
      assert.match(business.description, /Sin atención presencial/);
      assert.equal(business.areaServed.name, 'Alausí');
      assert.deepEqual(business.hasMenu, [origin + '/pizzas/', origin + '/combos/']);
    }
    const [service] = nodeType(graphs[0], 'Service');
    assert.equal(service.serviceType, 'Entrega de pizzas a domicilio');
    assert.equal(service.provider['@id'], origin + '/#negocio');
    assert.equal(service.areaServed.name, 'Alausí');
    assert.equal(graphs.slice(1).flatMap(graph => nodeType(graph, 'Service')).length, 0);
  });

  await t.test('Dos BlogPosting derivados del módulo editorial y breadcrumb acorde con enlaces reales', () => {
    assert.equal(graphs.flatMap(graph => nodeType(graph, 'BlogPosting')).length, 2);
    for (const article of blogArticles) {
      const path = articlePath(article), html = pages.get(fileFor(path));
      const graph = graphs[paths.indexOf(path)];
      const [post] = nodeType(graph, 'BlogPosting');
      assert.equal(post.headline, article.title);
      assert.equal(post.description, article.description);
      assert.equal(post.url, origin + path);
      assert.equal(post.image, origin + article.image);
      assert.equal(post.mainEntityOfPage['@id'], origin + path + '#webpage');
      const [breadcrumb] = nodeType(graph, 'BreadcrumbList');
      assert.deepEqual(breadcrumb.itemListElement.map(item => [item.position, item.item]), [[1, origin + '/'], [2, origin + '/blog/'], [3, origin + path]]);
      assert.match(html, /class="blog-back-link" href="\/blog\/"/);
      assert.match(html, /href="\/">Inicio/);
    }
  });

  await t.test('Sin datos comerciales/editoriales inventados, valoraciones, FAQ ni restaurante presencial', () => {
    const prohibited = ['address', 'geo', 'openingHours', 'openingHoursSpecification', 'aggregateRating', 'review', 'sameAs', 'author', 'datePublished', 'dateModified', 'offers', 'priceRange'];
    for (const graph of graphs) {
      const json = JSON.stringify(graph);
      for (const key of prohibited) assert.ok(!json.includes(`"${key}":`), key);
      assert.doesNotMatch(json, /"@type":"(?:Restaurant|FAQPage|Product|Offer)"/);
    }
  });

  await t.test('Todos los enlaces y recursos locales existen, incluidos srcset y anclas', async () => {
    for (const [file, html] of pages) {
      const base = origin + (file === 'index.html' ? '/' : file.replace(/index\.html$/, ''));
      const resources = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);
      for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) resources.push(...match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
      for (const resource of resources) {
        const url = new URL(resource, base);
        if (url.origin !== origin) continue;
        assert.doesNotMatch(url.pathname, /pizza-carnivora-alausi/);
        const target = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
        const localFile = url.pathname.endsWith('/') ? target === 'index.html' ? target : target + 'index.html' : target;
        assert.ok((await stat(join(projectRoot, localFile))).isFile(), `${file}: ${resource}`);
        if (url.hash && localFile.endsWith('.html')) {
          const content = pages.get(localFile) || await readFile(join(projectRoot, localFile), 'utf8');
          assert.ok(content.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), resource);
        }
      }
    }
  });

  await t.test('Español, jerarquía de encabezados, Twitter Card y dimensiones sociales', () => {
    for (const path of paths) {
      const html = pages.get(fileFor(path));
      assert.match(html, /<html lang="es-EC">/);
      assert.match(html, /name="twitter:card" content="summary_large_image"/);
      assert.match(html, /property="og:locale" content="es_EC"/);
      assert.match(html, /property="og:image:width" content="[1-9]\d*"/);
      assert.match(html, /property="og:image:height" content="[1-9]\d*"/);
      const levels = [...html.matchAll(/<h([1-6])\b/g)].map(m => Number(m[1]));
      assert.equal(levels.filter(n => n === 1).length, 1);
      assert.equal(levels[0], 1);
      for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1] + 1, `${path}: salto de encabezados`);
    }
  });

  await t.test('404 y previews sin grafo indexable; JSON seguro; peso tipográfico aprobado', async () => {
    assert.match(pages.get('404.html'), /name="robots" content="noindex, follow"/);
    assert.equal(scripts(pages.get('404.html')).length, 0);
    for (const html of (await renderPreviewPages()).values()) assert.equal(scripts(html).length, 0);
    const malicious = '</script><script>alert(1)</script>';
    const safe = structuredData({ page: { key: 'home', path: '/', title: malicious, description: 'Prueba' }, origin });
    assert.ok(!safe.includes('</script>'));
    assert.equal(JSON.parse(safe)['@graph'][2].name, malicious);
    const css = await readFile(join(projectRoot, 'css/styles.css'), 'utf8');
    assert.match(css, /\.section-heading\s+\.section-heading-lower\s*\{[^}]*font-weight:\s*200\s*;/);
  });
});
