#!/usr/bin/env bash
# Automatic Cloudflare Workers Builds: branch test -> Worker mistera-staging.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${MISTERA_TEST_DRAFTS:-0}" == "1" ]]; then
    # The operator must verify Worker-level Access protection before enabling this.
    if [[ "${MISTERA_ACCESS_VERIFIED:-}" != 'ACCESO_TEST_CONFIGURADO' ]]; then
        echo 'STOP: cannot publish private TEST drafts before Access is verified.' >&2
        exit 2
    fi
    python3 scripts/build_worker_release.py test --drafts
else
    python3 scripts/build_worker_release.py test
fi
python3 - <<'PY'
import json
from pathlib import Path
c=json.loads(Path('wrangler.test.jsonc').read_text(encoding='utf-8'))
assert c['name']=='mistera-staging'
assert c['assets']['directory']=='./.deploy/test'
assert c['d1_databases'][0]['binding']=='MISTERA_DB'
assert c['d1_databases'][0]['database_name']=='mistera-dev'
assert c['d1_databases'][0]['database_id']=='683018d0-4a53-4ddc-9f63-7611ebcb3005'
p=Path('.deploy/test/content/sorpresas-2026.json')
d=json.loads(p.read_text(encoding='utf-8'))
assert len(d['days'])==25
assert not Path('.deploy/test/functions').exists()
print('TEST safe release verified. No PRD state modified.')
PY
