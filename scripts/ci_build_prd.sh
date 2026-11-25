#!/usr/bin/env bash
# Cloudflare Workers Builds: rama main -> mistera-prd (solo Node.js).
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module <<'JS'
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('wrangler.prd.jsonc','utf8'));
const db = c.d1_databases?.[0];
if (c.name !== 'mistera-prd' || c.assets?.directory !== './.deploy/prd') throw new Error('PRD: Worker inesperado.');
if (db?.binding !== 'MISTERA_DB' || db?.database_name !== 'mistera-prd') throw new Error('PRD: D1 incorrecta.');
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(db.database_id || '') || db.database_id === '683018d0-4a53-4ddc-9f63-7611ebcb3005') throw new Error('PRD: falta configurar UUID real de D1 exclusiva.');
JS
node scripts/build_worker_release.mjs prd
node --input-type=module <<'JS'
import fs from 'node:fs';
const p = '.deploy/prd';
const exists = (f) => fs.existsSync(p + '/' + f);
if (!exists('index.html') || exists('editor') || exists('surprise-drafts.js') || exists('functions') || exists('db')) throw new Error('PRD: artefactos privados incluidos.');
const content = JSON.parse(fs.readFileSync(p+'/content/sorpresas-2026.json','utf8'));
if (content.days.length !== 25 || !fs.readFileSync(p+'/app.js','utf8').includes('const MISTERA_TEST_MODE = false;')) throw new Error('PRD: release invalido.');
console.log('PRD: release validado. D1 permanece intacta.');
JS
