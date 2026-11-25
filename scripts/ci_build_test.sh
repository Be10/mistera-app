#!/usr/bin/env bash
# Cloudflare Workers Builds: rama test -> mistera-staging (solo Node.js).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${MISTERA_TEST_DRAFTS:-0}" == "1" ]]; then
  if [[ "${MISTERA_ACCESS_VERIFIED:-}" != 'ACCESO_TEST_CONFIGURADO' ]]; then
    echo 'STOP: TEST requires verified Cloudflare Access before publishing drafts.' >&2
    exit 2
  fi
  node scripts/build_worker_release.mjs test --drafts
else
  node scripts/build_worker_release.mjs test
fi
node --input-type=module <<'JS'
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('wrangler.test.jsonc', 'utf8'));
const db = c.d1_databases?.[0];
if (c.name !== 'mistera-staging' || c.assets?.directory !== './.deploy/test' || db?.binding !== 'MISTERA_DB' || db?.database_name !== 'mistera-dev' || db?.database_id !== '683018d0-4a53-4ddc-9f63-7611ebcb3005') throw new Error('TEST: destino o base D1 inesperados.');
const p = '.deploy/test';
const content = JSON.parse(fs.readFileSync(p+'/content/sorpresas-2026.json','utf8'));
if (content.days?.length !== 25 || fs.existsSync(p+'/functions') || fs.existsSync(p+'/db')) throw new Error('TEST: release invalido.');
console.log('TEST: validado, sin modificar PRD ni D1.');
JS
