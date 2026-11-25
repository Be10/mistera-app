#!/usr/bin/env bash
# TEST / PRD manual deploy from Git Bash, without Python or Pages Functions.
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_USE_SYSTEM_CA="${NODE_USE_SYSTEM_CA:-1}"
ENVIRONMENT="${1:-}"
DRAFT_FLAG="${2:-}"
if [[ "$ENVIRONMENT" != test && "$ENVIRONMENT" != prd ]]; then
  echo 'Uso: bash scripts/deploy_worker.sh test [--drafts] | prd'; exit 2
fi
if [[ -n "$DRAFT_FLAG" && ( "$ENVIRONMENT" != test || "$DRAFT_FLAG" != '--drafts' ) ]]; then
  echo 'ERROR: --drafts solo esta permitido en TEST'; exit 2
fi
if ! command -v node >/dev/null; then echo 'ERROR: falta Node.js; no se requiere Python'; exit 2; fi
if [[ "$ENVIRONMENT" == test ]]; then
  echo 'Destino TEST: mistera-staging; D1: mistera-dev; PRD intacta.'
  read -r -p 'Escribe TEST para continuar: ' ACK
  [[ "$ACK" == TEST ]] || { echo 'Cancelado'; exit 2; }
  if [[ "$DRAFT_FLAG" == "--drafts" ]]; then
    MISTERA_TEST_DRAFTS=1 bash scripts/ci_build_test.sh
  else
    bash scripts/ci_build_test.sh
  fi
  npx --yes wrangler@4.168.0 deploy --config wrangler.test.jsonc
else
  bash scripts/ci_build_prd.sh
  echo 'ATENCION: se desplegara en PRD con su D1 exclusiva, sin modificar progreso.'
  read -r -p 'Escribe PUBLICAR-PRD para continuar: ' ACK
  [[ "$ACK" == 'PUBLICAR-PRD' ]] || { echo 'Cancelado';exit 2; }
  npx --yes wrangler@4.168.0 deploy --config wrangler.prd.jsonc
  node scripts/record_publication.mjs
fi
