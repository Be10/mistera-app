'use strict';
/* MISTERA V20 — local-only authoring bridge between the V5 editor and the villa.
 * No personal media, private letters, credentials or editor state are included
 * in the distributable scene. Drafts are read ONLY from this browser's storage.
 * A published recipient experience requires protected server-side delivery.
 */
(() => {
  const STORE='mistera-personal-editor-v1';
  const MEDIA_DB='mistera-personal-assets-v1';
  let requestNumber=0;
  const objectUrls=[];
  const element=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  const read=()=>{
    try{
      const value=JSON.parse(localStorage.getItem(STORE)||'null');
      if(value&&Array.isArray(value.days)&&value.days.length===24)return value;
    }catch(_){ }
    return null;
  };
  const get=(number)=>{
    const data=read();
    return data?(number===25?data.finale:data.days[number-1]):null;
  };
  function cleanup(){for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls.length=0;}
  const status=()=>{
    const target=document.getElementById('draft-status');
    if(!target)return;
    const v23=window.MisteraSurprises;
    if(v23?.list()?.length===25){
      const plans=v23.list();const count=plans.filter(x=>x.blocks.length>0).length;
      target.textContent=`Plan V23: ${count} de 25 sorpresas organizadas en borradores editables. Abre el Planificador V23 para completar medios y cartas pendientes.`;
      return;
    }
    const data=read();
    if(!data){target.textContent='Aún no hay borradores guardados. Abre el taller para comenzar a editar las 24 casas y el último regalo.';return;}
    const count=[...data.days,data.finale].filter(d=>d?.title?.trim()||d?.letter?.trim()||d?.voucher?.enabled).length;
    target.textContent=`${count} de 25 sorpresas con texto o vale en el taller. Son borradores locales y no están publicados.`;
  };
  function localMedia(day){
    return new Promise(resolve=>{
      try{
        const req=indexedDB.open(MEDIA_DB,1);
        req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media',{keyPath:'id'});};
        req.onerror=()=>resolve([]);
        req.onsuccess=()=>{
          const db=req.result;
          try{
            const transaction=db.transaction('media','readonly');
            const getAll=transaction.objectStore('media').getAll();
            getAll.onsuccess=()=>{
              const result=(getAll.result||[]).filter(m=>m.day===day).sort((a,b)=>(a.order||0)-(b.order||0));
              db.close();resolve(result);
            };
            getAll.onerror=()=>{db.close();resolve([]);};
          }catch(_){db.close();resolve([]);}
        };
      }catch(_){resolve([]);}
    });
  }
  function renderMedia(target,items){
    if(!items.length)return;
    const wrapper=element('div','draft-media');
    const photos=items.filter(x=>x.type==='photo').slice(0,15);
    const other=items.filter(x=>x.type==='audio'||x.type==='video').slice(0,2);
    for(const asset of [...photos,...other]){
      if(!(asset.blob instanceof Blob))continue;
      const url=URL.createObjectURL(asset.blob);objectUrls.push(url);
      const node=asset.type==='photo'?element('img'):element(asset.type);
      node.src=url;
      if(asset.type==='photo')node.alt='Recuerdo fotográfico preparado en el editor';
      else {node.controls=true;node.preload='metadata';if(asset.type==='video')node.playsInline=true;}
      wrapper.append(node);
    }
    if(wrapper.childNodes.length)target.append(wrapper);
  }
  async function show(day){
    const version=++requestNumber;
    cleanup();
    const wrapper=document.getElementById('surprise-draft-content');
    if(!wrapper)return;
    wrapper.replaceChildren();wrapper.hidden=true;
    const data=get(day);
    if(!data)return;
    document.getElementById('dialog-title').textContent=data.title|| (day===25?'Última sorpresa':`Casa ${day}`);
    document.getElementById('dialog-copy').textContent=data.lead||'Una sorpresa preparada con cariño.';
    if(data.letter?.trim()){
      wrapper.append(element('h3','', 'Una carta para ti'));
      wrapper.append(element('p','',data.letter));
    }
    if(data.voucher?.enabled){
      const voucher=element('section','draft-voucher');
      voucher.append(element('h3','',data.voucher.title||'Un vale especial'));
      if(data.voucher.details)voucher.append(element('p','',data.voucher.details));
      if(data.voucher.type==='choice'&&Array.isArray(data.voucher.options))voucher.append(element('p','',data.voucher.options.join(' · ')));
      wrapper.append(voucher);
    }
    if(data.game?.type&&data.game.type!=='none')wrapper.append(element('p','draft-note','Minijuego configurado en el editor. La vista previa interactiva completa se encuentra en el taller.'));
    wrapper.append(element('p','draft-note','Borrador local del editor. Los contenidos definitivos se publicarán mediante el acceso privado.'));
    wrapper.hidden=false;
    const items=await localMedia(day);
    if(version!==requestNumber)return;
    renderMedia(wrapper,items);
  }
  function hide(){requestNumber++;cleanup();const wrapper=document.getElementById('surprise-draft-content');if(wrapper){wrapper.replaceChildren();wrapper.hidden=true;}}
  window.MisteraDrafts={get,read,show,hide,status};
  document.addEventListener('DOMContentLoaded',()=>{
    status();
    const refresh=document.getElementById('draft-refresh');
    if(refresh)refresh.addEventListener('click',()=>{status();window.dispatchEvent(new Event('mistera:editor-drafts-refreshed'));});
    document.getElementById('surprise-dialog')?.addEventListener('close',hide);
  });
  window.addEventListener('storage',event=>{if(event.key===STORE||event.key==='mistera-surprises-v23-config')status();});
})();
