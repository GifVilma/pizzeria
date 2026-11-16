import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { renderSitePages, projectRoot } from '../scripts/generar-paginas.mjs';

const routes = [
  ['index.html', '/'], ['pizzas/index.html', '/pizzas/'], ['combos/index.html', '/combos/'],
  ['resenas/index.html', '/resenas/'], ['blog/index.html', '/blog/'],
  ['blog/pizza-a-domicilio-alausi/index.html', '/blog/pizza-a-domicilio-alausi/'],
  ['blog/masa-artesanal/index.html', '/blog/masa-artesanal/']
];
const origin = 'https://www.labuonapizzaalausi.online';
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const meta = (html, key) => {
  const entries = [...html.matchAll(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)">`, 'g'))];
  assert.equal(entries.length, 1, `Metadato ausente o duplicado: ${key}`);
  return entries[0][1];
};

await test('SEO de las páginas estáticas y artículos', async t => {
  const pages = await renderSitePages();
  const titles = [], descriptions = [], headings = [];
  for (const [file, path] of routes) {
    await t.test(`${path}: título, descripción, canonical, H1 y metadatos sociales`, async () => {
      const html = await readFile(join(projectRoot, file), 'utf8');
      assert.equal(html, pages.get(file), 'La página debe estar regenerada');
      const titleMatches = [...html.matchAll(/<title>([^<]+)<\/title>/g)];
      assert.equal(titleMatches.length, 1);
      const title = titleMatches[0][1];
      const description = meta(html, 'description');
      assert.match(title, /Alausí/);
      assert.match(title, /La Buona Pizza/);
      assert.match(description, /Alausí/);
      assert.doesNotMatch(description, /5 estrellas|entrega gratis|descuento|visítanos/i);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assert.equal(h1s.length, 1);
      const h1 = text(h1s[0][1]);
      if (path !== '/blog/masa-artesanal/') assert.match(h1, /Alausí/);
      else assert.equal(h1, 'Secretos de Nuestra Masa Artesanal');
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
      assert.ok(main.includes(h1s[0][0]));
      const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
      assert.equal(canonical.length, 1);
      assert.equal(canonical[0][1], origin + path);
      assert.equal(meta(html, 'og:title'), title);
      assert.equal(meta(html, 'og:description'), description);
      assert.equal(meta(html, 'og:url'), canonical[0][1]);
      assert.equal(meta(html, 'og:type'), path.startsWith('/blog/') && path !== '/blog/' ? 'article' : 'website');
      const image = new URL(meta(html, 'og:image'));
      assert.equal(image.origin, origin);
      await access(join(projectRoot, image.pathname));
      assert.ok(meta(html, 'og:image:alt').length > 0);
      assert.equal(meta(html, 'twitter:title'), title);
      assert.equal(meta(html, 'twitter:description'), description);
      assert.equal(meta(html, 'twitter:image'), image.href);
      assert.equal(meta(html, 'twitter:image:alt'), meta(html, 'og:image:alt'));
      assert.doesNotMatch(html, /noindex/);
      titles.push(title); descriptions.push(description); headings.push(h1);
    });
  }
  await t.test('Títulos, descripciones y H1 diferenciados entre páginas y artículos', () => {
    for (const values of [titles, descriptions, headings]) assert.equal(new Set(values).size, routes.length);
  });
  await t.test('Portada: servicio exclusivamente a domicilio y sin catálogo duplicado', () => {
    const html = pages.get('index.html');
    assert.match(html, /exclusivamente entrega a domicilio en Alausí/);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
    // El JSON-LD declara explícitamente «Sin atención presencial».
    // Esta comprobación busca invitaciones a visitar el local en el contenido visible.
    assert.doesNotMatch(main, /ambiente acogedor|visítanos|atención presencial|comer en nuestro local/i);
    assert.doesNotMatch(html, /\$\d+\.\d{2}|COMBO LA BUONA/);
  });
});
