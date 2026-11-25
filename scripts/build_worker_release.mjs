#!/usr/bin/env node
/*
 * MISTERA: reproducible Node.js-only deployment builder for Cloudflare Workers.
 * No Python, external NPM dependencies, database migrations, or network calls.
 * The public build excludes unpublished editorial drafts and private editor.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public');
const OUT = path.join(ROOT, '.deploy');
const environment = process.argv[2];
const drafts = process.argv.includes('--drafts');
const auditOnly = process.argv.includes('--audit-only');
const fail = (message) => { throw new Error(message); };
const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');
const json = (file) => JSON.parse(read(file));
const exists = (file) => fs.existsSync(file);
const matches = (text, pattern) => pattern.test(text);

if (!['test', 'prd'].includes(environment)) fail('Uso: node scripts/build_worker_release.mjs test [--drafts] | prd');
if (drafts && environment !== 'test') fail('--drafts solo esta permitido en TEST');
const BANNED_TOP = new Set([
  'editor', 'qa', 'surprise-drafts.js', 'calibrar-chimeneas.js',
  'README_V34.md', 'README_V35.md', 'QA_V34.json', 'QA_V35.json',
  'MANIFEST_V34.json', 'MANIFEST_V35.json',
]);
const BANNED_FIELDS = new Set(['editorNotes', 'mediaPending', 'description', 'updatedBy', 'planningStatus', 'mediaLabel']);
const EDITORIAL = /\b(?:pendiente(?:s)?|por elegir|por seleccionar|aún no|no se ha|sin comprar|idea (?:tentativa|provisional)|tentativ[oa]|propuesta|por configurar|referencia pendiente|no confirmad[oa]|falta(?:n)? por|preferencia:)\b/i;
const PUBLICATION = path.join(SOURCE, 'content', 'sorpresas-2026.json');

function publishedDay(day) {
  const value = structuredClone(day);
  for (const key of BANNED_FIELDS) delete value[key];
  value.title = '';
  for (const block of value.blocks || []) {
    for (const key of BANNED_FIELDS) delete block[key];
    if (block.displayTitle !== true) delete block.title;
    if (typeof block.body === 'string' && (!block.body.trim() || EDITORIAL.test(block.body))) delete block.body;
    for (const key of ['mediaLabel', 'editorNotes', 'planningStatus']) delete block[key];
    if (Array.isArray(block.scenes)) for (const scene of block.scenes) {
      for (const key of ['description', 'title', 'editorNotes']) delete scene[key];
    }
  }
  return value;
}
function hiddenDay(day) {
  return {
    day: day.day, date: day.date || '', unlockAt: day.unlockAt || '',
    publicationStatus: 'BORRADOR', blocks: [], title: '', description: '',
    specialExperience: null, mediaPending: [],
  };
}
function checkMedia(value, dayNumber) {
  if (Array.isArray(value)) return value.forEach((v) => checkMedia(v, dayNumber));
  if (value && typeof value === 'object') return Object.values(value).forEach((v) => checkMedia(v, dayNumber));
  if (typeof value !== 'string') return;
  if (/^(asset:|blob:|file:)/.test(value)) fail(`Dia ${dayNumber}: recurso local no publicable: ${value.slice(0, 90)}`);
  if (value.startsWith('assets/')) {
    const full = path.resolve(SOURCE, value);
    if (!full.startsWith(SOURCE + path.sep) || !fs.statSync(full, { throwIfNoEntry: false })?.isFile())
      fail(`Dia ${dayNumber}: falta el archivo public/${value}`);
  }
}
function copyTo(dest, privateTest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(SOURCE, dest, {
    recursive: true,
    filter: (name) => {
      const rel = path.relative(SOURCE, name);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      if (parts[0] === 'qa') return false;
      if (privateTest) return true;
      if (BANNED_TOP.has(parts[0])) return false;
      // This is an editorial planning file, never a recipient asset.
      if (rel === path.join('content', 'plan-sorpresas-2026.json')) return false;
      return true;
    },
  });
}
function assertNoBackendFiles(directory) {
  for (const name of ['db', 'functions']) if (exists(path.join(directory, name))) fail(`ERROR: ${name} encontrado en los recursos estaticos`);
}

const config = json(PUBLICATION);
const days = config.days || [];
if (days.length !== 25 || days.some((d, i) => d.day !== i + 1))
  fail('Calendario incorrecto: deben existir exactamente los dias 01-25 en orden.');
const approved = new Set(days.filter((d) => d.publicationStatus === 'PUBLICADO').map((d) => d.day));
if (!approved.has(1) || !approved.has(2)) fail('Los dias 01 y 02 aprobados deben permanecer PUBLICADO.');
const historyFile = path.join(ROOT, 'scripts', 'published-history.json');
const history = exists(historyFile) ? json(historyFile) : { days: [1, 2] };
const unpublished = (history.days || []).filter((day) => !approved.has(day));
if (unpublished.length) fail(`No se pueden retirar dias previamente publicados: ${unpublished.join(', ')}`);
for (const day of days) if (approved.has(day.day)) checkMedia(day, day.day);
console.log(`Dias publicados: ${[...approved].sort((a,b) => a-b).join(', ')}`);
console.log(`Borradores no publicos: ${25 - approved.size}`);
if (auditOnly) process.exit(0);

let privateTest = false;
if (environment === 'test' && drafts) {
  const accessMarker = path.join(ROOT, 'scripts', 'TEST_ACCESS_CONFIRMED');
  privateTest = (exists(accessMarker) && read(accessMarker).trim() === 'ACCESO_TEST_CONFIGURADO') ||
    process.env.MISTERA_ACCESS_VERIFIED === 'ACCESO_TEST_CONFIGURADO';
  if (!privateTest) fail('Antes de publicar borradores, protege TEST con Cloudflare Access y verifica su bloqueo en incognito.');
}
fs.mkdirSync(OUT, { recursive: true });
const target = path.join(OUT, environment);
copyTo(target, privateTest);

if (!privateTest) {
  const clean = structuredClone(config);
  delete clean.privacy;
  delete clean.updatedBy;
  delete clean.editorNotes;
  clean.revision = 'V35-publico';
  clean.environment = 'PRODUCCION';
  clean.days = days.map((day) => approved.has(day.day) ? publishedDay(day) : hiddenDay(day));
  write(path.join(target, 'content', 'sorpresas-2026.json'), JSON.stringify(clean, null, 2) + '\n');
  write(path.join(target, 'data', 'sorpresas-2026.js'),
    '/* MISTERA: calendario publico sin borradores privados. */\nwindow.MISTERA_SURPRISES_SEED = ' + JSON.stringify(clean, null, 2) + ';\n');
  // Remove assets for unpublished gifts, which could otherwise be discovered by URL.
  const assets = path.join(target, 'assets', 'sorpresas');
  if (exists(assets)) for (const item of fs.readdirSync(assets, { withFileTypes: true })) {
    const match = /^dia-(\d{2})$/.exec(item.name);
    if (item.isDirectory() && match && !approved.has(Number(match[1])))
      fs.rmSync(path.join(assets, item.name), { recursive: true, force: true });
  }
}
const page = path.join(target, 'index.html');
let html = read(page);
if (privateTest) {
  // Unsanitized TEST permitted only with Cloudflare Access already active.
  html = html.replace('<html lang="es">', '<html lang="es" class="mistera-test">');
} else {
  html = html.replace('<html lang="es">', '<html lang="es" class="mistera-public">');
  html = html.replace(/^\s*<script\s+src="surprise-drafts\.js"\s+defer><\/script>\s*\n/gm, '\n');
  const css = path.join(target, 'mistera-v35.css');
  write(css, read(css) + '\n/* Recipient-only release. */\nhtml.mistera-public .dock-advanced-options, html.mistera-public #settings { display:none!important; }\n');
}
if (environment === 'prd') {
  const appPath = path.join(target, 'app.js');
  const originalApp = read(appPath);
  const modeNeedle = "const MISTERA_TEST_MODE = new URLSearchParams(location.search).get('mistera-pruebas')==='1';";
  if (!originalApp.includes(modeNeedle)) fail('PRD: falta guardia de MISTERA_TEST_MODE, abortado.');
  write(appPath, originalApp.replace(modeNeedle, 'const MISTERA_TEST_MODE = false;'));
  const simExpr = "new URLSearchParams(location.search).get('mistera-pruebas')==='1'";
  for (const moduleName of ['surprises-store.js', 'mistera-cloud-sync.js']) {
    const modulePath = path.join(target, moduleName);
    const src = read(modulePath);
    if (!src.includes(simExpr)) fail(`PRD: falta guardia de pruebas en ${moduleName}`);
    write(modulePath, src.replaceAll(simExpr, 'false')); 
  }
  const pattern = /<details class="dock-advanced-options">\s*<summary>Opciones avanzadas<\/summary>[\s\S]*?<\/details>/;
  if (!pattern.test(html)) fail('PRD: no se encontro el bloque de Pruebas en Ajustes.');
  html = html.replace(pattern, '<span id="settings-button" hidden aria-hidden="true"></span>');
  html = html.replace('class="mistera-public"', 'class="mistera-public mistera-prd"');
}
if (environment === 'test') {
  html = html.replace('class="mistera-public"', 'class="mistera-test"');
  if (!html.includes('mistera-test')) html = html.replace('<html lang="es">', '<html lang="es" class="mistera-test">');
}
write(page, html);
if (!privateTest) {
  write(path.join(target, '_headers'), `/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Cache-Control: no-cache, must-revalidate\n\n/content/*\n  Cache-Control: no-store, max-age=0\n\n/assets/*\n  Cache-Control: public, max-age=3600\n`);
}
assertNoBackendFiles(target);
if (!privateTest) {
  if (exists(path.join(target, 'editor')) || exists(path.join(target, 'surprise-drafts.js'))) fail('EDITOR PRIVADO EN PUBLICACION');
  const safe = json(path.join(target, 'content', 'sorpresas-2026.json'));
  if (safe.days.length !== 25 || safe.days.some((d) => !approved.has(d.day) && ((d.blocks || []).length || d.specialExperience)))
    fail('Se detectaron datos de borradores en la version publica.');
  for (let i = 1; i <= 25; i++) if (!approved.has(i) && exists(path.join(target, 'assets', 'sorpresas', `dia-${String(i).padStart(2, '0')}`)))
    fail(`Se ha incluido un recurso privado del dia ${i}.`);
}
console.log(`OK ${environment.toUpperCase()}: ${fs.readdirSync(target, { recursive: true, withFileTypes: true }).filter(e=>e.isFile()).length} archivos; borradores privados=${privateTest}`);
console.log(`Ruta: ${target}`);
