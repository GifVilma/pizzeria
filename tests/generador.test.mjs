// Comprueba vistas temporales y páginas definitivas generadas. No utiliza la red ni datos de clientes.
// La comprobación HTML5 usa python3 y html5lib, disponibles en este entorno.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { renderPizzasPage } from '../js/pages/pizzas.js';
import { renderStorePage } from '../js/pages/store.js';
import { renderWhatsAppButton } from '../js/pages/whatsapp.js';
import {
  projectRoot, previewDirectory, normalizeHtmlEntities, normalizePageContent, renderPreviewPages, renderSitePages, generatePreview, generateSite
} from '../scripts/generar-paginas.mjs';

async function protectedFiles() {
  const paths = ['index.html', 'robots.txt', 'sitemap.xml', 'CNAME', 'tests/resenas.test.mjs'];
  async function walk(directory) {
    for (const entry of await readdir(join(projectRoot, directory), { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) paths.push(path);
    }
  }
  for (const directory of ['js', 'css', 'img']) await walk(directory);
  return Object.fromEntries(await Promise.all(paths.map(async path => [
    path, createHash('sha256').update(await readFile(join(projectRoot, path))).digest('hex')
  ])));
}

function validateHtml(path) {
  const result = spawnSync('python3', ['-c', `
import sys, json
try:
    import html5lib
except ImportError:
    sys.exit('La validación HTML5 necesita html5lib en python3; no se ha instalado nada automáticamente.')
parser = html5lib.HTMLParser()
with open(sys.argv[1], encoding='utf-8') as source:
    tree = parser.parse(source.read())
assert not parser.errors, json.dumps(parser.errors)
ns = {'h': 'http://www.w3.org/1999/xhtml'}
assert tree.tag == '{http://www.w3.org/1999/xhtml}html'
assert tree.attrib.get('lang') == 'es-EC'
assert len(tree.findall('h:head', ns)) == 1
assert len(tree.findall('h:body', ns)) == 1
assert len(tree.findall('.//h:main', ns)) == 1
assert len(tree.findall('.//h:title', ns)) == 1
headings = [int(e.tag[-1]) for e in tree.iter() if e.tag in ['{http://www.w3.org/1999/xhtml}h' + str(n) for n in range(1, 7)]]
assert headings.count(1) == 1, 'Cada página debe tener un solo H1'
assert headings[0] == 1, 'El primer encabezado debe ser H1'
assert all(b <= a + 1 for a, b in zip(headings, headings[1:])), 'Salto en la jerarquía de encabezados'
assert len(tree.findall('.//h:main//h:h1', ns)) == 1, 'El H1 debe estar en main'
ids = [e.attrib['id'] for e in tree.iter() if 'id' in e.attrib]
assert len(ids) == len(set(ids)), 'IDs repetidos'
for image in tree.findall('.//h:img', ns):
    assert image.attrib.get('src') and image.attrib.get('alt'), 'Imagen sin src o alt'
`, path], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
}

await test('Generador estático, fase 2', async t => {
  const before = await protectedFiles();
  const pages = await renderPreviewPages();
  await generatePreview();

  await t.test('El modo preview produce únicamente dos vistas temporales', () => {
    assert.deepEqual([...pages.keys()], ['pizzas.html', 'combos.html']);
    assert.equal(relative(projectRoot, previewDirectory), '.tmp/seo-preview');
    for (const html of pages.values()) {
      assert.match(html, /^<!DOCTYPE html>/);
      assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
      assert.doesNotMatch(html, /rel="canonical"/);
      assert.doesNotMatch(html, /src="(?:\/)?js\/app\.js"/);
      assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
    }
  });

  for (const [name, render] of [['pizzas.html', renderPizzasPage], ['combos.html', renderStorePage]]) {
    await t.test(`${name}: carta idéntica a su módulo y precios sin duplicación manual`, () => {
      const html = pages.get(name);
      const main = html.match(/<main id="app-content"[^>]*>([\s\S]*?)<\/main>/)[1].trim();
      const expected = normalizePageContent(render()).trim();
      assert.equal(main, expected, 'Se alteró el catálogo renderizado');
      assert.deepEqual(html.match(/\$\d+\.\d{2}/g), expected.match(/\$\d+\.\d{2}/g));
      assert.deepEqual([...main.matchAll(/<img\b[^>]*>/g)].map(m => m[0]),
        [...expected.matchAll(/<img\b[^>]*>/g)].map(m => m[0]));
      assert.ok(main.includes(normalizePageContent(renderWhatsAppButton()).trim()));
    });
    await t.test(`${name}: documento analizado como HTML5 sin errores`, () => validateHtml(join(previewDirectory, name)));
  }

  await t.test('Conserva cabecera, navegación, pie, estilos y enlaces de WhatsApp', async () => {
    const original = await readFile(join(projectRoot, 'index.html'), 'utf8');
    const header = original.match(/<div class="site-heading[^"]*">[\s\S]*?<\/div>/)[0];
    const paths = ['/', '/pizzas/', '/combos/', '/resenas/', '/blog/'];
    const footer = original.match(/<footer\b[\s\S]*?<\/footer>/)[0];
    for (const html of pages.values()) {
      for (const fragment of [header, footer]) assert.ok(html.includes(fragment));
      assert.match(html, /href="\/css\/styles\.css"/);
      assert.match(html, /href="tel:\+593980491815"/);
      assert.match(html, /href="https:\/\/wa\.me\/593980491815"/);
      for (const path of paths) assert.ok(html.includes(`href="${path}"`));
      assert.doesNotMatch(html, /<base\b/);
    }
  });

  await t.test('No importa ni publica configuración o servicios de reseñas', () => {
    for (const html of pages.values()) {
      assert.doesNotMatch(html, /sb_publishable_|sb_secret_|supabase\.co|challenges\.cloudflare\.com|turnstileToken/);
      assert.doesNotMatch(html, /localStorage|fetch\(/);
    }
  });

  await t.test('Generación determinista en carpeta ignorada y recursos existentes', async () => {
    const first = await generatePreview();
    assert.deepEqual(first.map(path => relative(previewDirectory, path)), [...pages.keys()]);
    const hashes = await Promise.all(first.map(path => readFile(path, 'utf8')));
    const second = await generatePreview();
    assert.deepEqual(await Promise.all(second.map(path => readFile(path, 'utf8'))), hashes);
    const ignored = spawnSync('git', ['check-ignore', ...first], { cwd: projectRoot, encoding: 'utf8' });
    assert.equal(ignored.status, 0, ignored.stderr);
    assert.equal(ignored.stdout.trim().split('\n').length, first.length);
  });


  await t.test('Páginas definitivas: siete indexables y 404 excluida de indexación', async () => {
    const publicPages = await renderSitePages();
    assert.deepEqual([...publicPages.keys()], ['index.html', 'pizzas/index.html', 'combos/index.html', 'resenas/index.html', 'blog/index.html', 'blog/pizza-a-domicilio-alausi/index.html', 'blog/masa-artesanal/index.html', '404.html']);
    await generateSite();
    for (const [name, html] of publicPages) {
      assert.equal(await readFile(join(projectRoot, name), 'utf8'), html);
      validateHtml(join(projectRoot, name));
      assert.doesNotMatch(html, /<base\b/);
      if (name === '404.html') assert.match(html, /name="robots" content="noindex, follow"/);
      else assert.doesNotMatch(html, /noindex/);
      assert.match(html, /src="\/js\/app\.js"/);
      if (name !== '404.html') {
        const path = name === 'index.html' ? '/' : '/' + name.replace(/index\.html$/, '');
        assert.ok(html.includes(`rel="canonical" href="https://www.labuonapizzaalausi.online${path}"`));
        if (path.startsWith('/blog/') && path !== '/blog/') assert.ok(html.includes('href="/blog/" aria-current="location"'));
        else assert.ok(html.includes(`href="${path}" aria-current="page"`));
      }
      for (const [, resource] of html.matchAll(/\b(?:src|href)="(\/[^"#]*)"/g)) {
        const local = resource.endsWith('/') ? resource + 'index.html' : resource;
        await access(join(projectRoot, local));
      }
    }
    const home = publicPages.get('index.html');
    assert.doesNotMatch(home, /\$\d+\.\d{2}|COMBO LA BUONA|Pizza Barbacoa \(Insignia\)/);
    assert.match(publicPages.get('blog/index.html'), /cómo elegir tu pedido/);
  });

  await t.test('Catálogos públicos idénticos a los renderizadores, sin dependencia del router', async () => {
    const publicPages = await renderSitePages();
    for (const [path, render] of [['pizzas/index.html', renderPizzasPage], ['combos/index.html', renderStorePage]]) {
      const main = publicPages.get(path).match(/<main id="app-content"[^>]*>([\s\S]*?)<\/main>/)[1].trim();
      assert.equal(main, normalizePageContent(render()).trim());
      assert.doesNotMatch(main, /<script/);
    }
  });

  await t.test('La generación conserva las fuentes, fotografías, servicios y resultados existentes', async () => {
    assert.deepEqual(await protectedFiles(), before);
  });
});
