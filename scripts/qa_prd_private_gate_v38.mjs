#!/usr/bin/env node
/**
 * MISTERA V38.1 - PRD privacy check, strictly anonymous and read-only.
 * No PIN, cookies, secrets, POST, D1 write or gift progress changes.
 * Diagnostics omit redirect query strings, hashes and response bodies.
 * A redirect is NOT automatically considered a pass: it may be an external
 * Cloudflare Access or company proxy challenge, which conceals the Worker.
 *
 * Usage from MISTERA_Codigo:
 *   NODE_USE_SYSTEM_CA=1 node scripts/qa_prd_private_gate_v38.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ORIGIN = 'https://mistera-prd.mistera-app.workers.dev';
const config = JSON.parse(fs.readFileSync('wrangler.prd.jsonc', 'utf8'));
assert.equal(config.name, 'mistera-prd');
assert.equal(config.vars?.MISTERA_AUTH_REQUIRED, '1');
assert.equal(config.assets?.run_worker_first, true);
assert.equal(config.d1_databases?.[0]?.database_name, 'mistera-prd');
for (const name of ['MISTERA_ACCESS_CODE', 'MISTERA_SESSION_KEY', 'MISTERA_PROGRESS_KEY']) {
  assert.ok(config.secrets?.required?.includes(name), `PRD debe exigir ${name}`);
}

const cases = [
  ['/', 200],
  ['/index.html', 200],
  ['/api/auth', 200],
  ['/api/status', 401],
  ['/api/progress', 401],
  ['/assets/aldea-base.png', 401],
  ['/content/mensaje-bienvenida.json', 401],
  ['/content/sorpresas-2026.json', 401],
  ['/data/sorpresas-2026.js', 401],
  ['/surprises-experience.js', 401],
  ['/editor/index.html', 401]
];

function sanitizedRedirect(response, requestPath) {
  const location = response.headers.get('location');
  if (!location) return 'sin cabecera Location';
  try {
    const url = new URL(location, ORIGIN + requestPath);
    const access = /(^|\.)cloudflareaccess\.com$/i.test(url.hostname) ||
      url.pathname.startsWith('/cdn-cgi/access/');
    // Never print query strings, fragments or long paths that could contain tokens.
    const prefix = access ? '/cdn-cgi/access/…'
      : '/' + (url.pathname.split('/').filter(Boolean)[0] || '') + '/…';
    return `${access ? 'posible Cloudflare Access' : 'redireccion externa o interna'}; host=${url.hostname}; ruta=${prefix}`;
  } catch {
    return 'Location no interpretable (valor oculto)';
  }
}

async function anonymousGET(path) {
  return fetch(ORIGIN + path, {
    method: 'GET',
    credentials: 'omit',
    redirect: 'manual', // never follow a login redirect, or an external URL
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    headers: { accept: path === '/api/auth' ? 'application/json' : '*/*' }
  });
}

let passed = 0;
let redirects = 0;
let failed = 0;
for (const [path, expected] of cases) {
  try {
    const response = await anonymousGET(path);
    const type = response.headers.get('content-type') || '';
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      redirects++;
      console.error(`NO VERIFICADO ${response.status} GET ${path}: ${sanitizedRedirect(response, path)}`);
      continue;
    }
    if (response.status !== expected) {
      failed++;
      console.error(`FALLO ${response.status} GET ${path}: esperado ${expected}${expected === 401 && response.ok ? ' - posible exposicion de recurso' : ''}`);
      continue;
    }
    if (path === '/api/auth') {
      assert.ok(type.includes('application/json'), 'La API de autenticacion debe responder JSON');
      const auth = await response.json();
      assert.deepEqual({required: auth.required, authenticated: auth.authenticated},
        {required: true, authenticated: false});
    } else if (expected === 200) {
      assert.ok(type.includes('text/html'), 'La portada debe ser HTML');
      const html = await response.text();
      assert.ok(html.includes('id="code"') && html.includes('inputmode="numeric"'), 'Falta el formulario protegido con PIN');
      assert.ok(!html.includes('numeritos'), 'La portada todavia contiene una pista editorial no aprobada');
      assert.ok(!html.includes('assets/aldea-base.png') && !html.includes('mistera-welcome.js'),
        'La portada anonima contiene referencias a recursos privados');
    } else {
      assert.ok(type.includes('application/json'), 'Las rutas privadas deben rechazar con JSON');
    }
    passed++;
    console.log(`PASS ${response.status} GET ${path}`);
  } catch (error) {
    failed++;
    const kind = error?.name === 'TimeoutError' ? 'tiempo agotado' :
      error?.code === 'ERR_ASSERTION' ? error.message : (error?.name || 'error de red');
    console.error(`FALLO GET ${path}: ${kind}`);
  }
}
console.log(`RESULTADO: ${passed}/${cases.length} verificadas; ${redirects} redirecciones; ${failed} fallos.`);
if (redirects > 0) {
  console.error('PRD NO VALIDADA: un 302 puede proceder de Cloudflare Access antes de entrar al Worker.');
  console.error('Si indica Cloudflare Access, revisa si PRD esta cubierta por una politica Access');
  console.error('a nivel de Worker, hostname o cuenta. NO la desactives sin comprobar antes el PIN del Worker.');
}
if (redirects || failed) {
  console.error('No compartas PRD hasta obtener 11/11 PASS sin redirecciones y verificar el flujo del PIN.');
  process.exitCode = 1;
} else {
  console.log('PASS PRD V38: cubierta de PIN y rutas privadas protegidas (prueba ANONIMA y de solo lectura).');
}
