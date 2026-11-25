/* MISTERA V33 — 01: scratch/flip/single cinema ticket; 02: folded riddle, cumulative clues.
 * User-written content lives in data/sorpresas-2026.js and remains editable in the planner.
 * No future-day media is preloaded and no product photo is ever displayed for day 02. */
(() => {
  'use strict';
  const S=window.MisteraSurprises;
  if(!S)return;
  const NS='http://www.w3.org/2000/svg';
  const $=(tag,cls='',txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
  const btn=(label,click,cls='m33-btn')=>{const e=$('button',cls,label);e.type='button';e.addEventListener('click',click);return e;};
  const icon=(key)=>{
    const paths={ticket:['M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6Z','M13 5v2','M13 17v2','M13 11v2'],calendar:['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'],clock:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z','M12 6v6l4 2'],door:['M3 21h18','M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16','M14 13h.01'],armchair:['M5 11V8a3 3 0 0 1 6 0v3','M13 11V8a3 3 0 0 1 6 0v3','M3 12a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4','M3 18h18'],arrow:['M19 12H5','m12 19-7-7 7-7'],heart:['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z']};
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','19');svg.setAttribute('height','19');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');for(const d of paths[key]||paths.heart){const p=document.createElementNS(NS,'path');p.setAttribute('d',d);svg.append(p);}return svg;
  };
  let current=null;
  function isLive(ctx){return current===ctx&&ctx.host.isConnected;}
  function has(ctx,key){return ctx.preview?!!ctx.previewProgress[key]:!!S.getProgress(ctx.day)[key];}
  function val(ctx,key,fallback){const v=ctx.preview?ctx.previewProgress[key]:S.getProgress(ctx.day)[key];return v==null?fallback:v;}
  function save(ctx,key,value=true){if(ctx.preview)ctx.previewProgress[key]=value;else S.complete(ctx.day,key,value);}
  function setScene(ctx,child){if(!isLive(ctx))return;ctx.host.replaceChildren(child);}
  function paragraphs(text,cls){const box=$('div',cls);String(text||'').split(/\n\s*\n/).forEach(section=>{const p=$('p','',section);box.append(p);});return box;}
  function attachImage(ctx,path,host,alt){const image=$('img');image.alt=alt;image.decoding='async';image.loading='eager';host.append(image);S.mediaURL(path).then(src=>{
      if(!isLive(ctx)||!image.isConnected)return;
      if(!src){image.alt='Imagen temporalmente no disponible';return;}
      if(src.startsWith('blob:'))ctx.urls.push(src);image.src=src;
    }).catch(()=>{});return image;}
  function ticketAvailable(){return S.isOpened(1)&&S.isCompleted(1,'d01-ticket-available');}
  function mountedTicket(ctx){const data=ctx.record.cinema||{},wrap=$('section','m33-cinema-ticket');wrap.setAttribute('aria-label','Una entrada de cine para dos butacas');
    const top=$('div','m33-ticket-header');top.append(icon('ticket'),$('span','','UNA TARDE JUNTOS'));wrap.append(top);
    const body=$('div','m33-ticket-body');const poster=$('div','m33-ticket-poster');attachImage(ctx,data.poster,poster,'Cartel de la película');body.append(poster);
    const details=$('div','m33-ticket-details');details.append($('h3','',data.movie));
    let today=false;try{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const value=k=>parts.find(x=>x.type===k)?.value;today=`${value('year')}-${value('month')}-${value('day')}`===data.date;}catch(_){}
    const displayDate=today?'Hoy':(data.date||'2026-12-01').split('-').reverse().join('/');
    for(const [id,label,v] of [['calendar','Fecha',displayDate],['clock','Hora',data.time],['door','Sala',data.room],['armchair','Butacas',data.seats]]){
      const row=$('div','m33-ticket-detail');row.append(icon(id));const words=$('div');words.append($('small','',label),$('strong','',v));row.append(words);details.append(row);
    }
    body.append(details);wrap.append(body);
    if(data.ticketNote)wrap.append($('p','m33-ticket-note',data.ticketNote));
    const back=btn('Volver',()=>renderCinema(ctx,'back'),'m33-text-button');wrap.append(back);return wrap;
  }
  function cinemaFront(ctx,flipped=false){const data=ctx.record.cinema||{};
    const wrap=$('section','m33-cinema-view');
    const stage=$('div','m33-cinema-stage');const card=$('div','m33-flip-card'+(flipped?' is-flipped':''));card.setAttribute('aria-label',flipped?'Leer dedicatoria':'Voltear tarjeta revelada');
    const rotor=$('div','m33-flip-rotor');const front=$('div','m33-flip-front');attachImage(ctx,data.cover,front,'Imagen de la película revelada');
    const overlay=$('div','m33-title-overlay');attachImage(ctx,data.overlay,overlay,'Título original de la película');front.append(overlay);rotor.append(front);
    const back=$('div','m33-flip-back');back.append($('div','m33-back-mark','✦'),paragraphs(data.letter,'m33-letter-body'));
    const ticketButton=btn('Ver nuestras entradas',event=>{event.stopPropagation();save(ctx,'d01-ticket-available');renderCinema(ctx,'ticket');},'m33-btn m33-ticket-action');ticketButton.prepend(icon('ticket'));back.append(ticketButton);rotor.append(back);card.append(rotor);stage.append(card);wrap.append(stage);
    const flip=()=>{
      if(card.classList.contains('is-flipped')){renderCinema(ctx,'front');return;}
      save(ctx,'d01-letter');save(ctx,'d01-ticket-available');
      card.classList.add('is-flipped');front.setAttribute('aria-hidden','true');back.removeAttribute('aria-hidden');
      window.dispatchEvent(new Event('mistera:ticket-state'));
    };
    back.addEventListener('click',e=>{if(e.target.closest('.m33-ticket-action'))return;renderCinema(ctx,'front');});
    back.tabIndex=0;back.setAttribute('role','button');back.setAttribute('aria-label','Volver a ver la portada');
    back.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('.m33-ticket-action')){e.preventDefault();renderCinema(ctx,'front');}});
    if(!flipped){front.tabIndex=0;front.setAttribute('role','button');front.setAttribute('aria-label',data.flipPrompt||'Dar vuelta a la tarjeta');front.addEventListener('click',flip);front.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}});back.setAttribute('aria-hidden','true');}
    else{front.setAttribute('aria-hidden','true');back.removeAttribute('aria-hidden');}

    return wrap;
  }
  function scratch(ctx){const data=ctx.record.cinema||{};const wrap=$('section','m33-cinema-view');
    const stage=$('div','m33-scratch-card'),art=$('div','m33-scratch-art');attachImage(ctx,data.cover,art,'Imagen oculta que se descubrirá al raspar');stage.append(art);
    const canvas=$('canvas','m33-scratch-canvas');canvas.setAttribute('aria-label','Raspar para revelar el secreto cinematográfico');canvas.setAttribute('role','img');stage.append(canvas);wrap.append(stage);
    // Canvas is measured at its actual displayed width. Sampling alpha at a
    // coarse grid makes the completion threshold efficient on a Galaxy A53.
    const raf=requestAnimationFrame(()=>{
      if(!isLive(ctx)||!canvas.isConnected)return;
      const box=stage.getBoundingClientRect(),w=Math.max(100,box.width),h=Math.max(120,box.height);
      const dpr=Math.min(window.devicePixelRatio||1,1.7),c=canvas.getContext('2d',{willReadFrequently:true});if(!c)return;
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);
      const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#b49c83');grad.addColorStop(.52,'#778ba4');grad.addColorStop(1,'#6b708d');c.fillStyle=grad;c.fillRect(0,0,w,h);
      c.fillStyle='#fff0d4';c.textAlign='center';c.font=`600 ${Math.max(15,w*.065)}px Georgia,serif`;c.fillText(data.scratchCoverText||'RASPA AQUÍ',w/2,h/2);
      c.globalCompositeOperation='destination-out';c.lineWidth=Math.min(55,Math.max(33,w*.15));c.lineCap='round';c.lineJoin='round';
      let active=false,last=null,completed=false;const pos=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height};};
      function brush(e){const at=pos(e);c.beginPath();c.moveTo(last?.x??at.x,last?.y??at.y);c.lineTo(at.x,at.y);c.stroke();last=at;}
      function coverage(){const im=c.getImageData(0,0,canvas.width,canvas.height).data;let erased=0,total=0;const skip=Math.max(12,Math.floor(canvas.width/29));for(let y=0;y<canvas.height;y+=skip)for(let x=0;x<canvas.width;x+=skip){total++;if(im[(y*canvas.width+x)*4+3]<48)erased++;}return erased/Math.max(1,total);}
      function check(e){if(!active||completed)return;active=false;last=null;try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch(_){}
        if(coverage()>=Math.max(.65,Math.min(.7,Number(data.scratchThreshold)||.68))){completed=true;canvas.classList.add('m33-scratch-cleared');save(ctx,'d01-scratch');save(ctx,'d01-card-revealed');
          window.setTimeout(()=>{if(isLive(ctx))renderCinema(ctx,'front');},460);}}
      canvas.addEventListener('pointerdown',e=>{if(e.button!==0||completed)return;active=true;last=null;canvas.setPointerCapture(e.pointerId);brush(e);});
      canvas.addEventListener('pointermove',e=>{if(active)brush(e);});canvas.addEventListener('pointerup',check);canvas.addEventListener('pointercancel',check);
    });ctx.rafs.push(raf);
    return wrap;
  }
  function renderCinema(ctx,mode){if(!isLive(ctx))return;ctx.mode=mode;const panel=mode==='ticket'?mountedTicket(ctx):mode==='scratch'?scratch(ctx):cinemaFront(ctx,mode==='back');setScene(ctx,panel);}
  function renderSecret(ctx){if(!isLive(ctx))return;const data=ctx.record.secret||{};
    if(has(ctx,'d02-found')){const wrap=$('section','m33-found-letter');wrap.append($('span','m33-found-seal','❤'),paragraphs(data.foundNote,'m33-found-note'));setScene(ctx,wrap);return;}
    if(!has(ctx,'d02-opened')){
      const wrap=$('section','m33-secret-view'),fold=btn('',()=>{save(ctx,'d02-opened');fold.classList.add('m34-opening');setTimeout(()=>{if(isLive(ctx))renderSecret(ctx);},480);},'m33-folded-letter');fold.setAttribute('aria-label',data.openPrompt||'Abrir carta doblada');
      fold.append($('span','m33-letter-flap'),$('span','m33-folded-seal','✦'));wrap.append(fold);setScene(ctx,wrap);return;
    }
    const wrap=$('section','m33-secret-view'),letter=$('article','m33-riddle-letter');letter.append($('span','m33-riddle-ornament','✦'));
    letter.append($('p','m33-riddle-text',data.riddle));
    const revealed=Math.max(0,Math.min(3,Number(val(ctx,'d02-hints',0))||0));
    const notes=$('div','m33-hint-list');for(let i=0;i<revealed;i++){const item=$('p','m33-hint-note',data.hints?.[i]||'');item.dataset.hint=String(i+1);notes.append(item);}letter.append(notes);
    const buttons=$('div','m33-riddle-actions');const hint=btn(revealed===0?'Una pistita':revealed>=3?'Ya viste todas las pistas':'Otra pistita',()=>{
      const n=Math.max(0,Math.min(3,Number(val(ctx,'d02-hints',0))||0));if(n>=3)return;
      save(ctx,'d02-hints',n+1);const note=$('p','m33-hint-note',data.hints?.[n]||'');note.dataset.hint=String(n+1);notes.append(note);
      hint.textContent=n+1>=3?'Ya viste todas las pistas':'Otra pistita';hint.disabled=n+1>=3;
    },'m33-btn m33-hint-button');if(revealed>=3)hint.disabled=true;
    const found=btn('Encontrado',()=>{save(ctx,'d02-found');renderSecret(ctx);},'m33-btn m33-found-button');found.prepend(icon('heart'));buttons.append(hint,found);letter.append(buttons);wrap.append(letter);setScene(ctx,wrap);
  }
  function mount(day,host,record,options={}){
    stop();current={day,host,record,preview:!!options.preview,previewProgress:options.previewProgress||{},urls:[],rafs:[],mode:options.ticket?'ticket':null};const ctx=current;
    if(day===1){const mode=options.ticket&&ticketAvailable()?'ticket':has(ctx,'d01-letter')?'back':has(ctx,'d01-scratch')?'front':'scratch';renderCinema(ctx,mode);}
    if(day===2)renderSecret(ctx);
    return true;
  }
  function stop(){if(!current)return;for(const id of current.rafs)cancelAnimationFrame(id);for(const url of current.urls)URL.revokeObjectURL(url);current=null;}
  window.MisteraSpecialDays={mount,stop,ticketAvailable};
})();
