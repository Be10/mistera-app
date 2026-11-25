# MISTERA — acceso privado y mensaje de bienvenida

## Secuencia de la experiencia

Primera visita PRD: pantalla con el mismo estilo de la carga → pedir seis números especiales → validar con Cloudflare Worker y recordar sesión → terminar de cargar recursos privados → «Vamos allá» → mostrar **tu texto escrito**, una sola vez → botón dorado «X Cerrar» con resplandor leve → villa. Visitas posteriores en el mismo navegador: carga → «Vamos allá» → villa. Al entrar desde otro equipo se vuelve a introducir la clave, pero se recupera el progreso compartido desde D1.

La pantalla de código es técnicamente una cubierta ligera antes de descargar las imágenes personales: es obligatorio para no dejar recursos visibles antes de autenticar. Mantiene el diseño visual de MISTERA y no revela la villa.

## Completar mensaje personal

Editar `public/content/mensaje-bienvenida.json`:

```json
{
  "enabled": true,
  "message": "AQUÍ VA EL TEXTO DEFINITIVO ESCRITO POR TI"
}
```

No marques `enabled:true` hasta colocar tu mensaje definitivo. El archivo se sincroniza cuando hagas `git push` a TEST; después de revisarlo, se promoverá a PRD. El sistema solo registra la lectura cuando ella pulsa «Cerrar», no antes.

## D1 — esquema extra de seguridad

Las dos bases existentes permanecen separadas. Solo añadimos una tabla de contadores de intento, sin quitar ni restablecer `gift_progress`.

```bash
export NODE_USE_SYSTEM_CA=1
bash scripts/init_d1_progress.sh test
bash scripts/init_d1_progress.sh prd
```

## Primero activar en TEST

TEST sigue protegido por Cloudflare Access. Antes de cambiar `MISTERA_AUTH_REQUIRED` a `1` en `wrangler.test.jsonc`, prepara tres **Secret** bindings para `mistera-staging` desde Cloudflare → Workers & Pages → mistera-staging → Settings → Variables and Secrets:

- `MISTERA_ACCESS_CODE`: los seis dígitos de vuestra fecha; introdúcelo solo en Cloudflare, sin escribirlo en código ni commits.
- `MISTERA_SESSION_KEY`: una clave aleatoria de más de 32 caracteres.
- `MISTERA_PROGRESS_KEY`: **otra** clave aleatoria, distinta y permanente para TEST.

Las claves aleatorias se pueden generar en el equipo con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`; guardar la clave `MISTERA_PROGRESS_KEY` fuera del repositorio en un gestor privado.

**El modo de prueba del PIN no estará visible hasta activar este flag tras configurar los secretos.** Asegúrate de que `mistera-staging` continúa usando D1 `mistera-test-progress` y Cloudflare Access.

## Más tarde, PRD

Crea `mistera-prd`, con D1 `mistera-prd`. En sus ajustes añade sus propios secretos `MISTERA_ACCESS_CODE`, `MISTERA_SESSION_KEY` y `MISTERA_PROGRESS_KEY`. Usa otra pareja de claves aleatorias distinta de TEST y conserva la de progreso con máxima precaución. PRD requiere estos secretos y, si faltan, falla cerrada, sin publicar imágenes personales. `main` se promueve solo tras aprobar TEST.

**No usar Cloudflare One-time PIN en PRD** si quieres acceder solo con los seis dígitos y no consultar correo. El PIN romántico tampoco es una protección empresarial: seis números y la URL compartida no impiden que otra persona a quien se le comunique el código pueda acceder, aunque hay límites de intentos. Comparte la URL y la pista de forma privada.

## Pruebas locales y publicación

```bash
node scripts/qa_v37_auth.mjs
bash scripts/ci_build_test.sh
bash scripts/ci_build_prd.sh
```

Estos comandos no cambian D1 ni despliegan a Cloudflare. El despliegue se ejecutará automáticamente cuando el cambio de TEST se suba a `test`; PRD seguirá sin tocarse hasta aprobar la promoción a `main`.
