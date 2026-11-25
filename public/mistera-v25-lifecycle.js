/* MISTERA V25: suspensión audiovisual y Wake Lock en primer plano.
   No altera volúmenes guardados ni reubica pistas tras volver al navegador. */
(() => {
  'use strict';
  const audio=window.__misteraAudio;
  let wakeLock=null,requested=false,suspending=false,saved=false;
  let exitTimer=0,entryTimer=0;
  const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ramp=(element,target,ms,done)=>{
    if(!element){done?.();return;}
    const start=element.volume,begin=performance.now();
    const tick=(now)=>{
      if(document.hidden||suspending&&ms===0){element.volume=target;done?.();return;}
      const ratio=Math.min(1,(now-begin)/Math.max(1,ms));
      const shaped=ratio*ratio*(3-2*ratio);
      element.volume=Math.max(0,Math.min(1,start+(target-start)*shaped));
      if(ratio<1)requestAnimationFrame(tick);else done?.();
    };
    requestAnimationFrame(tick);
  };
  async function acquireWake(){
    if(document.hidden||!document.hasFocus()||!('wakeLock' in navigator)||wakeLock)return;
    try{wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release',()=>{wakeLock=null;},{once:true});
    }catch(_){wakeLock=null;}
  }
  function releaseWake(){if(wakeLock){const old=wakeLock;wakeLock=null;old.release().catch(()=>{});}}
  function pauseImmediately(){
    clearTimeout(exitTimer);
    if(!audio)return;
    audio._cancelFade?.();audio.music.pause();audio.music.volume=0;
    audio.fireplace?.stop?.();
    if(audio._v17AmbientBus&&audio.context){
      audio._v17AmbientBus.gain.cancelScheduledValues(audio.context.currentTime);
      audio._v17AmbientBus.gain.value=0;
    }
    clearTimeout(audio._v17WindTimer);audio._v17WindTimer=0;
  }
  function suspend(force=false){
    if(!audio)return;
    releaseWake();
    if(suspending){if(force)pauseImmediately();return;}
    suspending=true;saved=audio.ambientMusicEnabled;
    audio._misteraSuspended=true;
    const ctx=audio.context,wind=audio._v17AmbientBus;
    if(wind&&ctx){wind.gain.cancelScheduledValues(ctx.currentTime);wind.gain.setValueAtTime(wind.gain.value,ctx.currentTime);
      wind.gain.linearRampToValueAtTime(0,ctx.currentTime+(force?.008:.24));}
    audio._cancelFade?.();
    if(force||document.hidden){pauseImmediately();return;}
    ramp(audio.music,0,230);
    ramp(audio.fireplace?.element,0,230);
    exitTimer=setTimeout(pauseImmediately,245);
  }
  function resume(){
    if(document.hidden||!document.hasFocus())return;
    if(requested)acquireWake();
    if(!audio||!suspending)return;
    suspending=false;audio._misteraSuspended=false;
    clearTimeout(exitTimer);clearTimeout(entryTimer);
    if(!saved||!audio.ambientMusicEnabled)return;
    audio._fadedThisVisit=false;
    audio.music.volume=0;
    if(audio.fireplace){audio.fireplace.faded=false;audio.fireplace.element.volume=0;}
    if(audio._v17AmbientBus&&audio.context){const g=audio._v17AmbientBus.gain,now=audio.context.currentTime;
      g.cancelScheduledValues(now);g.setValueAtTime(0,now);
      g.linearRampToValueAtTime(audio.ambientMusicVolume,now+1.5);}
    // Reanuda en el segundo guardado. Las políticas del navegador pueden pedir un gesto nuevo.
    if(audio._visitHasGesture){audio._playMusicIfPossible(true);audio.fireplace?.start?.();}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend(true);else resume();});
  window.addEventListener('pagehide',()=>suspend(true));
  window.addEventListener('pageshow',resume);
  window.addEventListener('blur',()=>suspend(false));
  window.addEventListener('focus',resume);
  const firstGesture=(e)=>{if(e.isTrusted){requested=true;acquireWake();
    if(!document.hidden&&document.hasFocus())resume();}};
  document.addEventListener('pointerdown',firstGesture,{capture:true,passive:true});
  document.addEventListener('keydown',firstGesture,true);
  if(!document.hidden&&document.hasFocus()){requested=true;acquireWake();}
})();
