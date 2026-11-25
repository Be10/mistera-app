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
if (c.assets?.run_worker_first !== true) throw new Error('TEST: Worker debe validar cada ruta antes de servir assets.');
if (c.d1_databases?.some((b) => b.database_id === 'ec5b19c8-4b50-4c5a-b9ed-e878d9338473') || c.d1_databases?.length !== 1) throw new Error('TEST: D1 de PRD detectada.');
if (c.name !== 'mistera-staging' || c.assets?.directory !== './.deploy/test' || db?.binding !== 'MISTERA_DB' || db?.database_name !== 'mistera-test-progress' || db?.database_id !== '4dc0b767-144a-4499-ad12-a79ec3d7c468') throw new Error('TEST: destino o base D1 inesperados.');
const p = '.deploy/test';
const content = JSON.parse(fs.readFileSync(p+'/content/sorpresas-2026.json','utf8'));
if (content.days?.length !== 25 || fs.existsSync(p+'/functions') || fs.existsSync(p+'/db')) throw new Error('TEST: release invalido.');
console.log('TEST: validado, sin modificar PRD ni D1.');
JS
