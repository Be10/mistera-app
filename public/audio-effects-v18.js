'use strict';
/* MISTERA V18 - audible-first effects, independent of ambient music.
 * Native HTMLAudioElement pools provide a resilient path across responsive/mobile
 * transitions. The V17 AudioContext synthesizer remains the fallback if play()
 * is denied, times out while loading, or media output is interrupted.
 * This does NOT override browser/OS muting or user audio preferences.
 */
(() => {
  const manager=window.__misteraAudio;
  if(!manager || manager._v18EffectsInstalled)return;
  manager._v18EffectsInstalled=true;
  const files={
    open:'assets/audio/Door-open.wav',
    close:'assets/audio/Door-close.wav',
    tree:'assets/audio/Christmas_tree_1s_v34.wav',
    locked:'assets/audio/bells-locked.mp3',
    dock:'assets/audio/Dock_sound.mp3',
    launch:'assets/audio/lanzamiento-siseo-v20.mp3',
    explosion:'assets/audio/fuegos-explosion-v18.mp3'
  };
  const limits={open:2,close:2,tree:2,locked:3,dock:2,launch:7,explosion:9};
  // Base volumes are amplified relative to the V17 cue chain, but never clipped.
  const levels={open:1,close:.58,tree:.78,locked:.9,dock:.68,launch:.56,explosion:.98};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const voices={};
  const counts={attempted:0,played:0,rejected:0,fallback:0,lastError:'',lastKind:''};
  const cueWebAudio=manager.playInteractionSound?.bind(manager);
  const now=()=>performance.now();
  for(const kind of Object.keys(files)){
    voices[kind]=Array.from({length:limits[kind]},(_,index)=>{
      const element=document.createElement('audio');
      element.src=files[kind];element.preload=index===0?'auto':'metadata';
      element.loop=false;
      element.setAttribute('playsinline','');
      element.setAttribute('webkit-playsinline','');
      element.load();
      return {element,last:-Infinity,index};
    });
  }
  function play(kind,options={},fallback=null){
    if(!files[kind]||!manager.soundEffectsEnabled||manager.soundEffectsVolume<=.001)return false;
    counts.attempted++;counts.lastKind=kind;
    manager.ensureEffectsActive?.();
    const available=voices[kind],idle=available.filter(v=>v.element.paused||v.element.ended);
    const voice=(idle.length?idle:available).reduce((a,b)=>a.last<b.last?a:b);
    voice.last=now();
    const el=voice.element;
    // At 200% the native element reaches at most 100% digital level.
    // The underlying source audio retains peak headroom; no gain >1 is applied here.
    const relative=clamp(manager.soundEffectsVolume/1.7,0,1);
    el.volume=clamp(levels[kind]*relative,0,1);
    el.muted=false;
    try{el.pause();el.currentTime=0;}catch(_){}
    try{el.playbackRate=clamp(options.playbackRate??1,.85,1.18);}catch(_){}
    let resolved=false,usedFallback=false;
    const onFallback=(reason)=>{
      if(usedFallback)return;
      usedFallback=true;counts.fallback++;
      counts.lastError=reason||'Sin salida nativa disponible';
      try{el.pause();}catch(_){}
      manager.ensureEffectsActive?.();
      try{fallback?.();}catch(_){}
    };
    const stopLate=setTimeout(()=>{
      if(!resolved && (el.paused || el.readyState<2))onFallback('Carga del efecto demasiado lenta');
    },420);
    try{
      const promise=el.play();
      Promise.resolve(promise).then(()=>{
        resolved=true;clearTimeout(stopLate);
        if(usedFallback){try{el.pause();}catch(_){};return;}
        counts.played++;counts.lastError='';
      }).catch(error=>{
        resolved=true;clearTimeout(stopLate);counts.rejected++;
        onFallback(error?.name||'play() denegado');
      });
    }catch(error){
      resolved=true;clearTimeout(stopLate);counts.rejected++;
      onFallback(error?.name||'play() no disponible');
    }
    return true;
  }
  manager.playInteractionSound=kind=>{
    if(!['open','close','tree','locked','dock'].includes(kind))return false;
    return play(kind,{},()=>cueWebAudio?.(kind));
  };
  manager.playFireworkNative=(kind,options={},fallback=null)=>{
    if(kind!=='launch'&&kind!=='explosion')return false;
    return play(kind,options,fallback);
  };
  manager.getEffectDiagnostics=()=>({...counts,
    effectVolume:manager.soundEffectsVolume,
    effectsEnabled:manager.soundEffectsEnabled,
    contextState:manager.context?.state||'sin iniciar',
    voices:Object.fromEntries(Object.entries(voices).map(([k,v])=>
      [k,v.filter(x=>!x.element.paused).length]))
  });
  window.addEventListener('pagehide',e=>{
    if(e.persisted)return;
    for(const pool of Object.values(voices))for(const v of pool){
      try{v.element.pause();v.element.removeAttribute('src');}catch(_){}
    }
  });
})();
