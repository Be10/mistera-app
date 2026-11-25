/* MISTERA V35 · Motor de experiencias reutilizables. Nunca confunde contenido
   pendiente con medios/entradas reales ni expone herramientas administrativas. */
(() => {
  'use strict';
  const S=window.MisteraSurprises;
  const $=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
  const button=(label,fn,cls='mx-btn')=>{const b=$('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;};
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  let current=null,renderId=0;
  // Recipient-facing scenes never inherit editorial headings, planning labels or
  // generated helper copy. Only an expressly approved displayTitle can opt in.
  const editorial=/\b(?:pendiente(?:s)?|por elegir|por seleccionar|aún no|no se ha|sin comprar|idea (?:tentativa|provisional)|tentativ[oa]|propuesta|aproximad[oa]|por configurar|de prueba|para configurar|no confirmad[oa]|falta(?:n)? por|preferencia:|referencia pendiente)\b/i;
  const visibleBody=(text,preview=false)=>{
    const value=typeof text==='string'?text.trim():'';
    return !!value && (preview || !editorial.test(value));
  };
  const displayTitle=(block,preview)=>!!(preview || block.displayTitle===true) &&
    !!String(block.title||'').trim() && !/^para ti\s*[❤❤️💗]?$/iu.test(String(block.title).trim());

  function media(reference,host,kind='image',alt='Ilustración de la sorpresa pendiente'){
    const run=current;if(!reference){if(run?.preview)host.append($('div','mx-placeholder',alt));return;}
    const placeholder=$('div','mx-placeholder','Preparando recurso…');host.append(placeholder);
    S.mediaURL(reference).then(src=>{
      if(current!==run||!placeholder.isConnected)return;
      if(!src){if(run?.preview)placeholder.textContent='Archivo pendiente de configurar.';else placeholder.remove();return;}
      if(src.startsWith('blob:'))run.urls.push(src);
      const tag=kind==='image'?'img':kind;
      const node=$(tag,`mx-media mx-${kind}`);node.src=src;
      if(tag==='img'){node.alt=alt;node.loading='lazy';}
      else{node.controls=true;node.preload='metadata';if(tag==='video')node.playsInline=true;}
      placeholder.replaceWith(node);
    }).catch(()=>{if(run?.preview)placeholder.textContent='No fue posible cargar este recurso.';else placeholder.remove();});
  }
  function statusBadge(d){const div=$('div','mx-editorial-notice');div.append($('span','mx-status',d.planningStatus||'PROPUESTA'));
    div.append($('span','',d.publicationStatus==='PUBLICADO'?'Configuración local de demostración':'Vista previa privada · contenido editable'));
    return div;}
  function stopStory(event){const state=current;if(!state)return;
    state.storyActive=false;
    for(const p of state.host.querySelectorAll('audio,video')){try{p.pause();}catch(_){}}
    const a=window.__misteraAudio;if(state.savedAmbient!==undefined&&a){
      const shouldRestore=state.savedAmbient;state.savedAmbient=undefined;
      if(a.ambientMusicEnabled!==shouldRestore)a.setAmbientMusicEnabled(shouldRestore,event||null);
      if(shouldRestore){if(a.music?.paused){try{a.music.play().catch(()=>{});}catch(_){}}try{a.fireplace?.start?.();}catch(_){}}
    }
  }
  function holdAmbient(){
    if(!current||current.preview||current.storyActive)return;
    const manager=window.__misteraAudio;
    if(!manager)return;
    current.savedAmbient=manager.ambientMusicEnabled;
    current.storyActive=true;
    if(manager.ambientMusicEnabled)manager.setAmbientMusicEnabled(false);
  }
  function complete(block,value=true){if(!current)return;const d=current.day;if(current.preview)current.previewProgress[block.id]=value;else S.complete(d,block.id,value);current.step=Math.min(current.step+1,(S.get(d)?.blocks?.length||1)-1);rerender(current.step);}
  function done(id){if(!id)return true;return !!(current.preview?current.previewProgress[id]:S.isCompleted(current.day,id));}
  function rerender(step=null){const c=current;if(!c)return;const day=c.day,preview=c.preview,progress=c.previewProgress;stopStory();mount(day,c.host,{preview,previewProgress:progress,step:step??c.step});}
  function renderScratch(block,card){
    const plate=$('div','mx-scratch-plate');const reveal=$('div','mx-scratch-reveal');reveal.append($('span','mx-mini-label','TESORO ESCONDIDO'),$('strong','',block.message||'Una sorpresa para ti'));plate.append(reveal);
    const canvas=$('canvas','mx-scratch-layer');canvas.setAttribute('aria-label','Raspar la tarjeta secreta');plate.append(canvas);card.append(plate);
    // The scratch canvas itself carries the single instruction; no repeated hint.
    const finish=()=>{canvas.style.opacity='0';canvas.style.pointerEvents='none';complete(block);};
    // El único modo de completar es raspar de verdad.
    requestAnimationFrame(()=>{
      if(!canvas.isConnected)return;
      const rect=plate.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(220,rect.width),h=Math.max(130,rect.height);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
      const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#a99493');g.addColorStop(1,'#786c83');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#ffedce';ctx.font='600 18px Georgia,serif';ctx.textAlign='center';ctx.fillText(block.coverText||'RASPA AQUÍ',w/2,h/2);
      ctx.globalCompositeOperation='destination-out';ctx.lineWidth=32;ctx.lineCap='round';ctx.lineJoin='round';
      let active=false,last=null,marked=0;
      const xy=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(w/r.width),y:(e.clientY-r.top)*(h/r.height)};};
      canvas.addEventListener('pointerdown',e=>{active=true;last=xy(e);canvas.setPointerCapture(e.pointerId);});
      canvas.addEventListener('pointermove',e=>{if(!active||!last)return;const pos=xy(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(pos.x,pos.y);ctx.stroke();last=pos;marked++;});
      function check(){active=false;last=null;if(marked<3)return;
        const im=ctx.getImageData(0,0,canvas.width,canvas.height).data;let hidden=0,total=0;
        for(let y=0;y<canvas.height;y+=12)for(let x=0;x<canvas.width;x+=12){total++;if(im[(y*canvas.width+x)*4+3]<60)hidden++;}
        if(hidden/Math.max(1,total)>Math.min(.9,Math.max(.12,Number(block.threshold)||.4)))finish();
      }
      canvas.addEventListener('pointerup',check);canvas.addEventListener('pointercancel',check);
    });
  }
  function renderRiddle(block,card){if(!block.question||!block.answer){if(current.preview)card.append($('div','mx-placeholder','Configura el acertijo en el planificador.'));return;}
    card.append($('p','mx-riddle-question',block.question));const form=$('form','mx-answer-form'),input=$('input','mx-input');input.placeholder='Escribe tu respuesta';input.autocomplete='off';input.setAttribute('aria-label','Respuesta al acertijo');const result=$('span','mx-answer-feedback');result.setAttribute('role','status');const submit=button('Comprobar',()=>{},'mx-btn');submit.type='submit';form.append(input,submit,result);card.append(form);
    form.addEventListener('submit',e=>{e.preventDefault();if(normalize(input.value)===normalize(block.answer)){result.textContent='¡Lo descubriste! ✨';complete(block);}else result.textContent='Todavía no; intenta otra vez.';});
    if(block.hint)card.append(button('Ver una pista',e=>{e.target.textContent=block.hint;e.target.disabled=true;},'mx-link-button'));
  }
  function renderPuzzle(block,card){if(!block.image){if(current.preview)card.append($('div','mx-placeholder','Añade una imagen para activar el rompecabezas.'));return;}
    const parent=$('div','mx-puzzle-holder');card.append(parent);const pending=$('p','mx-hint','Toca dos piezas para intercambiarlas.');card.append(pending);
    const c=current;S.mediaURL(block.image).then(src=>{
      if(current!==c||!parent.isConnected)return;
      if(!src){parent.textContent='No se encontró la imagen del rompecabezas.';return;}
      if(src.startsWith('blob:'))c.urls.push(src);
      const n=Number(block.pieces)===16?4:3,order=Array.from({length:n*n},(_,i)=>i),grid=$('div','mx-puzzle');grid.style.setProperty('--puzzle-n',String(n));
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      if(order.every((v,i)=>v===i))[order[0],order[1]]=[order[1],order[0]];
      let picked=-1;const buttons=[];
      function update(){buttons.forEach((b,i)=>{const index=order[i];b.style.backgroundImage=`url("${src.replace(/["\\]/g,'')}")`;b.style.backgroundSize=`${n*100}% ${n*100}%`;
        b.style.backgroundPosition=`${(index%n)*100/(n-1)}% ${Math.floor(index/n)*100/(n-1)}%`;b.classList.toggle('is-picked',picked===i);});
        if(order.every((v,i)=>v===i))complete(block);
      }
      for(let i=0;i<n*n;i++){const b=button('',()=>{if(picked<0)picked=i;else{[order[picked],order[i]]=[order[i],order[picked]];picked=-1;}update();},'mx-puzzle-tile');b.setAttribute('aria-label',`Pieza ${i+1}`);buttons.push(b);grid.append(b);}
      parent.replaceChildren(grid);update();
    });
  }
  function renderPhysical(block,card){
    const completed=done(block.id),preview=current.preview;
    if((completed||preview||block.showItemBeforeFound===true)&&block.item)
      card.append($('strong','mx-physical-name',block.item));
    if(visibleBody(block.body,preview)&&(completed||preview||block.showBodyBeforeFound===true))
      card.append($('p','mx-body',block.body));
    if(completed||preview||block.showImageBeforeFound===true)
      media(block.image,card,'image',block.mediaLabel||'Imagen');
    if(!completed)card.append(button(block.foundLabel||'Encontrado',()=>complete(block,{found:true,at:Date.now()})));
  }
  function renderVoucher(block,card){card.append($('p','mx-voucher-label','VALE PARA NOSOTROS'));if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));if(visibleBody(block.place,current.preview))card.append($('p','mx-meta','Lugar: '+block.place));if(visibleBody(block.conditions,current.preview))card.append($('p','mx-meta','Condiciones: '+block.conditions));
    if(!done(block.id))card.append(button('Guardar este vale ♥',()=>complete(block,{accepted:true,at:Date.now()})));
    else card.append($('p','mx-success','♥ Un recuerdo para compartir.'));
  }
  function renderFlip(block,card){
    const front=$('div','mx-flip-face');
    if(visibleBody(block.body,current.preview))front.append($('p','mx-letter',block.body));
    const back=$('div','mx-flip-face');back.hidden=true;
    if(visibleBody(block.backText,current.preview))back.append($('p','mx-letter',block.backText));
    media(block.image,back,'image',block.mediaLabel||'Recuerdo');
    const toggle=()=>{front.hidden=!front.hidden;back.hidden=!back.hidden;};
    for(const side of [front,back]){
      side.tabIndex=0;side.setAttribute('role','button');side.setAttribute('aria-label','Voltear carta');
      side.addEventListener('click',toggle);
      side.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    }
    card.append(front,back);
  }
  function renderStory(block,card){
    const scenes=Array.isArray(block.scenes)?block.scenes:[];
    let at=0;const stage=$('div','mx-story-stage');card.append(stage);
    const icon=(symbol,label,callback)=>{const node=button(symbol,callback,'mx-story-icon');node.setAttribute('aria-label',label);node.title=label;return node;};
    const prev=icon('‹','Anterior',()=>show(at-1));
    const next=icon('›','Siguiente',()=>show(at+1));
    const nav=$('div','mx-story-nav');nav.append(prev,next);card.append(nav);
    function show(index){
      at=Math.max(0,Math.min(index,Math.max(0,scenes.length-1)));
      stage.replaceChildren();prev.disabled=at===0;next.disabled=at>=scenes.length-1;
      const scene=scenes[at];if(!scene)return;
      // Las descripciones y títulos son notas de producción: no son parte de la narración.
      media(scene.image,stage,'image','Ilustración');
      if(scene.narration?.trim())stage.append($('p','mx-letter',scene.narration));
      if(!scene.image&&!scene.narration?.trim())stage.append($('div','mx-story-silent','✦'));
    }
    if(block.music){
      const holder=$('div','mx-story-audio');card.prepend(holder);const session=current;
      S.mediaURL(block.music).then(src=>{if(!src||current!==session||!holder.isConnected)return;
        if(src.startsWith('blob:'))session.urls.push(src);
        const player=$('audio');player.src=src;player.controls=false;player.loop=true;player.volume=.35;
        holder.append(player);player.play().catch(()=>{});
      });
    }
    show(0);
  }
  function renderBlock(block){const card=$('section','mx-block');card.dataset.blockId=block.id;
    if(block.requires&&!done(block.requires))return card;
    if(displayTitle(block,current.preview))card.append($('h3','mx-block-title',block.title));
    const type=block.type;
    if(type==='scratch'){if(!done(block.id))renderScratch(block,card);else card.append($('div','mx-scratch-reveal',block.message||'Secreto descubierto'));}
    else if(type==='riddle')renderRiddle(block,card);
    else if(type==='puzzle')renderPuzzle(block,card);
    else if(type==='physical')renderPhysical(block,card);
    else if(type==='voucher')renderVoucher(block,card);
    else if(type==='flip-letter')renderFlip(block,card);
    else if(type==='story')renderStory(block,card);
    else if(type==='gallery'){if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));const gallery=$('div','mx-gallery');for(const img of block.images||[])media(img,gallery,'image','Fotografía pendiente');if(!gallery.children.length&&current.preview)gallery.append($('div','mx-placeholder','Fotos pendientes de seleccionar.'));card.append(gallery);}
    else if(type==='tickets'){if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));media(block.image,card,'image',block.mediaLabel||'Entradas reales pendientes');if(block.date)card.append($('p','mx-meta',`Fecha: ${block.date}`));}
    else if(type==='image'||type==='reveal'){if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));media(block.image,card,'image',block.mediaLabel||'Ilustración pendiente');}
    else if(type==='music'){if(visibleBody(block.body,current.preview))card.append($('p','mx-letter',block.body));card.append($('p','mx-meta',`${block.songTitle||''}${block.artist?' · '+block.artist:''}`));media(block.audio,card,'audio','Grabación autorizada pendiente');}
    else if(type==='video'){if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));media(block.video,card,'video','Video personal pendiente');}
    else if(type==='letter'){if(visibleBody(block.body,current.preview))card.append($('p','mx-letter',block.body));}
    else {if(visibleBody(block.body,current.preview))card.append($('p','mx-body',block.body));}
    
    return card;
  }
  function mount(day,host,options={}){
    if(!host)return;stop();
    const d=S.get(day);if(!d)return;
    current={day,host,preview:!!options.preview,previewProgress:options.previewProgress||{},step:Math.max(0,Number(options.step)||0),urls:[],savedAmbient:undefined,storyActive:false};
    if(!current.preview && d.publicationStatus!=='PUBLICADO'){
      host.replaceChildren();host.hidden=false;
      host.append($('p','mx-private-wait','Esta casita todavía guarda su secreto. ✨'));
      return;
    }
    if(d.audioBehavior==='pause-ambient')holdAmbient();
    host.replaceChildren();host.hidden=false;const wrap=$('div','mx-experience');if(current.preview)wrap.append(statusBadge(d));
    if((day===1||day===2)&&d.specialExperience&&window.MisteraSpecialDays){
      host.append(wrap);
      window.MisteraSpecialDays.mount(day,wrap,d,{preview:current.preview,previewProgress:current.previewProgress,ticket:!!options.ticket});
      return;
    }
    if(!d.blocks.length&&current.preview)wrap.append($('p','mx-hint','Esta sorpresa aún no está configurada.'));
    // Una etapa visible. La etapa siguiente permanece oculta hasta una acción explícita.
    const blocks=d.blocks||[];
    let index=Math.min(current.step,Math.max(0,blocks.length-1));
    while(index>0&&blocks[index].requires&&!done(blocks[index].requires))index--;
    current.step=index;
    const active=blocks[index];
    if(active){
      const card=renderBlock(active);wrap.append(card);
      const passive=['intro','reveal','image','tickets','gallery','music','video','letter'];
      if(index<blocks.length-1&&(passive.includes(active.type)||done(active.id))){
        const following=blocks[index+1];
        const next=button('Continuar ›',()=>{
          if(!done(active.id)){if(current.preview)current.previewProgress[active.id]=true;
            else S.complete(day,active.id,true);}
          current.step=index+1;rerender(current.step);
        },'mx-btn mx-continue');
        if(!following.requires||done(following.requires)||following.requires===active.id)card.append(next);
      }
    }
    if(current.preview&&d.mediaPending?.length)wrap.append($('p','mx-pending','Pendiente: '+d.mediaPending.join(' · ')));
    host.append(wrap);
  }
  function stop(event){window.MisteraSpecialDays?.stop?.();stopStory(event);if(current){for(const url of current.urls)URL.revokeObjectURL(url);current.host.replaceChildren();current.host.hidden=true;current=null;}renderId++;}
  const show=(day)=>{
    const host=document.getElementById('surprise-draft-content');mount(day,host,{preview:false});
    const d=S.get(day),title=document.getElementById('dialog-title'),intro=document.getElementById('dialog-copy');
    if(title)title.textContent='';if(intro)intro.textContent='';
  };
  function openTicket(){
    if(!window.MisteraSpecialDays?.ticketAvailable())return false;
    mount(1,document.getElementById('surprise-draft-content'),{ticket:true});
    const title=document.getElementById('dialog-title'),intro=document.getElementById('dialog-copy');
    if(title)title.textContent='';if(intro)intro.textContent='';
    return true;
  }
  window.MisteraExperience={mount,show,stop,rerender,openTicket};
  document.getElementById('surprise-dialog')?.addEventListener('close',()=>stop());
})();
