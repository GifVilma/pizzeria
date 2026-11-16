import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initBackToTop } from '../js/ui/volver-arriba.js';
import { renderSitePages } from '../scripts/generar-paginas.mjs';

await test('Volver arriba: estado, rendimiento y accesibilidad', async t => {
  let dispose;
  const listeners = new Map(), frames = new Map(), observers = [];
  let nextFrame = 0, collisions = [], menuOpen = false, reduced = false, focused = false, scrollOptions;
  const button = {
    tagName: 'BUTTON', hidden: true, contains: () => false,
    getBoundingClientRect: () => ({ left: 20, right: 74, top: 700, bottom: 754 }),
    addEventListener: (name, handler) => listeners.set('button:' + name, handler),
    removeEventListener: name => listeners.delete('button:' + name)
  };
  const observe = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  const fire = name => listeners.get('window:' + name)?.();
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); };
  globalThis.ResizeObserver = observe;
  globalThis.MutationObserver = observe;
  globalThis.window = {
    scrollY: 0, innerHeight: 812,
    addEventListener(name, handler, options) { listeners.set('window:' + name, handler); if (name === 'scroll') assert.equal(options.passive, true); },
    removeEventListener: name => listeners.delete('window:' + name),
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    matchMedia: query => { assert.equal(query, '(prefers-reduced-motion: reduce)'); return { matches: reduced }; },
    scrollTo: options => { scrollOptions = options; }
  };
  globalThis.document = {
    body: {}, documentElement: { scrollHeight: 3000 },
    getElementById: id => id === 'back-to-top' ? button : id === 'app-content' ? { focus(options) { assert.equal(options.preventScroll, true); focused = true; } } : {},
    querySelector: () => menuOpen ? {} : null,
    querySelectorAll: selector => { assert.ok(selector.includes('[tabindex]:not([tabindex="-1"])')); return collisions; },
    addEventListener: (name, handler) => listeners.set('document:' + name, handler),
    removeEventListener: name => listeners.delete('document:' + name)
  };
  try {
    await t.test('Oculto al inicio; aparece a 450 px y desaparece al volver arriba', () => {
      dispose = initBackToTop(); assert.equal(button.hidden, true);
      window.scrollY = 449; fire('scroll'); flush(); assert.equal(button.hidden, true);
      window.scrollY = 450; fire('scroll'); flush(); assert.equal(button.hidden, false);
      window.scrollY = 0; fire('scroll'); flush(); assert.equal(button.hidden, true);
    });
    await t.test('Una inicialización y un fotograma para múltiples eventos de scroll', () => {
      const count = listeners.size;
      assert.equal(initBackToTop(), dispose); assert.equal(listeners.size, count); assert.equal(observers.length, 2);
      for (let i = 0; i < 30; i++) fire('scroll');
      assert.equal(frames.size, 1); flush();
    });
    await t.test('Scroll suave habitual, sin animación con movimiento reducido; foco en main', () => {
      listeners.get('button:click')();
      assert.deepEqual(scrollOptions, { top: 0, left: 0, behavior: 'smooth' }); assert.equal(focused, true);
      reduced = true; listeners.get('button:click')();
      assert.equal(scrollOptions.behavior, 'auto'); reduced = false;
    });
    await t.test('Páginas cortas: disponible al final; oculto cuando no hay desplazamiento', () => {
      document.documentElement.scrollHeight = 1000; window.scrollY = 188;
      fire('resize'); flush(); assert.equal(button.hidden, false);
      document.documentElement.scrollHeight = 812; window.scrollY = 0;
      fire('resize'); flush(); assert.equal(button.hidden, true);
      document.documentElement.scrollHeight = 3000;
    });
    await t.test('No tapa formularios, controles ni menús y se recupera al quedar libre', () => {
      window.scrollY = 800;
      collisions = [{ contains: () => false, getClientRects: () => [{ width: 100, height: 40, left: 30, right: 130, top: 710, bottom: 750 }] }];
      fire('scroll'); flush(); assert.equal(button.hidden, true);
      collisions = []; fire('scroll'); flush(); assert.equal(button.hidden, false);
      menuOpen = true; observers[1].callback(); flush(); assert.equal(button.hidden, true);
      menuOpen = false; observers[1].callback(); flush(); assert.equal(button.hidden, false);
    });
    await t.test('pageshow y cambios de contenido actualizan la posición restaurada', () => {
      window.scrollY = 0; fire('pageshow'); flush(); assert.equal(button.hidden, true);
      window.scrollY = 900; observers[0].callback(); flush(); assert.equal(button.hidden, false);
    });
    await t.test('Limpieza completa permite reinicializar sin listeners pendientes', () => {
      fire('scroll'); dispose(); assert.equal(frames.size, 0); assert.equal(listeners.size, 0);
      assert.equal(button.hidden, true); assert.ok(observers.every(observer => observer.disconnected));
      dispose = initBackToTop(); assert.equal(button.hidden, false);
    });
    await t.test('Las ocho páginas incluyen un botón real oculto, SVG decorativo y destino de foco', async () => {
      for (const html of (await renderSitePages()).values()) {
        assert.equal([...html.matchAll(/id="back-to-top"/g)].length, 1);
        assert.match(html, /<button id="back-to-top" class="back-to-top" type="button" aria-label="Volver arriba" hidden>/);
        const markup = html.match(/<button id="back-to-top"[\s\S]*?<\/button>/)[0];
        assert.match(markup, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
        assert.match(html, /<main id="app-content" tabindex="-1">/);
      }
    });
  } finally {
    dispose?.();
    delete globalThis.window; delete globalThis.document;
    delete globalThis.ResizeObserver; delete globalThis.MutationObserver;
  }
});
