import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderSitePages, projectRoot } from '../scripts/generar-paginas.mjs';

await test('Marca de agua aprobada: recurso autónomo y exclusivo de inicio', async t => {
  await t.test('SVG conserva exactamente el JPG original y el recorte aprobado con transparencia exterior', async () => {
    const svg = await readFile(join(projectRoot, 'img/logo-la-buona-marca-agua.svg'), 'utf8');
    const jpeg = await readFile(join(projectRoot, 'img/logo-la-buona.jpg'));
    const embedded = svg.match(/xlink:href="data:image\/jpeg;base64,([A-Za-z0-9+/=]+)"/);
    assert.ok(embedded);
    assert.deepEqual(Buffer.from(embedded[1], 'base64'), jpeg);
    assert.match(svg, /viewBox="426 326 1224 1158"/);
    assert.match(svg, /<ellipse cx="1038" cy="905" rx="612" ry="579"\/>/);
    assert.match(svg, /clip-path="url\(#borde\)"/);
    assert.doesNotMatch(svg, /<script|<rect|\.tmp|favicon/);
  });

  await t.test('Decoración accesible una sola vez en portada, sin referencias temporales', async () => {
    const pages = await renderSitePages();
    for (const [path, html] of pages) {
      assert.equal((html.match(/class="home-watermark"/g) || []).length, path === 'index.html' ? 1 : 0);
      assert.doesNotMatch(html, /\.tmp\/|propuesta-[abc]/);
    }
    assert.match(pages.get('index.html'), /<span class="home-watermark" aria-hidden="true"><\/span>/);
    assert.doesNotMatch(pages.get('index.html'), /home-watermark[^>]*(?:tabindex|role="button")/);
  });

  await t.test('CSS mantiene dimensiones, ubicación y opacidades de C sin interceptar clics', async () => {
    const css = await readFile(join(projectRoot, 'css/styles.css'), 'utf8');
    const blocks = [...css.matchAll(/body\[data-page="home"\] \.home-watermark\s*\{([^}]+)\}/g)].map(m => m[1]);
    assert.equal(blocks.length, 2);
    for (const declaration of ['position: absolute', 'pointer-events: none', 'user-select: none', 'z-index: 0', 'width: 132px', 'max-width: 18%', 'left: 26px', 'top: 50%', 'transform: translateY(-50%)', 'opacity: 0.08', 'aspect-ratio: 1224 / 1158', 'url("/img/logo-la-buona-marca-agua.svg")']) assert.ok(blocks[0].includes(declaration), declaration);
    for (const declaration of ['width: 100px', 'max-width: 35%', 'left: 12px', 'top: auto', 'bottom: 12px', 'transform: none', 'opacity: 0.065']) assert.ok(blocks[1].includes(declaration), declaration);
    assert.match(css, /@media \(max-width: 575\.98px\)\s*\{\s*body\[data-page="home"\] \.home-watermark/);
    assert.match(css, /body\[data-page="home"\] \.intro-text\s*\{[^}]*isolation: isolate;/);
    assert.match(css, /body\[data-page="home"\] \.intro-text > :not\(\.home-watermark\)\s*\{[^}]*z-index: 1;/);
  });
});
