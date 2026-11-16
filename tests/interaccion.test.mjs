// Regresión con clics reales en Chrome. No abre llamadas ni envía datos.
// Usa el HTML y CSS del proyecto; bloquea scripts y servicios externos.
// CHROME_BIN permite indicar otra instalación local de Chrome/Chromium.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

await test('Marco decorativo: los enlaces reciben clics reales', async t => {
  const profile = await mkdtemp(join(tmpdir(), 'pizzeria-clics-'));
  const server = createServer(async (req, res) => {
    try {
      let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (path !== root && !path.startsWith(root + '/')) throw Error('Ruta no permitida');
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      const mime = { '.html': 'text/html', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
      res.writeHead(200, {
        'Content-Type': mime[extname(path)] || 'application/octet-stream',
        'Content-Security-Policy': "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
      });
      const bytes = await readFile(path);
      // Sin Bootstrap externo, las fotografías grandes no deben ampliar el
      // viewport móvil de la prueba. Equivale a su utilidad .img-fluid.
      res.end(extname(path) === '.html'
        ? bytes.toString().replace('</head>', '<style>.img-fluid{max-width:100%;height:auto}.text-center{text-align:center}</style></head>')
        : bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  let chrome, ws;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    chrome = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run',
      '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
    ], { stdio: 'ignore' });
    let launchError;
    chrome.on('error', error => { launchError = error; });
    let port;
    for (let i = 0; i < 100; i++) {
      if (launchError) throw launchError;
      try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
      catch { await delay(50); }
    }
    assert.ok(port, 'Chrome no inició; revisa CHROME_BIN');
    const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(page => page.type === 'page');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(Error(`Chrome no respondió: ${method}`)); }, 10000);
      pending.set(requestId, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: requestId, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    await send('Page.enable');
    for (const viewport of [{ width: 1366, height: 900, mobile: false, deviceScaleFactor: 1 }, { width: 375, height: 812, mobile: true, deviceScaleFactor: 2 }]) {
      await t.test(viewport.mobile ? 'Móvil: llamada, WhatsApp y navegación en combos' : 'Escritorio: llamada, WhatsApp y navegación en combos', async () => {
        await send('Emulation.setDeviceMetricsOverride', viewport);
        for (const path of ['/combos/']) {
          await send('Page.navigate', { url: origin + path });
          let ready = false;
          for (let i = 0; i < 100; i++) {
            ready = await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete'`);
            if (ready) break;
            await delay(50);
          }
          assert.ok(ready, path);
          assert.equal(await evaluate(`document.querySelector('.btn-whatsapp-inline').getAttribute('href')`), 'tel:+593980491815');
          assert.equal(await evaluate(`getComputedStyle(document.querySelector('h1 .section-heading-lower')).fontWeight`), '200');
          const count = await evaluate(`(() => {
            window.__targets = [...document.querySelectorAll('main a, #navbar-links a')];
            document.addEventListener('click', event => {
              event.preventDefault();
              window.__received = event.target === window.__expected || window.__expected.contains(event.target);
              window.__lastTarget = { tag: event.target.tagName, class: event.target.className };
            }, true);
            return window.__targets.length;
          })()`);
          for (let i = 0; i < count; i++) {
            const point = await evaluate(`(async () => {
              const el = window.__targets[${i}];
              window.__expected = el; window.__received = false;
              el.scrollIntoView({block:'center'});
              await new Promise(resolve => requestAnimationFrame(resolve));
              const rect = el.getClientRects()[0];
              return { x: rect.x + rect.width/2, y: rect.y + rect.height/2, label: el.textContent.trim() || el.getAttribute('aria-label') };
            })()`);
            const { x, y, label } = point;
            await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, x, y });
            await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, x, y });
            assert.equal(await evaluate('window.__received'), true, `${path}: enlace cubierto: ${label}; ${JSON.stringify({ x, y, target: await evaluate('window.__lastTarget') })}`);
          }
        }
      });
      await t.test(`${viewport.mobile ? 'Móvil' : 'Escritorio'}: Volver arriba oculto, accesible y activable por teclado`, async () => {
        const query = `?qa=volver-${viewport.width}`;
        await send('Page.navigate', { url: origin + '/combos/' + query });
        const waitFor = async expression => {
          for (let i = 0; i < 100; i++) {
            if (await evaluate(expression)) return;
            await delay(50);
          }
          assert.fail(`Chrome no alcanzó el estado: ${expression}`);
        };
        await waitFor(`location.search === ${JSON.stringify(query)} && document.readyState === 'complete'`);
        // La CSP de esta prueba bloquea todos los scripts de la página. Ejecutamos
        // el módulo real mediante DevTools, manteniendo los servicios bloqueados.
        const source = (await readFile(join(root, 'js/ui/volver-arriba.js'), 'utf8')).replace('export function', 'function');
        await evaluate(`(() => { ${source}; window.scrollTo(0, 0); initBackToTop(); })()`);
        assert.equal(await evaluate(`(() => {const b=document.getElementById('back-to-top');b.focus();return b.hidden && getComputedStyle(b).display==='none' && document.activeElement!==b;})()`), true);
        await evaluate('window.scrollTo(0, 300)');
        await delay(100);
        assert.equal(await evaluate(`document.getElementById('back-to-top').hidden`), true);
        let visible = false;
        for (const top of [500, 650, 800, 1000]) {
          await evaluate(`window.scrollTo(0, ${top})`); await delay(100);
          visible = await evaluate(`!document.getElementById('back-to-top').hidden`);
          if (visible) break;
        }
        assert.equal(visible, true);
        assert.equal(await evaluate(`(() => {const b=document.getElementById('back-to-top'),r=b.getBoundingClientRect();return b.type==='button' && b.getAttribute('aria-label')==='Volver arriba' && r.width>=44 && r.height>=44;})()`), true);
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await evaluate(`document.getElementById('back-to-top').focus({preventScroll:true})`);
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        await waitFor(`scrollY===0 && document.getElementById('back-to-top').hidden`);
        assert.equal(await evaluate('document.activeElement.id'), 'app-content');
        await send('Emulation.setEmulatedMedia', { features: [] });
      });
      await t.test(`${viewport.mobile ? 'Móvil' : 'Escritorio'}: nombres, URLs y comentarios largos íntegros y sin desbordamiento`, async () => {
        const query = `?qa=texto-${viewport.width}`;
        await send('Page.navigate', { url: origin + '/resenas/' + query });
        for (let i = 0; i < 100; i++) {
          if (await evaluate(`location.search===${JSON.stringify(query)}&&document.readyState==='complete'`)) break;
          await delay(50);
        }
        const source = await readFile(join(root, 'js/pages/resenas.js'), 'utf8');
        const start = source.indexOf('function renderResenaItem(');
        const end = source.indexOf('\nexport function renderResenasPage', start);
        assert.ok(start >= 0 && end > start);
        // Usar el renderizador real; el servidor de pruebas mantiene bloqueada la red externa.
        const result = await evaluate(`(() => {
          ${source.slice(start, end)}
          const review={nombre:'Nombre'.repeat(20),estrellas:5,comentario:'https://ejemplo.invalid/'+ 'x'.repeat(180)+' '+ 'Pizza'.repeat(30)+' <script>alert(1)</script>',created_at:'2026-11-16T00:00:00Z'};
          const c=document.getElementById('resenas-container');c.style.width='240px';c.style.maxWidth='100%';
          c.replaceChildren(renderResenaItem(review));c.querySelector('h3').parentElement.style.display='flex';
          const name=c.querySelector('h3'),comment=c.querySelector('.section-content');
          return {name:name.textContent,comment:comment.textContent,expected:review,nameFits:name.scrollWidth<=name.getBoundingClientRect().width+1,commentFits:comment.scrollWidth<=comment.getBoundingClientRect().width+1,wrap:getComputedStyle(comment).overflowWrap,maxHeight:getComputedStyle(comment).maxHeight,overflow:getComputedStyle(comment).overflow,injected:c.querySelectorAll('script,img').length,color:getComputedStyle(name).color};
        })()`);
        assert.equal(result.name, result.expected.nombre);
        assert.equal(result.comment, `“${result.expected.comentario}”`);
        assert.equal(result.nameFits, true); assert.equal(result.commentFits, true);
        assert.equal(result.wrap, 'anywhere'); assert.equal(result.maxHeight, 'none');
        assert.notEqual(result.overflow, 'hidden'); assert.equal(result.injected, 0);
        assert.equal(result.color, 'rgb(47, 23, 15)');
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('.phone-pulse-wave')).animationName`), 'none');
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('.whatsapp-floating-btn')).transitionDuration`), '0s');
        await send('Emulation.setEmulatedMedia', { features: [] });
      });
    }
    await t.test('Copyright visible sin solaparse con los flotantes a 320, 375, 390, 768 y 1440 px', async () => {
      for (const width of [320, 375, 390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 844, mobile: width < 992, deviceScaleFactor: 1 });
        const query = `?qa=pie-${width}`;
        await send('Page.navigate', { url: origin + '/' + query });
        for (let i = 0; i < 100; i++) {
          if (await evaluate(`location.search===${JSON.stringify(query)}&&document.readyState==='complete'`)) break;
          await delay(50);
        }
        const result = await evaluate(`(() => {
          const button=document.getElementById('back-to-top');button.hidden=false;
          scrollTo(0,document.documentElement.scrollHeight);
          const p=document.querySelector('footer .small'),range=document.createRange();range.selectNodeContents(p);
          const obstacles=[button,document.querySelector('.whatsapp-floating-btn')].map(e=>e.getBoundingClientRect());
          const overlaps=[...range.getClientRects()].some(t=>obstacles.some(r=>t.left<r.right&&t.right>r.left&&t.top<r.bottom&&t.bottom>r.top));
          return {overlaps,color:getComputedStyle(p).color,overflow:document.documentElement.scrollWidth>innerWidth+1};
        })()`);
        assert.equal(result.overlaps, false, `${width}px: copyright tapado`);
        assert.equal(result.color, 'rgb(255, 255, 255)'); assert.equal(result.overflow, false);
      }
    });
  } finally {
    ws?.close();
    if (chrome?.pid) {
      const stopped = new Promise(resolve => chrome.once('exit', resolve));
      chrome.kill();
      await stopped;
    }
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
