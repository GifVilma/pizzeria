import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { imageManifest } from '../scripts/imagenes-html.mjs';
import { renderSitePages, projectRoot } from '../scripts/generar-paginas.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

await test('Imágenes WebP, originales y selección responsiva', async t => {
  await t.test('Hashes originales y derivados coinciden con el inventario', async () => {
    assert.ok(imageManifest['/img/fingers.jpeg']);
    assert.equal(imageManifest['/img/fingers.jpeg'].retained, true);
    assert.deepEqual(imageManifest['/img/fingers.jpeg'].uses, []);
    for (const path of ['/img/finger-pollo.jpg', '/img/pizza-carnivora.png', '/img/Menú La Buona Pizza.jpg']) assert.equal(imageManifest[path], undefined);
    for (const entry of Object.values(imageManifest)) {
      const original = await readFile(join(projectRoot, entry.source));
      assert.equal(hash(original), entry.sha256, entry.source);
      assert.equal(original.length, entry.bytes);
      for (const variant of entry.variants) {
        const bytes = await readFile(join(projectRoot, variant.path));
        assert.equal(hash(bytes), variant.sha256, variant.path);
        assert.equal(bytes.length, variant.bytes);
      }
    }
  });
  await t.test('WebP decodificable, sin recortes, ampliaciones ni cambios de perfil de color', () => {
    const result = spawnSync('python3', ['-c', `
from PIL import Image
from pathlib import Path
import json,sys,runpy
root=Path(sys.argv[1]); manifest=json.loads((root/'img/optimized/manifest.json').read_text())
validate=runpy.run_path(str(root/'scripts/optimizar-imagenes.py'))['validate_preoptimized']
for entry in manifest.values():
    if entry.get('preoptimized'):
        assert validate(entry,entry['uses']) == entry
    with Image.open(root/entry['source'].lstrip('/')) as original:
        assert original.size == (entry['width'],entry['height'])
        for variant in entry['variants']:
            with Image.open(root/variant['path'].lstrip('/')) as image:
                image.load()
                assert image.format == 'WEBP'
                assert image.size == (variant['width'],variant['height'])
                assert image.width <= original.width and image.height <= original.height
                assert abs(image.height - original.height*image.width/original.width) <= .5
                assert image.info.get('icc_profile',b'') == original.info.get('icc_profile',b'')
`, projectRoot], { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr);
  });
  await t.test('Todas las rutas usan picture con dimensiones, alt intacto y fallback original', async () => {
    for (const html of (await renderSitePages()).values()) {
      const images = [...html.matchAll(/<img\b[^>]*>/g)];
      const pictures = [...html.matchAll(/<picture class="optimized-picture"><source([^>]+)>(<img\b[^>]*>)<\/picture>/g)];
      assert.equal(pictures.length, images.length);
      for (const [, source, image] of pictures) {
        const original = image.match(/\bsrc="([^"]+)"/)[1];
        const entry = imageManifest[original];
        assert.ok(entry);
        assert.ok(image.includes(`width="${entry.width}" height="${entry.height}"`));
        assert.ok(image.match(/\balt="[^"]+"/));
        assert.match(source, /type="image\/webp"/);
        assert.match(source, /sizes="[^"]+"/);
        assert.equal(source.match(/srcset="([^"]+)"/)[1], entry.variants.map(v => `${v.path} ${v.width}w`).join(', '));
      }
    }
  });
  await t.test('Imagen principal eager y de alta prioridad; secundarias lazy', async () => {
    for (const html of (await renderSitePages()).values()) {
      const images = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
      if (!images.length) continue;
      assert.match(images[0], /loading="eager"/);
      assert.match(images[0], /fetchpriority="high"/);
      for (const image of images.slice(1)) { assert.match(image, /loading="lazy"/); assert.doesNotMatch(image, /fetchpriority="high"/); }
    }
  });
  await t.test('Derivados con ahorro, sin tamaños redundantes; inventario de archivos conservados', async () => {
    const expected = [];
    for (const entry of Object.values(imageManifest)) {
      assert.equal(new Set(entry.variants.map(v => v.width)).size, entry.variants.length);
      const largest = entry.variants.at(-1);
      for (const variant of entry.variants) {
        if (!entry.preoptimized) {
          assert.ok(variant.bytes <= entry.bytes * .92);
          assert.ok(entry.bytes - variant.bytes >= 4096);
          if (variant !== largest) { assert.ok(variant.bytes <= largest.bytes * .90); assert.ok(largest.bytes - variant.bytes >= 4096); }
        }
        if (variant.path.startsWith('/img/optimized/')) expected.push(variant.path.split('/').at(-1));
      }
    }
    const actual = (await readdir(join(projectRoot, 'img/optimized'))).filter(p => p.endsWith('.webp'));
    assert.deepEqual(actual.sort(), expected.sort());
  });
  await t.test('Fingers: tres WebP aportados, srcset, proporción y ninguna referencia antigua en las páginas', async () => {
    const entry = imageManifest['/img/fingers-plato-blanco-1200.webp'];
    assert.equal(entry.preoptimized, true);
    assert.deepEqual(entry.variants.map(v => [v.path, v.width, v.height]), [
      ['/img/fingers-plato-blanco-480.webp', 480, 360],
      ['/img/fingers-plato-blanco-800.webp', 800, 600],
      ['/img/fingers-plato-blanco-1200.webp', 1200, 900]
    ]);
    const pages = await renderSitePages();
    const html = pages.get('combos/index.html');
    const picture = [...html.matchAll(/<picture\b[^>]*>[\s\S]*?<\/picture>/g)].find(m => m[0].includes(entry.source))?.[0];
    assert.ok(picture);
    assert.ok(picture.includes(entry.variants.map(v => `${v.path} ${v.width}w`).join(', ')));
    assert.match(picture, /sizes="\(min-width: 1200px\) 218px/);
    assert.match(picture, /width="1200" height="900" loading="lazy"/);
    assert.match(picture, /alt="Fingers de pollo con patatas, presentados en un plato blanco"/);
    for (const page of pages.values()) assert.doesNotMatch(page, /\/img\/fingers\.jpeg|\/img\/optimized\/fingers-(?:480|960)\.webp/);
  });
  await t.test('Fondo con fallback y favicon ligero disponibles en todas las páginas', async () => {
    const css = await readFile(join(projectRoot, 'css/styles.css'), 'utf8');
    assert.match(css, /url\("\.\.\/img\/bg\.jpg"\)/);
    assert.match(css, /image-set\(url\("\.\.\/img\/optimized\/bg-1520\.webp"\)/);
    await access(join(projectRoot, 'img/optimized/bg-1520.webp'));
    const icon = imageManifest['/img/favicon-logo.png'].variants[0];
    assert.equal(icon.width, 64); assert.equal(icon.height, 64);
    for (const html of (await renderSitePages()).values()) assert.ok(html.includes(`href="${icon.path}" type="image/webp" sizes="64x64"`));
  });
});
