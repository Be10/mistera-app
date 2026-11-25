/* MISTERA V34: quiet daily content updates and optional paired-device persistence.
 * No registration provider, paid API, tracker, or exposed server credential.
 * The same high-entropy pairing code intentionally links two trusted devices. */
(()=>{'use strict';
  const S=window.MisteraSurprises;
  const KEY='mistera-pair-code-v34', OPEN='mistera-escena-v5-opened', FINAL='mistera-escena-v5-final';
  let token='',available=false,inFlight=null,queued=false,lastError='',listeners=[],initialized=false;
  const notify=()=>listeners.forEach(fn=>{try{fn();}catch(_){}});
  const load=k=>{try{return localStorage.getItem(k);}catch(_){return null;}};
  const save=(k,v)=>{try{localStorage.setItem(k,v);}catch(_){}};
  const valid=t=>typeof t==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(t);
  function freshToken(){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  token=load(KEY);if(!valid(token)){token=freshToken();save(KEY,token);}
  const snapshot=()=>{
    let opened=[];try{opened=JSON.parse(load(OPEN)||'[]');}catch(_){}
    return {opened:Array.isArray(opened)?opened.filter(x=>Number.isInteger(x)&&x>0&&x<25):[],final:load(FINAL)==='yes',stages:S?.getAllProgress?.()||{}};
  };
  function apply(remote,{replace=false}={}){
    if(!remote||typeof remote!=='object')return;
    const local=replace?{opened:[],final:false}:snapshot();
    const incoming=Array.isArray(remote.opened)?remote.opened.filter(d=>Number.isInteger(d)&&d>=1&&d<=24):[];
    const daySet=new Set([...local.opened,...incoming]);
    save(OPEN,JSON.stringify([...daySet].sort((a,b)=>a-b)));
    save(FINAL,local.final||remote.final===true?'yes':'no');
    if(replace)S?.replaceProgressFromLink?.(remote.stages||{});
    else S?.importProgress?.(remote.stages||{});
    window.MisteraRefreshFromCloud?.();
  }
  async function refreshPublished(){
    // no-store means the latest deployed day appears at next entrance without
    // altering gifts already opened or interrupting the current surprise dialog.
    try{
      const res=await fetch('content/sorpresas-2026.json',{cache:'no-store'});
      if(!res.ok)return;
      const content=await res.json();
      if(S?.applyPublished?.(content))window.dispatchEvent(new Event('mistera:published-content-refreshed'));
    }catch(_){/* offline users keep the embedded seed */}
  }
  async function sync(){
    if(!available)return false;
    if(inFlight){queued=true;return inFlight;}
    inFlight=(async()=>{
      const body=JSON.stringify({pairingCode:token,snapshot:snapshot()});
      const r=await fetch('/api/progress',{method:'POST',headers:{'content-type':'application/json'},body,cache:'no-store'});
      if(!r.ok)throw Error(`Sincronización HTTP ${r.status}`);
      const reply=await r.json();
      if(reply.snapshot)apply(reply.snapshot);
      lastError='';notify();return true;
    })().catch(e=>{lastError=e.message||String(e);notify();return false;}).finally(()=>{
      inFlight=null;if(queued){queued=false;setTimeout(()=>sync(),250);}
    });
    return inFlight;
  }
  let timer=0;
  function schedule(){if(!available||document.hidden||!initialized||new URLSearchParams(location.search).get('mistera-pruebas')==='1')return;
    clearTimeout(timer);timer=setTimeout(sync,450);}
  async function initial(){
    if(new URLSearchParams(location.search).get('mistera-pruebas')==='1'){
      initialized=true;lastError='Modo pruebas aislado';notify();return;
    }
    await refreshPublished();
    if(document.querySelector('meta[name="mistera-cloud"]')?.content!=='on'){
      initialized=true;notify();return;
    }
    try{
      const res=await fetch('/api/status',{headers:{accept:'application/json'},cache:'no-store'});
      if(!res.ok)throw Error('No hay servidor de progreso');
      const status=await res.json();
      available=status.sync===true;
      if(available)await sync();
    }catch(e){available=false;lastError='Sincronización remota pendiente de configurar';}
    initialized=true;notify();
  }
  const ready=initial();
  window.addEventListener('mistera:surprise-progress',schedule);
  window.addEventListener('mistera:opened-change',schedule);
  window.addEventListener('pageshow',()=>{if(initialized){refreshPublished();sync();}});
  window.addEventListener('focus',()=>{if(initialized)sync();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&initialized){refreshPublished();sync();}});
  window.MisteraCloud={
    get ready(){return ready;},get pairingCode(){return token;},get available(){return available;},get lastError(){return lastError;},
    statusMessage(){return available?(lastError?'Sin conexión temporal; los avances quedan guardados en este teléfono.':'Recuerdos sincronizados entre nuestros dispositivos.'):'Avances guardados aquí. Activa Cloudflare D1 para sincronizar dispositivos.';},
    onStatus(fn){listeners.push(fn);},
    sync,
    async connect(code){
      // A new device must READ the linked history first, not upload its own
      // unrelated local history to the recipient's permanent D1 account.
      if(!available||!valid(code))return false;
      if(code===token)return sync();
      if(inFlight)await inFlight;
      const old=token,before=snapshot();
      try{
        const r=await fetch('/api/progress',{
          method:'POST',headers:{'content-type':'application/json'},
          body:JSON.stringify({pairingCode:code,snapshot:{opened:[],final:false,stages:{}}}),
          cache:'no-store'
        });
        if(!r.ok)throw Error(`No se pudo consultar la vinculacion (HTTP ${r.status})`);
        const reply=await r.json(),remote=reply.snapshot;
        if(!remote||!Array.isArray(remote.opened)||!remote.stages||typeof remote.stages!=='object')throw Error('Respuesta de vinculación inválida');
        const hadProgress=before.opened.length>0||before.final||Object.values(before.stages).some(v=>v&&Object.keys(v).length);
        const remoteHasProgress=remote.opened.length>0||remote.final||Object.values(remote.stages).some(v=>v&&Object.keys(v).length);
        if(hadProgress&&!remoteHasProgress)throw Error('Código sin progreso remoto. Se conservó el historial de este dispositivo.');
        if(hadProgress){
          // Preserve prior local history if this phone belonged to another code.
          localStorage.setItem('mistera-backup-before-link-v34-'+Date.now(),JSON.stringify({snapshot:before}));
        }
        token=code;
        apply(remote,{replace:true});
        save(KEY,code);
        lastError='';notify();return true;
      }catch(error){
        token=old;
        lastError=error?.message||'No se pudo vincular este dispositivo';
        notify();return false;
      }
    }
  };
})();
