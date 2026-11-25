'use strict';
/* MISTERA V17 — Extra channels on the existing single AudioManager.
   Native HTML audio is used for long MP3s, Web Audio for short wind and cues.
   One ambient switch never silences the fireworks or gift interaction cues. */
(() => {
  const audio = window.__misteraAudio;
  if (!audio || audio._v17Installed) return;
  audio._v17Installed = true;
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const path = 'assets/audio/';
  const signal = () => audio.ambientMusicEnabled && !audio._destroyed && !audio._misteraSuspended && !document.hidden;
  const ORIGINAL = {
    activate:audio.activateFromGesture.bind(audio),
    setEnabled:audio.setAmbientMusicEnabled.bind(audio),
    setVolume:audio.setAmbientMusicVolume.bind(audio),
    getContext:audio._getContext.bind(audio),
    getStats:audio.getStats.bind(audio),
    destroy:audio.destroy.bind(audio)
  };

  class AmbientLongTrack {
    constructor(src) {
      this.element=new Audio();
      this.element.preload='metadata';this.element.loop=true;
      this.element.setAttribute('playsinline','');this.element.src=src;
      this.element.volume=0;
      this.randomPosition=0;
      this.initialSeekDone=true;this.seekingLoop=false;this.playStarted=false;this.faded=false;
      this.fadeFrame=0;this.error=null;this.loading=null;
      this.element.addEventListener('loadedmetadata',()=>this.onMetadata());
      this.element.addEventListener('seeked',()=>this.onSeeked());
      this.element.addEventListener('playing',()=>{this.playStarted=true;this.fadeIn();});
      this.element.addEventListener('ended',()=>this.onEnded());
      this.element.addEventListener('error',()=>{this.error='Error al cargar la chimenea';});
      this.element.load();
    }
    onMetadata() {
      // V26: the five-minute fire begins at 0 and loops as a complete recording.
      // No seek/random offset, including when audio metadata arrives late.
      this.initialSeekDone=true;
      this.fadeIn();
    }
    onSeeked() {
      this.initialSeekDone=true;
      this.fadeIn();
    }
    fadeIn() {
      if(!this.playStarted||!this.initialSeekDone||this.element.paused||!signal()||this.fadeFrame)return;
      if(this.faded){this.element.volume=audio.ambientMusicVolume;return;}
      const start=performance.now();
      const tick=now=>{
        this.fadeFrame=0;
        if(!signal()||this.element.paused)return;
        const t=clamp((now-start)/1500,0,1);
        this.element.volume=audio.ambientMusicVolume*(t*t*(3-2*t));
        if(t<1)this.fadeFrame=requestAnimationFrame(tick);else this.faded=true;
      };
      this.fadeFrame=requestAnimationFrame(tick);
    }
    start() {
      if(!signal())return;
      if(!this.element.paused)return;
      if(!this.initialSeekDone)this.element.volume=0;
      // Called synchronously inside the trusted gesture, without awaiting metadata.
      try {const p=this.element.play();if(p?.catch)p.catch(err=>{this.error=err.name||String(err);});}
      catch(e){this.error=e.name||String(e);}
    }
    stop() {
      cancelAnimationFrame(this.fadeFrame);this.fadeFrame=0;
      this.element.pause();this.element.volume=0;this.faded=false;
    }
    onEnded() {
      // HTMLMediaElement.loop normally handles this seamlessly. Keep fallback
      // for a browser that unexpectedly fires ended despite loop=true.
      if(!signal())return;
      try {this.element.currentTime=0;this.start();}catch(_){}
    }
    setVolume(v){if(!this.fadeFrame&&!this.element.paused&&this.initialSeekDone)this.element.volume=v;}
    status(){return {playing:!this.element.paused,time:this.element.currentTime,
      duration:this.element.duration,volume:this.element.volume,error:this.error};}
    destroy(){this.stop();this.element.removeAttribute('src');this.element.load();}
  }

  audio.fireplace=new AmbientLongTrack(path+'fireplace_5m.mp3');
  audio._v17Buffers={};audio._v17Pending=[];audio._v17WindTimer=0;audio._v17CueCount=0;
  audio._v17WindActive=[];audio._v17AmbientBus=null;audio._v17CueBus=null;
  audio._v17SourceBytes={};
  const SOUNDS={wind:'wind-snow.mp3',open:'Door-open.wav',close:'Door-close.wav',tree:'Christmas_tree_1s_v34.wav',locked:'bells-locked.mp3',dock:'Dock_sound.mp3'};
  for(const [name,filename] of Object.entries(SOUNDS)) {
    fetch(path+filename).then(r=>{if(!r.ok)throw Error(filename+' '+r.status);return r.arrayBuffer();})
      .then(bytes=>{audio._v17SourceBytes[name]=bytes;decode(name);}).catch(()=>{});
  }
  function decode(name) {
    const ctx=audio.context, bytes=audio._v17SourceBytes[name];
    if(!ctx||!bytes||audio._v17Buffers[name]||audio._v17Decoding?.[name])return;
    audio._v17Decoding=audio._v17Decoding||{};
    audio._v17Decoding[name]=true;
    ctx.decodeAudioData(bytes.slice(0)).then(buffer=>{
      audio._v17Buffers[name]=buffer;delete audio._v17SourceBytes[name];
      const pending=audio._v17Pending.filter(p=>p.kind===name && performance.now()-p.at<1400);
      if(audio.context?.state==='running'){
        audio._v17Pending=audio._v17Pending.filter(p=>p.kind!==name);
        for(const item of pending)playCueBuffer(name);
      }
    }).catch(()=>{}).finally(()=>delete audio._v17Decoding[name]);
  }
  function ensureV17Buses(){
    const ctx=audio.context;if(!ctx)return;
    if(!audio._v17AmbientBus){
      audio._v17AmbientBus=ctx.createGain();
      audio._v17AmbientBus.gain.value=signal()?audio.ambientMusicVolume:0;
      audio._v17AmbientBus.connect(ctx.destination);
    }
    if(!audio._v17CueBus){
      audio._v17CueBus=ctx.createGain();
      audio._v17CueBus.gain.value=audio.soundEffectsEnabled?.5:0;
      // Interaction cues bypass the 200% fireworks gain but share the peak safety chain.
      audio._v17CueBus.connect(audio.effectsDynamics||ctx.destination);
    }
    for(const name of Object.keys(SOUNDS))decode(name);
  }
  function playCueBuffer(name){
    const ctx=audio.context,buffer=audio._v17Buffers[name];
    if(!ctx||ctx.state!=='running'||!buffer||!audio.soundEffectsEnabled)return false;
    ensureV17Buses();
    const node=ctx.createBufferSource();node.buffer=buffer;
    const gain=ctx.createGain();gain.gain.value=name==='locked'?.62:name==='dock'?.44:name==='tree'?.72:name==='close'?.64:.72;
    if(['open','close','tree'].includes(name)){
      const tail=Math.min(.048,Math.max(.018,buffer.duration*.035));
      const end=ctx.currentTime+buffer.duration;
      gain.gain.setValueAtTime(gain.gain.value,Math.max(ctx.currentTime,end-tail));
      gain.gain.linearRampToValueAtTime(0,end);
    }
    node.connect(gain);gain.connect(audio._v17CueBus);
    node.start();audio._v17CueCount++;node.onended=()=>{try{node.disconnect();gain.disconnect();}catch(_){}};
    return true;
  }
  audio.playInteractionSound=(kind)=>{
    if(!['open','close','tree','locked','dock'].includes(kind)||!audio.soundEffectsEnabled)return false;
    audio.ensureEffectsActive();
    if(playCueBuffer(kind))return true;
    audio._v17Pending.push({kind,at:performance.now()});
    if(audio._v17Pending.length>6)audio._v17Pending.shift();
    return false;
  };
  audio.ensureEffectsActive=()=>{
    if(!audio.soundEffectsEnabled&&!audio.ambientMusicEnabled)return false;
    const ctx=ORIGINAL.getContext();if(!ctx)return false;
    ensureV17Buses();
    if(ctx.state!=='running'&&!audio._resumePromise){
      audio._resumePromise=ctx.resume().then(()=>{audio._syncAudioReady();
      audio._v17Pending=audio._v17Pending.filter(item=>{
        if(performance.now()-item.at<1400){playCueBuffer(item.kind);return false;}return false;
      });
      }).catch(()=>{}).finally(()=>{audio._resumePromise=null;});
    }
    return ctx.state==='running';
  };
  const initialGetContext=audio._getContext.bind(audio);
  audio._getContext=()=>{const ctx=initialGetContext();ensureV17Buses();return ctx;};
  // Preserve global first-gesture handling. Each subsequent trusted gesture can
  // recover suspended/interrupted mobile AudioContexts without affecting UI.
  audio.activateFromGesture=(event)=>{
    const result=ORIGINAL.activate(event);
    if(!event?.isTrusted)return result;
    audio.ensureEffectsActive();
    if(signal()){
      audio.fireplace.start();
      if(!audio._v17WindTimer)startWindSchedule();
    }
    return result;
  };
  const gestureRecovery=e=>{
    if(!e.isTrusted)return;
    if(document.body.classList.contains('mistera-booting') && !e.target?.closest?.('#mistera-enter'))return;
    if(e.type==='pointerdown'&&e.button!==0)return;
    if(e.type==='keydown'&&(e.repeat||e.isComposing||['Shift','Control','Alt','Meta'].includes(e.key)))return;
    if(audio._visitHasGesture)audio.ensureEffectsActive();
    if(signal()&&audio.fireplace.element.paused)audio.fireplace.start();
  };
  document.addEventListener('pointerdown',gestureRecovery,true);
  document.addEventListener('keydown',gestureRecovery,true);
  const tryRecovery=()=>{
    if(audio._visitHasGesture && (audio.soundEffectsEnabled||audio.ambientMusicEnabled))audio.ensureEffectsActive();
    if(document.hidden){clearTimeout(audio._v17WindTimer);audio._v17WindTimer=0;}
    else if(signal()&&audio._visitHasGesture&&!audio._v17WindTimer)startWindSchedule();
  };
  document.addEventListener('visibilitychange',tryRecovery);
  window.addEventListener('pageshow',tryRecovery);
  window.addEventListener('focus',tryRecovery);

  function startWindSchedule(){
    if(audio._v17WindTimer||!signal()||document.hidden)return;
    const next=5000+Math.random()*10000;
    audio._v17WindTimer=setTimeout(()=>{
      audio._v17WindTimer=0;
      if(signal()&&!document.hidden)playWind();
      startWindSchedule();
    },next);
  }
  function playWind(){
    const ctx=audio.context,buffer=audio._v17Buffers.wind;
    if(!ctx||ctx.state!=='running'||!buffer||!audio._v17AmbientBus)return;
    const offset=Math.random()*Math.max(0,buffer.duration-9.5);
    const length=Math.min(buffer.duration-offset,8+Math.random()*2);
    const src=ctx.createBufferSource(),g=ctx.createGain(),now=ctx.currentTime;
    src.buffer=buffer;g.gain.setValueAtTime(.0001,now);
    g.gain.linearRampToValueAtTime(.66,now+1.2);
    g.gain.setValueAtTime(.66,now+Math.max(1.3,length-1.5));
    g.gain.linearRampToValueAtTime(.0001,now+length);
    src.connect(g);g.connect(audio._v17AmbientBus);
    src.start(now,offset,length);src.stop(now+length+.01);
    src.onended=()=>{try{src.disconnect();g.disconnect();}catch(_){}};
  }
  audio.setAmbientMusicEnabled=(on,e=null)=>{
    const previously=audio.ambientMusicEnabled;
    ORIGINAL.setEnabled(on,e);
    if(!on){audio.fireplace.stop();clearTimeout(audio._v17WindTimer);audio._v17WindTimer=0;}
    else if(!previously&&e?.isTrusted){audio.fireplace.start();startWindSchedule();}
    if(audio._v17AmbientBus)audio._v17AmbientBus.gain.value=on?audio.ambientMusicVolume:0;
    window.dispatchEvent(new CustomEvent('mistera:ambient-toggle',{detail:{enabled:!!on}}));
  };
  audio.setAmbientMusicVolume=(value)=>{
    ORIGINAL.setVolume(value);
    audio.fireplace.setVolume(audio.ambientMusicVolume);
    if(audio._v17AmbientBus)audio._v17AmbientBus.gain.value=signal()?audio.ambientMusicVolume:0;
  };
  audio.setSoundEffectsEnabled=((original)=>function(on,e=null){
    original(on,e);if(audio._v17CueBus)audio._v17CueBus.gain.value=on?.5:0;
  })(audio.setSoundEffectsEnabled.bind(audio));
  audio.getStats=()=>({...ORIGINAL.getStats(),fireplace:audio.fireplace.status(),
    windLoaded:!!audio._v17Buffers.wind,cuesLoaded:!!audio._v17Buffers.open&&!!audio._v17Buffers.close&&!!audio._v17Buffers.tree&&!!audio._v17Buffers.dock&&!!audio._v17Buffers.locked,
    ambientChannelsMuted:!signal(),ambientVolume:audio.ambientMusicVolume,cuesPlayed:audio._v17CueCount});
  audio.destroy=()=>{
    clearTimeout(audio._v17WindTimer);audio._v17WindTimer=0;
    document.removeEventListener('pointerdown',gestureRecovery,true);
    document.removeEventListener('keydown',gestureRecovery,true);
    document.removeEventListener('visibilitychange',tryRecovery);
    window.removeEventListener('pageshow',tryRecovery);
    window.removeEventListener('focus',tryRecovery);
    audio.fireplace.destroy();ORIGINAL.destroy();
  };
  // Ambient preference from the previous version already applies to all 3 streams.
  // Music is kept at 10% unless the user explicitly chooses a different setting.
  try {
    const old = localStorage.getItem('mistera-audio-music-volume-v16');
    if(old===null || Math.abs(Number(old)-.40)<.0001)audio.setAmbientMusicVolume(.10);
  } catch(_) {audio.setAmbientMusicVolume(.10);}
})();
