/* Public pre-auth shell: deliberately carries NO private gift media, future-day
 * titles, page scripts or personal information. Its design matches the loader. */
export function lockedShell(){return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#020d27"><title>MISTERA · Una sorpresa para ti</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:radial-gradient(ellipse 78% 53% at 50% 38%,rgba(27,62,105,.43),transparent 84%),linear-gradient(#020d27,#031436 54%,#010b23);color:#f9ecd4;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:36px 24px;text-align:center;overflow:hidden}main{width:min(400px,100%);position:relative;z-index:2}body:before{content:"";position:fixed;inset:13px;border:1px solid #c49d5740;pointer-events:none} .ornament{position:absolute;width:58px;height:58px;border:1px solid #cba86c80;pointer-events:none}.tl{top:25px;left:25px;border-right:0;border-bottom:0}.tr{top:25px;right:25px;border-left:0;border-bottom:0}.bl{bottom:25px;left:25px;border-right:0;border-top:0}.br{bottom:25px;right:25px;border-left:0;border-top:0}.star{width:92px;height:92px;margin:0 auto 20px;filter:drop-shadow(0 0 18px #eab76e70);animation:glow 5s ease-in-out infinite}.divider{color:#f1ce98;margin:12px auto 17px;display:flex;gap:13px;align-items:center;max-width:154px}.divider:before,.divider:after{content:"";height:1px;background:linear-gradient(90deg,transparent,#d0ac73);flex:1}.divider:after{transform:scaleX(-1)}h1{font:400 clamp(31px,10vw,41px) Georgia,serif;letter-spacing:.23em;padding-left:.23em;margin:0;color:#fff0d1}.subtitle{font:500 9px system-ui;letter-spacing:.28em;color:#dcc5a6;text-transform:uppercase;margin:12px 0 55px}h2{font:400 21px/1.45 Georgia,serif;color:#f7dfb6;margin:0 0 15px}p{color:#dcc6a8;font:14px/1.55 Georgia,serif}input{width:192px;height:58px;border:1px solid #e4c18c;border-radius:13px;background:#071b3b;color:#ffe5b3;font:700 25px system-ui;letter-spacing:.32em;text-align:center;padding-left:.32em;outline-offset:4px}input:focus{outline:2px solid #e8bc77}button{width:min(280px,100%);min-height:50px;border-radius:50px;border:1px solid #f7e4bc;background:linear-gradient(120deg,#f5ddb0,#d8ae73 53%,#f6e2ba);color:#122445;font-weight:700;cursor:pointer;margin-top:19px}button:disabled{opacity:.6;cursor:wait}.hint{font:12px/1.5 system-ui;color:#d6b995;min-height:18px;margin:10px 0 0}#panel[hidden],#load[hidden]{display:none!important}.progress{height:8px;border:1px solid #e5bd7e8a;border-radius:99px;overflow:hidden;margin:22px auto;width:min(330px,100%)}.fill{height:100%;width:0;background:linear-gradient(90deg,#d5a153,#ffe3a0);animation:fill 1.3s ease forwards}@keyframes fill{to{width:100%}}@keyframes glow{50%{filter:drop-shadow(0 0 28px #f7d28fa6);transform:scale(1.025)}}@media(max-height:600px){.star{width:66px;height:66px;margin-bottom:10px}.divider{margin:8px auto 10px}.subtitle{margin:7px 0 26px}.ornament{width:36px;height:36px}button{margin-top:11px}}@media(max-height:410px){.star,.divider{display:none}.subtitle{margin:7px 0 14px}button{margin-top:8px;min-height:44px}.hint{margin:5px 0 0}}@media(prefers-reduced-motion:reduce){*{animation:none!important}.fill{width:100%}}
</style></head><body><i class="ornament tl"></i><i class="ornament tr"></i><i class="ornament bl"></i><i class="ornament br"></i><main>
<svg class="star" viewBox="0 0 100 100" aria-hidden="true"><path fill="#e8bd78" stroke="#ffe9bc" d="M50 10 55 40 70 30 60 45 90 50 60 55 70 70 55 60 50 90 45 60 30 70 40 55 10 50 40 45 30 30 45 40Z"/></svg><div class="divider">✦</div><h1>MISTERA</h1><p class="subtitle">Calendario de Adviento</p>
<div id="load"><p>Preparando algo especial para ti…</p><div class="progress"><div class="fill"></div></div></div>
<form id="panel" hidden aria-label="Acceso privado MISTERA"><label for="code" style="position:absolute;clip:rect(0 0 0 0);overflow:hidden">Código de seis dígitos</label><input id="code" name="code" type="password" pattern="[0-9]{6}" inputmode="numeric" enterkeyhint="done" autofocus autocomplete="off" minlength="6" maxlength="6" required aria-describedby="hint"><button id="submit" type="submit">Descubrir ✨</button><p class="hint" id="hint" role="status" aria-live="polite"></p></form></main>
<script>
const load=document.getElementById('load');
const panel=document.getElementById('panel');
const codeInput=document.getElementById('code');
const submitButton=document.getElementById('submit');
function focusPin(fromGesture=false){
  if(panel.hidden||submitButton.disabled)return;
  // A second focus during a real tap can reveal keyboards that ignore timer-based focus.
  if(fromGesture&&document.activeElement===codeInput)codeInput.blur();
  try{codeInput.focus({preventScroll:true});}catch(_){codeInput.focus();}
  // Supported browsers may open the numeric keyboard; others require a real tap.
  if(document.activeElement===codeInput){
    try{navigator.virtualKeyboard?.show?.();}catch(_){}
  }
}
function showPin(){
  load.hidden=true;
  panel.hidden=false;
  focusPin();
  requestAnimationFrame(()=>{if(document.activeElement!==codeInput)focusPin();});
}
setTimeout(showPin,1350);
// Any tap on an empty part of the entrance activates the PIN field, without an extra button.
document.addEventListener('click',event=>{
  if(panel.hidden||!event.isTrusted)return;
  const target=event.target;
  if(target instanceof Element&&target.closest('input,button'))return;
  focusPin(true);
});
codeInput.addEventListener('click',()=>{
  try{navigator.virtualKeyboard?.show?.();}catch(_){}
});
panel.addEventListener('submit',async e=>{e.preventDefault();const b=document.getElementById('submit'),h=document.getElementById('hint'),c=document.getElementById('code');if(!/^\\d{6}$/.test(c.value)){h.textContent='Introduce los seis d\u00edgitos';focusPin();return;}b.disabled=true;h.textContent='Verificando c\u00f3digo…';try{const r=await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({code:c.value})});const d=await r.json();if(r.ok&&d.authenticated){c.value='';location.replace('/');return;}h.textContent=r.status===401?'C\u00f3digo incorrecto.':(d.error||'No se pudo verificar el c\u00f3digo');c.value='';queueMicrotask(()=>focusPin());}catch(_){h.textContent='No hay conexión. Inténtalo otra vez.';queueMicrotask(()=>focusPin());}finally{b.disabled=false;}});</script>
</body></html>`,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});}
