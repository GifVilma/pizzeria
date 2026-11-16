// Ejecutar: node --experimental-default-type=module tests/resenas.test.mjs
// No utiliza la configuración real ni envía datos a Supabase o Cloudflare.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchResenasAprobadas, enviarResena, isResenasSubmissionConfigured } from '../js/services/resenas-api.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = { projectUrl: 'https://example.supabase.co', publishableKey: 'sb_publishable_test', turnstileSiteKey: 'public-test-key' };
const values = { nombre: ' Ana ', estrellas: 4, comentario: ' Muy buena ', turnstileToken: 'test-token' };
const review = { id: 1, created_at: '2026-11-15T00:00:00Z', nombre: '<img src=x onerror=alert(1)>', estrellas: 4, comentario: '<script>alert(1)</script>' };
const tick = () => new Promise(resolve => setImmediate(resolve));
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.isConnected = true; this.textContent = ''; this.disabled = true; }
  set innerHTML(_) { throw Error('No insertar HTML de reseñas'); }
  setAttribute(k, v) { this.attributes[k] = v; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  remove() { this.isConnected = false; }
  getBoundingClientRect() { return { width: 250 }; }
}

await test('Integración de reseñas (sin conexiones externas)', async t => {
  const originalFetch = globalThis.fetch;
  const fixture = await mkdtemp(join(tmpdir(), 'pizzeria-resenas-'));
  try {
    await t.test('Lectura: GET solo de aprobadas; lista vacía y puntuación inválida', async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(url.searchParams.get('aprobada'), 'eq.true');
        assert.equal(options.method, 'GET');
        return new Response(JSON.stringify([review]));
      };
      assert.deepEqual(await fetchResenasAprobadas({ config }), [review]);
      globalThis.fetch = async () => new Response('[]');
      assert.deepEqual(await fetchResenasAprobadas({ config }), []);
      globalThis.fetch = async () => new Response(JSON.stringify([{ ...review, estrellas: -1 }]));
      await assert.rejects(fetchResenasAprobadas({ config }));
    });
    await t.test('Configuración incompleta y datos inválidos impiden POST', async () => {
      globalThis.fetch = () => assert.fail('No debe haber peticiones');
      assert.equal(isResenasSubmissionConfigured({ ...config, turnstileSiteKey: '' }), false);
      assert.equal(isResenasSubmissionConfigured({ ...config, publishableKey: 'sb_secret_invalid' }), false);
      for (const invalid of [{ ...values, nombre: ' ' }, { ...values, estrellas: 6 }, { ...values, turnstileToken: '' }]) {
        await assert.rejects(enviarResena(invalid, { config }));
      }
    });
    await t.test('POST a la función con los cuatro campos exactos y solo apikey pública', async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(url.href, 'https://example.supabase.co/functions/v1/enviar-resena');
        assert.equal(options.method, 'POST');
        assert.equal(options.headers.apikey, config.publishableKey);
        assert.equal(options.headers.Authorization, undefined);
        assert.deepEqual(JSON.parse(options.body), { ...values, nombre: 'Ana', comentario: 'Muy buena' });
        return new Response(JSON.stringify({ success: true }));
      };
      await enviarResena(values, { config });
    });
    await t.test('Errores HTTP, fallo lógico y respuesta de red incierta', async () => {
      for (const status of [400, 401, 403, 409, 422, 429, 500]) {
        globalThis.fetch = async () => new Response('{}', { status });
        await assert.rejects(enviarResena(values, { config }));
      }
      globalThis.fetch = async () => new Response('{"success":false}');
      await assert.rejects(enviarResena(values, { config }));
      globalThis.fetch = async () => { throw Error('offline'); };
      await assert.rejects(enviarResena(values, { config }), /podría haberse recibido/);
    });
    await t.test('Impide peticiones simultáneas sin reintentos automáticos', async () => {
      let finish, requests = 0;
      globalThis.fetch = () => { requests++; return new Promise(resolve => { finish = resolve; }); };
      const pending = enviarResena(values, { config });
      await assert.rejects(enviarResena(values, { config }), /Ya hay una reseña/);
      assert.equal(requests, 1);
      finish(new Response(null, { status: 204 }));
      await pending;
    });

    for (const dir of ['pages', 'services', 'config']) await mkdir(join(fixture, dir));
    for (const path of ['pages/resenas.js', 'pages/whatsapp.js', 'services/resenas-api.js', 'services/turnstile.js']) {
      await copyFile(join(root, 'js', path), join(fixture, path));
    }
    await writeFile(join(fixture, 'config/supabase.js'), `export const supabaseConfig=${JSON.stringify(config)};`);
    const page = await import(pathToFileURL(join(fixture, 'pages/resenas.js')));
    let nodes, callbacks, removed, resets, posts, bodies;
    function resetView() {
      nodes = Object.fromEntries(['resenas-form', 'resenas-container', 'resenas-fields', 'resenas-submit', 'resenas-envio-info', 'resenas-verificacion', 'resenas-turnstile'].map(id => [id, new Element('div')]));
      const fields = { nombre: { value: 'Ana' }, comentario: { value: 'Muy buena' }, estrellas: { value: '4' } };
      nodes['resenas-form'].elements = { namedItem: name => fields[name] };
      nodes['resenas-form'].reportValidity = () => true;
      nodes['resenas-form'].reset = () => { nodes['resenas-form'].wasReset = true; };
      globalThis.document = { createElement: tag => new Element(tag), getElementById: id => nodes[id], head: new Element('head') };
      removed = 0; resets = 0; posts = 0; bodies = [];
      globalThis.window = { turnstile: {
        render(_, options) { callbacks = options; return 0; },
        reset(id) { assert.equal(id, 0); resets++; },
        remove(id) { assert.equal(id, 0); removed++; }
      } };
      globalThis.fetch = async (_, options) => {
        if (options.method === 'POST') { posts++; bodies.push(JSON.parse(options.body)); return new Response('{"success":true}'); }
        return new Response(JSON.stringify([review]));
      };
    }
    const submitForm = () => nodes['resenas-form'].listeners.submit({ preventDefault() {} });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('No usar localStorage'); } });
    await t.test('Diseño y reseñas: WhatsApp intacto y HTML de usuarios como texto', async () => {
      const html = page.renderResenasPage();
      assert.match(html, /https:\/\/wa.me\/593980491815/);
      assert.match(html, /col-lg-6/);
      assert.doesNotMatch(html, /Cliente verificado|Carlos M\.|Lucía G\./);
      resetView(); const cleanup = page.attachResenasEvents(); await tick();
      const card = nodes['resenas-container'].children[0];
      assert.equal(card.children[0].children[0].textContent, review.nombre);
      assert.equal(card.children[1].textContent, `“${review.comentario}”`);
      cleanup();
    });
    await t.test('Token requerido; expiración y errores vuelven a bloquear el botón', async () => {
      resetView(); const cleanup = page.attachResenasEvents(); await tick();
      assert.equal(callbacks.sitekey, config.turnstileSiteKey);
      assert.equal(callbacks.size, 'compact');
      await submitForm(); assert.equal(posts, 0);
      callbacks.callback('token-1'); assert.equal(nodes['resenas-submit'].disabled, false);
      callbacks['expired-callback'](); assert.equal(nodes['resenas-submit'].disabled, true);
      callbacks.callback('token-2'); callbacks['error-callback']();
      assert.equal(nodes['resenas-submit'].disabled, true);
      cleanup();
    });
    await t.test('Éxito queda pendiente, no publica; doble pulsación solo hace un POST', async () => {
      resetView(); const cleanup = page.attachResenasEvents(); await tick();
      let finish;
      globalThis.fetch = (_, options) => { posts++; bodies.push(JSON.parse(options.body)); return new Promise(resolve => { finish = resolve; }); };
      callbacks.callback('valid-token');
      const pending = submitForm(); await submitForm();
      assert.equal(posts, 1);
      finish(new Response('{"success":true}')); await pending;
      assert.equal(bodies[0].turnstileToken, 'valid-token');
      assert.match(nodes['resenas-envio-info'].textContent, /pendiente de aprobación/);
      assert.equal(nodes['resenas-container'].children.length, 1);
      assert.equal(nodes['resenas-form'].wasReset, true);
      assert.equal(resets, 1);
      assert.equal(nodes['resenas-submit'].disabled, true);
      cleanup(); assert.equal(removed, 1);
    });
    await t.test('Error de servidor conserva campos y requiere token nuevo', async () => {
      resetView(); const cleanup = page.attachResenasEvents(); await tick();
      globalThis.fetch = async () => new Response('{}', { status: 403 });
      callbacks.callback('rejected-token'); await submitForm();
      assert.match(nodes['resenas-envio-info'].textContent, /rechazada/);
      assert.equal(nodes['resenas-form'].wasReset, undefined);
      assert.equal(nodes['resenas-submit'].disabled, true);
      assert.equal(resets, 1); cleanup();
    });
    await t.test('Limpieza de ruta elimina widget e ignora callbacks antiguos', async () => {
      resetView(); const cleanup = page.attachResenasEvents(); await tick();
      cleanup(); callbacks.callback('late-token');
      assert.equal(nodes['resenas-submit'].disabled, true);
      assert.equal(removed, 1);
      await submitForm(); assert.equal(posts, 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.document; delete globalThis.window; delete globalThis.localStorage;
    await rm(fixture, { recursive: true, force: true });
  }
});
