#!/usr/bin/env node
/* MISTERA V39: minimalist PIN screen, initial focus + numeric keyboard fallback.
 * This test never contacts PRD, submits a PIN or writes to D1. */
import assert from 'node:assert/strict';
import {lockedShell} from '../worker/splash.js';

const response=lockedShell();
assert.equal(response.status,200);
assert.match(response.headers.get('content-type')||'',/text\/html/i);
const html=await response.text();
assert.ok(html.includes('MISTERA'));
assert.ok(html.includes('<form id="panel" hidden aria-label="Acceso privado MISTERA">'));
assert.match(html,/<input id="code"[^>]*type="password"[^>]*inputmode="numeric"[^>]*autofocus/);
assert.ok(html.includes('enterkeyhint="done"'));
assert.ok(html.includes('codeInput.focus({preventScroll:true})'));
assert.ok(html.includes('navigator.virtualKeyboard?.show?.()'));
assert.ok(html.includes("document.addEventListener('click'"));
assert.ok(!html.includes('Nuestro peque\u00f1o secreto'));
assert.ok(!html.includes('numeritos'));
assert.ok(!html.includes('Recuerdas'));
assert.ok(!html.includes('/assets/aldea-base.png'));
assert.ok(!html.includes('mistera-welcome.js'));
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'No se encontro script de PIN');
new Function(script); // Syntax-only compilation, without evaluating any browser code.
console.log('PASS V39: PIN minimalista, foco inicial, teclado numerico, activacion por toque y recursos privados protegidos.');
