/* MISTERA V23 · Fuente editable de las 25 experiencias. Borradores LOCALES,
   no constituyen un sistema de publicación ni control de acceso remoto. */
(() => {
  'use strict';
  const CONFIG_KEY='mistera-surprises-v23-config';
  const PROGRESS_KEY='mistera-surprises-v23-progress'+(new URLSearchParams(location.search).get('mistera-pruebas')==='1'?'-test':'');
  const DB_NAME='mistera-surprises-v23-media';
  const seed=window.MISTERA_SURPRISES_SEED;
  if(!seed||!Array.isArray(seed.days)||seed.days.length!==25)throw new Error('Falta el calendario editorial V23.');
  const clone=x=>JSON.parse(JSON.stringify(x));
  const getJSON=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const putJSON=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(error){console.warn('[MISTERA] No se pudo guardar:',error);return false;}};
  const valid=(value)=>value&&Array.isArray(value.days)&&value.days.length===25&&value.days.every((d,i)=>d&&d.day===i+1&&Array.isArray(d.blocks));
  let content=valid(getJSON(CONFIG_KEY))?getJSON(CONFIG_KEY):clone(seed);
  // Once-only migration for existing V23-V32 browser drafts: only days 01/02
  // are replaced by the approved experiences; all other 23 days stay untouched.
  const MIGRATION_KEY='mistera-special-days-v33-migrated';
  if(!getJSON(MIGRATION_KEY)){
    for(const i of [0,1])content.days[i]=clone(seed.days[i]);
    putJSON(CONFIG_KEY,content);putJSON(MIGRATION_KEY,{at:Date.now(),version:33});
  }
  let progress=getJSON(PROGRESS_KEY)||{};
  if(!progress||typeof progress!=='object'||Array.isArray(progress))progress={};
  const api={
    get(day){return content.days[day-1]||null;},
    list(){return content.days;},
    getAll(){return clone(content);},
    getSeed(day){return clone(seed.days[day-1]);},
    saveDay(day,value){
      if(!Number.isInteger(day)||day<1||day>25||!value||!Array.isArray(value.blocks))throw Error('Datos de sorpresa no válidos.');
      const record=value;record.day=day;
      const ids=new Set();for(const b of record.blocks){if(!b.id||ids.has(b.id))throw Error('Cada bloque necesita un identificador único.');ids.add(b.id);}
      content.days[day-1]=record;
      if(!putJSON(CONFIG_KEY,content))throw Error('No se pudo guardar. Comprueba el almacenamiento del navegador.');
      window.dispatchEvent(new CustomEvent('mistera:surprises-saved',{detail:{day}}));
    },
    saveAll(value){if(!valid(value))throw Error('El archivo debe contener exactamente 25 sorpresas, ordenadas del 1 al 25.');
      content=clone(value);if(!putJSON(CONFIG_KEY,content))throw Error('No se pudo importar el plan.');
      window.dispatchEvent(new CustomEvent('mistera:surprises-saved',{detail:{day:0}}));
    },
    resetDay(day){api.saveDay(day,seed.days[day-1]);},
    getProgress(day){return progress[String(day)]||{};},
    getAllProgress(){return clone(progress);},
    importProgress(next){
      if(!next||typeof next!=='object'||Array.isArray(next))return;
      for(const [day,states] of Object.entries(next)){
        if(!/^([1-9]|1[0-9]|2[0-5])$/.test(day)||!states||typeof states!=='object')continue;
        progress[day]||={};
        for(const [id,value] of Object.entries(states)){
          if(id==='d02-hints'){progress[day][id]=Math.min(3,Math.max(0,Number(progress[day][id])||0,Number(value)||0));}
          else if(value && !progress[day][id])progress[day][id]=value;
        }
      }
      putJSON(PROGRESS_KEY,progress);
      window.dispatchEvent(new Event('mistera:progress-merged'));
    },
    replaceProgressFromLink(next){
      // Only for an explicit account/device pairing. Remote history is the
      // source of truth; do not mix a different local account into D1.
      if(!next||typeof next!=='object'||Array.isArray(next))return false;
      progress={};
      api.importProgress(next);
      return true;
    },
    applyPublished(next){
      if(!valid(next))return false;
      // Public content is refreshed quietly on every entry and never clears progress.
      // Local editorial overrides are kept only in the editor, not on the public villa.
      content=clone(next);
      return true;
    },
    isCompleted(day,blockId){return !!api.getProgress(day)[blockId];},
    complete(day,blockId,details=true){
      const k=String(day);if(!progress[k])progress[k]={};progress[k][blockId]=details;
      putJSON(PROGRESS_KEY,progress);
      window.dispatchEvent(new CustomEvent('mistera:surprise-progress',{detail:{day,blockId,details}}));
    },
    isOpened(day){try{const suffix=new URLSearchParams(location.search).get('mistera-pruebas')==='1'?'-test':'';return day===25?localStorage.getItem('mistera-escena-v5-final'+suffix)==='yes':JSON.parse(localStorage.getItem('mistera-escena-v5-opened'+suffix)||'[]').includes(day);}catch{return false;}},
    isRewardAvailable(day,block){return api.isOpened(day)&&(!block.requires||api.isCompleted(day,block.requires));},
    resetProgress(){progress={};try{localStorage.removeItem(PROGRESS_KEY);}catch(_){}window.dispatchEvent(new Event('mistera:surprises-progress-reset'));},
    isRedeemed(day,id){return !!api.getProgress(day)[`redeemed:${id}`];},
    redeem(day,id){api.complete(day,`redeemed:${id}`,{at:new Date().toISOString()});},
    isDraftOnly(){return true;},
    configKey:CONFIG_KEY,
    progressKey:PROGRESS_KEY
  };
  let dbPromise;
  function database(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      try{const req=indexedDB.open(DB_NAME,1);
        req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
      }catch{resolve(null);}
    });return dbPromise;
  }
  api.putMedia=async(file)=>{
    if(!(file instanceof Blob))throw Error('El archivo es inválido.');
    if(file.size>160*1024*1024)throw Error('El archivo supera 160 MiB. Optimiza el video antes de añadirlo.');
    const db=await database();if(!db)throw Error('El navegador no admite el almacenamiento de multimedia.');
    const id='asset:'+((crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`));
    return new Promise((resolve,reject)=>{
      try{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({id,blob:file,mime:file.type,name:file.name||'archivo',at:Date.now()});
      tx.oncomplete=()=>resolve(id);tx.onerror=()=>reject(new Error('No se pudo guardar multimedia; revisa el espacio disponible.'));
      }catch(error){reject(error);}
    });
  };
  api.mediaBlob=async(id)=>{
    if(typeof id!=='string'||!id.startsWith('asset:'))return null;
    const db=await database();if(!db)return null;
    return new Promise(resolve=>{try{const tx=db.transaction('files','readonly'),req=tx.objectStore('files').get(id);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null);
    }catch{resolve(null);}});
  };
  api.deleteMedia=async(id)=>{const db=await database();if(!db)return;
    await new Promise(resolve=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=resolve;tx.onerror=resolve;});
  };
  api.mediaURL=async(reference)=>{
    if(!reference||typeof reference!=='string')return '';
    if(reference.startsWith('asset:')){const item=await api.mediaBlob(reference);return item?.blob?URL.createObjectURL(item.blob):'';}
    // No javascript:, data:, file: or untrusted URI schemes.
    if(/^https:\/\//i.test(reference)||/^(?:assets|content)\/[\w.\-/]+$/.test(reference))return reference;
    return '';
  };
  window.MisteraSurprises=api;
})();
