/*
 * MISTERA -- non-destructive end-to-end check against TEST only.
 * Uses freshly generated random pairing secrets; never reads or writes the
 * recipient's code, and never connects to production.
 * Run: NODE_USE_SYSTEM_CA=1 node scripts/verify_test_sync.mjs
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const ORIGIN = 'https://mistera-staging.mistera-app.workers.dev';
const expectedHost = 'mistera-staging.mistera-app.workers.dev';
if (new URL(ORIGIN).hostname !== expectedHost) throw Error('STOP: this diagnostic is TEST-only');

const steps = [];
const tokenA = randomBytes(24).toString('base64url');
const tokenB = randomBytes(24).toString('base64url');

async function jsonRequest(path, opts = {}) {
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(ORIGIN + path, {
      cache: 'no-store',
      signal: controller.signal,
      ...opts,
    });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
      throw Error(`The TEST endpoint did not return JSON (HTTP ${response.status}). Check corporate network/proxy or deployment.`);
    }
    return { status: response.status, body: await response.json() };
  } finally {
    clearTimeout(abort);
  }
}
const post = (pairingCode, snapshot = {}) => jsonRequest('/api/progress', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ pairingCode, snapshot }),
});
const ok = (message) => { steps.push(message); console.log(`OK: ${message}`); };

try {
  const status = await jsonRequest('/api/status');
  assert.equal(status.status, 200, 'status endpoint must return 200');
  assert.equal(status.body.sync, true, 'TEST must connect to an initialized D1');
  ok('TEST /api/status confirms D1 ready');

  const empty = await post(tokenA, { opened: [], final: false, stages: {} });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.snapshot.opened, []);
  assert.equal(empty.body.snapshot.final, false);
  ok('New pairing secret starts with no discovered gifts');

  // Simulate the first trusted device discovering a gift and 2 hints.
  const deviceA = await post(tokenA, {
    opened: [1],
    final: false,
    stages: { 1: { 'd01-letter': true }, 2: { 'd02-hints': 2, 'd02-opened': true } },
  });
  assert.equal(deviceA.status, 200);
  assert.deepEqual(deviceA.body.snapshot.opened, [1]);
  assert.equal(deviceA.body.snapshot.stages['2']['d02-hints'], 2);
  ok('Device A saves a discovered house and two hints');

  // The second device sends no local progress but receives the same state.
  const deviceB = await post(tokenA, { opened: [], final: false, stages: {} });
  assert.equal(deviceB.status, 200);
  assert.deepEqual(deviceB.body.snapshot.opened, [1]);
  assert.equal(deviceB.body.snapshot.stages['1']['d01-letter'], true);
  assert.equal(deviceB.body.snapshot.stages['2']['d02-hints'], 2);
  ok('Device B restores the same cloud state');

  // An older client cannot erase history or move hint counters backwards.
  const olderB = await post(tokenA, {
    opened: [],
    final: false,
    stages: { 2: { 'd02-hints': 1 } },
  });
  assert.deepEqual(olderB.body.snapshot.opened, [1]);
  assert.equal(olderB.body.snapshot.stages['2']['d02-hints'], 2);
  ok('Older device cannot undo opened gifts or reduce hints');

  const latest = await post(tokenA, { opened: [1, 2], final: false, stages: { 2: { 'd02-hints': 3 } } });
  assert.deepEqual(latest.body.snapshot.opened, [1, 2]);
  assert.equal(latest.body.snapshot.stages['2']['d02-hints'], 3);
  ok('New progress from another device is merged');

  const separate = await post(tokenB, { opened: [], final: false, stages: {} });
  assert.equal(separate.status, 200);
  assert.deepEqual(separate.body.snapshot.opened, []);
  assert.deepEqual(separate.body.snapshot.stages, {});
  ok('Different pairing secret cannot see previous device progress');

  const invalid = await post('invalid', {});
  assert.equal(invalid.status, 401);
  ok('Server rejects invalid pairing code');

  console.log(`\nMISTERA TEST REMOTE SYNC: PASSED (${steps.length} checks).`);
  console.log('Only random diagnostic accounts were written in mistera-test-progress. Production was not accessed.');
} catch (error) {
  console.error('\nMISTERA TEST REMOTE SYNC: FAILED');
  console.error(error?.message || String(error));
  console.error('No production endpoint or production database was contacted.');
  process.exitCode = 1;
}
