# MISTERA — Publicación automática TEST y PRD, sin ZIP

## Estado confirmado

- Cuenta Cloudflare autorizada localmente con Wrangler.
- Worker TEST existente: `mistera-staging`.
- Worker histórico: `shy-recipe-28ed`; no usar.
- D1 TEST exclusiva: `mistera-test-progress` (`4dc0b767-144a-4499-ad12-a79ec3d7c468`), creada el 25/11/2026.
- D1 PRD exclusiva: `mistera-prd` (`ec5b19c8-4b50-4c5a-b9ed-e878d9338473`), creada el 25/11/2026. Worker PRD pendiente de despliegue.
- Código fuente permanente en OneDrive: `Mistera_App/MISTERA_Codigo` (carpeta por sincronizar).

## Única preparación local del repositorio (necesita tu cuenta GitHub)

Repositorio creado: `https://github.com/Be10/mistera-app.git` (privado). No utilices como repositorio la carpeta raíz antigua `Mistera_App`, que contiene las copias históricas y otras aplicaciones.

Abre en VS Code la carpeta sincronizada `MISTERA_Codigo` y desde Git Bash, dentro de esa carpeta, ejecuta:

```bash
git init -b main
git add .
git commit -m "MISTERA: fuente estable TEST y PRD"
git remote add origin https://github.com/Be10/mistera-app.git
git push -u origin main
git switch -c test
git push -u origin test
```

El repositorio privado de MISTERA es `Be10/mistera-app`. Ejecuta Git dentro de `MISTERA_Codigo` y nunca en la carpeta padre `Mistera_App`. Si la carpeta ya tiene `.git`, **no repitas `git init`**; consulta `git remote -v` y `git branch` primero. No compartas credenciales. La carpeta usa `.gitignore` para impedir que salgan credenciales, paquetes ZIP y `.deploy`.

## Terminal corporativa sin Python

El proceso completo de compilación y publicación está implementado usando Node.js; no hay que instalar Python. Para el despliegue manual inicial en TEST, dentro de `MISTERA_Codigo`:

```bash
export NODE_USE_SYSTEM_CA=1
bash scripts/deploy_test.sh
```

Cuando pregunte, escribe `TEST`. Asegúrate de que OneDrive haya sincronizado `scripts/build_worker_release.mjs` y los scripts actualizados, y luego sube esos cambios a la rama `test` para que Cloudflare use también la versión sin Python al compilar automáticamente.

## TEST — configuración única

1. Inicializa D1 existente desde la terminal autenticada (solo una vez):

   `bash scripts/init_d1_progress.sh test`

2. En Cloudflare abre **Workers & Pages → mistera-staging → Settings → Builds → Connect**. Autoriza GitHub y selecciona el repositorio privado `mistera-app`.
3. Selecciona la rama de producción de **este Worker** `test` (no `main`) en Branch control.
4. Configura en Build settings:

   - Root directory: `/` (raíz del repositorio).
   - Build command: `bash scripts/ci_build_test.sh`
   - Deploy command: `npx --yes wrangler@4.168.0 deploy --config wrangler.test.jsonc`
   - Preview builds para otras ramas: desactivados.

5. Guarda y ejecuta un build/push a `test` para desplegar. Verifica `https://mistera-staging.mistera-app.workers.dev/api/status` (se espera `sync: true`).
6. Antes de exponer sorpresas todavía secretas: **Workers & Pages → mistera-staging → Access → Protect this Worker behind Access**; autoriza solo tu correo y comprueba la protección desde incógnito.
7. Solo después de comprobar esa protección, configura en **TEST → Settings → Build → Environment variables** `MISTERA_TEST_DRAFTS=1` y `MISTERA_ACCESS_VERIFIED=ACCESO_TEST_CONFIGURADO`. Reconstruye TEST y verifica que el editor/borradores solo sean accesibles tras iniciar sesión. Si retiras Access, elimina primero estas variables y vuelve a desplegar la versión saneada.

## PRD — configuración única, DESPUÉS de aprobar TEST

1. La D1 exclusiva `mistera-prd` ya existe, con UUID registrado en `wrangler.prd.jsonc`. No volver a crearla.
2. Verifica que el UUID de PRD siga siendo distinto de TEST y que no se haya cambiado el binding `MISTERA_DB`.
3. Inicializa su esquema de forma no destructiva y sin subir archivos `.sql`:

   `bash scripts/init_d1_progress.sh prd`

4. Publica a `test` la configuración actualizada, valídala y promuévela a `main` con un Pull Request aprobado.
5. En Cloudflare crea un Worker nuevo `mistera-prd` con GitHub, usando **el mismo repositorio privado**. Selecciona la rama `main` y el mismo directorio raíz `/`.
6. Configura Build command: `bash scripts/ci_build_prd.sh` y Deploy command: `npx --yes wrangler@4.168.0 deploy --config wrangler.prd.jsonc`. Desactiva builds de vista previa de otras ramas.
7. Protege el Worker PRD desde Cloudflare Access, autoriza únicamente a tu esposa (y opcionalmente a ti). Comprueba el bloqueo anónimo **antes de compartir el enlace**.
8. Verifica `https://mistera-prd.mistera-app.workers.dev/api/status` y prueba sincronización de progreso entre dos dispositivos autorizados, enlazados con el mismo código privado de MISTERA.

## Uso diario automático

### Actualizar TEST

Desde la rama `test`, cambia el contenido/recursos en `public/`, verifica y ejecuta:

```bash
git add .
git commit -m "MISTERA: cambios para pruebas"
git push origin test
```

Cloudflare Workers Builds recompila y publica **solo** `mistera-staging` al detectar el push.

### Promover a PRD

Después de validar TEST, abre un Pull Request **`test` → `main`** en GitHub. Revisa el diff y los recursos, y haz merge. Cloudflare compila y publica **solo** `mistera-prd`. Nunca se actualiza su D1 mediante un despliegue de código.

La promoción no supone que haya terminado la validación real: revisar integridad, velocidad, audio en móviles y el progreso persistido tras el deploy.

## Precauciones

- `main` se reserva para código aprobado. No subas pruebas directamente a esa rama.
- Si el repositorio privado contiene borradores futuros, no permitas acceso público al repositorio.
- TEST con borradores secretos requiere Cloudflare Access verificado; la compilación TEST predeterminada es segura y solo incluye días publicados.
- No uses la subida manual de carpetas ni ZIP; esta arquitectura utiliza **Workers Builds**, no Pages Functions.
- Una nueva sorpresa debe marcarse `PUBLICADO` solo cuando corresponda; el sitio publicado puede inspeccionarse técnicamente, aunque visualmente esté bloqueado por fecha.
- El archivo `scripts/published-history.json` debe seguir acumulando días ya entregados; verifica este archivo al promover cambios para no ocultarlos accidentalmente.
- En PRD los cambios del esquema D1 se aplican aparte y de manera no destructiva, nunca automáticamente por un despliegue ordinario.

Documentación oficial:
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/d1/get-started/

## Bloqueo de uploads SQL por seguridad corporativa

NTT DATA Zscaler bloquea el host de subida de archivos usado por `wrangler d1 execute --file=...`. Este error no implica que las bases D1 hayan fallado. Los dos UUID estan ya en `wrangler.test.jsonc` y `wrangler.prd.jsonc`. Para configurar una sola vez las tablas de cada entorno ejecuta los scripts oficiales de MISTERA basados en `--command` (Cloudflare D1 REST, sin upload de archivos):

```bash
export NODE_USE_SYSTEM_CA=1
bash scripts/init_d1_progress.sh test
bash scripts/init_d1_progress.sh prd
```

Cada script valida nombre, UUID y binding, y aplica solo `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`, conservando los registros existentes. Si la politica corporativa bloquea tambien estas consultas, no intentes eludirla: solicita una excepcion autorizada al administrador de red o inicializa manualmente en el editor SQL de D1 del panel de Cloudflare si esta permitido.
