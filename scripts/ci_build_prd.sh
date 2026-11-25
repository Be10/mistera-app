#!/usr/bin/env bash
# Automatic Cloudflare Workers Builds: branch main -> Worker mistera-prd.
# PRD must be promoted ONLY through an approved merge into main.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import json,re
from pathlib import Path
p=Path('wrangler.prd.jsonc')
c=json.loads(p.read_text(encoding='utf-8'))
r=c['d1_databases'][0]
if c.get('name')!='mistera-prd' or c.get('assets',{}).get('directory')!='./.deploy/prd':
    raise SystemExit('STOP: invalid PRD Worker configuration')
if r.get('database_name')!='mistera-prd' or r.get('binding')!='MISTERA_DB':
    raise SystemExit('STOP: PRD database binding must be MISTERA_DB -> mistera-prd')
if not re.fullmatch(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',r.get('database_id','')):
    raise SystemExit('STOP: create D1 mistera-prd and set its real database_id in wrangler.prd.jsonc')
if r['database_id']=='683018d0-4a53-4ddc-9f63-7611ebcb3005':
    raise SystemExit('STOP: PRD cannot use the TEST D1 database')
PY
python3 scripts/build_worker_release.py prd
python3 - <<'PY'
import json
from pathlib import Path
p=Path('.deploy/prd')
assert (p/'index.html').exists()
assert not (p/'editor').exists()
assert not (p/'surprise-drafts.js').exists()
assert not (p/'functions').exists()
d=json.loads((p/'content/sorpresas-2026.json').read_text(encoding='utf-8'))
assert len(d['days'])==25
assert 'const MISTERA_TEST_MODE = false;' in (p/'app.js').read_text(encoding='utf-8')
print('PRD release verified. D1 existing data is not modified by the build/deploy.')
PY
