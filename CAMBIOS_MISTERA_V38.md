# MISTERA — V38: cierre del chat 05 y bienvenida definitiva

**25 de noviembre de 2026 — código fuente sincronizable a OneDrive**

## Fuente y entornos

La única raíz de trabajo y publicación es `Documentos/Mistera_App/MISTERA_Codigo`.
No desplegar ZIPs de `Escena_Villa_Interactiva_VXX` ni parches aislados.

- TEST: Worker `mistera-staging`, rama `test`, D1 `mistera-test-progress`, Cloudflare Access. El requisito de PIN de MISTERA permanece apagado por defecto (`MISTERA_AUTH_REQUIRED=0`) hasta que el propietario configure los secretos y decida probarlo.
- PRD: Worker `mistera-prd`, rama `main`, D1 `mistera-prd`, autenticación personalizada exigida (`MISTERA_AUTH_REQUIRED=1`), solo días 01–02 publicados, sin editor ni simulación de fecha. **No publicar sin comprobar que los tres secretos de Cloudflare existen y que la protección falla cerrada.**
- GitHub es repositorio privado y Cloudflare Workers Builds usa ramas independientes. La fuente original se guarda en OneDrive y su cliente de escritorio la sincroniza; una escritura en OneDrive **no equivale a** un `git push` ni a desplegar.

## Correcciones que ya existían en V37 y se han conservado

- `Una villa solo para nosotros ✨` retirado del splash, y etiquetado accesible del progreso cambiado a «Preparación de MISTERA» en V38 para no desvelar la sorpresa.
- Icono de regalo Lucide en Ajustes del dock, no árbol deformado.
- Día 01: efecto reversible de tarjeta; `Title` aparece suavemente después de raspar.
- Separación vertical más amplia de «Día NN» en los contenidos.
- Acceso PRD con PIN validado por Worker; recurso y API protegidos, sesión HttpOnly con límite de intentos, secretos guardados en Cloudflare.

## Cambios realizados en V38

1. `public/content/mensaje-bienvenida.json`: mensaje definitivo, nueve párrafos, signos y emojis intactos, dos párrafos con negritas. `enabled:true`.
2. `public/mistera-welcome.js`: claves locales `mistera-welcome-seen-test` y `mistera-welcome-seen-prd` independientes y estables; verificación de progreso D1; recibo solo al cerrar.
3. `public/mistera-loader.js`: renderizado seguro de negritas, transición escalonada entre párrafos, botón «Cerrar» disponible al finalizar, prevención de doble clic, navegación original y audio intactos.
4. `public/mistera-v37.css`: pantalla de carta con desplazamiento, márgenes seguros, brillo cálido discreto, accesibilidad y opción de movimiento reducido.
5. `public/index.html`: contenedor y botón accesibles, inicialmente ocultos; se evita revelar el término «villa» antes de entrar.
6. `scripts/qa_v37_welcome.mjs`: validación de recibos y aislamiento TEST/PRD.
7. `scripts/qa_v38_welcome.mjs`: nuevo control automático de integridad exacta del mensaje aprobado y flujo.
8. `README.md`: documentación actualizada.

## Pruebas locales realizadas (sin publicar ni acceder a la D1 real)

- `node scripts/qa_v37_auth.mjs` → aprobado.
- `node scripts/qa_v37_welcome.mjs` → aprobado.
- `node scripts/qa_v38_welcome.mjs` → aprobado.
- `node scripts/build_worker_release.mjs test` → 108 archivos, solo días 01 y 02 publicados.
- `node scripts/build_worker_release.mjs prd` → 108 archivos, solo días 01 y 02 publicados, sin editor público.
- Navegador aislado con DOM/CSS/JS reales y tareas de inicio simuladas: 393×851 TEST/PRD, 320×568, 1440×900 con movimiento reducido → aprobado. En alturas pequeñas se desplaza el texto sin tapar el botón. **No sustituye pruebas E2E del Worker conectado a Cloudflare.**

## Publicación desde Git Bash en VS Code

Tras la sincronización OneDrive, primero comprobar la rama de trabajo y las diferencias (`git status -sb`, `git diff --stat`). No publicar directamente `main`.

Si estás en la rama `test` y la revisión es satisfactoria, puedes usar el flujo existente de GitHub o el despliegue manual de TEST descrito en README:

```bash
export NODE_USE_SYSTEM_CA=1
node scripts/qa_v37_auth.mjs
node scripts/qa_v37_welcome.mjs
node scripts/qa_v38_welcome.mjs
bash scripts/ci_build_test.sh
bash scripts/deploy_test.sh
```

El despliegue de TEST requiere Wrangler autenticado y permisos de Cloudflare, solo se ejecuta en tu equipo. **No ejecutes `deploy_prd.sh`, `git push origin main` ni un merge de `test` a `main` hasta comprobar la protección de PRD y aprobar TEST.**

## Pruebas pendientes en TEST y PRD reales

- Activación del audio con el primer gesto y continuidad entre las escenas; validar en tu Samsung Galaxy A53.
- Primera entrada, segundo ingreso, interrupción antes de cerrar y lectura al volver; prueba usando un progreso de prueba distinto del de la receptora. No borrar `gift_progress` ni modificar D1 real para reiniciar la bienvenida.
- Validación completa del PIN y la cookie de PRD solo después de configurar Worker/secrets y proteger el despliegue.
- Comprobar que Cloudflare Access sigue interceptando TEST y que PRD no expone medios sin autenticación.

**Estado:** cambios de V38 preparados en el código; sin publicar PRD. Estos cambios no alteran los recursos gráficos, la estructura D1 ni las 24 casas.
