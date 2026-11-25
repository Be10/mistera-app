#!/usr/bin/env bash
# Inicializa las tablas de progreso via D1 --command (sin upload de archivo .sql).
# MISTERA: nunca borra ni sustituye el progreso existente.
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_USE_SYSTEM_CA="${NODE_USE_SYSTEM_CA:-1}"
case "${1:-}" in
  test)
    DB='mistera-test-progress'
    CONFIG='wrangler.test.jsonc'
    EXPECTED_ID='4dc0b767-144a-4499-ad12-a79ec3d7c468'
    ;;
  prd)
    DB='mistera-prd'
    CONFIG='wrangler.prd.jsonc'
    EXPECTED_ID='ec5b19c8-4b50-4c5a-b9ed-e878d9338473'
    ;;
  *)
    echo 'Uso: bash scripts/init_d1_progress.sh test|prd' >&2
    exit 2
    ;;
esac
node --input-type=module - "$CONFIG" "$DB" "$EXPECTED_ID" <<'JS'
import fs from 'node:fs';
const [config, name, uuid] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(config, 'utf8'));
const bindings = cfg.d1_databases || [];
if (bindings.length !== 1 || bindings[0].binding !== 'MISTERA_DB' ||
    bindings[0].database_name !== name || bindings[0].database_id !== uuid)
  throw new Error('ABORTADO: la vinculacion D1 no coincide con el entorno seleccionado.');
JS
mapfile -t QUERIES < <(node --input-type=module <<'JS'
import fs from 'node:fs';
const raw = fs.readFileSync('db/schema.sql','utf8').replace(/^\s*--[^\n]*$/gm,'');
const queries = raw.split(';').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
if (queries.length !== 2 || !queries[0].startsWith('CREATE TABLE IF NOT EXISTS gift_progress') ||
    !queries[1].startsWith('CREATE INDEX IF NOT EXISTS gift_progress_user'))
  throw new Error('El esquema ha cambiado; revisar antes de aplicar.');
queries.forEach(q=>console.log(q));
JS
)
if [[ "${#QUERIES[@]}" -ne 2 ]]; then
  echo 'ERROR: no se pudo leer el esquema seguro de progreso.' >&2
  exit 2
fi
echo "Base D1: $DB (solo CREATE TABLE/INDEX IF NOT EXISTS)."
for statement in "${QUERIES[@]}"; do
  npx --yes wrangler@4.168.0 d1 execute "$DB" --remote --config "$CONFIG" --command "$statement" --yes
done
echo 'Comprobando tabla e indice en D1:'
npx --yes wrangler@4.168.0 d1 execute "$DB" --remote --config "$CONFIG" --command "SELECT name,type FROM sqlite_master WHERE name IN ('gift_progress','gift_progress_user') ORDER BY type,name;" --yes
echo "D1 $DB inicializada sin borrar registros."
