import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLegacyDestination, initPage, initMenuLabel } from '../js/app.js';
const tick = () => new Promise(resolve => setImmediate(resolve));

await test('Navegación estática y reseñas', async t => {
  let events, clicks, collapsed, replaced;
  function setup(page = 'home') {
    events = {}; clicks = []; collapsed = []; replaced = [];
    globalThis.window = {
      location: { pathname: page === 'home' ? '/' : `/${page}/`, hash: '', replace: path => replaced.push(path) },
      jQuery: selector => ({ collapse: action => collapsed.push([selector, action]) }),
      addEventListener: (event, handler) => { events[event] = handler; }
    };
    globalThis.document = {
      body: { dataset: { page } },
      querySelectorAll: () => Array.from({ length: 5 }, () => ({ addEventListener: (_, handler) => clicks.push(handler) })),
      getElementById: () => null
    };
  }
  try {
    await t.test('Nombre accesible del menú refleja aria-expanded, sin observadores duplicados', () => {
      setup();
      const attributes = { 'aria-expanded': 'false' };
      const button = { tagName: 'BUTTON', getAttribute: key => attributes[key], setAttribute: (key, value) => { attributes[key] = value; } };
      let callback, observed = 0;
      globalThis.MutationObserver = class {
        constructor(handler) { callback = handler; }
        observe(target, options) { assert.equal(target, button); assert.deepEqual(options.attributeFilter, ['aria-expanded']); observed++; }
      };
      document.getElementById = id => id === 'menu-toggle' ? button : null;
      try {
        initMenuLabel(); initMenuLabel();
        assert.equal(observed, 1);
        assert.equal(attributes['aria-label'], 'Abrir menú');
        attributes['aria-expanded'] = 'true'; callback();
        assert.equal(attributes['aria-label'], 'Cerrar menú');
        attributes['aria-expanded'] = 'false'; callback();
        assert.equal(attributes['aria-label'], 'Abrir menú');
      } finally { delete globalThis.MutationObserver; }
    });
    await t.test('Compatibilidad de los cinco enlaces antiguos en la portada', () => {
      const routes = { home: '/', pizzas: '/pizzas/', store: '/combos/', resenas: '/resenas/', blog: '/blog/' };
      for (const path of ['/', '/index.html']) for (const [hash, target] of Object.entries(routes)) {
        assert.equal(getLegacyDestination(path, `#${hash}`), target);
      }
      assert.equal(getLegacyDestination('/pizzas/', '#blog'), null);
      assert.equal(getLegacyDestination('/', '#desconocido'), null);
    });
    await t.test('El enlace antiguo redirige sin cargar el formulario ni sustituir contenido', () => {
      setup(); window.location.hash = '#store';
      initPage({ loadReviews: () => assert.fail('No cargar reseñas') });
      assert.deepEqual(replaced, ['/combos/']);
    });
    await t.test('El menú conserva cierre móvil y las páginas estáticas no cargan reseñas', () => {
      setup('pizzas');
      initPage({ loadReviews: () => assert.fail('No cargar reseñas') });
      assert.equal(clicks.length, 5);
      clicks[1]();
      assert.deepEqual(collapsed, [['#navbarResponsive', 'hide']]);
      delete window.jQuery;
      assert.doesNotThrow(() => clicks[1]());
    });
    await t.test('Reseñas se inicializa solo en /resenas/ y se recupera al volver con el navegador', async () => {
      setup('resenas');
      let attached = 0, cleaned = 0;
      const form = { dataset: { bound: 'true' } };
      document.getElementById = id => id === 'resenas-form' ? form : null;
      initPage({ loadReviews: async () => ({ attachResenasEvents: () => { attached++; return () => { cleaned++; }; } }) });
      await tick(); assert.equal(attached, 1);
      events.pagehide(); assert.equal(cleaned, 1); assert.equal(form.dataset.bound, undefined);
      events.pageshow({ persisted: true }); await tick(); assert.equal(attached, 2);
    });
    await t.test('Ignora la importación tardía al salir y muestra un error si no puede cargar el módulo', async () => {
      setup('resenas'); let finish;
      initPage({ loadReviews: () => new Promise(resolve => { finish = resolve; }) });
      events.pagehide();
      finish({ attachResenasEvents: () => assert.fail('La página ya no está activa') }); await tick();
      setup('resenas'); const status = { setAttribute() {} };
      document.getElementById = () => status;
      initPage({ loadReviews: async () => { throw Error('offline'); } }); await tick();
      assert.match(status.textContent, /Recarga la página/);
    });
  } finally { delete globalThis.window; delete globalThis.document; }
});
