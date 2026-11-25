# MISTERA V38 | Activación segura de PRD (sin perder progreso)

**Estado al 25/11/2026:** TEST `mistera-staging` actualizado manualmente con editor privado, y posteriormente rama `test` enviada a GitHub en commit `66ff489`. Cloudflare muestra compilación automática *Ready*. Esto no prueba por sí solo la inclusión de borradores: revisar los logs del Build y confirmar `OK TEST: 127 archivos; borradores privados=true`, y que la ruta `/editor/planificador.html` funcione **solo tras Cloudflare Access**.

## Corrección de seguridad tras revisión de Cloudflare (25/11/2026)

**Bloqueante antes de publicar:** en la pantalla de `mistera-prd` las tres credenciales se configuraron como **Variable** (texto visible) y no **Secret**. Además, las dos claves largas son idénticas y predecibles, y el PIN aparece en la captura. No desplegar la villa con estos valores.

1. Mientras PRD solo tenga el Worker provisional, entra en **Settings → Variables and Secrets** y elimina las tres variables actuales `MISTERA_ACCESS_CODE`, `MISTERA_SESSION_KEY` y `MISTERA_PROGRESS_KEY`; pulsa **Deploy** para aplicar su eliminación. Cloudflare no permite tener a la vez un secreto y una variable con un mismo nombre.
2. Pulsa **Add variable** y selecciona explícitamente el tipo **Secret**, no **Variable**, para crear los tres bindings con los mismos nombres; pulsa **Deploy**. La interfaz deberá indicar tipo Secret y ocultar los valores.
3. Para `MISTERA_SESSION_KEY` y `MISTERA_PROGRESS_KEY` genera **dos claves diferentes e impredecibles**, una por ejecución local: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Cada resultado tiene 43 caracteres. No pegues las claves en Git, OneDrive, chats, capturas ni logs públicos. Guarda la clave de progreso en un gestor seguro de contraseñas.
4. El PIN mostrado en la captura ya no debe considerarse secreto. Es preferible elegir otro código de seis dígitos antes de compartir PRD; si se conserva el código romántico original por una decisión personal, asume su exposición y evita difundir el enlace, manteniendo la protección de recursos y el límite de intentos.
5. **No copies el bloque `vars` que Cloudflare muestra en su aviso azul**. El `wrangler.prd.jsonc` del proyecto ya especifica `secrets.required` solo con los nombres, `MISTERA_AUTH_REQUIRED=1`, `run_worker_first=true` y la D1 PRD correcta. Poner valores en `vars` reemplazaría los secretos en un despliegue posterior.
6. **La identidad del progreso PRD depende de `MISTERA_PROGRESS_KEY`.** En esta fase inicial es correcto crearla con seguridad antes de que exista progreso real. Si ya hubiera registros de la destinataria en `gift_progress`, detenerse y revisar una migración; cambiarla sin migración desvincula el historial anterior. Cambiar `MISTERA_SESSION_KEY` invalida las sesiones anteriores.
7. Después de convertir las tres entradas a Secret, comprueba que no se ve ninguno de sus valores en el panel y que no hay referencias a los valores sensibles en `wrangler.prd.jsonc`. Luego continúa con las pruebas de privacidad y, solo después, el despliegue PRD con aprobación explícita.

Referencia: [Cloudflare Workers — Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) y [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).

## Fuente canónica y separación

- Fuente sincronizada: `Documentos/Mistera_App/MISTERA_Codigo`; desplegar desde Git Bash en esa carpeta.
- GitHub privado: `Be10/mistera-app`. Rama `test` → TEST; rama `main` → PRD.
- TEST: `mistera-staging`, D1 `mistera-test-progress` (UUID `4dc0b767-144a-4499-ad12-a79ec3d7c468`), Access de Cloudflare, `MISTERA_AUTH_REQUIRED=0`, editor permitido **solo** detrás de Access.
- PRD: `mistera-prd`, D1 `mistera-prd` (UUID `ec5b19c8-4b50-4c5a-b9ed-e878d9338473`), `MISTERA_AUTH_REQUIRED=1`, `run_worker_first=true`, sin editor, solo sorpresas 01–02 publicadas. Mantener borradores 03–25 privados.
- La sincronización de OneDrive no ejecuta Git, Wrangler ni modificaciones de D1.

## Pasos previos a cualquier despliegue PRD

1. Confirmar el build automático de TEST en Cloudflare → Workers & Pages → `mistera-staging` → Deployments → Build. El log de compilación con borradores privados debe mostrar `borradores privados=true`. Si muestra `false`, configurar `MISTERA_TEST_DRAFTS=1` y `MISTERA_ACCESS_VERIFIED=ACCESO_TEST_CONFIGURADO` en **Settings → Build → Build Variables and Secrets**, con Access previamente verificado.
2. En Git Bash, compilar PRD de forma local, sin publicar ni escribir en D1:

   ```bash
   export NODE_USE_SYSTEM_CA=1
   node scripts/qa_v37_auth.mjs
   node scripts/qa_v38_welcome.mjs
   bash scripts/ci_build_prd.sh
   ```

3. Inicializar la D1 **ya existente**, una sola vez (puede repetirse porque solo ejecuta `CREATE ... IF NOT EXISTS`):

   ```bash
   bash scripts/init_d1_progress.sh prd
   ```

   Confirmar que las tablas `gift_progress`, `mistera_auth_attempts` y el índice `gift_progress_user` están presentes. **No** recrear, eliminar ni vaciar la base.
4. En Cloudflare, crear el Worker `mistera-prd` **si no existe**, inicialmente con una respuesta provisional sin recursos (por ejemplo HTTP 503). No conectar todavía la rama `main` ni desplegar la villa hasta configurar todos los secretos. Una respuesta provisional no contiene sorpresas privadas.
5. En `mistera-prd` → **Settings → Variables and Secrets**, añadir como tipo **Secret** (NO texto sin cifrar):

   - `MISTERA_ACCESS_CODE`: los seis dígitos que el autor ya escogió. Escribirlos directamente en Cloudflare; nunca en código, capturas, chat ni GitHub.
   - `MISTERA_SESSION_KEY`: secreto aleatorio de al menos 32 caracteres.
   - `MISTERA_PROGRESS_KEY`: otro secreto aleatorio, distinto, de al menos 32 caracteres. **Conservarlo permanentemente**: define la identidad del historial compartido en D1.

   Para generar cada uno de los dos valores aleatorios, ejecutar por separado:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Copiar cada resultado directamente en su campo Secret. No pegar nunca esos resultados al enviar logs o capturas.
6. Asegurarse de que `wrangler.prd.jsonc` mantiene `secrets.required` con los tres nombres, `MISTERA_AUTH_REQUIRED=1`, `assets.run_worker_first=true` y la D1 exclusiva. Wrangler rechaza los despliegues si falta un Secret obligatorio.
7. Cuando TEST y los secretos estén revisados, desplegar únicamente la compilación PRD segura desde Git Bash, tras aprobación explícita:

   ```bash
   export NODE_USE_SYSTEM_CA=1
   bash scripts/deploy_prd.sh
   ```

   Confirmación esperada: `PUBLICAR-PRD`. El comando modifica el Worker PRD y registra los días publicados; **no** borra la D1. No ejecutarlo mientras falten secretos o pruebas.

## Comprobación de privacidad tras desplegar PRD

Ejecutar **sin PIN, sin cookies y sin abrir regalos**:

```bash
export NODE_USE_SYSTEM_CA=1
node scripts/qa_prd_private_gate_v38.mjs
```

Comprueba `/`, `/index.html`, `/api/auth`, `/api/status`, `/api/progress`, la imagen principal, la dedicatoria, el JSON de sorpresas, el JS de escenas y la URL del editor. Los recursos y API deben negar acceso sin sesión; únicamente debe mostrarse la cubierta de PIN. No hace ninguna petición POST ni escribe en D1.

**Importante:** PRD usa **una sola identidad privada compartida**. Si el autor pulsa «Cerrar» en PRD, registra la dedicatoria como vista para la destinataria; si abre una casita, la marca como abierta. No usar PRD para probar estas interacciones ni reiniciar manualmente `gift_progress`; realizar las pruebas completas de experiencia en TEST. En PRD, después de publicar, verificar inicialmente solo el acceso ANÓNIMO; introducir el PIN únicamente para comprobar lo imprescindible, sin cerrar la dedicatoria ni abrir casas.

## Activar CI/CD PRD solo cuando todo esté aprobado

Con Worker `mistera-prd` ya configurado y versión protegida verificada, conectar el repositorio privado desde **Settings → Builds → Connect**. Seleccionar `Be10/mistera-app`, rama de producción **`main`**, raíz `/`, Build command `bash scripts/ci_build_prd.sh` y Deploy command `npx --yes wrangler@4.168.0 deploy --config wrangler.prd.jsonc`; desactivar Previews de otras ramas. Promover cambios de `test` a `main` mediante Pull Request revisado, **no** mediante `git push origin main` directo. Confirmar siempre la versión y la privacidad tras la actualización automática. Si conectar CI ejecuta una compilación de `main` todavía no aprobada, cancelar la conexión antes de desplegar.

## Referencias

- Workers Builds, Workers existente: https://developers.cloudflare.com/workers/ci-cd/builds/
- Variables de compilación: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Secretos exigidos por Wrangler: https://developers.cloudflare.com/workers/wrangler/configuration/
- Secretos en Dashboard: https://developers.cloudflare.com/workers/configuration/secrets/

## Incidencia del primer despliegue PRD — HTTP 302 en la prueba anónima (25/11/2026)

**Estado observado:** la primera publicación manual de `mistera-prd` terminó con Wrangler versión `45c74d4a-34d1-4e49-aaa1-e7d6f0597480`, D1 `mistera-prd`, autenticación obligatoria y solo días 01–02. La base `gift_progress` tenía cero registros antes de la publicación. La prueba anterior `qa_prd_private_gate_v38.mjs` falló en `GET /` porque recibió `HTTP 302` y esperaba `HTTP 200`. **No significa por sí mismo acceso público ni protección completa.**

El `worker/index.js` que se desplegó responde a `GET /` sin sesión con `lockedShell()` (**200**, formulario del PIN), o con **503** si faltan secretos. No emite una redirección 302 para esa ruta. Por tanto, el `302` puede originarse en Cloudflare Access (Worker, hostname o cuenta) o en otra capa intermedia, y debe identificarse su destino antes de modificar la seguridad.

### Diagnóstico corregido, sin datos privados

El archivo `scripts/qa_prd_private_gate_v38.mjs` fue corregido para:

- Revisar las **11 rutas** aun cuando alguna falle; no detenerse solo en `/`.
- Mostrar para un 302 únicamente **código HTTP, hostname y ruta recortada del destino**. Se ocultan query string, fragmentos y posibles tokens.
- Distinguir redirecciones (no verificadas), respuestas inesperadas (fallos) y respuestas correctas.
- **Nunca contar una redirección como PASS**. Tampoco seguirla automáticamente.
- Enviar exclusivamente GET anónimos, sin cookies, PIN ni POST; no lee/escribe datos de progreso en D1.

Desde Git Bash, dentro de `MISTERA_Codigo`:

```bash
export NODE_USE_SYSTEM_CA=1
node scripts/qa_prd_private_gate_v38.mjs
```

**Resultado esperado antes de compartir PRD:** `11/11 verificadas; 0 redirecciones; 0 fallos`, con HTML de PIN (200) y bloqueos JSON (401). Si se muestra `host=...cloudflareaccess.com` o `ruta=/cdn-cgi/access/…`, puede existir Cloudflare Access delante del Worker.

### Si Cloudflare Access explica la redirección

1. Revisar en Cloudflare `mistera-prd → Access` y en Zero Trust → Access → Applications si hay políticas a nivel de Worker, hostname o cuenta. **No retirar ninguna política todavía**.
2. La experiencia solicitada para PRD es **PIN romántico de MISTERA, sin solicitud de correo**. Si también hay Access, la destinataria podría encontrarse con un segundo inicio de sesión.
3. Para validar el código de MISTERA **detrás de Access**, desde una sesión privada autorizada en Access y sin cookie `mistera_private_session`, comprobar que `/` muestra la portada de seis dígitos y que una solicitud a `/assets/aldea-base.png` es denegada (401). No pulsar «Cerrar» ni abrir regalos.
4. **No desactivar una política Access a nivel de cuenta**, porque podría dejar TEST sin protección. Si Access se aplica solo a PRD, evaluar su ajuste específico **únicamente después de verificar el bloqueo del Worker**, y volver a ejecutar enseguida la prueba anónima. Si es una política de cuenta o de dominio compartida, detenerse y revisar el alcance.
5. Si el `302` apunta a otro hostname/proxy corporativo, no asumir que sea Cloudflare; revisar con el administrador de red sin desactivar TLS ni introducir excepciones inseguras.

### Version URLs (antes denominadas Preview URLs)

El primer despliegue advirtió que la opción `preview_urls` no estaba declarada y Cloudflare activaría enlaces de versión. Se añadió `"preview_urls": false` a `wrangler.prd.jsonc` para que **el siguiente despliegue autorizado** deshabilite estas rutas adicionales. **Editar OneDrive NO cambia el Worker ya desplegado.** Se pueden deshabilitar manualmente desde Cloudflare → `mistera-prd` → Settings → Domains & Routes → Version URLs, sin tocar D1.

**No ejecutar otro `deploy_prd.sh` automáticamente para solucionar el 302**: primero determinar la redirección y la política de acceso. Conservar los tres secretos como tipo Secret; `MISTERA_PROGRESS_KEY` no debe cambiar tras el primer progreso real.

Documentación oficial: [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Access y redirecciones para clientes no navegador](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/) y [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).


## Resolución confirmada: redirección Access en las 11 rutas

La prueba real `node scripts/qa_prd_private_gate_v38.mjs` devolvió 11/11 respuestas HTTP 302 hacia `floral-truth-b889.cloudflareaccess.com/cdn-cgi/access/...` y 0 verificaciones del Worker. Esto confirma una capa de **Cloudflare Access delante de `mistera-prd`**, no una falla demostrada del PIN y tampoco una verificación de privacidad del Worker. La versión PRD publicada manualmente es `45c74d4a-34d1-4e49-aaa1-e7d6f0597480`.

### Procedimiento sin tocar TEST

1. **Conservar Access por ahora.** En `mistera-prd` > Settings > Variables and Secrets confirmar que `MISTERA_ACCESS_CODE`, `MISTERA_SESSION_KEY` y `MISTERA_PROGRESS_KEY` son realmente **Secret** (no Variable), y que las dos claves son distintas, aleatorias y de al menos 32 caracteres. No publicar valores ni capturas. El código de acceso apareció previamente en una captura; considerar rotarlo antes de entregar la invitación.
2. Desde una ventana privada del navegador, autenticar **solo como propietario** ante Cloudflare Access en la URL PRD. Sin introducir el PIN, verificar que `/` muestra la pantalla `Nuestro pequeño secreto` y que `/assets/aldea-base.png` devuelve 401 o acceso denegado (no una imagen). Para probar un segundo dispositivo, no cerrar la bienvenida ni abrir regalos: esas acciones pueden escribir en la identidad definitiva de `gift_progress`.
3. Identificar la regla exacta en `mistera-prd` > Access y, si es necesario, Zero Trust > Access controls > Applications. La prioridad actual de Cloudflare es **hostname/path > Worker > cuenta**. Si la regla es exclusivamente de `mistera-prd`, desactivar solo esa regla. Si protege **todos los Workers** a nivel de cuenta, usar la opción **Make this Worker public / bypass** para `mistera-prd`, sin desactivar `Protect all Workers`. Si hay una regla por hostname, quitar solo la que corresponda a `mistera-prd.mistera-app.workers.dev` (no un comodín compartido ni `mistera-staging`).
4. Inmediatamente ejecutar `export NODE_USE_SYSTEM_CA=1` y `node scripts/qa_prd_private_gate_v38.mjs`. Deben pasar 11/11 rutas con cero redirecciones y cero fallos: `200` para `/`, `/index.html` y `GET /api/auth`; `401` para datos, imágenes, JavaScript privado, API de progreso y editor.
5. Si aparece cualquier `200` en un recurso restringido, un error de secretos o algún resultado no previsto, **volver a activar Access para PRD** y detener el proceso. Comprobar además en incógnito que TEST (`mistera-staging`) mantiene su desafío Access. No hacer POST de PIN ni abrir regalos durante estas pruebas anónimas.

**Interpretación:** "Make this Worker public" se refiere exclusivamente a quitar el desafío de Cloudflare Access; **MISTERA no es pública** en cuanto a recursos, porque el Worker sigue exigiendo el PIN y `assets.run_worker_first=true` para cada petición. La portada de PIN sí será visible desde Internet y un código de seis dígitos ofrece seguridad limitada; mantener URL y código en privado.

Tras pasar la prueba 11/11, no conectar CI/CD de PRD hasta que `test` y `main` tengan una versión aprobada y coherente. `wrangler.prd.jsonc` incluye ahora `preview_urls:false`, pero no está aplicado a la versión publicada hasta el siguiente despliegue o ajuste equivalente en el panel.

Documentación (actualizada al 02/11/2026): https://developers.cloudflare.com/workers/configuration/cloudflare-access/
