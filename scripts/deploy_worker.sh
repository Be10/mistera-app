#!/usr/bin/env bash
# V36: dos destinos separados. No crea ni borra bases D1.
set -euo pipefail
cd "$(dirname "$0")/.."
# Wrangler OAuth works with the Windows certificate store in the user's VS Code.
export NODE_USE_SYSTEM_CA="${NODE_USE_SYSTEM_CA:-1}"
ENVIRONMENT="${1:-}"
if [[ "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "prd" ]]; then
  echo 'Uso: bash scripts/deploy_worker.sh test [--drafts] | prd';exit 2
fi
if ! command -v node >/dev/null;then echo 'ERROR: instala Node.js LTS';exit 2;fi
if command -v python3 >/dev/null;then PY=(python3)
elif command -v py >/dev/null;then PY=(py -3)
elif command -v python >/dev/null;then PY=(python)
else echo 'ERROR: necesitas Python 3';exit 2;fi
DRAFT_FLAG="${2:-}"
if [[ -n "$DRAFT_FLAG" && ( "$ENVIRONMENT" != "test" || "$DRAFT_FLAG" != '--drafts' ) ]];then
  echo 'ERROR: --drafts es exclusivo de TEST';exit 2
fi
if [[ "$ENVIRONMENT" == 'test' ]];then
  echo 'Destino TEST: mistera-staging. D1: mistera-dev.'
  echo 'Se actualizará el Worker staging actual. PRD queda intacta.'
  read -r -p 'Escribe TEST para continuar: ' ACK
  [[ "$ACK" == TEST ]] || { echo 'Cancelado';exit 2; }
  "${PY[@]}" scripts/build_worker_release.py test ${DRAFT_FLAG:+--drafts}
  npx --yes wrangler deploy --config wrangler.test.jsonc
else
  "${PY[@]}" - <<'PY'
import json
from pathlib import Path
p=Path('wrangler.prd.jsonc')
d=json.loads(p.read_text(encoding='utf8'))
entry=d['d1_databases'][0]
if entry['database_name']!='mistera-prd' or not __import__('re').fullmatch(r'[a-fA-F0-9-]{36}',entry['database_id']):
    raise SystemExit('ERROR: configura el UUID REAL de la base D1 mistera-prd en wrangler.prd.jsonc')
if d['name']!='mistera-prd':raise SystemExit('ERROR: destino PRD inesperado')
PY
  echo 'ATENCION: destino PRD: mistera-prd. Base D1: mistera-prd (el progreso existente NO se modifica desde este script).'
  echo 'Confirma solo después de probar los cambios en TEST.'
  read -r -p 'Escribe PUBLICAR-PRD para continuar: ' ACK
  [[ "$ACK" == 'PUBLICAR-PRD' ]] || { echo 'Cancelado';exit 2; }
  "${PY[@]}" scripts/build_worker_release.py prd
  npx --yes wrangler deploy --config wrangler.prd.jsonc
  "${PY[@]}" scripts/record_publication.py
fi
