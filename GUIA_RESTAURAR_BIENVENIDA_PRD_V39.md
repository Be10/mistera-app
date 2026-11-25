# MISTERA V39 - Recuperar la bienvenida de PRD sin borrar regalos

**Caso confirmado (25/11/2026):** `mistera-prd` desplegado como version `577ea929-e9e0-4a5f-9e30-bfee29784ce0`, D1 `mistera-prd`, dias publicados 01 y 02. Una consulta real devolvio `day=25`, `field=mistera-intro-seen`, `value_json=true`.

## Por que no basta con borrar una fila

La bienvenida se considera vista si existe cualquiera de estas evidencias:

1. `localStorage['mistera-welcome-seen-prd'] === 'yes'` o la marca anterior `mistera-welcome-seen-v1`.
2. `localStorage['mistera-surprises-v23-progress']['25']['mistera-intro-seen']` (es JSON almacenado como texto).
3. La fila de D1 `gift_progress` con `day=25`, `field='mistera-intro-seen'`, `value_json='true'`.

La sincronizacion existente es monotona (append-only): si se borra solo la fila remota y se vuelve a abrir un navegador antiguo, puede reinsertar su copia local. **Primero limpiar esa lectura en cada navegador de prueba; luego borrar exclusivamente la fila de D1.** No tocar otros dias, campos ni claves de autenticacion. No usar "Reiniciar la prueba" ni borrar tablas.

## 1. Retirar la marca local en el navegador usado para PRD

En la URL REAL `https://mistera-prd.mistera-app.workers.dev/`, con la sesion ya abierta, F12 -> Console. Pega este bloque completo. Comprueba el dominio exacto en la primera linea. Si el JSON local esta mal formado, el codigo no borra nada.

```javascript
(() => {
  if (location.hostname !== 'mistera-prd.mistera-app.workers.dev') {
    throw new Error('Operacion permitida solo en el dominio PRD de MISTERA');
  }
  const key = 'mistera-surprises-v23-progress';
  const raw = localStorage.getItem(key);
  let next = null;
  if (raw !== null) {
    next = JSON.parse(raw);
    if (!next || Array.isArray(next) || typeof next !== 'object') {
      throw new Error('Progreso local inesperado: no se ha modificado nada');
    }
    if (Object.prototype.hasOwnProperty.call(next, '25')) {
      const stage = next['25'];
      if (!stage || Array.isArray(stage) || typeof stage !== 'object') {
        throw new Error('Estado del dia 25 inesperado: no se ha modificado nada');
      }
      delete stage['mistera-intro-seen'];
      if (Object.keys(stage).length === 0) delete next['25'];
    }
  }
  if (next) localStorage.setItem(key, JSON.stringify(next));
  localStorage.removeItem('mistera-welcome-seen-prd');
  localStorage.removeItem('mistera-welcome-seen-v1');
  console.info('Solo la lectura de bienvenida PRD fue retirada del almacenamiento local.');
  // Navegar de inmediato evita que la copia en memoria del tab reenvie el recibo.
  location.replace('about:blank');
})();
```

No reabrir el sitio aun. Cierra otras pestanas PRD que hayan marcado la bienvenida; si se uso otro navegador/dispositivo, repetir ahi la limpieza del recibo local o mantenerlo cerrado hasta que pueda limpiarse. La limpieza de la cookie `mistera_private_session` NO sustituye estos pasos: esa cookie solo controla la autenticacion.

## 2. Guardar un punto de recuperacion y verificar la D1 correcta

Desde Git Bash, en `Mistera_App/MISTERA_Codigo`:

```bash
export NODE_USE_SYSTEM_CA=1
npx --yes wrangler@4.168.0 d1 time-travel info mistera-prd
npx --yes wrangler@4.168.0 d1 execute mistera-prd --remote --command "SELECT COUNT(*) AS recibos FROM gift_progress WHERE day=25 AND field='mistera-intro-seen' AND value_json='true';"
```

Guardar el bookmark de Time Travel en un sitio privado, fuera de Git. Es una proteccion adicional; NO ejecutar `time-travel restore`, porque eso revertiria toda la D1. Antes de seguir, el numero de `recibos` debe ser exactamente **1**. Si es distinto, detenerse para revisar.

## 3. Eliminar SOLO esa lectura

Ejecutar UNICAMENTE si `recibos=1` y todas las pestanas de PRD de prueba estan cerradas:

```bash
npx --yes wrangler@4.168.0 d1 execute mistera-prd --remote --command "DELETE FROM gift_progress WHERE day=25 AND field='mistera-intro-seen' AND value_json='true' AND (SELECT COUNT(*) FROM gift_progress WHERE day=25 AND field='mistera-intro-seen')=1;"
```

El predicado extra evita borrar datos si hay mas de un recibo con ese campo. No elimina ni modifica las otras filas, las tablas, el indice ni los secretos.

Verificar:

```bash
npx --yes wrangler@4.168.0 d1 execute mistera-prd --remote --command "SELECT COUNT(*) AS recibos_restantes FROM gift_progress WHERE day=25 AND field='mistera-intro-seen';"
```

Esperado: `recibos_restantes=0`. Si la fila reaparece, un navegador con un estado local antiguo puede haberla reinsertado: cerrar las pestanas y revisar sus tres marcas locales ANTES de volver a eliminar.

## 4. Verificar sin volver a marcarla

Abrir PRD en un navegador privado nuevo (para evitar marcas antiguas), completar Cloudflare Access solo si aun esta activo, introducir el PIN, tocar "Vamos alla" y comprobar que se vea la dedicatoria. **NO tocar "Cerrar" en PRD**: ese clic vuelve a guardar `mistera-intro-seen=true`. Cerrar la ventana privada sin pulsar "Cerrar". Las pruebas completas de la experiencia se hacen en TEST, no PRD.

## 5. Seguridad y despliegues

- No cambiar `MISTERA_PROGRESS_KEY` para borrar una lectura: esa clave determina la identidad de todos los registros PRD.
- No borrar cookies, IndexedDB o almacenamiento completo para recuperar la bienvenida; las instrucciones anteriores actuan solo sobre las marcas pertinentes.
- Mantener Cloudflare Access de TEST independiente. Para PRD, ejecutar `node scripts/qa_prd_private_gate_v38.mjs` desde Git Bash. Si hay redirecciones `302`, el Worker sigue oculto tras una politica Access: revisar su alcance antes de quitarla; no compartir PRD hasta obtener 11/11 PASS anonimos.
- La correccion del PIN V39 ya se publico manualmente; esta recuperacion es exclusivamente de estado y no necesita nuevo `deploy_prd.sh`.
- No promover automaticamente la rama `test` a `main` hasta revisar el diff y completar la prueba anonima de privacidad PRD.

Fuentes de codigo examinadas: `public/mistera-welcome.js`, `public/mistera-cloud-sync.js`, `public/surprises-store.js`, `functions/api/progress.js`, `worker/private-access.js`, `db/schema.sql`.

Referencia CLI oficial: https://developers.cloudflare.com/d1/wrangler-commands/ ; Time Travel: https://developers.cloudflare.com/d1/reference/time-travel/

## Verificación posterior del autor - 25/11/2026

- Se confirmó la ejecución de Time Travel **info**, una consulta `recibos=1`, el DELETE limitado de `mistera-intro-seen` y la consulta final `recibos_restantes=0`. La lectura remota queda recuperada; **no volver a ejecutar DELETE o restaurar toda la base**.
- La salida de terminal proporcionada no demuestra que la marca local se haya limpiado; si aún queda un navegador de prueba que abrió o cerró la dedicatoria, aplicar la sección 1 de esta guía y cerrar sus pestañas antes de otra visita.
- El acceso anónimo de PRD aún está interceptado por Cloudflare Access: `0/11 verificadas; 11 respuestas 302 a cloudflareaccess.com`; falta revisar únicamente la política Access de PRD y ejecutar nuevamente la prueba de privacidad. La guía `GUIA_PREPARACION_PRD_V38.md` documenta cómo conservar TEST protegido.
