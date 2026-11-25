#!/usr/bin/env node
/** MISTERA V38: QA sin dependencias ni navegador del texto aprobado, flujo y seguridad. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8');
const config=JSON.parse(read('public/content/mensaje-bienvenida.json'));
assert.equal(config.enabled,true,'la bienvenida editorial debe estar habilitada');
assert.equal(crypto.createHash('sha256').update(config.message,'utf8').digest('hex'),'c80f0fd96c93efa9e378a78be074b769aa8b34797757076009e2e7caba194179',
  'el mensaje editorial no se debe cambiar ni parcialmente');
assert.equal(config.message.split(/\n\s*\n/).length,9);
assert.equal((config.message.match(/\*\*/g)||[]).length,4,'dos secciones en negrita');
const html=read('public/index.html');
const loader=read('public/mistera-loader.js');
const css=read('public/mistera-v37.css');
const welcome=read('public/mistera-welcome.js');
assert.match(html,/<section id="mistera-welcome"[^>]*\bhidden\b/);
assert.match(html,/<button[^>]*id="mistera-welcome-close"[^>]*\bhidden\b/);
assert.match(html,/id="mistera-enter"/);
assert.match(loader,/mistera-enter/);
assert.match(loader,/MisteraWelcome\?\.shouldShow/);
assert.match(loader,/renderWelcomeLetter/);
assert.match(loader,/welcomeStepMs/);
assert.match(loader,/if\(entered\|\|!entering\|\|closingWelcome\|\|welcomeClose.hidden\)return/);
assert.ok(loader.indexOf('markSeen')>loader.indexOf("welcomeClose?.addEventListener('click'"),
  'marcar recibo solo al pulsar Cerrar');
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/overflow-y:auto/);
assert.match(css,/m37-gold-pulse/);
assert.match(welcome,/mistera-welcome-seen-\$\{ENV\}/);
assert.match(welcome,/mistera-intro-seen/);
assert.doesNotMatch(html,/Una villa solo para nosotros/);
assert.doesNotMatch(html,/aria-label="Preparación de la villa"/);
console.log('PASS V38: integridad editorial, visibilidad, persistencia, acceso y no spoilers.');
