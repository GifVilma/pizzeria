import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderPizzasPage } from '../js/pages/pizzas.js';
import { renderStorePage } from '../js/pages/store.js';
import { blogArticles } from '../js/pages/blog-articulos.js';
import { projectRoot } from '../scripts/generar-paginas.mjs';
const plain = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const guide = blogArticles.find(article => article.slug === 'pizza-a-domicilio-alausi').content;
const store = renderStorePage();
const complements = store.match(/<section id="complementos"[^>]*>([\s\S]*?)<\/section>/)[1];
const rice = store.match(/<section id="arroz"[^>]*>([\s\S]*?)<\/section>/)[1];

await test('Carta oficial y condiciones confirmadas por el negocio', async t => {
  await t.test('Margarita pequeña a $5.50 y los restantes precios base intactos', () => {
    const expected = new Map([
      ['Pizza Barbacoa (Insignia)', ['$7.00', '$9.00', '$11.00', '$14.00']],
      ['Pizza Hawaiana', ['$5.50', '$7.00', '$8.50', '$11.50']],
      ['Pizza Carbonara', ['$5.50', '$7.00', '$8.50', '$11.50']],
      ['Pizza Margarita', ['$5.50', '$6.50', '$8.00', '$10.50']],
      ['Pizza Pepperoni', ['$5.50', '$7.00', '$8.50', '$11.50']]
    ]);
    const sections = renderPizzasPage().split('<section class="page-section">').slice(1);
    assert.equal(sections.length, 5);
    for (const section of sections) {
      const name = section.match(/section-heading-lower">([^<]+)/)[1];
      assert.deepEqual(section.match(/\$\d+\.\d{2}/g).slice(0, 4), expected.get(name));
    }
  });
  await t.test('Suplemento de $2,50: nota única después de las cinco pizzas, también en el HTML generado', async () => {
    const note = 'Opcional: doble de ingredientes por $2,50 adicionales, disponible para todas las pizzas y tamaños.';
    for (const pizzas of [renderPizzasPage(), await readFile(join(projectRoot, 'pizzas/index.html'), 'utf8')]) {
      assert.equal(pizzas.split(note).length - 1, 1);
      assert.equal([...pizzas.matchAll(/doble de ingredientes/g)].length, 1);
      const sections = [...pizzas.matchAll(/<section class="page-section">[\s\S]*?<\/section>/g)];
      assert.equal(sections.length, 5);
      for (const section of sections) assert.doesNotMatch(section[0], /Opcional:|doble de ingredientes/);
      const noteIndex = pizzas.indexOf('id="pizzas-suplemento"');
      const lastPizza = sections.at(-1);
      assert.ok(noteIndex > lastPizza.index + lastPizza[0].length);
      assert.ok(noteIndex < pizzas.indexOf('class="btn btn-primary btn-xl btn-whatsapp-inline"'));
      const prices = pizzas.match(/\$\d+\.\d{2}/g);
      assert.equal(prices.length, 20, 'Solo los veinte precios base, sin suplementos repetidos');
      assert.doesNotMatch(pizzas, /Opcional: doble de ingredientes por \$2\.50/);
    }
    assert.match(guide, /doble de ingredientes por \$2\.50 adicionales al precio del tamaño de pizza elegido/);
    assert.match(guide, /opción está disponible para los cuatro tamaños/);
  });
  await t.test('Guarnición limitada a los cuatro complementos, con descripción oficial de Papas Locas', () => {
    assert.match(complements, /Los cuatro complementos de esta sección incluyen patatas y ensalada/);
    assert.deepEqual([...complements.matchAll(/<h3\b[^>]*>([^<]+)<\/h3>/g)].map(m => m[1]), ['Alitas BBQ', 'Papas Locas', 'Fingers de pollo', 'Combinado La Buona']);
    const outside = store.replace(complements, '');
    assert.doesNotMatch(outside, /incluyen patatas y ensalada/);
    assert.match(complements, /Pollo, carne y cerdo cubiertos con salsa especial La Buona y mayonesa al gusto\./);
    assert.doesNotMatch(complements, /Porción individual/);
    assert.match(guide, /no se aplica al arroz ni se extiende automáticamente a los combos/);
  });
  await t.test('Arroz separado: $1.00 y ninguna imagen ni guarnición atribuida', () => {
    assert.match(rice, /Porción de arroz/);
    assert.deepEqual(rice.match(/\$\d+\.\d{2}/g), ['$1.00']);
    assert.doesNotMatch(rice, /<img|<picture|patatas|ensalada|incluye/);
    assert.match(guide, /porción de arroz por \$1\.00/);
    assert.ok(store.indexOf('</section>', store.indexOf('id="complementos"')) < store.indexOf('id="arroz"'));
  });
  await t.test('Fingers usa la fotografía del plato blanco y conserva las anteriores', async () => {
    assert.match(complements, /src="img\/fingers-plato-blanco-1200\.webp"/);
    assert.match(complements, /alt="Fingers de pollo con patatas, presentados en un plato blanco"/);
    assert.doesNotMatch(complements, /src="img\/fingers\.jpeg"/);
    assert.doesNotMatch(complements, /src="img\/finger-pollo\.jpg"/);
    await access(join(projectRoot, 'img/fingers.jpeg'));
    await access(join(projectRoot, 'img/finger-pollo.jpg'));
    for (const path of ['img/optimized/fingers-480.webp', 'img/optimized/fingers-960.webp']) await access(join(projectRoot, path));
  });
  await t.test('Los cinco combos conservan precio, composición, cantidades y fotografías', () => {
    const combos = store.split('<!-- Listado de Combos Especiales con Fotografía -->')[1].split('<!-- Listado de Complementos -->')[0];
    assert.deepEqual(combos.match(/\$\d+\.\d{2}/g), ['$9.00', '$9.00', '$12.50', '$9.00', '$17.00']);
    assert.equal([...combos.matchAll(/<h3\b/g)].length, 5);
    assert.equal([...combos.matchAll(/\(6 ud\.\)/g)].length, 4);
    assert.deepEqual([...combos.matchAll(/src="([^"]+)"/g)].map(m => m[1]), ['img/pizza-peperoni-fingers.png', 'img/pizza-hawaiana-patatas.png', 'img/combo-bar-ali.jpg', 'img/pizza-carbonara-fingers.png', 'img/combo-familiar.png']);
    assert.match(combos, /Barbacoa, Hawaiana, Carbonara, Margarita o Pepperoni/);
    assert.doesNotMatch(combos, /ensalada|id="arroz"/);
  });
});
