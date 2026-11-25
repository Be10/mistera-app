(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const KEY='mistera-personal-editor-v1';
  const TEMPLATES=window.MISTERA_TEMPLATES;
  const encoder=new TextEncoder();
  const DEFAULT_FINALE=window.MISTERA_FINALE_DEFAULT || {title:'Nuestro Gran Final',lead:'Una ultima sorpresa, solo para ti.',letter:'Esto no es el final: es otra forma de decirte que quiero seguir creando recuerdos contigo.',youtube:'',game:{type:'none'},voucher:{enabled:false}};
  const state={recipient:'',subtitle:'',senderWhatsapp:'',password:'',signKey:'',days:structuredClone(window.MISTERA_DEFAULTS),finale:structuredClone(DEFAULT_FINALE)};
  const media=new Map();const objectURLs=new Map();
  let db=null,selectedDay=1,previewActive=false;
  const BLOCKS=['letter','photos','audio','video','voucher','game'];
  const BLOCK_NAMES={letter:'Carta',photos:'Fotografías',audio:'Audio',video:'Video',voucher:'Vale',game:'Minijuego'};
  const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
  const asText=value=>String(value??'');
  const esc=value=>asText(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const randomHex=size=>Array.from(crypto.getRandomValues(new Uint8Array(size)),v=>v.toString(16).padStart(2,'0')).join('');
  const newPassword=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';return Array.from(crypto.getRandomValues(new Uint8Array(20)),n=>alphabet[n%alphabet.length]).join('');};
  const showMsg=msg=>{const target=$('editorToast');target.textContent=msg;clearTimeout(showMsg.timer);showMsg.timer=setTimeout(()=>target.textContent='',5500);};
  const dayData=n=>n===25?state.finale:state.days[n-1];
  const dateFor=n=>`2026-12-${String(Math.min(n,25)).padStart(2,'0')}`;
  const dateLabel=n=>n===25?'25 de diciembre de 2026, a las 00:00 (Per\u00fa), despu\u00e9s de abrir la puerta 24':`${n} de diciembre de 2026, a las 00:00 (Per\u00fa)`;
  const readableDate=iso=>{if(!iso)return '';const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d,12)));};
  function normalizeVoucher(old={}){
    const v=typeof old==='object'&&old?old:{};
    return {enabled:typeof v.enabled==='boolean'?v.enabled:!!v.title,title:asText(v.title||''),details:asText(v.details||''),type:v.type==='choice'?'choice':'fixed',options:Array.isArray(v.options)?v.options:[],suggestedDate:v.suggestedDate||'',suggestedTime:v.suggestedTime||'',expiresAt:v.expiresAt||'',location:v.location||''};
  }
  function normalizeGame(d){const x=d.game&&typeof d.game==='object'?d.game:null;return {type:['none','scratch','riddle','puzzle'].includes(x?.type)?x.type:(d.scratch?'scratch':'none'),message:x?.message||d.scratch||'',question:x?.question||'',answer:x?.answer||'',hint:x?.hint||''};}
  function upgradeDay(d){const copy={...d};copy.game=normalizeGame(d);copy.voucher=normalizeVoucher(d.voucher);const order=Array.isArray(d.blockOrder)?d.blockOrder.filter(k=>BLOCKS.includes(k)):[];copy.blockOrder=[...new Set(order),...BLOCKS.filter(k=>!order.includes(k))];copy.gameGate=!!d.gameGate&&copy.game.type!=='none';if(copy.gameGate){copy.blockOrder=['game',...copy.blockOrder.filter(k=>k!=='game')];}return copy;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{showMsg('No se pudieron guardar los textos en este navegador.');}}
  function readSaved(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&Array.isArray(x.days)&&x.days.length===24){state.recipient=x.recipient||'';state.subtitle=x.subtitle||'';state.senderWhatsapp=x.senderWhatsapp||'';state.password=x.password||'';state.signKey=x.signKey||'';state.days=x.days.map(upgradeDay);state.finale=upgradeDay(x.finale||DEFAULT_FINALE);return;}}catch{}state.days=state.days.map(upgradeDay);state.finale=upgradeDay(state.finale);}
  function transaction(mode,callback){return new Promise((resolve,reject)=>{const tx=db.transaction('media',mode);const req=callback(tx.objectStore('media'));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function initStorage(){try{db=await new Promise((resolve,reject)=>{const request=indexedDB.open('mistera-personal-assets-v1',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('media'))request.result.createObjectStore('media',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});const stored=await transaction('readonly',store=>store.getAll());stored.forEach(record=>media.set(record.id,record));$('mediaStatus').textContent='Fotos, audios y videos guardados en este navegador. Los textos se guardan autom\u00e1ticamente.';}
    catch{db=null;$('mediaStatus').textContent='AVISO: los archivos multimedia solo duran mientras esta p\u00e1gina permanezca abierta. Genera el ZIP antes de cerrarla.';}}
  async function storeAsset(item){media.set(item.id,item);if(!db)return;try{await transaction('readwrite',store=>store.put(item));}catch{showMsg('Sin espacio para guardar este archivo. Exporta el ZIP antes de cerrar.');}}
  async function removeAsset(id){if(objectURLs.has(id)){URL.revokeObjectURL(objectURLs.get(id));objectURLs.delete(id);}media.delete(id);if(db)try{await transaction('readwrite',store=>store.delete(id));}catch{}renderAssets();renderGrid();renderLivePreview();}
  const assetsFor=(day,type)=>Array.from(media.values()).filter(v=>v.day===day&&(!type||v.type===type)).sort((a,b)=>a.order-b.order);
  const assetUrl=record=>{if(!record)return '';if(!objectURLs.has(record.id))objectURLs.set(record.id,URL.createObjectURL(record.blob));return objectURLs.get(record.id);};
  function renderGrid(){let count=0;let html='';for(let n=1;n<=25;n++){
    const d=dayData(n);const attachments=assetsFor(n).length;count+=attachments;
    const mediaMark=attachments?' has-media':'';const finale=n===25;const selected=selectedDay===n;
    html+=`<button type="button" data-day="${n}" class="day-chip${selected?' active':''}${mediaMark}${finale?' finale-chip':''}" aria-label="${finale?'Gran Final':`D\u00eda ${n}`}" aria-pressed="${selected}">${finale?'&#10022; Gran Final':String(n).padStart(2,'0')}</button>`;
  }
  $('dayGrid').innerHTML=html;
  $('dayGrid').querySelectorAll('[data-day]').forEach(button=>button.addEventListener('click',()=>selectDay(Number(button.dataset.day))));
  $('mediaCounter').textContent=`${count} archivo${count===1?'':'s'} multimedia`;
  $('progressText').textContent='Cada puerta tiene su fecha. El Gran Final se anuncia tras abrir el d\u00eda 24 y se desbloquea el 25 de diciembre.';
  }
  function selectDay(n){selectedDay=Math.max(1,Math.min(25,n));const d=dayData(selectedDay);
    $('dayKicker').textContent=selectedDay===25?'GRAN FINAL / DESPU\u00c9S DEL D\u00cdA 24':`D\u00cdA ${String(selectedDay).padStart(2,'0')} / 24`;
    $('dayHeading').textContent=d.title||'Un momento para ella';
    $('unlockInfo').textContent=selectedDay===25?`\u2728 Gran Final: ${dateLabel(25)}. Nunca sustituye el d\u00eda 24.`:`\uD83D\uDD13 Se abre el ${dateLabel(selectedDay)}.`;
    for(const f of ['title','lead','letter','youtube'])$(f).value=d[f]||'';
    for(const [id,key] of [['gameType','type'],['gameMessage','message'],['gameQuestion','question'],['gameAnswer','answer'],['gameHint','hint']])$(id).value=d.game?.[key]|| (key==='type'?'none':'');
    for(const [id,key] of [['voucherTitle','title'],['voucherDetails','details'],['voucherType','type'],['voucherOptions','options'],['voucherSuggested','suggestedDate'],['voucherTime','suggestedTime'],['voucherExpires','expiresAt'],['voucherLocation','location']]){
      const val=d.voucher?.[key];$(id).value=Array.isArray(val)?val.join('\n'):(val|| (key==='type'?'fixed':''));
    }
    $('voucherEnabled').checked=!!d.voucher?.enabled;
    $('voucherSuggested').min=dateFor(selectedDay);$('voucherExpires').min=dateFor(selectedDay);
    $('prevDay').disabled=selectedDay===1;$('nextDay').disabled=selectedDay===25;
    $('nextDay').textContent=selectedDay===24?'Editar Gran Final \u2728':selectedDay===25?'\u00daltimo momento':'Siguiente \u2192';
    $('liveDay').textContent=selectedDay===25?'Gran Final':`D\u00eda ${String(selectedDay).padStart(2,'0')}`;
    $('gameGate').checked=!!d.gameGate;toggleGameFields();toggleVoucherFields();renderGrid();renderBlockOrder();renderAssets();renderLivePreview();
  }

  function renderBlockOrder(){
    const d=dayData(selectedDay),host=$('blockOrderList');host.replaceChildren();
    for(const [index,key] of d.blockOrder.entries()){
      const row=document.createElement('div');row.className='block-row';
      const label=document.createElement('strong');label.textContent=`${index+1}. ${BLOCK_NAMES[key]}`;
      const tag=document.createElement('small');tag.textContent=d.gameGate&&key==='game'?'Obligatorio primero':'';
      const actions=document.createElement('div');actions.className='block-row-actions';
      for(const [delta,symbol,name] of [[-1,'↑','Subir'],[1,'↓','Bajar']]){
        const btn=document.createElement('button');btn.type='button';btn.textContent=symbol;btn.title=`${name} ${BLOCK_NAMES[key]}`;
        btn.setAttribute('aria-label',btn.title);
        btn.disabled=(delta<0&&index===0)||(delta>0&&index===d.blockOrder.length-1)||(d.gameGate&&(key==='game'||(index===1&&delta<0)));
        btn.addEventListener('click',()=>{
          const j=index+delta;if(j<0||j>=d.blockOrder.length)return;
          [d.blockOrder[index],d.blockOrder[j]]=[d.blockOrder[j],d.blockOrder[index]];
          save();renderBlockOrder();renderLivePreview();
        });actions.append(btn);
      }
      row.append(label,tag,actions);host.append(row);
    }
  }
  function toggleGameFields(){const type=$('gameType').value;$('scratchFields').hidden=type!=='scratch';$('riddleFields').hidden=type!=='riddle';$('puzzleHint').hidden=type!=='puzzle';}
  function toggleVoucherFields(){$('voucherFields').hidden=!$('voucherEnabled').checked;$('voucherOptionsField').hidden=$('voucherType').value!=='choice';}
  function renderAssets(){function paint(list,where){const target=$(where);target.replaceChildren();if(!list.length){const empty=document.createElement('p');empty.className='empty-assets';empty.textContent='Todav\u00eda sin archivos.';target.append(empty);return;}
      for(const record of list){const card=document.createElement('div');card.className='asset-card';
        const top=document.createElement('div');top.className='asset-top';
        if(record.type==='photo'){const img=document.createElement('img');img.src=assetUrl(record);img.alt='Foto: '+record.name;top.append(img);}
        else if(record.type==='audio'){const audio=document.createElement('audio');audio.src=assetUrl(record);audio.controls=true;audio.preload='metadata';top.append(audio);}
        else {const video=document.createElement('video');video.src=assetUrl(record);video.controls=true;video.playsInline=true;video.preload='metadata';top.append(video);}
        const meta=document.createElement('div');meta.className='asset-meta';const name=document.createElement('span');name.textContent=record.name;name.title=record.name;
        const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.setAttribute('aria-label','Quitar '+record.name);remove.addEventListener('click',()=>removeAsset(record.id));
        meta.append(name,remove);card.append(top,meta);target.append(card);
      }
    }
    paint(assetsFor(selectedDay,'photo'),'photoList');paint([...assetsFor(selectedDay,'audio'),...assetsFor(selectedDay,'video')],'soundList');
  }
  function youtubeId(value){if(typeof value!=='string'||!value.trim())return '';
    try{const url=new URL(value);if(url.protocol!=='https:')return '';
      if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname)){const id=url.searchParams.get('v')||url.pathname.split('/').pop();return /^[\w-]{11}$/.test(id)?id:'';}
      if(url.hostname==='youtu.be'){const id=url.pathname.slice(1);return /^[\w-]{11}$/.test(id)?id:'';}
    }catch{}return '';
  }
  function contentPreview(container){
    const d=dayData(selectedDay);container.replaceChildren();
    const make=(tag,cls,val)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(val!==undefined)node.textContent=val;return node;};
    const photos=assetsFor(selectedDay,'photo');
    const chunks={};
    if(d.letter)chunks.letter=()=>make('div','live-letter',d.letter);
    if(photos.length)chunks.photos=()=>{const holder=make('div','live-photo-section');const frame=make('div','live-photo-frame');const img=make('img');let active=0;img.src=assetUrl(photos[0]);img.alt='Foto personal de la sorpresa';frame.append(img);holder.append(frame);
      if(photos.length>1){const nav=make('div','live-photo-nav');const prev=make('button','btn muted','‹');const indicator=make('span','',`1 / ${photos.length}`);const next=make('button','btn muted','›');prev.type=next.type='button';const move=x=>{active=(active+x+photos.length)%photos.length;img.src=assetUrl(photos[active]);indicator.textContent=`${active+1} / ${photos.length}`;};prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));nav.append(prev,indicator,next);holder.append(nav);}return holder;};
    const audio=assetsFor(selectedDay,'audio')[0];if(audio)chunks.audio=()=>{const box=make('div','live-audio-section');const player=make('audio');player.controls=true;player.preload='metadata';player.src=assetUrl(audio);box.append(player);return box;};
    const video=assetsFor(selectedDay,'video')[0];if(video||youtubeId(d.youtube))chunks.video=()=>{const box=make('div','live-video-section');if(video){const player=make('video','live-video');player.controls=true;player.playsInline=true;player.preload='metadata';player.src=assetUrl(video);box.append(player);}else{const player=make('iframe','live-youtube');player.title='Video de YouTube';player.loading='lazy';player.allow='encrypted-media; picture-in-picture';player.allowFullscreen=true;player.src=`https://www.youtube-nocookie.com/embed/${youtubeId(d.youtube)}`;box.append(player);}return box;};
    if(d.voucher?.enabled)chunks.voucher=()=>{const v=d.voucher;const voucher=make('div','live-voucher');voucher.append(make('div','voucher-stamp','VALE POR'),make('h4','',v.title||'Tu regalo'),make('p','',v.details||''));if(v.type==='choice'&&v.options?.length)voucher.append(make('p','',`Opciones: ${v.options.join(' / ')}`));if(v.suggestedDate)voucher.append(make('p','',`Fecha: ${readableDate(v.suggestedDate)}${v.suggestedTime?' a las '+v.suggestedTime:''}`));if(v.expiresAt)voucher.append(make('p','',`Hasta: ${readableDate(v.expiresAt)}`));if(v.location)voucher.append(make('p','',`Lugar: ${v.location}`));return voucher;};
    if(d.game?.type&&d.game.type!=='none')chunks.game=()=>{const game=make('div','live-game');window.MISTERA_GAMES.mount(game,d.game,{photo:photos[0]?assetUrl(photos[0]):''});return game;};
    if(d.gameGate&&chunks.game){
      const game=chunks.game();container.append(game);
      const reveal=make('div','live-locked');const label=make('p','', 'Completa el juego para ver el contenido.');reveal.append(label);container.append(reveal);
      // The editor preview is illustrative; the full calendar preview plays the actual reveal flow.
      for(const key of d.blockOrder){if(key!=='game'&&chunks[key]){const el=chunks[key]();el.hidden=true;el.dataset.afterGame='true';container.append(el);}}
      game.addEventListener('mistera:complete',()=>{reveal.remove();container.querySelectorAll('[data-after-game]').forEach(el=>{el.hidden=false;});},{once:true});
    }else{for(const key of d.blockOrder)if(chunks[key])container.append(chunks[key]());}
    if(!container.childNodes.length)container.append(make('p','empty-preview','Esta sorpresa todavía no tiene contenido.'));
  }
  function renderLivePreview(){const d=dayData(selectedDay);$('liveTitle').textContent=d.title||'Un detalle para ti';$('liveLead').textContent=d.lead||'Una sorpresa muy especial';
    contentPreview($('liveMedia'));$('liveLetter').hidden=true;$('liveVoucher').hidden=true;$('liveGame').hidden=true;
    if(previewActive)renderExpandedPreview();
  }
  function renderExpandedPreview(){const d=dayData(selectedDay);$('previewDay').textContent=selectedDay===25?'GRAN FINAL':`D\u00cdA ${String(selectedDay).padStart(2,'0')}`;
    $('previewTitle').textContent=d.title||'Un detalle para ti';$('previewLead').textContent=d.lead||'';contentPreview($('previewContent'));}
  function openPreview(){previewActive=true;renderExpandedPreview();$('previewOverlay').hidden=false;$('closePreview').focus();}
  function closePreview(){previewActive=false;$('previewOverlay').hidden=true;$('previewContent').querySelectorAll('audio,video').forEach(player=>player.pause());$('previewContent').replaceChildren();$('previewBtn').focus();}
  function bindFields(){for(const f of ['recipient','subtitle','senderWhatsapp','password'])$(f).addEventListener('input',e=>{state[f]=e.target.value;if(f==='password')state.signKey=randomHex(32);save();});
    for(const f of ['title','lead','letter','youtube'])$(f).addEventListener('input',e=>{dayData(selectedDay)[f]=e.target.value;if(f==='title')$('dayHeading').textContent=e.target.value||'Un momento para ella';save();renderLivePreview();});
    for(const [id,key] of [['gameType','type'],['gameMessage','message'],['gameQuestion','question'],['gameAnswer','answer'],['gameHint','hint']])$(id).addEventListener(id==='gameType'?'change':'input',e=>{dayData(selectedDay).game[key]=e.target.value;if(key==='type'&&e.target.value==='none'){dayData(selectedDay).gameGate=false;$('gameGate').checked=false;}save();toggleGameFields();renderBlockOrder();renderLivePreview();});
    const voucherEvents=[['voucherTitle','title'],['voucherDetails','details'],['voucherType','type'],['voucherOptions','options'],['voucherSuggested','suggestedDate'],['voucherTime','suggestedTime'],['voucherExpires','expiresAt'],['voucherLocation','location']];
    for(const [id,key] of voucherEvents)$(id).addEventListener(['voucherType','voucherSuggested','voucherTime','voucherExpires'].includes(id)?'change':'input',e=>{
      dayData(selectedDay).voucher[key]=key==='options'?e.target.value.split('\n').map(x=>x.trim()).filter(Boolean):e.target.value;save();toggleVoucherFields();renderLivePreview();
    });
    $('gameGate').addEventListener('change',e=>{const d=dayData(selectedDay);if(e.target.checked&&d.game.type==='none'){showMsg('Primero elige un minijuego.');e.target.checked=false;return;}d.gameGate=e.target.checked;if(d.gameGate)d.blockOrder=['game',...d.blockOrder.filter(x=>x!=='game')];save();renderBlockOrder();renderLivePreview();});
    $('voucherEnabled').addEventListener('change',e=>{dayData(selectedDay).voucher.enabled=e.target.checked;save();toggleVoucherFields();renderLivePreview();});
    $('newPassword').onclick=()=>{if(!confirm('Al cambiar la clave, tendr\u00e1s que compartir la nueva clave del pr\u00f3ximo ZIP.'))return;state.password=newPassword();state.signKey=randomHex(32);$('password').value=state.password;save();};
    $('prevDay').onclick=()=>selectDay(selectedDay-1);$('nextDay').onclick=()=>selectDay(selectedDay+1);
    for(const type of ['photos','audio','video'])$(type).addEventListener('change',e=>uploadFiles(type,e.target.files).finally(()=>e.target.value=''));
    $('backupBtn').onclick=()=>download(new Blob([JSON.stringify({...state,note:'Este JSON contiene los textos y los vales, NO contiene archivos multimedia.'},null,2)],{type:'application/json'}),'MISTERA-RESPALDO-TEXTOS.json');
    $('importInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.days)||data.days.length!==24)throw Error('Respaldo incompatible.');if(!confirm('Restaurar textos y vales de este respaldo? Las fotos, audios y videos actuales no se cambiar\u00e1n.'))return;
        state.days=data.days.map(upgradeDay);state.finale=upgradeDay(data.finale||DEFAULT_FINALE);state.recipient=data.recipient||'';state.subtitle=data.subtitle||'';state.senderWhatsapp=data.senderWhatsapp||'';state.password=data.password||state.password;state.signKey=data.signKey||state.signKey;
        save();syncSetup();selectDay(1);showMsg('Respaldo de textos recuperado.');}catch(err){showMsg('No se pudo recuperar este archivo JSON.');}e.target.value='';});
    $('previewBtn').onclick=openPreview;$('liveExpand').onclick=openPreview;$('closePreview').onclick=closePreview;$('previewOverlay').addEventListener('click',event=>{if(event.target===$('previewOverlay'))closePreview();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&previewActive)closePreview();});
    $('exportBtn').onclick=exportSite;
  }
  function syncSetup(){for(const f of ['recipient','subtitle','senderWhatsapp','password'])$(f).value=state[f]||'';}
  async function optimizePhoto(file){let bitmap=null;try{bitmap=await createImageBitmap(file);}catch{
      const url=URL.createObjectURL(file);try{bitmap=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}finally{URL.revokeObjectURL(url);}}
    const w=bitmap.width||bitmap.naturalWidth,h=bitmap.height||bitmap.naturalHeight;const ratio=Math.min(1,1600/Math.max(w,h));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.83));if(!blob||blob.type!=='image/webp')throw Error('El navegador no puede transformar esta foto. Usa Chrome o Edge actualizado.');return blob;
  }
  async function uploadFiles(input,files){if(!files?.length)return;const day=selectedDay,type=input==='photos'?'photo':input;
    if(type==='photo'&&assetsFor(day,'photo').length+files.length>15){showMsg('Puedes agregar hasta 15 fotos por sorpresa.');return;}
    for(const file of Array.from(files)){try{const ext=(file.name.split('.').pop()||'').toLowerCase();
      if(type==='photo'&&!file.type.startsWith('image/'))throw Error('No parece una imagen.');
      if(type==='audio'&&!['mp3','m4a','ogg','webm','wav','mp4'].includes(ext))throw Error('Prueba con MP3, M4A, OGG, WAV o WebM.');
      if(type==='video'&&!['mp4','webm'].includes(ext))throw Error('Para video utiliza MP4 o WebM.');
      const blob=type==='photo'?await optimizePhoto(file):file;
      if(blob.size>25*1024*1024)throw Error(`${file.name}: el archivo supera 25 MiB. Comprime el video o enl\u00e1zalo desde YouTube.`);
      if(type!=='photo')for(const old of assetsFor(day,type))await removeAsset(old.id);
      await storeAsset({id:uid(),day,type,name:file.name,ext:type==='photo'?'webp':ext,blob,order:Date.now()+Math.random()});
      showMsg('Archivo guardado y disponible para reproducir.');
    }catch(error){showMsg(error.message||'No fue posible subir el archivo.');}}
    renderAssets();renderGrid();renderLivePreview();
  }
  function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
  async function sha256(value){const result=await crypto.subtle.digest('SHA-256',encoder.encode(value));return Array.from(new Uint8Array(result),x=>x.toString(16).padStart(2,'0')).join('');}
  function zipWriter(){const parts=[],central=[];let offset=0;const add=p=>{parts.push(p);offset+=p.byteLength??p.size;};
    const crcTable=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[i]=c>>>0;}
    const crc32=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
    const u16=(v,p,n)=>v.setUint16(p,n,true),u32=(v,p,n)=>v.setUint32(p,n,true);
    return {async entry(path,blob){const name=encoder.encode(path),buffer=new Uint8Array(await blob.arrayBuffer());const size=buffer.length,crc=crc32(buffer),start=offset;if(size>0xffffffff)throw Error('Un archivo excede el tama\u00f1o permitido.');
      const local=new Uint8Array(30),v=new DataView(local.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x0800);u16(v,8,0);u16(v,10,0);u16(v,12,0x0021);u32(v,14,crc);u32(v,18,size);u32(v,22,size);u16(v,26,name.length);u16(v,28,0);add(local);add(name);add(blob);
      const center=new Uint8Array(46),b=new DataView(center.buffer);u32(b,0,0x02014b50);u16(b,4,20);u16(b,6,20);u16(b,8,0x0800);u16(b,10,0);u16(b,12,0);u16(b,14,0x0021);u32(b,16,crc);u32(b,20,size);u32(b,24,size);u16(b,28,name.length);u16(b,30,0);u16(b,32,0);u16(b,34,0);u16(b,36,0);u32(b,38,0);u32(b,42,start);central.push(center,name);
    },finish(){const start=offset;for(const p of central)add(p);const size=offset-start,count=central.length/2;if(count>65535)throw Error('Demasiados archivos para el ZIP.');const end=new Uint8Array(22),v=new DataView(end.buffer);u32(v,0,0x06054b50);u16(v,8,count);u16(v,10,count);u32(v,12,size);u32(v,16,start);add(end);return new Blob(parts,{type:'application/zip'});}};
  }
  function validateDay(n){const d=dayData(n);if(d.voucher?.enabled){const v=d.voucher;if(!v.title?.trim())throw Error(`D\u00eda ${n===25?'Gran Final':n}: el vale necesita un nombre.`);
      if(v.type==='choice'&&(!Array.isArray(v.options)||v.options.length<2||v.options.length>6))throw Error(`D\u00eda ${n===25?'Gran Final':n}: indica entre 2 y 6 opciones para el vale.`);
      if(v.suggestedTime&&!v.suggestedDate)throw Error('Si eliges una hora para el vale, indica tambi\u00e9n la fecha sugerida.');
      if(v.suggestedDate&&v.suggestedDate<dateFor(n))throw Error('La fecha sugerida del vale debe ser igual o posterior a su apertura.');
      if(v.expiresAt&&v.expiresAt<dateFor(n))throw Error('La fecha de vencimiento debe ser igual o posterior a la apertura.');
      if(v.expiresAt&&v.suggestedDate&&v.expiresAt<v.suggestedDate)throw Error('La fecha de vencimiento no puede ser anterior a la fecha sugerida.');
    }
    if(d.gameGate&&(!d.game||d.game.type==='none'||d.blockOrder[0]!=='game'))throw Error(`Día ${n===25?'Gran Final':n}: el juego obligatorio debe ir primero.`);
    if(d.game?.type==='riddle'&&(!d.game.question?.trim()||!d.game.answer?.trim()))throw Error(`D\u00eda ${n===25?'Gran Final':n}: completa la pregunta y respuesta del acertijo.`);
    if(d.game?.type==='puzzle'&&!assetsFor(n,'photo').length)throw Error(`D\u00eda ${n===25?'Gran Final':n}: el rompecabezas necesita al menos una foto.`);
    if(d.youtube?.trim()&&!youtubeId(d.youtube))throw Error(`D\u00eda ${n===25?'Gran Final':n}: el enlace de YouTube no es v\u00e1lido.`);
  }
  async function exportSite(){const button=$('exportBtn');button.disabled=true;button.textContent='Preparando tu regalo...';
    try{if(!crypto?.subtle)throw Error('Utiliza el editor con Chrome o Edge y el servidor local.');if(state.password.trim().length<12)throw Error('La clave privada debe tener al menos 12 caracteres.');
      for(let n=1;n<=25;n++)validateDay(n);
      if(/gran\s+final|sorpresa\s+final|24\s*\+\s*1|25\s+(?:regalos|sorpresas|momentos)/i.test(state.subtitle))throw Error('El texto de bienvenida revela el Gran Final. Cambia el subtítulo para conservar el secreto.');
      if(state.senderWhatsapp.trim()&&!/^[1-9]\d{7,14}$/.test(state.senderWhatsapp.trim()))throw Error('El número de WhatsApp debe tener código de país y solo dígitos, por ejemplo 51987654321.');
      const config={recipient:state.recipient.trim().slice(0,70),subtitle:state.subtitle.trim().slice(0,240),senderWhatsapp:state.senderWhatsapp.trim(),startDate:'2026-12-01',timezone:'America/Lima',days:24,hasFinale:true};
      const salt=randomHex(16),passwordHash=await sha256(`${salt}:${state.password.trim()}`);
      const worker=TEMPLATES.worker.replace('__CONFIG_JSON__',JSON.stringify(config)).replace('__SALT_JSON__',JSON.stringify(salt)).replace('__HASH_JSON__',JSON.stringify(passwordHash)).replace('__SIGN_KEY_JSON__',JSON.stringify(state.signKey));
      if(worker.includes('__CONFIG_JSON__'))throw Error('El generador no tiene una plantilla de publicaci\u00f3n v\u00e1lida.');
      const zip=zipWriter();for(const [name,text] of Object.entries(TEMPLATES.files))await zip.entry(name,new Blob([text]));await zip.entry('_worker.js',new Blob([worker]));
      for(let n=1;n<=25;n++){
        const d=dayData(n),isFinale=n===25,section=isFinale?'finale':`day-${String(n).padStart(2,'0')}`;
        const output={title:d.title|| (isFinale?'Gran Final':`D\u00eda ${n}`),lead:d.lead||'',letter:d.letter||'',photos:[],audio:'',video:'',youtube:d.youtube||'',game:d.game||{type:'none'},voucher:d.voucher?.enabled?d.voucher:null,blockOrder:d.blockOrder,gameGate:!!d.gameGate};
        for(const [i,record] of assetsFor(n,'photo').entries()){const path=`media/${section}/photo-${String(i+1).padStart(2,'0')}.webp`;await zip.entry(path,record.blob);output.photos.push({src:`/${path}`});}
        for(const type of ['audio','video']){const item=assetsFor(n,type)[0];if(item){const path=`media/${section}/${type}.${item.ext}`;await zip.entry(path,item.blob);output[type]=`/${path}`;}}
        await zip.entry(isFinale?'content/finale.json':`content/${section}.json`,new Blob([JSON.stringify(output)]));
      }
      const blob=zip.finish();if(blob.size>500*1024*1024&&!confirm('El ZIP supera 500 MiB. Recomendamos reducir videos. Deseas descargarlo de todas formas?'))return;
      download(blob,'MISTERA-ADVIENTO-2026-PUBLICAR.zip');showMsg(`Calendario y Gran Final listos (${(blob.size/1048576).toFixed(1)} MiB).`);
      if(!$('accessBtn')){const b=document.createElement('button');b.id='accessBtn';b.className='btn muted';b.type='button';b.textContent='Guardar clave privada';b.onclick=()=>download(new Blob([`MISTERA - ACCESO PRIVADO PARA ELLA\n\nClave: ${state.password.trim()}\n\nNO subas este archivo a Cloudflare Pages.\n`]),'MISTERA-CLAVE-PRIVADA-NO-PUBLICAR.txt');$('exportBtn').parentElement.prepend(b);}
    }catch(err){console.error(err);showMsg(err.message||'No se pudo crear el ZIP.');}
    finally{button.disabled=false;button.textContent='Preparar ZIP para publicar \u2197';}
  }
  function openWorldPreview(){ const url=new URL('/index.html',location.href); window.open(url.href,'_blank','noopener,noreferrer'); }
  async function start(){ $('worldPreviewBtn').addEventListener('click',openWorldPreview); $('worldPreviewBanner').addEventListener('click',openWorldPreview); readSaved();if(!state.password)state.password=newPassword();if(!state.signKey)state.signKey=randomHex(32);save();syncSetup();bindFields();await initStorage();selectDay(1);}
  window.addEventListener('beforeunload',()=>{for(const src of objectURLs.values())URL.revokeObjectURL(src);});
  start();
})();
