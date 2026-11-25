# MISTERA — código activo de TEST y PRD

Esta es la **carpeta fuente estable** de MISTERA. Ya no es necesario crear un ZIP ni copiar versiones para publicar. No uses `Escena_Villa_Interactiva_VXX` como raíz de despliegue.

- Rama `test` → Cloudflare Worker `mistera-staging` + D1 `mistera-dev`.
- Rama `main` → Cloudflare Worker `mistera-prd` + D1 `mistera-prd`.
- `shy-recipe-28ed` queda como archivo histórico, sin despliegues nuevos.

En ambos Workers se utilizan **Static Assets + Worker API + D1**. Nunca se suben Pages Functions mediante la interfaz de carga estática.

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
