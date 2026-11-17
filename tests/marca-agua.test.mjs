import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { renderSitePages, projectRoot } from '../scripts/generar-paginas.mjs';

await test('Logotipo aprobado en el fondo general, sin duplicación en portada', async t => {
  await t.test('PNG publicado idéntico al aprobado, con proporciones y canal alfa originales', async () => {
    const png = await readFile(join(projectRoot, 'img/optimized/logo-la-buona-fondo-transparente.png'));
    assert.equal(createHash('sha256').update(png).digest('hex'), '3a4a59175abd9a0126d75630d707e1ba30a4000a6587e59a346b67720b376046');
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.toString('ascii', 12, 16), 'IHDR');
    assert.equal(png.readUInt32BE(16), 1224);
    assert.equal(png.readUInt32BE(20), 1158);
    assert.equal(png[25], 6, 'PNG RGBA, con transparencia real');
  });

  await t.test('Todas las páginas carecen de la antigua marca de tarjeta y de referencias temporales', async () => {
    const pages = await renderSitePages();
    for (const [path, html] of pages) {
      assert.doesNotMatch(html, /home-watermark/, path);
      assert.doesNotMatch(html, /\.tmp\/|propuesta-[abc]/);
    }
    assert.doesNotMatch(await readFile(join(projectRoot, 'index.html'), 'utf8'), /home-watermark/);
  });

  await t.test('Capa independiente con geometría aprobada y fotografía y filtro conservados', async () => {
    const css = await readFile(join(projectRoot, 'css/styles.css'), 'utf8');
    const body = css.match(/\bbody\s*\{([^}]+)\}/)[1];
    for (const declaration of ['--logo-fondo-ancho: 22vw', '--logo-fondo-opacidad: 0.25', '--logo-fondo-izquierda: 32px', '--logo-fondo-abajo: 104px', 'isolation: isolate', 'background-attachment: fixed', 'background-position: center', 'background-size: cover']) assert.ok(body.includes(declaration), declaration);
    assert.ok(body.includes('background: linear-gradient(rgba(47, 23, 15, 0.65), rgba(47, 23, 15, 0.65)), url("../img/optimized/bg-1520.webp")'));
    assert.ok(body.includes('background-image: linear-gradient(rgba(47, 23, 15, 0.40), rgba(47, 23, 15, 0.65)), url("../img/optimized/bg-1520.webp")'));
    assert.doesNotMatch(body, /(?:^|;)\s*opacity\s*:/);
    const layers = [...css.matchAll(/body::before\s*\{([^}]+)\}/g)];
    assert.equal(layers.length, 1, 'Una sola capa de logotipo para todas las páginas');
    const layer = layers[0][1];
    for (const declaration of ['content: ""', 'position: fixed', 'inset: 0', 'z-index: -1', 'pointer-events: none', 'opacity: var(--logo-fondo-opacidad)', 'url("../img/optimized/logo-la-buona-fondo-transparente.png") left var(--logo-fondo-izquierda) bottom var(--logo-fondo-abajo) / var(--logo-fondo-ancho) auto no-repeat']) assert.ok(layer.includes(declaration), declaration);
    assert.match(css, /@media \(max-width: 575\.98px\)\s*\{\s*body\s*\{\s*--logo-fondo-izquierda: 16px;\s*--logo-fondo-abajo: 96px;/);
    assert.doesNotMatch(css, /home-watermark|\.tmp\/|__prueba/);
  });
});
