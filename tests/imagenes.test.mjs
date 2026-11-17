import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { imageManifest } from '../scripts/imagenes-html.mjs';
import { renderSitePages, projectRoot } from '../scripts/generar-paginas.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

await test('Rutas de imágenes existentes exclusivamente en optimized', async t => {
  await t.test('El manifiesto ya no depende de originales; conserva los WebP aprobados', async () => {
    const paths = new Set();
    for (const [key, entry] of Object.entries(imageManifest)) {
      assert.equal(key, entry.source);
      assert.ok(key.startsWith('/img/optimized/'));
      assert.equal(entry.preoptimized, true);
      assert.ok(entry.width > 0 && entry.height > 0);
      const assets = [{ path: entry.source, bytes: entry.bytes, sha256: entry.sha256 }, ...entry.variants];
      for (const asset of assets) {
        assert.ok(asset.path.startsWith('/img/optimized/'));
        const bytes = await readFile(join(projectRoot, asset.path));
        assert.equal(hash(bytes), asset.sha256, asset.path);
        assert.equal(bytes.length, asset.bytes);
        assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
        assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
        paths.add(asset.path.split('/').at(-1));
      }
    }
    const actual = (await readdir(join(projectRoot, 'img/optimized'))).filter(p => p.endsWith('.webp'));
    assert.deepEqual(actual.sort(), [...paths].sort());
  });

  await t.test('picture/srcset conserva tamaños, alt, presentación y fallback WebP', async () => {
    for (const html of (await renderSitePages()).values()) {
      const images = [...html.matchAll(/<img\b[^>]*>/g)];
      const pictures = [...html.matchAll(/<picture class="optimized-picture"><source([^>]+)>(<img\b[^>]*>)<\/picture>/g)];
      assert.equal(pictures.length, images.length);
      for (const [, source, image] of pictures) {
        const src = image.match(/\bsrc="([^"]+)"/)[1];
        const entry = imageManifest[src];
        assert.ok(src.startsWith('/img/optimized/') && src.endsWith('.webp'));
        assert.ok(entry);
        assert.ok(image.includes(`width="${entry.width}" height="${entry.height}"`));
        assert.match(image, /\balt="[^"]+"/);
        assert.match(source, /type="image\/webp"/);
        assert.match(source, /sizes="[^"]+"/);
        assert.equal(source.match(/srcset="([^"]+)"/)[1], entry.variants.map(v => `${v.path} ${v.width}w`).join(', '));
      }
      assert.doesNotMatch(html, /\/img\/(?!optimized\/)/);
    }
  });

  await t.test('Prioridad de imágenes y variantes de los tres productos aprobados', async () => {
    for (const html of (await renderSitePages()).values()) {
      const images = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
      if (!images.length) continue;
      assert.match(images[0], /loading="eager"/);
      assert.match(images[0], /fetchpriority="high"/);
      for (const image of images.slice(1)) assert.match(image, /loading="lazy"/);
    }
    for (const name of ['fingers', 'papas-locas', 'papas-locas-fingers']) {
      const entry = imageManifest[`/img/optimized/${name}.webp`];
      assert.ok(entry);
      assert.deepEqual(entry.variants.map(v => v.path), [
        `/img/optimized/${name}-480.webp`, `/img/optimized/${name}-960.webp`
      ]);
      assert.deepEqual(entry.variants.map(v => v.width), [480, 960]);
      for (const variant of entry.variants) {
        assert.equal(variant.height, Math.round(entry.sourceHeight * variant.width / entry.sourceWidth));
      }
    }
  });

  await t.test('Fondo WebP, ajuste 0.40, PNG transparente y favicon resueltos', async () => {
    const css = await readFile(join(projectRoot, 'css/styles.css'), 'utf8');
    assert.ok(css.includes('background-image: linear-gradient(rgba(47, 23, 15, 0.40), rgba(47, 23, 15, 0.65)), url("../img/optimized/bg-1520.webp")'));
    assert.doesNotMatch(css, /\.\.\/img\/(?!optimized\/)/);
    for (const path of ['img/optimized/bg-1520.webp', 'img/optimized/logo-la-buona-fondo-transparente.png']) await access(join(projectRoot, path));
    for (const html of (await renderSitePages()).values()) assert.ok(html.includes('href="/img/optimized/favicon-logo-64.webp" type="image/webp" sizes="64x64"'));
  });
});
