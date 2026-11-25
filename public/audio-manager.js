'use strict';
/* MISTERA V16 — globally unlocked music and dynamically limited 200% effect gain.
 * Audio effects use ONE shared AudioContext; long-form ambient music is streamed
 * through its native HTMLAudioElement output. This deliberately avoids routing
 * the 39-MB MP3 through a suspended Web Audio context (the V14 silent-output
 * failure), while sharing one manager, persisted preferences and trusted-gesture
 * handling. HTMLMediaElement.volume can be device-controlled on iOS Safari.
 */
(function () {
  if (window.__misteraAudio) return;
  const KEYS = {
    effects:'mistera-audio-effects-enabled-v13',
    effectsVolume:'mistera-audio-effects-volume-v16',
    music:'mistera-audio-music-enabled-v14',
    musicVolume:'mistera-audio-music-volume-v16'
  };
  const config = window.MISTERA_AUDIO_CONFIG || {};
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const get=k=>{try{return localStorage.getItem(k);}catch(_){return null;}};
  const set=(k,v)=>{try{localStorage.setItem(k,String(v));}catch(_){}};
  const enabled=(k,initial)=>get(k)==null?initial:get(k)==='yes';
  const volume=(k,initial)=>get(k)==null?initial:Number.isFinite(Number(get(k)))?
    clamp(Number(get(k)),0,1):initial;
  class AudioManager {
    constructor(){
      const oldEffects=get('mistera-fireworks-sound-v10');
      const oldVol=get('mistera-fireworks-volume-v10');
      this.soundEffectsEnabled=enabled(KEYS.effects,oldEffects==null?true:oldEffects==='yes');
      // V16: 200% is a 2.0x gain setting, not a PCM level above digital full scale.
      this.soundEffectsVolume=clamp(Number(get(KEYS.effectsVolume)??2),0,2);
      this.ambientMusicEnabled=enabled(KEYS.music,true);
      // Migrate a genuinely customized V15 preference; upgrade the former 35% default to 40%.
      const previousMusic=get('mistera-audio-music-volume-v13');
      const customMusic=previousMusic!==null&&Number.isFinite(Number(previousMusic))&&
        Math.abs(Number(previousMusic)-.35)>.001?Number(previousMusic):null;
      this.ambientMusicVolume=volume(KEYS.musicVolume,customMusic??config.musicDefaultVolume??.40);
      this.context=null;this.effectsBus=null;this.effectsDynamics=null;this.effectsLimiter=null;
      this.effectsPeakGuard=null;this.audioReady=false;
      this._contextCount=0;this._resumePromise=null;this._playPromise=null;
      this._destroyed=false;this._listenerInstalled=false;this._visitHasGesture=false;
      this._attempts=0;this._musicPlaying=false;this._musicStarted=false;
      this._musicError=null;this._isBuffering=false;this._initialSeekFinished=false;
      this._seekPrepared=false;this._randomStart=null;this._musicFadeFrame=0;
      this._seekRecoveryTimer=0;this._seekFallbackUsed=false;this._randomSeekRetries=0;
      this._loopSeekPending=false;this._musicSourceUrl=config.musicFile ||
        'assets/audio/villancicos-instrumentales-jumisca.mp3';
      this._durationHint=Number(config.durationHintSeconds)||0;
      this._onGesture=this._onGesture.bind(this);
      this._onVisibility=this._onVisibility.bind(this);
      this._onStateChange=this._onStateChange.bind(this);
      this._onMetadata=this._onMetadata.bind(this);
      this._onSeeked=this._onSeeked.bind(this);
      this._onEnded=this._onEnded.bind(this);
      this._onPlaying=this._onPlaying.bind(this);
      this._onPaused=this._onPaused.bind(this);
      this._onError=this._onError.bind(this);
      this.music=document.createElement('audio');
      this.music.setAttribute('playsinline','');
      this.music.setAttribute('webkit-playsinline','');
      this.music.preload=this.ambientMusicEnabled?'auto':'none';
      this.music.loop=false;
      this.music.volume=0; // silence until an ACTUAL seek and a 1.5s fade
      // V33: preload the 14.9-MB lightweight MP3 as a same-origin Blob before
      // the entrance. Seeking a local Blob is deterministic even on phones
      // whose HTTP Range request for a minute-35 offset stalls indefinitely.
      this._cachedMusicUrl=null;this._cachedMusicReady=null;
      this._musicCachePromise=this._prepareSeekableMusic();
      // Prepare an offline random offset from this file's validated duration.
      // loadedmetadata always checks it against the real file duration.
      if(this._durationHint>301){
        this._randomStart=1+Math.random()*(this._durationHint-301);
        // Do not seek before metadata: a remote Pages MP3 may stall while seeking.
      }
      this.music.addEventListener('loadedmetadata',this._onMetadata);
      this.music.addEventListener('durationchange',this._onMetadata);
      this.music.addEventListener('seeked',this._onSeeked);
      this.music.addEventListener('canplay',this._onSeeked);
      this.music.addEventListener('ended',this._onEnded);
      this.music.addEventListener('playing',this._onPlaying);
      this.music.addEventListener('pause',this._onPaused);
      this.music.addEventListener('waiting',()=>{this._isBuffering=true;});
      this.music.addEventListener('stalled',()=>{this._isBuffering=true;});
      this.music.addEventListener('error',this._onError);
      document.addEventListener('visibilitychange',this._onVisibility);
      window.addEventListener('pageshow',this._onVisibility);
      window.addEventListener('pagehide',e=>{if(!e.persisted)this.destroy();});
      this._refreshListeners();
      // Music source is initialized by _prepareSeekableMusic (stream fallback on failure).
    }
    async _prepareSeekableMusic(){
      // Fetch an already-optimized lightweight MP3 only once. The loader waits
      // for this promise; no future-day videos or private images are fetched.
      let controller=null,timer=0;
      try{
        if(typeof AbortController==='function')controller=new AbortController();
        if(controller)timer=setTimeout(()=>controller.abort(),14500);
        const response=await fetch(this._musicSourceUrl,{cache:'force-cache',signal:controller?.signal});
        if(!response.ok)throw new Error(`MP3 HTTP ${response.status}`);
        const blob=await response.blob();
        if(blob.size<100000||this._destroyed)throw new Error('MP3 vacío o descarga interrumpida');
        this._cachedMusicUrl=URL.createObjectURL(new Blob([blob],{type:'audio/mpeg'}));
        this.music.src=this._cachedMusicUrl;
        this.music.preload='auto';this.music.load();
        this._musicCacheStatus='local';
        return true;
      }catch(error){
        this._musicCacheStatus='stream';
        this._musicError=`Descarga local no disponible: ${error?.message||error}`;
        if(!this._destroyed){this.music.src=this._musicSourceUrl;this.music.preload='auto';this.music.load();}
        return false;
      }finally{if(timer)clearTimeout(timer);}
    }
    _getContext(){
      if(this.context||this._destroyed)return this.context;
      const Ctor=window.AudioContext||window.webkitAudioContext;
      if(!Ctor)return null;
      try{
        const ctx=new Ctor({latencyHint:'interactive'});
        this.context=ctx;this._contextCount++;
        this.effectsBus=ctx.createGain();
        this.effectsBus.gain.value=this.soundEffectsEnabled?this.soundEffectsVolume:0;
        // Dynamics control keeps clustered rockets and explosions from summing into hard clipping.
        // The peak stage is solely for the effects bus: music retains native HTMLAudioElement output.
        this.effectsDynamics=ctx.createDynamicsCompressor();
        this.effectsDynamics.threshold.value=-17;this.effectsDynamics.knee.value=15;
        this.effectsDynamics.ratio.value=5.5;this.effectsDynamics.attack.value=.004;
        this.effectsDynamics.release.value=.19;
        this.effectsLimiter=ctx.createDynamicsCompressor();
        this.effectsLimiter.threshold.value=-3;this.effectsLimiter.knee.value=0;
        this.effectsLimiter.ratio.value=20;this.effectsLimiter.attack.value=.002;
        this.effectsLimiter.release.value=.12;
        this.effectsBus.connect(this.effectsDynamics);
        this.effectsDynamics.connect(this.effectsLimiter);
        // Oversampled soft peak guard: combined volleys cannot exceed digital full scale.
        // Unlike a hard clip, it smoothly rounds extreme peaks only.
        this.effectsPeakGuard=ctx.createWaveShaper();
        const curve=new Float32Array(2049);
        const factor=Math.tanh(1.15);
        for(let i=0;i<curve.length;i++){
          const x=i/(curve.length-1)*2-1;
          curve[i]=.95*Math.tanh(1.15*x)/factor;
        }
        this.effectsPeakGuard.curve=curve;
        this.effectsPeakGuard.oversample='4x';
        this.effectsLimiter.connect(this.effectsPeakGuard);
        this.effectsPeakGuard.connect(ctx.destination);
        ctx.addEventListener('statechange',this._onStateChange);
        this._syncAudioReady();return ctx;
      }catch(e){this.audioReady=false;return null;}
    }
    _syncAudioReady(){
      this.audioReady=!!this.context && this.context.state==='running';
      this._refreshListeners();
    }
    _onStateChange(){this._syncAudioReady();}
    _refreshListeners(){
      if(this._destroyed)return;
      const need=(this.soundEffectsEnabled&&!this.audioReady) ||
        (this.ambientMusicEnabled && this.music.paused && !this._playPromise);
      if(need&&!this._listenerInstalled){
        document.addEventListener('pointerdown',this._onGesture,true);
        document.addEventListener('keydown',this._onGesture,true);
        this._listenerInstalled=true;
      }else if(!need&&this._listenerInstalled){
        document.removeEventListener('pointerdown',this._onGesture,true);
        document.removeEventListener('keydown',this._onGesture,true);
        this._listenerInstalled=false;
      }
    }
    _onGesture(e){
      if(!e.isTrusted)return;
      if(document.body.classList.contains('mistera-booting') && !e.target?.closest?.('#mistera-enter'))return;
      if(e.type==='pointerdown'&&e.button!==0)return;
      if(e.type==='keydown'&&(e.repeat||e.isComposing||['Shift','Control','Alt','Meta','Dead'].includes(e.key)))return;
      this.activateFromGesture(e);
    }
    activateFromGesture(e){
      if(!e?.isTrusted||this._destroyed||(!this.ambientMusicEnabled&&!this.soundEffectsEnabled))return false;
      this._visitHasGesture=true;this._attempts++;
      if(this.soundEffectsEnabled){
        const ctx=this._getContext();
        if(ctx && ctx.state!=='running'&&!this._resumePromise){
          try{
            this._resumePromise=Promise.resolve(ctx.resume()).catch(()=>{}).finally(()=>{
              this._resumePromise=null;this._syncAudioReady();
            });
          }catch(_){this._syncAudioReady();}
        }
      }
      // Crucially, play() runs NOW inside the real user gesture. The main MP3
      // never waits for a Promise, metadata callback, AudioContext, or fake click.
      if(this.ambientMusicEnabled && this.music.error){
        // Recover on the user's next gesture if a remote MP3 failed to load.
        clearTimeout(this._seekRecoveryTimer);this._seekRecoveryTimer=0;
        this._seekFallbackUsed=false;this._randomSeekRetries=0;
        this._seekPrepared=false;this._initialSeekFinished=false;
        this._musicError=null;
        try{this.music.load();}catch(_){}
      }
      if(this.ambientMusicEnabled){
        this._playMusicIfPossible(true);
        if(!this._initialSeekFinished)this._armSeekRecovery();
      }
      this._refreshListeners();return true;
    }
    _musicTargetVolume(){
      // The very light 48-kbps carol mix must be audible above wind and fire.
      // Preserve the ambient preference, but balance music independently (10% -> 28%).
      return clamp(this.ambientMusicVolume*2.8,0,1);
    }
    _armSeekRecovery(){
      if(!this._visitHasGesture||this._seekRecoveryTimer||this._initialSeekFinished||this._destroyed)return;
      this._seekRecoveryTimer=setTimeout(()=>{
        this._seekRecoveryTimer=0;
        if(this._initialSeekFinished||this._destroyed)return;
        const target=this._randomStart;
        if(target!=null&&!this.music.seeking&&this.music.readyState>=2&&
           Math.abs(this.music.currentTime-target)<1.5){this._finishInitialSeek();return;}
        // First try the same random point again; never replace with zero merely
        // because a remote request is slow. On devices with a restricted seekable
        // range, stop gating audible output after two attempts.
        if(++this._randomSeekRetries<=2){this._seekPrepared=false;this._onMetadata();return;}
        this._seekFallbackUsed=true;
        this._musicError='Inicio aleatorio limitado por el navegador; audio recuperado';
        if(this.music.readyState>=2&&!this.music.seeking){
          this._finishInitialSeek();
        }else{
          // Do not wait forever in silence even if the seeked event never fires.
          try{if(this.music.seeking)this.music.currentTime=Math.max(0,this.music.currentTime||0);}catch(_){}
          this._finishInitialSeek();
        }
      },3600);
    }
    _finishInitialSeek(){
      clearTimeout(this._seekRecoveryTimer);this._seekRecoveryTimer=0;
      this._initialSeekFinished=true;
      this._maybeFade();
    }
    _onMetadata(){
      const duration=this.music.duration;
      if(!Number.isFinite(duration)||duration<=0||this._destroyed)return;
      if(this._randomStart===null || Math.abs(duration-this._durationHint)>2){
        const low=duration>1.5?1:0;
        const high=duration>301?duration-300:Math.max(low,duration-.5);
        this._randomStart=low+Math.random()*Math.max(0,high-low);
        this._durationHint=duration;
        this._seekPrepared=false;
      }
      if(this._loopSeekPending||this._initialSeekFinished)return;
      // Attempt the random offset exactly once after the real metadata arrives.
      if(!this._seekPrepared){
        this._seekPrepared=true;
        if(Math.abs(this.music.currentTime-this._randomStart)>.6){
          try{this.music.currentTime=this._randomStart;}
          catch(e){
            // Temporary seek denial is common until a mobile browser has
            // buffered the remote range. Keep the chosen random timestamp.
            this._musicError='Esperando rango del MP3 para el inicio aleatorio';
            this._seekPrepared=false;
            this._armSeekRecovery();return;
          }
        }
      }
      if(!this.music.seeking && this.music.readyState>=2 && Math.abs(this.music.currentTime-this._randomStart)<1.2){
        this._finishInitialSeek();
      }else this._armSeekRecovery();
    }
    _onSeeked(){
      if(this._loopSeekPending){
        this._loopSeekPending=false;
        if(this.ambientMusicEnabled){
          this.music.volume=this._musicTargetVolume();
          if(this.music.paused)this._playMusicIfPossible(false);
        }
        return;
      }
      if(this._randomStart!==null && !this.music.seeking && this.music.readyState>=2 &&
         Math.abs(this.music.currentTime-this._randomStart)<1.2){
        this._finishInitialSeek();
      }
    }
    _onPlaying(){
      this._musicPlaying=true;this._musicStarted=true;this._isBuffering=false;
      if(!this._initialSeekFinished)this._armSeekRecovery();
      this._maybeFade();this._refreshListeners();
    }
    _onPaused(){this._musicPlaying=false;this._cancelFade();this._refreshListeners();}
    _onError(){
      const code=this.music.error?.code;
      this._musicError=code===4?'Formato MP3 no compatible o ruta inválida':
        code===3?'No se pudo decodificar el audio':
        code===2?'Falló la conexión o el streaming del MP3':'No se pudo cargar el MP3';
      this._musicPlaying=false;clearTimeout(this._seekRecoveryTimer);this._seekRecoveryTimer=0;
      this._refreshListeners();
    }
    _maybeFade(){
      if(this._misteraSuspended||document.hidden||!this.ambientMusicEnabled||!this._initialSeekFinished||this.music.paused||!this._musicPlaying)return;
      if(this._loopSeekPending)return;
      if(this._musicFadeFrame)return;
      if(this._musicStarted&&!this._fadedThisVisit){this._fadeMusic(true);this._fadedThisVisit=true;}
      else if(!this._fadedThisVisit){this._fadeMusic(true);this._fadedThisVisit=true;}
      else if(this.music.volume<.001)this._fadeMusic(true);
    }
    _cancelFade(){
      if(this._musicFadeFrame)cancelAnimationFrame(this._musicFadeFrame);
      this._musicFadeFrame=0;
    }
    _fadeMusic(fade){
      this._cancelFade();
      if(!this.ambientMusicEnabled)return;
      if(!fade){this.music.volume=this._musicTargetVolume();return;}
      this.music.volume=0;
      const start=performance.now();
      const step=now=>{
        this._musicFadeFrame=0;
        if(this._destroyed||!this.ambientMusicEnabled||this.music.paused)return;
        const x=clamp((now-start)/1500,0,1),smooth=x*x*(3-2*x);
        this.music.volume=clamp(this._musicTargetVolume()*smooth,0,1);
        if(x<1)this._musicFadeFrame=requestAnimationFrame(step);
      };
      this._musicFadeFrame=requestAnimationFrame(step);
    }
    _playMusicIfPossible(fade){
      if(this._destroyed||this._misteraSuspended||document.hidden||!this.ambientMusicEnabled||this.music.error)return false;
      if(!this.music.paused&&!this.music.ended){this._maybeFade();return true;}
      if(this._playPromise)return true;
      if(!this._initialSeekFinished)this.music.volume=0;
      else if(fade){this.music.volume=0;this._fadedThisVisit=false;}
      try{
        const result=this.music.play();
        this._playPromise=Promise.resolve(result).then(()=>{
          this._musicPlaying=!this.music.paused;this._musicError=null;
          this._maybeFade();
        }).catch(err=>{
          this._musicPlaying=false;
          this._musicError=err?.name||'Reproducción denegada';
        }).finally(()=>{this._playPromise=null;this._refreshListeners();});
        this._refreshListeners();
        return true;
      }catch(err){this._musicError=err?.name||'Reproducción denegada';this._refreshListeners();return false;}
    }
    _onEnded(){
      this._musicPlaying=false;this._cancelFade();
      if(this._destroyed||!this.ambientMusicEnabled)return;
      this._loopSeekPending=true;
      this._initialSeekFinished=true;
      const start=Number.isFinite(this.music.duration)&&this.music.duration>1?1:0;
      try{
        this.music.currentTime=start;
        if(!this.music.seeking)this._onSeeked();
      }catch(_){this._loopSeekPending=false;}
    }
    _onVisibility(){
      this._syncAudioReady();
      if(document.visibilityState==='visible'&&this._visitHasGesture&&this.ambientMusicEnabled&&
         this.music.paused&&!this.music.ended){
        // Browsers may still require a new gesture, which remains subscribed.
        this._refreshListeners();
      }
    }
    setSoundEffectsEnabled(on,e=null){
      this.soundEffectsEnabled=!!on;set(KEYS.effects,this.soundEffectsEnabled?'yes':'no');
      if(this.effectsBus)this.effectsBus.gain.value=this.soundEffectsEnabled?this.soundEffectsVolume:0;
      this._refreshListeners();if(this.soundEffectsEnabled&&e?.isTrusted)this.activateFromGesture(e);
    }
    setSoundEffectsVolume(value){
      this.soundEffectsVolume=clamp(Number(value)||0,0,2);set(KEYS.effectsVolume,this.soundEffectsVolume);
      if(this.effectsBus)this.effectsBus.gain.value=this.soundEffectsEnabled?this.soundEffectsVolume:0;
    }
    setAmbientMusicEnabled(on,e=null){
      this.ambientMusicEnabled=!!on;set(KEYS.music,this.ambientMusicEnabled?'yes':'no');
      if(!on){this._cancelFade();this.music.pause();this.music.volume=0;this._fadedThisVisit=false;}
      else{
        if(this.music.networkState===0)this.music.load();
        if(e?.isTrusted)this.activateFromGesture(e);
      }
      this._refreshListeners();
    }
    setAmbientMusicVolume(value){
      this.ambientMusicVolume=clamp(Number(value)||0,0,1);
      set(KEYS.musicVolume,this.ambientMusicVolume);
      if(!this._musicFadeFrame&&!this.music.paused&&this._initialSeekFinished)
        this.music.volume=this._musicTargetVolume();
    }
    retryMusicFromGesture(e){
      if(!e?.isTrusted)return false;
      if(!this.ambientMusicEnabled)this.setAmbientMusicEnabled(true,e);
      if(this.music.error){
        this._musicError=null;this.music.load();
      }
      return this.activateFromGesture(e);
    }
    getStats(){
      const t=this.music.currentTime;
      return {
        soundEnabled:this.soundEffectsEnabled,soundEffectsEnabled:this.soundEffectsEnabled,
        soundEffectsVolume:this.soundEffectsVolume,ambientMusicEnabled:this.ambientMusicEnabled,
        ambientMusicVolume:this.ambientMusicVolume,audioReady:this.audioReady,
        audioState:this.context?.state||'uninitialized',contextCount:this._contextCount,
        gestureAttempts:this._attempts,musicDuration:Number.isFinite(this.music.duration)?this.music.duration:null,
        randomStartSeconds:this._randomStart,musicTime:t,
        musicPlaying:!this.music.paused&&!this.music.ended&&this.music.readyState>=2,
        musicSeekPrepared:this._initialSeekFinished,
        musicWaitingForInitialSeek:!this._initialSeekFinished,
        musicReadyState:this.music.readyState,musicNetworkState:this.music.networkState,
        musicPaused:this.music.paused,musicGain:this.music.volume,
        musicTargetVolume:this._musicTargetVolume(),musicSeekFallback:this._seekFallbackUsed,
        musicAudible:!this.music.paused&&!this.music.muted&&this.music.volume>.01&&this._initialSeekFinished,
        musicIsBuffering:this._isBuffering,musicError:this._musicError,musicCache:this._musicCacheStatus||'pending',
        musicOutput:'HTMLAudioElement',awaitingGesture:this._listenerInstalled
      };
    }
    destroy(){
      if(this._destroyed)return;this._destroyed=true;
      document.removeEventListener('pointerdown',this._onGesture,true);
      document.removeEventListener('keydown',this._onGesture,true);
      document.removeEventListener('visibilitychange',this._onVisibility);
      window.removeEventListener('pageshow',this._onVisibility);
      clearTimeout(this._seekRecoveryTimer);this._seekRecoveryTimer=0;
      this._cancelFade();this.music.pause();
      if(this._cachedMusicUrl){URL.revokeObjectURL(this._cachedMusicUrl);this._cachedMusicUrl=null;}
      this.music.removeEventListener('loadedmetadata',this._onMetadata);
      this.music.removeEventListener('durationchange',this._onMetadata);
      this.music.removeEventListener('seeked',this._onSeeked);
      this.music.removeEventListener('canplay',this._onSeeked);
      this.music.removeEventListener('ended',this._onEnded);
      this.music.removeEventListener('playing',this._onPlaying);
      this.music.removeEventListener('pause',this._onPaused);
      this.music.removeEventListener('error',this._onError);
      this.context?.removeEventListener('statechange',this._onStateChange);
      this.context?.close().catch(()=>{});
    }
  }
  window.MisteraAudioManager=AudioManager;
  window.__misteraAudio=new AudioManager();
})();
