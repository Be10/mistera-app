/* MISTERA V28 — genuine initial-asset readiness and intentional audio entrance.
   Prepares the 24-house scene but NEVER downloads media for future gifts.
   V33: only the lightweight instrumental MP3 (14.9 MB) is cached fully for
   reliable random seeking. Future-day videos and personal media remain lazy.
   Anime.js enhances the ornamental motion; native CSS/WAAPI remain the safe fallback. */
(() => {
  'use strict';
  const root=document.getElementById('mistera-loader');
  const button=document.getElementById('mistera-enter');
  const buttonText=document.getElementById('mistera-enter-label');
  const message=document.getElementById('mistera-loader-message');
  const percent=document.getElementById('mistera-loader-percent');
  const track=document.getElementById('mistera-loader-track');
  const fill=document.getElementById('mistera-loader-fill');
  const foot=document.getElementById('mistera-loader-foot');
  const progressBox=document.getElementById('mistera-loader-progress');
  if(!root||!button||!message)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const KEY_OPENED='mistera-escena-v5-opened';
  const FIRST='Tu pollito preparó muchas cosas…';
  const PHRASES=[
    'Creando un poquito de magia…',
    'Ordenando casitas nevadas…',
    'Ubicando las estrellas…',
    'Preparando chocolate caliente…',
    'Partiendo panetoncito…',
    'Esperando a Santa…',
    'Eligiendo villancicos…',
    'Cascabeleando por aquí…',
    'Jugando en la nieve…',
    'Sacudiendo copitos de nieve…',
    'Buscando un gorrito calentito…',
    'Acomodando bufandas diminutas…',
    'Contando copitos de nieve…',
    'Sacando galletitas del horno…',
    'Poniendo a dormir a los renos…',
    'Desenredando luces doradas…',
    'Calentando las manitas…',
    'Espolvoreando azúcar y alegría…',
    'Revisando la lista de Santa…',
    'Dándole cuerda a la Navidad…',
    'Escuchando cascabelitos lejanos…',
    'Viendo si cae otro copito…'
  ];
  function openedCount(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY_OPENED)||'[]');
      return Array.isArray(raw)?new Set(raw.filter(d=>Number.isInteger(d)&&d>=1&&d<=24)).size:0;
    }catch(_){return 0;}
  }
  if(openedCount()>=2)PHRASES.push('Encendiendo chimeneas…');
  let lastPhrase=FIRST,phraseTimer=0,ready=false,entered=false,failures=[],essentialFailures=[];
  let done=0,total=0;
  let animeStarted=false,animeAttempt=0,animeTicker=0;
  const animeHandles=[];
  const phaseMessage=value=>{
    if(!value||value===lastPhrase)return;
    lastPhrase=value;
    if(reduce.matches){message.textContent=value;return;}
    message.classList.add('is-changing');
    setTimeout(()=>{message.textContent=value;message.classList.remove('is-changing');},210);
  };
  function nextPhrase(){
    if(ready||entered)return;
    const choices=PHRASES.filter(p=>p!==lastPhrase);
    phaseMessage(choices[Math.floor(Math.random()*choices.length)]);
  }
  function tryAnime(){
    if(animeStarted||reduce.matches||typeof window.anime!=='function')return;
    animeStarted=true;
    try{
      animeHandles.push(window.anime({targets:'#mistera-loader .m-loader-emblem svg',rotate:['-2deg','2deg'],
        scale:[.985,1.017],easing:'easeInOutSine',duration:3700,direction:'alternate',loop:true}));
      animeHandles.push(window.anime({targets:'#mistera-loader .m-loader-dashes',opacity:[.6,1],
        easing:'easeInOutSine',duration:2100,direction:'alternate',loop:true}));
      animeHandles.push(window.anime({targets:'#mistera-loader .m-loader-stars i',
        translateY:[0,-4],duration:2600,delay:window.anime.stagger(190),
        easing:'easeInOutSine',direction:'alternate',loop:true}));
    }catch(_){animeStarted=false;}
  }
  function recordProgress(task,ok,reason){
    done++;
    if(!ok){
      const issue={name:task.name,reason:String(reason?.message||reason||'no disponible')};
      failures.push(issue);
      if(task.required)essentialFailures.push(issue);
    }
    const value=Math.min(100,Math.round(done/Math.max(1,total)*100));
    fill.style.width=value+'%';percent.textContent=value+' %';track.setAttribute('aria-valuenow',String(value));
    if(done===total && !ready)finishLoading();
  }
  function deadline(task,ms){
    return new Promise((resolve,reject)=>{
      const t=setTimeout(()=>reject(new Error('Tiempo de carga agotado')),ms);
      Promise.resolve().then(task).then(x=>{clearTimeout(t);resolve(x);},e=>{clearTimeout(t);reject(e);});
    });
  }
  function imageReady(url){
    return new Promise((resolve,reject)=>{
      const image=new Image();image.decoding='async';
      image.onload=()=>{
        if(!image.naturalWidth){reject(new Error('Imagen vacía'));return;}
        if(typeof image.decode==='function')image.decode().then(resolve,resolve);else resolve();
      };
      image.onerror=()=>reject(new Error('Imagen no disponible'));
      image.src=url;
      if(image.complete&&image.naturalWidth)image.onload();
    });
  }
  async function shortAudioReady(url){
    const res=await fetch(url,{cache:'force-cache'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    await res.arrayBuffer(); // short sounds, never multi-minute tracks
  }
  function mediaReady(media){
    return new Promise((resolve,reject)=>{
      if(!media){reject(new Error('Canal no inicializado'));return;}
      if(media.error){reject(new Error('Error de audio'));return;}
      if(media.readyState>=2){resolve();return;}
      let settled=false;
      const remove=()=>{media.removeEventListener('loadeddata',check);media.removeEventListener('canplay',check);media.removeEventListener('error',onError);};
      const doneNow=(err)=>{if(settled)return;settled=true;remove();err?reject(err):resolve();};
      const check=()=>{if(media.readyState>=2)doneNow();};
      const onError=()=>doneNow(new Error('La pista no está disponible'));
      media.addEventListener('loadeddata',check);media.addEventListener('canplay',check);
      media.addEventListener('error',onError);
      try{
        media.preload='auto';
        if(media.networkState===0)media.load();
      }catch(e){doneNow(e);}
      check();
    });
  }
  async function musicReady(manager){
    if(manager?._musicCachePromise)await manager._musicCachePromise;
    await mediaReady(manager?.music);
    // A seek into the long MP3 should settle during the entrance, before the
    // first user gesture. Do not stall indefinitely on a restrictive browser.
    if(!manager || manager._initialSeekFinished)return;
    await new Promise(resolve=>{
      const media=manager.music;
      let settled=false,timeout;
      const done=()=>{if(settled)return;settled=true;clearTimeout(timeout);
        media.removeEventListener('seeked',check);media.removeEventListener('canplay',check);resolve();};
      const check=()=>{if(manager._initialSeekFinished)done();};
      media.addEventListener('seeked',check);media.addEventListener('canplay',check);
      timeout=setTimeout(done,4500);check();
    });
  }
  function dayMediaReady(url,kind){
    // Buffer only metadata for today's audio or video; never fetch an entire video here.
    const el=document.createElement(kind==='video'?'video':'audio');
    el.preload='metadata';el.src=url;
    return new Promise((resolve,reject)=>{
      let finished=false;
      const done=(err)=>{if(finished)return;finished=true;
        el.removeEventListener('loadedmetadata',onMetadata);
        el.removeEventListener('error',onError);
        // Leave already-buffered bytes in the HTTP cache, not an invisible player.
        el.removeAttribute('src');err?reject(err):resolve();};
      const onMetadata=()=>done();
      const onError=()=>done(new Error('No se pudieron cargar los metadatos'));
      el.addEventListener('loadedmetadata',onMetadata,{once:true});
      el.addEventListener('error',onError,{once:true});
      try{el.load();}catch(e){done(e);}
    });
  }
  function appReady(){
    return new Promise((resolve,reject)=>{
      if(window.__misteraAppReady){resolve();return;}
      if(window.__misteraBootError){reject(window.__misteraBootError);return;}
      const onReady=()=>{cleanup();resolve();};
      const onError=()=>{if(window.__misteraBootError){cleanup();reject(window.__misteraBootError);}};
      const cleanup=()=>{window.removeEventListener('mistera:ready',onReady);clearInterval(watch);};
      window.addEventListener('mistera:ready',onReady,{once:true});
      const watch=setInterval(onError,250);
    });
  }
  function localToday(){
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
      const v=k=>Number(parts.find(p=>p.type===k)?.value||0);
      return {year:v('year'),month:v('month'),day:v('day')};
    }catch(_){return {year:0,month:0,day:0};}
  }
  function currentDayMedia(){
    // Only media from the current calendar day, NEVER content from unopened future days.
    const today=localToday();
    if(today.year!==2026||today.month!==12||today.day<1||today.day>25)return [];
    const day=window.MisteraSurprises?.get?.(today.day);
    if(today.day===1 && day?.specialExperience==='cinema-v33'){
      const cover=day.cinema?.cover;
      // Only the scratch surface image; do not expose the title or ticket early.
      return typeof cover==='string'&&/^(?:assets|content)\/[\w.\-/]+$/.test(cover)?
        [{name:'imagen para raspar',url:cover,kind:'image'}]:[];
    }
    const first=day?.blocks?.[0];
    if(!first)return [];
    const out=[];
    const safeUrl=x=>typeof x==='string'&&/^(?:assets|content)\/[\w.\-/]+$/.test(x)?x:null;
    const imageRefs=[first.image,...(Array.isArray(first.images)?first.images:[]),first.scenes?.[0]?.image];
    for(const src of imageRefs){const url=safeUrl(src);if(url)out.push({name:'medio del día',url,kind:'image'});}
    for(const [kind,src] of [['audio',first.audio],['video',first.video]]){
      const url=safeUrl(src);
      if(url)out.push({name:'medio del día',url,kind});
    }
    return out;
  }
  function readyTask(name,load,required=false,timeout=18000){return {name,load,required,timeout};}
  function planTasks(){
    const img=[
      'assets/aldea-base.png','assets/arbol-apagado.png','assets/nieve-primer-plano.png',
      'assets/luna.png','assets/ui/corona-nav.png','assets/ui/estrella-disponible.png',
      'assets/ui/vale.png','assets/ui/continuacion-left-v16.png','assets/ui/continuacion-right-v16.png',
      ...[1,4,7,9].map(n=>`assets/clouds/nube-${n}.png`),
      ...Array.from({length:24},(_,i)=>`assets/casas/casa-${String(i+1).padStart(2,'0')}.png`)
    ];
    let opened=0;try{opened=openedCount();}catch(_){/* ignore */}
    let isFinal=false;try{isFinal=localStorage.getItem('mistera-escena-v5-final')==='yes'&&opened===24;}catch(_){}
    if(isFinal)img.push('assets/arbol-encendido.webp','assets/arbol-encendido-estatico.png');
    const images=img.map(url=>readyTask(url,()=>imageReady(url),url==='assets/aldea-base.png'||url==='assets/arbol-apagado.png'));
    const current=currentDayMedia();
    for(const item of current)images.push(readyTask(item.name+' '+item.url,
      ()=>item.kind==='image'?imageReady(item.url):dayMediaReady(item.url,item.kind),false,18000));
    const audio=window.__misteraAudio;
    const sounds=[
      readyTask('Entrada navideña',()=>shortAudioReady('assets/audio/Load_Screen_Button.mp3'),true,20000),
      readyTask('Estrella de casa',()=>shortAudioReady('assets/audio/Star_Shinning.mp3'),true,20000),
      readyTask('Música instrumental',()=>musicReady(audio),true,24000),
      readyTask('Fogata',()=>shortAudioReady('assets/audio/fireplace_5m.mp3').then(()=>mediaReady(audio?.fireplace?.element)),true,20000),
      ...['Dock_sound.mp3','Door-open.wav','Door-close.wav','Christmas_tree_1s_v34.wav','bells-locked.mp3',
          'wind-snow.mp3','lanzamiento-siseo-v20.mp3','fuegos-explosion-v18.mp3']
        .map(name=>readyTask(name,()=>shortAudioReady('assets/audio/'+name),true,20000)),
      readyTask('Escena interactiva',appReady,true,18000),
      readyTask('Tipografía',()=>document.fonts?.ready||Promise.resolve(),false,12000),
      readyTask('Contenido actualizado',()=>window.MisteraCloud?.ready||Promise.resolve(),false,10000)
    ];
    return {images,audio:sounds};
  }
  function finishLoading(){
    if(ready)return;
    ready=true;clearInterval(phraseTimer);
    window.__misteraLoaderDiagnostics={items:total,completed:done,failed:failures,criticalFailed:essentialFailures,entered:false};
    if(essentialFailures.length){
      phaseMessage('Revisando unos cascabelitos…');
      buttonText.textContent='Reintentar carga';
      foot.hidden=false;
      foot.textContent='No se completó la preparación de recursos. Pulsa para volver a intentarlo.';
    }else{
      // V34: no 100%, progress bar or finished message after all resources are ready.
      progressBox.hidden=true;
      foot.hidden=true;
      root.classList.add('is-ready');
    }
    button.hidden=false;button.disabled=false;button.classList.add('is-ready');
  }
  async function run(){
    message.textContent=FIRST;
    phraseTimer=setInterval(nextPhrase,3400);
    // Load the animation library opportunistically: it is not a prerequisite.
    animeTicker=setInterval(()=>{tryAnime();if(animeStarted||++animeAttempt>25)clearInterval(animeTicker);},240);
    tryAnime();
    const {images,audio}=planTasks();total=images.length+audio.length;
    const pool=images.slice();
    const workers=Array.from({length:5},async()=>{
      while(pool.length){
        const task=pool.shift();
        try{await deadline(task.load,task.timeout);recordProgress(task,true);}catch(e){recordProgress(task,false,e);}
      }
    });
    const other=audio.map(async task=>{
      try{await deadline(task.load,task.timeout);recordProgress(task,true);}catch(e){recordProgress(task,false,e);}
    });
    await Promise.all([...workers,...other]);
    finishLoading();
  }
  button.addEventListener('click',event=>{
    if(!ready||entered||!event.isTrusted)return;
    if(essentialFailures.length){location.reload();return;}
    entered=true;button.disabled=true;clearInterval(phraseTimer);clearInterval(animeTicker);
    for(const animation of animeHandles)try{animation.pause();}catch(_){}
    // Entrar es la primera interacción autorizada; los sonidos están descargados.
    try{window.MisteraLoaderEntrySound?.play?.();}catch(_){}
    // This is the explicit trusted gesture that starts the existing 3 ambient tracks.
    try{window.__misteraAudio?.activateFromGesture?.(event);}catch(e){console.warn('[MISTERA] Audio no autorizado:',e);}
    try{window.__misteraFireworks?.unlockAudio?.();}catch(_){}
    const app=document.getElementById('app');
    document.body.classList.remove('mistera-booting');
    document.body.classList.add('mistera-scene-arriving');
    if(app){app.inert=false;app.removeAttribute('aria-hidden');}
    root.classList.add('is-leaving');
    if(window.__misteraLoaderDiagnostics)window.__misteraLoaderDiagnostics.entered=true;
    window.dispatchEvent(new Event('mistera:entered'));
    setTimeout(()=>{
      root.hidden=true;root.remove();document.body.classList.remove('mistera-scene-arriving');
    },reduce.matches?50:860);
  });
  window.MisteraLoader={get ready(){return ready;},get entered(){return entered;},get progress(){return {done,total,failures,essentialFailures};}};
  run().catch(error=>{
    console.error('[MISTERA] Falló la pantalla de carga:',error);
    failures.push({name:'Inicio',reason:String(error?.message||error)});
    essentialFailures.push(failures[failures.length-1]);
    if(!Number.isFinite(total)||total<=0)total=1;
    done=total;fill.style.width='100%';percent.textContent='100 %';finishLoading();
  });
})();
