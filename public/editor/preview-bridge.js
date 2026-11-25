/* Local-only preview API: displays current editor text and media without exporting or publishing. */
(() => {
  'use strict';
  window.MISTERA_PREVIEW=true;
  const draftKey='mistera-personal-editor-v1';
  const blobURLs=new Map();
  let database=null;
  const draft=()=>{try{return JSON.parse(localStorage.getItem(draftKey)||'null')||{};}catch{return {};}};
  async function openMedia(){
    if(database)return database;
    database=await new Promise((resolve)=>{
      try{const req=indexedDB.open('mistera-personal-assets-v1',1);
        req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media',{keyPath:'id'});};
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
      }catch{resolve(null);}
    });
    return database;
  }
  async function forDay(n){
    const db=await openMedia();if(!db)return [];
    return new Promise(resolve=>{
      try{const tx=db.transaction('media','readonly'),req=tx.objectStore('media').getAll();
        req.onsuccess=()=>resolve((req.result||[]).filter(item=>item.day===n).sort((a,b)=>(a.order||0)-(b.order||0)));
        req.onerror=()=>resolve([]);
      }catch{resolve([]);}
    });
  }
  function objectURL(item){
    if(!blobURLs.has(item.id))blobURLs.set(item.id,URL.createObjectURL(item.blob));
    return blobURLs.get(item.id);
  }
  async function surprise(n){
    const data=draft(),raw=n===25?data.finale:data.days?.[n-1];
    const day=raw||{};
    const items=await forDay(n);
    const images=items.filter(x=>x.type==='photo').map(item=>({src:objectURL(item)}));
    const audio=items.find(x=>x.type==='audio'),video=items.find(x=>x.type==='video');
    const game=day.game||{type:'none'};
    const voucher=day.voucher?.enabled?{...day.voucher}:null;
    return {title:day.title||`Sorpresa ${n}`,lead:day.lead||'',letter:day.letter||'',photos:images,audio:audio?objectURL(audio):'',video:video?objectURL(video):'',youtube:day.youtube||'',game,voucher,blockOrder:day.blockOrder,gameGate:!!day.gameGate};
  }
  const response=(payload,status=200)=>Promise.resolve(new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json'}}));
  const realFetch=window.fetch.bind(window);
  window.fetch=(url,options)=>{
    const path=new URL(url,location.origin).pathname;
    if(path==='/api/calendar'){
      const current=draft();return response({recipient:current.recipient||'mi amor',senderWhatsapp:current.senderWhatsapp||'',subtitle:current.subtitle||'Un diciembre lleno de nosotros.',startDate:'2026-12-01',startDateLabel:'1 de diciembre de 2026',days:Array.from({length:24},(_,i)=>({day:i+1,available:true})),...(JSON.parse(localStorage.getItem('mistera-opened-v1')||'{}')[24]?{hasFinale:true,finaleAvailable:true}:{}),today:'2026-12-25',timezone:'America/Lima'});
    }
    if(/^\/api\/day\/(?:[1-9]|1[0-9]|2[0-4])$/.test(path))return surprise(Number(path.slice(9))).then(data=>response(Number(path.slice(9))===24?{...data,finaleReveal:true}:data));
    if(path==='/api/finale')return surprise(25).then(data=>response(data));
    return realFetch(url,options);
  };
  window.addEventListener('beforeunload',()=>{for(const url of blobURLs.values())URL.revokeObjectURL(url);});
})();
