# MISTERA V39 - Pantalla privada de acceso

## Alcance

Mejora puntual de la portada PIN renderizada en `worker/splash.js`. No cambia la villa, los regalos, el mensaje de bienvenida, los secretos, las tablas D1 ni la lógica de autorización.

## Cambios en interfaz

- Retirados el encabezado romántico y la pista verbal situados inmediatamente encima del campo de seis dígitos.
- Se mantiene solamente la identidad visual MISTERA, una casilla de tipo `password` y el botón `Descubrir`.
- Se agregó `autofocus` y se conserva `inputmode="numeric"` para solicitar teclado numérico.
- La casilla recibe `focus()` al mostrarse tras la transición de carga. Se intenta `navigator.virtualKeyboard.show()` en los navegadores compatibles.
- Si el sistema bloquea la apertura automática del teclado, tocar la casilla o cualquier punto vacío de la portada vuelve a enfocar el campo desde una interacción real.
- Se adaptó el espaciado a alturas de pantalla reducidas cuando aparece el teclado.
- Los mensajes de validación bajo la casilla son neutros y no adelantan pistas.

**Límite del navegador:** iOS y algunos Android no permiten desplegar el teclado virtual sin un gesto real del usuario. El foco automático está implementado; el toque en el campo o en el fondo es el respaldo para abrir el teclado donde el sistema lo exija. No se garantiza forzar el teclado contra el navegador.

## QA

- `node scripts/qa_v37_auth.mjs`: conserva la cobertura de cookies, API, límites de intentos y recursos privados.
- `node scripts/qa_v39_pin.mjs`: valida estructura mínima, campo numérico protegido, foco, activacíon por toque y ausencia de pistas.
- `node scripts/qa_v37_welcome.mjs` y `node scripts/qa_v38_welcome.mjs`: no se modifica la dedicatoria ni su persistencia.
- `scripts/qa_prd_private_gate_v38.mjs`: verifica el campo de PIN en vez del encabezado eliminado. Ejecutar contra PRD solo **después** de publicar V39.
- Pruebas locales de navegador: 393x851, 320x568 y 1440x900, con foco inicial y recuperación del foco por toque. Un navegador emulado no prueba la aparición real del teclado físico del dispositivo.

## Restablecer la pantalla de PIN en el navegador usado para pruebas

En Chrome: `F12` -> `Application` -> `Storage` -> `Cookies` -> dominio `mistera-prd.mistera-app.workers.dev`. Eliminar **solo** la cookie `mistera_private_session` y recargar. El siguiente `GET /api/auth` sin esa cookie devuelve `authenticated:false`.

Un inicio de sesión correcto **no** escribe `gift_progress`. Si se pulsó `Cerrar` en la dedicatoria o se abrió una casa, esos estados son independientes y persisten también en D1; no borrar la tabla para recuperar la pantalla de acceso.

Para consultar, sin modificar D1, si se registró la lectura de la bienvenida:

```bash
npx --yes wrangler@4.168.0 d1 execute mistera-prd --remote --command "SELECT day,field,value_json FROM gift_progress WHERE day=25 AND field='mistera-intro-seen';"
```

## Despliegue

Fuente: `Mistera_App/MISTERA_Codigo` sincronizada por OneDrive, rama `test`. Este cambio es al Worker: compilar TEST o PRD no basta para verlo en la portada de PRD, hasta publicar una nueva versión de `mistera-prd` desde Git Bash. Mantener la separación de D1, TEST y PRD; no exponer borradores, no deshabilitar Cloudflare Access global, no utilizar claves en Git.

**Estado:** archivos preparados y validados localmente; sin despliegue automático desde ChatGPT.
