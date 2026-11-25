# MISTERA — código activo de TEST y PRD

Esta es la **carpeta fuente estable** de MISTERA. Ya no es necesario crear un ZIP ni copiar versiones para publicar. No uses `Escena_Villa_Interactiva_VXX` como raíz de despliegue.

- Rama `test` → Cloudflare Worker `mistera-staging` + D1 `mistera-test-progress`.
- Rama `main` → Cloudflare Worker `mistera-prd` + D1 `mistera-prd`.
- `shy-recipe-28ed` queda como archivo histórico, sin despliegues nuevos.

En ambos Workers se utilizan **Static Assets + Worker API + D1**. Nunca se suben Pages Functions mediante la interfaz de carga estática.

## Despliegue sin Python: Node.js + Wrangler

No instales Python en tu equipo corporativo. Los scripts de compilación de TEST y PRD usan Node.js integrado y las publicaciones se realizan con Wrangler. Para publicar TEST desde Git Bash:

```bash
export NODE_USE_SYSTEM_CA=1
bash scripts/deploy_test.sh
```

Los archivos publicados se preparan con `node scripts/build_worker_release.mjs test|prd`. Los `.py` históricos no intervienen en esta ruta.

## Despliegue automático nativo de Cloudflare Workers Builds

| Worker | Rama GitHub | Build command | Deploy command |
|---|---|---|---|
| `mistera-staging` | `test` | `bash scripts/ci_build_test.sh` | `npx --yes wrangler@4.168.0 deploy --config wrangler.test.jsonc` |
| `mistera-prd` | `main` | `bash scripts/ci_build_prd.sh` | `npx --yes wrangler@4.168.0 deploy --config wrangler.prd.jsonc` |

Los archivos de ambos entornos se generan en `.deploy/test` y `.deploy/prd` respectivamente. `.deploy` se ignora en Git y nunca se publica directamente.

**Nunca** conectes los dos Workers a la misma rama. Desactiva las compilaciones de vista previa de otras ramas en ambos Workers si no las necesitas. PRD debe quedar protegido por Cloudflare Access, y la rama `main` solo recibirá cambios aprobados desde TEST.

## Qué hacer una sola vez

Lee `GUIA_GIT_CLOUDFLARE.md` para crear un repositorio privado GitHub, conectar las ramas en Cloudflare Workers Builds y habilitar las dos bases D1. Estas operaciones requieren tu acceso de propietario; el `wrangler login` local no autoriza a ChatGPT a usar tu cuenta directamente.

## Después de la instalación

1. Edita y prueba en la rama `test`.
2. `git add . && git commit -m "Actualización de MISTERA" && git push origin test` para publicar TEST automáticamente.
3. Revisa TEST. Cuando lo apruebes, crea un Pull Request de `test` hacia `main`, revisa y haz *merge*; Cloudflare publica PRD automáticamente.

La D1 de PRD no se recrea, se borra ni se migra automáticamente por cada `push`; el progreso queda separado de los despliegues. Si en el futuro cambia el esquema, se revisará una migración no destructiva por separado.

## Privacidad y contenido

- El repositorio GitHub **debe ser privado** porque contiene borradores y el editor.
- TEST sin Cloudflare Access publica una versión saneada con solo días aprobados.
- Después de verificar Cloudflare Access, configura en las variables de compilación de TEST `MISTERA_TEST_DRAFTS=1` y `MISTERA_ACCESS_VERIFIED=ACCESO_TEST_CONFIGURADO` para incluir borradores privados. Nunca habilites estas variables antes de verificar que TEST está protegido.
- Los borradores privados nunca se publican en PRD.
- Antes de habilitar pruebas con borradores en TEST, protege `mistera-staging` con Cloudflare Access y verifica el bloqueo en una ventana de incógnito.
- PRD no contiene el editor ni permite habilitar el modo Pruebas por URL.
- No compartas tokens de GitHub, Cloudflare, códigos de progreso o claves de vinculación.

## Inicializacion D1 sin archivo SQL

En Git Bash (NTT DATA/Zscaler puede bloquear uploads de `.sql`):

```bash
bash scripts/init_d1_progress.sh test
bash scripts/init_d1_progress.sh prd
```

Los comandos usan la API oficial `wrangler d1 execute --command` con SQL no destructivo (`IF NOT EXISTS`), en vez de subir un archivo `.sql`. TEST y PRD mantienen UUID de D1 independientes. Verifica `/api/status` despues de publicar la configuracion. Nunca ejecutes estas operaciones contra la antigua `mistera-dev`.

## Verificacion de progreso remoto (TEST, sin alterar PRD)

Tras confirmar `https://mistera-staging.mistera-app.workers.dev/api/status` con `{"sync":true}`, ejecuta desde Git Bash:

```bash
export NODE_USE_SYSTEM_CA=1
node scripts/qa_pairing_isolation.mjs
node scripts/verify_test_sync.mjs
```

La primera prueba se ejecuta de forma local. La segunda llama exclusivamente al Worker `mistera-staging`, genera un codigo temporal aleatorio distinto del de la receptora y comprueba el guardado remoto de dos dispositivos simulados, merge monotono y aislamiento. Registra unicamente filas de diagnostico en `mistera-test-progress`; nunca accede a `mistera-prd`. Si Zscaler bloquea las consultas HTTPS desde Node, detenerse y revisar el error; no se debe deshabilitar TLS.

Al vincular un segundo dispositivo real, MISTERA primero obtiene el historial remoto y respalda localmente cualquier historial anterior antes de enlazar el codigo. Esto impide subir avances locales ajenos al progreso de la receptora. No compartir el codigo privado de vinculacion en capturas ni repositorios.


## Acceso romántico privado y bienvenida (V37)

- La autenticación **sin correo** utiliza el Worker con Static Assets y `run_worker_first:true` para proteger imágenes, audio, HTML y `/api/progress`.
- La clave de seis números se guarda **solo en los secretos de Cloudflare**, nunca en GitHub, JS, CSS ni JSON. El servidor aplica límite de intentos y entrega una cookie `HttpOnly`, `Secure`, `SameSite=Lax` de hasta 365 días. Si se borran las cookies o caduca la sesión, deberá volver a introducirla.
- **PRD exige tres secretos:** `MISTERA_ACCESS_CODE`, `MISTERA_SESSION_KEY` y `MISTERA_PROGRESS_KEY` (los dos últimos deben tener al menos 32 caracteres). **Conservar siempre `MISTERA_PROGRESS_KEY`: cambiarla cambia la identidad del historial y lo haría inaccesible sin una migración.** Cambiar el código o la clave de sesión no afecta al progreso.
- TEST continúa protegido por Cloudflare Access. Inicialmente `MISTERA_AUTH_REQUIRED=0` para no bloquear TEST hasta configurar sus secretos; se puede activar el código en TEST cambiando ese valor a `1` **solo después** de configurar los tres secretos y crear la tabla de intentos.
- Primero se presenta una pantalla visual idéntica en estilo a la carga para escribir el código; solo después de verificarlo se descargan los recursos privados. Esta separación técnica impide entregar la villa a usuarios sin acceso. Luego el botón «Vamos allá» abre una dedicatoria de una sola lectura y, al pulsar «Cerrar», la villa.
- Desde V38, el mensaje **definitivo aprobado por el autor** ya se encuentra íntegro y habilitado en `public/content/mensaje-bienvenida.json` (`enabled:true`), sin necesidad de rellenar plantillas. Solo se muestra en el primer ingreso; se registra exclusivamente al pulsar «Cerrar». Nunca modificar ese contenido sin nueva aprobación editorial.
- El recibo `mistera-intro-seen` se guarda mediante el sistema existente `gift_progress`, de forma monótona y sincronizada entre dispositivos bajo el identificador privado de PRD.
- Las mejoras cosméticas incluyen reverso animado de la notita 01, aparición breve del título al finalizar la raspadita, separación generosa de «Día NN», icono Lucide de regalo en Ajustes y eliminación de la frase que anticipaba la villa.
- Aplicar una vez `bash scripts/init_d1_progress.sh test` y `bash scripts/init_d1_progress.sh prd` para crear **solo si no existen** los contadores del acceso (sin borrar progreso). La inicialización usa `--command` para ser compatible con Zscaler.
- Probar el backend aislado sin Cloudflare ni Python: `node scripts/qa_v37_auth.mjs`.
- No desplegar PRD hasta que se hayan configurado sus tres secretos, completado y aprobado el mensaje personal y validado la experiencia en TEST.


## V38 — bienvenida romántica aprobada y verificada (25/11/2026)

La nueva escena usa los elementos y estilo de carga originales de MISTERA. Presenta los nueve párrafos de la dedicatoria aprobada en secuencia suave con sus dos negritas; el botón Lucide «X Cerrar» aparece al finalizar, con resplandor tenue constante. El contenido se desplaza en pantallas bajas, el botón permanece accesible y se respeta `prefers-reduced-motion`. El resto de la villa, audio, dock, día 01 y desbloqueos sigue intacto.

El recibo se conserva en la tabla compartida de progreso D1 existente y mediante `localStorage` con claves específicas de TEST y PRD; no depende del número de versión. No se restablecen los descubrimientos ni se modifica el esquema D1 para la bienvenida.

Para comprobar V38 desde la raíz estable del proyecto:

```bash
node scripts/qa_v37_auth.mjs
node scripts/qa_v37_welcome.mjs
node scripts/qa_v38_welcome.mjs
node scripts/build_worker_release.mjs test
node scripts/build_worker_release.mjs prd
```

Ambas compilaciones deben conservar solo los días 01 y 02 publicados; TEST retiene sus herramientas privadas cuando están autorizadas. **Compilar no despliega.** Probar en TEST antes de aprobar una publicación a PRD. Ver `CAMBIOS_MISTERA_V38.md` para seguimiento y política de seguridad.
