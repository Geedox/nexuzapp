import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
// shortcut: the parser requests minimatch 9; remove the override when it accepts a patched version.
const parserRequire = createRequire(require.resolve('@typescript-eslint/typescript-estree'));
const { minimatch } = parserRequire('minimatch');
assert(minimatch('src/.internal/View.tsx', 'src/**/*.tsx', { dot: true }));
assert(!minimatch('public/logo.svg', 'src/**/*.tsx', { dot: true }));

// Fixture only: no real email credential; the browser blocks every external request.
process.env.VITE_RESEND_API_KEY = 're_dependency_fixture_only';
const profile = await mkdtemp(join(tmpdir(), 'nexuz-dependencies-'));
const server = await createServer({ server: { host: '127.0.0.1', port: 4189, strictPort: true } });
let chrome;
let socket;
const pending = new Map();
let id = 0;
const errors = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const call = ++id; pending.set(call, { resolve, reject }); socket.send(JSON.stringify({ id: call, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
async function until(check) {
  for (let i = 0; i < 300; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Timed out waiting for browser state');
}
try {
  await server.listen();
  chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9259', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let launchError; chrome.on('error', error => { launchError = error; });
  await until(async () => { if (launchError) throw launchError; return fetch('http://127.0.0.1:9259/json/version').then(r => r.ok).catch(() => false); });
  const target = await (await fetch('http://127.0.0.1:9259/json/new?about:blank', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', event => {
    const m = JSON.parse(event.data);
    if (m.id) { const call = pending.get(m.id); pending.delete(m.id); if (m.error) call?.reject(new Error(m.error.message)); else call?.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Fetch.requestPaused') {
      if (m.params.request.url.startsWith('https://api-sui.cetus.zone/v3/sui/market_price?')) {
        void send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify({ data: { prices: [{ price: '1' }, { price: '1' }] } })).toString('base64') });
        return;
      }
      const local = m.params.request.url.startsWith('http://127.0.0.1:4189/');
      void send(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', { requestId: m.params.requestId, ...(!local && { errorReason: 'BlockedByClient' }) });
    }
  });
  await send('Runtime.enable'); await send('Page.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Page.navigate', { url: 'http://127.0.0.1:4189/scripts/dependency-smoke/' });
  await until(() => evaluate('!!document.querySelector(".rdp-root")'));
  assert(await evaluate('document.querySelector("#lifi").textContent==="true"'));
  assert(await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="5").disabled'));
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="17").click()');
  await until(() => evaluate('document.querySelector("#selection").textContent==="17"'));
  await evaluate('document.querySelector("a").click()');
  await until(() => evaluate('document.querySelector("#route").textContent==="?view=next"'));
  for (const kind of ['dialog', 'drawer']) {
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Open ${kind}').click()`);
    await until(() => evaluate('!!document.querySelector("[role=dialog]")'));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
    await until(() => evaluate('!document.querySelector("[role=dialog]")'));
  }
  assert(await evaluate('!!document.querySelector(".recharts-line-curve")'));
  await evaluate('[...document.querySelectorAll("button")].find(b=>/next month/i.test(b.getAttribute("aria-label")||"")).click()');
  await until(() => evaluate('document.body.textContent.includes("December 2026")'));
  await send('Page.navigate', { url: 'http://127.0.0.1:4189/dashboard' });
  await until(() => evaluate('location.pathname==="/" && !!document.querySelector("#root")?.children.length'));
  assert.deepEqual(errors, [], 'Uncaught browser errors');
  console.log('Passed: calendar selection/disabled dates/navigation, routing, dialogs, drawers, charts, and unauthenticated dashboard redirect. External requests blocked.');
} finally {
  socket?.close(); chrome?.kill(); await server.close();
  await new Promise(resolve => setTimeout(resolve, 300));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
