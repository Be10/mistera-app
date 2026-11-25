# MISTERA — Publicación automática TEST y PRD, sin ZIP

## Estado confirmado

- Cuenta Cloudflare autorizada localmente con Wrangler.
- Worker TEST existente: `mistera-staging`.
- Worker histórico: `shy-recipe-28ed`; no usar.
- D1 TEST existente: `mistera-dev` (`683018d0-4a53-4ddc-9f63-7611ebcb3005`), inicialmente con 0 tablas.
- Worker PRD `mistera-prd` y base D1 `mistera-prd`: aún no creados.
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

   `npx wrangler d1 execute mistera-dev --remote --file=db/schema.sql`

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

1. Crea D1 exclusiva desde tu terminal:

   `npx wrangler d1 create mistera-prd`

2. Copia el UUID devuelto al campo `database_id` de **`wrangler.prd.jsonc`**. El UUID de PRD no puede ser el mismo de TEST.
3. Inicializa su esquema sin borrar datos:

   `npx wrangler d1 execute mistera-prd --remote --file=db/schema.sql`

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
