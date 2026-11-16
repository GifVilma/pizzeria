import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { blogArticles, articlePath, renderBlogArticlePage } from '../js/pages/blog-articulos.js';
import { renderBlogPage } from '../js/pages/blog.js';
import { renderPizzasPage } from '../js/pages/pizzas.js';
import { renderStorePage } from '../js/pages/store.js';
import { renderSitemap, projectRoot } from '../scripts/generar-paginas.mjs';
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const guide = blogArticles[0];
const dollars = value => `$${Number(value).toFixed(2)}`;

await test('Artículos del blog y correspondencia con la carta actual', async t => {
  await t.test('Dos tarjetas y dos destinos, con contenido estático y CTA de WhatsApp', () => {
    const listing = renderBlogPage();
    assert.equal([...listing.matchAll(/<article\b/g)].length, 2);
    assert.equal([...listing.matchAll(/>Leer artículo completo<\/a>/g)].length, 2);
    for (const article of blogArticles) {
      assert.ok(listing.includes(`href="${articlePath(article)}"`));
      const html = renderBlogArticlePage(article);
      assert.ok(html.includes(article.content));
      assert.match(html, /href="\/pizzas\/"/);
      assert.match(html, /href="\/combos\/"/);
      assert.match(html, /href="https:\/\/wa.me\/593980491815"[^>]*>Pedir por WhatsApp/);
      assert.doesNotMatch(html, /\?text=.*Carn/);
    }
  });
  await t.test('Volver al blog usa la raíz y todos los enlaces internos tienen un destino existente', async () => {
    for (const article of blogArticles) {
      const html = renderBlogArticlePage(article);
      assert.match(html, /class="blog-back-link" href="\/blog\/">Volver al blog<\/a>/);
      for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
        const path = href.endsWith('/') ? href + 'index.html' : href;
        await access(join(projectRoot, path));
      }
    }
  });
  await t.test('Guía de 700–1000 palabras y tabla de precios idéntica a la carta', () => {
    const count = text(guide.content).split(/\s+/).length;
    assert.ok(count >= 700 && count <= 1000, `Extensión: ${count}`);
    const source = new Map();
    for (const section of renderPizzasPage().split('<section class="page-section">').slice(1)) {
      const name = section.match(/section-heading-lower">([^<]+)/)[1].replace(/^Pizza /, '').replace(/ \(Insignia\)/, '');
      source.set(name, section.match(/\$\d+\.\d{2}/g).slice(0, 4));
    }
    const rows = [...guide.content.matchAll(/<tr><th scope="row">([^<]+)<\/th>([\s\S]*?)<\/tr>/g)];
    assert.equal(rows.length, source.size);
    for (const [, name, cells] of rows) assert.deepEqual(cells.match(/\$\d+\.\d{2}/g), source.get(name));
    assert.match(guide.content, /doble de ingredientes por \$2\.50 adicionales/);
  });
  await t.test('Precios de combos, complementos y ejemplo calculados frente al menú', () => {
    const prices = new Map([...renderStorePage().matchAll(/<h3\b[^>]*>([^<]+)<\/h3>[\s\S]*?<span[^>]*>(\$\d+\.\d{2})<\/span>/g)]
      .map(([, name, price]) => [text(name).toLowerCase(), price]));
    const items = [...guide.content.matchAll(/<li><strong>([^<]+):<\/strong>([\s\S]*?)<\/li>/g)];
    assert.equal(items.length, 8);
    for (const [, name, item] of items) assert.equal(item.match(/\$\d+\.\d{2}/)[0], prices.get(name.toLowerCase()));
    const familiar = prices.get('combo la buona (familiar supremo)');
    assert.ok(guide.content.includes(`de <strong>${familiar}</strong>`));
    const hawaiana = renderPizzasPage().split('<section class="page-section">').find(s => s.includes('>Pizza Hawaiana<'));
    const medium = Number(hawaiana.match(/\$\d+\.\d{2}/g)[1].slice(1));
    const fingers = Number(prices.get('fingers de pollo').slice(1));
    assert.ok(guide.content.includes(`subtotal de estos productos es ${dollars(medium + fingers)}`));
  });
  await t.test('Carnívora retirada de fuentes, listado, sitemap y HTML generado; imagen conservada', async () => {
    assert.equal(blogArticles.length, 2);
    assert.ok(!blogArticles.some(article => article.slug === 'pizza-carnivora-alausi'));
    assert.doesNotMatch(renderBlogPage(), /Carnívora|pizza-carnivora-alausi/);
    assert.doesNotMatch(renderSitemap(), /pizza-carnivora-alausi/);
    await assert.rejects(access(join(projectRoot, 'blog/pizza-carnivora-alausi/index.html')), { code: 'ENOENT' });
    await access(join(projectRoot, 'img/pizza-carnivora.png'));
  });
  await t.test('Masa sin afirmaciones técnicas o digestivas no confirmadas', () => {
    const article = blogArticles.find(a => a.slug === 'masa-artesanal');
    assert.doesNotMatch(article.content, /harina de alta fuerza|24 horas|fácil digestión|facilita la digestión/);
    assert.match(article.content, /información que podamos confirmar/);
    assert.equal(article.title, 'Secretos de Nuestra Masa Artesanal');
  });
  await t.test('Sitemap generado incluye las siete páginas y excluye 404', async () => {
    const sitemap = await readFile(join(projectRoot, 'sitemap.xml'), 'utf8');
    assert.equal(sitemap, renderSitemap());
    assert.equal([...sitemap.matchAll(/<loc>/g)].length, 7);
    for (const article of blogArticles) assert.ok(sitemap.includes(`https://www.labuonapizzaalausi.online${articlePath(article)}`));
    assert.doesNotMatch(sitemap, /404|lastmod|#/);
  });
});
