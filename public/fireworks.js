'use strict';
/* MISTERA V18 — denser bounded fireworks, unchanged source sounds, shared limited effects bus.
 * Audio is routed through the global AudioManager with independent effects/music buses.
 * Visual fireworks remain outside the clipped sky layer and behind the tree art.
 */
(function(){
  const palettes=[
    ['#ffe6a5','#ffc77b','#f1ae66','#f6edc2'], // golden champagne
    ['#ef9795','#f6b6a8','#ffe3c1','#e67678'], // Christmas red
    ['#73bd9a','#9fe3bd','#d7f2c8','#e9d68c'], // fir green
    ['#c1daef','#90bde1','#f5f1dd','#b8e7eb'], // winter blue
    ['#f5b8d2','#f8d5e3','#ffdce8','#dba5c9']  // pastel rose
  ];
  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  class SoftFireworkAudio {
    constructor(manager){this.manager=manager;this.master=null;this.noiseBuffer=null;this.count=0;
      this.launchClip=null;this.launchBytes=null;this.launchLoad=null;this.launchDecode=null;
      // Small local original source, derived by synthesis from CC0 field-recording characteristics.
      // MP3 for widest mobile browser compatibility; source WAV is also in assets/audio.
      this.launchLoad=fetch('assets/audio/lanzamiento-siseo-v20.mp3')
        .then(r=>{if(!r.ok)throw new Error('launch audio unavailable');return r.arrayBuffer();})
        .then(buf=>{this.launchBytes=buf;if(this.context)this.decodeLaunch();})
        .catch(()=>{});
    }
    get context(){return this.manager?.context||null;}
    get enabled(){return !!this.manager?.soundEffectsEnabled;}
    get volume(){return this.manager?.soundEffectsVolume??.45;}
    decodeLaunch(){
      if(this.context && this.launchBytes && !this.launchClip && !this.launchDecode){
        this.launchDecode=this.context.decodeAudioData(this.launchBytes.slice(0))
          .then(buffer=>{this.launchClip=buffer;this.launchBytes=null;})
          .catch(()=>{}).finally(()=>{this.launchDecode=null;});
      }
    }
    setEnabled(v){this.manager?.setSoundEffectsEnabled(v);}
    setVolume(v){this.manager?.setSoundEffectsVolume(v);}
    prepare(){
      const ac=this.context;
      if(!ac || this.master || !this.manager?.effectsBus)return;
      this.master=ac.createGain();
      // A fixed local balance matches V12. Main volume is on the effects bus.
      this.master.gain.value=.33;
      this.master.connect(this.manager.effectsBus);
      const len=Math.ceil(ac.sampleRate*1.45);
      this.noiseBuffer=ac.createBuffer(1,len,ac.sampleRate);
      const a=this.noiseBuffer.getChannelData(0);
      for(let i=0;i<len;i++)a[i]=Math.random()*2-1;
      this.decodeLaunch();
    }
    unlock(){
      // Effects are independent of the environmental mute. When the browser
      // suspends WebAudio after mobile/desktop layout changes, request recovery.
      this.manager?.ensureEffectsActive?.();
      this.prepare();
      return Promise.resolve(this.manager?.audioReady||false);
    }
    canPlay(){
      if(!this.enabled || this.volume<=.001)return false;
      if(this.context?.state!=='running')this.manager?.ensureEffectsActive?.();
      if(this.context?.state!=='running')return false;
      this.prepare();return !!this.master;
    }
    launch(variation=0){
      // Reliable short native media playback, with the existing synthesis as fallback.
      if(this.enabled&&this.manager?.playFireworkNative?.('launch',
          {playbackRate:.96+variation*.09},()=>this.launchSynthetic(variation))){this.count++;return;}
      this.launchSynthetic(variation);
    }
    launchSynthetic(variation=0){
      if(!this.canPlay())return;
      try {
        const ac=this.context,t=ac.currentTime;
        if(this.launchClip){
          // Distant natural-sounding airy pyrotechnic lift, softer than the explosions.
          const src=ac.createBufferSource(),gain=ac.createGain();
          src.buffer=this.launchClip;src.playbackRate.value=.96+variation*.09;
          gain.gain.setValueAtTime(.13,t);
          gain.gain.linearRampToValueAtTime(.25,t+.17);
          gain.gain.setValueAtTime(.21,t+.70);
          gain.gain.exponentialRampToValueAtTime(.001,t+1.48);
          src.connect(gain);gain.connect(this.master);
          src.start(t);src.stop(t+1.52);this.count++;return;
        }
        // Fallback for a transient decoding delay: NO previous sawtooth / watery plop.
        const whoosh=ac.createBufferSource(),filter=ac.createBiquadFilter(),ng=ac.createGain();
        whoosh.buffer=this.noiseBuffer;filter.type='bandpass';filter.Q.value=.28;
        filter.frequency.setValueAtTime(1200,t);
        ng.gain.setValueAtTime(.0001,t);
        ng.gain.linearRampToValueAtTime(.08,t+.16);
        ng.gain.exponentialRampToValueAtTime(.0001,t+1.25);
        whoosh.connect(filter);filter.connect(ng);ng.connect(this.master);
        whoosh.start(t,.02);whoosh.stop(t+1.26);this.count++;
      }catch(_){}
    }
    explosion({heart=false,size=1,travelDelay=.15}={}){
      const playSound=()=>{
        if(this.enabled&&this.manager?.playFireworkNative?.('explosion',
            {playbackRate:heart?1.10:.95+Math.random()*.12},
            ()=>this.explosionSynthetic({heart,size}))){this.count++;return;}
        this.explosionSynthetic({heart,size});
      };
      // Short atmospheric light-to-sound delay, including on mobile.
      setTimeout(playSound,Math.round(travelDelay*1000));
    }
    explosionSynthetic({heart=false,size=1}={}){
      if(!this.canPlay())return;
      try{
        const ac=this.context,t=ac.currentTime;
        const broad=ac.createBufferSource(),lp=ac.createBiquadFilter(),ng=ac.createGain();
        broad.buffer=this.noiseBuffer;lp.type='lowpass';lp.frequency.setValueAtTime(780+rand(0,280),t);
        lp.frequency.exponentialRampToValueAtTime(135,t+.63);
        ng.gain.setValueAtTime(.0001,t);ng.gain.linearRampToValueAtTime(.33*size*(heart?.80:1),t+.024);
        ng.gain.exponentialRampToValueAtTime(.0001,t+.74);
        broad.connect(lp);lp.connect(ng);ng.connect(this.master);
        broad.start(t,rand(.1,.4));broad.stop(t+.76);
        const thump=ac.createOscillator(),tg=ac.createGain();
        thump.type='sine';thump.frequency.setValueAtTime(100+rand(-18,24),t);
        thump.frequency.exponentialRampToValueAtTime(39,t+.40);
        tg.gain.setValueAtTime(.0001,t);tg.gain.linearRampToValueAtTime(.42*size,t+.028);
        tg.gain.exponentialRampToValueAtTime(.0001,t+.42);
        thump.connect(tg);tg.connect(this.master);thump.start(t);thump.stop(t+.44);
        this.count++;
      }catch(_){}
    }
    stop(){ /* Existing audio has a natural sub-second decay. */ }
  }
  class MisteraFireworks {
    constructor(canvas,host){
      this.canvas=canvas;this.host=host;this.ctx=canvas.getContext('2d',{alpha:true});
      this.w=1;this.h=1;this.raf=0;this.last=0;this.drawLast=0;this.endAt=0;this.nextLaunch=0;
      this.rockets=[];this.sparks=[];this.bursts=0;this.launches=0;this.hearts=0;
      this.running=false;this.pausedByPage=false;this.launchCap=0;this.maxConcurrent=7;this.drawCostMs=0;this.drawSamples=0;
      this.sparkSprites=new Map();this.geometry={headerBottom:62,skyBottom:195,flightSourceY:480};
      this.audio=new SoftFireworkAudio(window.__misteraAudio);this.resize();
      document.addEventListener('visibilitychange',()=>{
        if(document.hidden){this.pausedByPage=this.running;cancelAnimationFrame(this.raf);this.raf=0;}
        else if(this.pausedByPage&&this.running){
          this.pausedByPage=false;this.last=0;this.audio.unlock();
          this.raf=requestAnimationFrame(this.tick);
        }
      });
      window.addEventListener('resize',()=>{
        if(this.running)this.audio.manager?.ensureEffectsActive?.();
      });
    }
    setSoundEnabled(v){this.audio.setEnabled(v);}
    setVolume(v){this.audio.setVolume(v);}
    unlockAudio(){return this.audio.unlock();}
    setGeometry(next){Object.assign(this.geometry,next);}
    resize(){
      const rect=this.host.getBoundingClientRect();if(!rect.width||!rect.height||!this.ctx)return;
      this.w=rect.width;this.h=rect.height;
      const dpr=Math.min(window.devicePixelRatio||1,1.45);
      const w=Math.round(this.w*dpr),h=Math.round(this.h*dpr);
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    isRunning(){return this.running;}
    getStats(){return {active:this.running,bursts:this.bursts,launches:this.launches,
      hearts:this.hearts,rockets:this.rockets.length,sparks:this.sparks.length,launchCap:this.launchCap,maxConcurrent:this.maxConcurrent,
      pausedByPage:this.pausedByPage,averageDrawMs:Math.round(this.drawCostMs/Math.max(1,this.drawSamples)*100)/100,
      soundEnabled:this.audio.enabled,audioState:this.audio.context?.state||'uninitialized',soundEvents:this.audio.count,
      nativeEffects:this.audio.manager?.getEffectDiagnostics?.()||null};}
    play({duration=60000}={}){
      if(!this.ctx||matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('no-motion'))return false;
      this.stop();this.resize();this.audio.unlock();
      if(this.w<10||this.h<50)return false;
      this.running=true;this.pausedByPage=false;this.bursts=0;this.launches=0;this.hearts=0;this.last=0;
      this.drawCostMs=0;this.drawSamples=0;
      const showMs=clamp(duration,3000,60000);
      this.endAt=performance.now()+showMs;
      // V15 averaged ~1 rocket/s (ceiling 3). This cap keeps the new show under 3x.
      this.launchCap=Math.max(8,Math.floor(showMs/1000*2.70));
      this.nextLaunch=performance.now()+130;
      // Audio was prepared on the first trusted global gesture when permitted.
      this.raf=requestAnimationFrame(this.tick);
      return true;
    }
    launch(){
      if(this.rockets.length>=this.maxConcurrent || this.launches>=this.launchCap)return;
      const g=this.geometry,skyTop=Math.max(9,g.headerBottom||62),skyBottom=clamp(g.skyBottom||190,skyTop+30,this.h*.55);
      // Plaza-centered launches, slightly LEFT or RIGHT of the tree, never from its star.
      const lane=Math.random()<.5?rand(.353,.413):rand(.587,.649);
      const startX=this.w*lane;
      const startY=clamp(g.flightSourceY||this.h*.64,skyBottom+72,this.h-10);
      const targetX=this.w*rand(.20,.77);
      const targetY=rand(skyTop+Math.min(22,(skyBottom-skyTop)*.16),skyBottom-Math.min(21,(skyBottom-skyTop)*.16));
      const rocket={x:startX,y:startY,fromX:startX,fromY:startY,toX:targetX,toY:targetY,
        age:0,life:rand(1.05,1.58),trail:[],wiggle:rand(-5,5),color:'#ffe3a3'};
      this.rockets.push(rocket);this.launches++;this.audio.launch(rand(0,1));
    }
    burst(x,y){
      this.bursts++;
      const shape=this.bursts%5===2?'heart':['peony','ring','chrysanthemum','willow','peony'][Math.floor(rand(0,5))];
      if(shape==='heart')this.hearts++;
      const palette=shape==='heart'?palettes[4]:palettes[Math.floor(rand(0,4))];
      // A modest range of blossom sizes, never radically different.
      const skySpan=Math.max(45,(this.geometry.skyBottom||190)-(this.geometry.headerBottom||62));
      const radius=clamp(Math.min(this.w*.13,skySpan*.48)*rand(.86,1.20),20,68);
      const count=(this.w<355?57:72)+Math.floor(rand(-7,12));
      for(let i=0;i<count;i++){
        const t=i*2*Math.PI/count;
        let vx,vy;
        if(shape==='heart'){
          const xh=16*Math.sin(t)**3;
          const yh=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
          const strength=rand(.90,1.08)*radius*2.2/17;
          vx=xh*strength;vy=-yh*strength;
        } else {
          const angle=t+rand(-.19,.19);
          let speed=radius*rand(1.12,2.7);
          if(shape==='ring')speed=radius*rand(2.20,2.51);
          if(shape==='willow')speed=radius*rand(1.1,2.0);
          vx=Math.cos(angle)*speed;vy=Math.sin(angle)*speed;
        }
        this.sparks.push({x,y,vx,vy,age:0,life:rand(1.33,2.70),
          radius:rand(.58,1.45)*(shape==='heart'?1.13:1),
          color:palette[i%palette.length],gravity:shape==='heart'?6:shape==='willow'?26:15,
          friction:shape==='heart'?.989:.980,seed:rand(0,10),shape});
      }
      this.audio.explosion({heart:shape==='heart',size:radius/55,travelDelay:rand(.12,.24)});
    }
    step(dt){
      const now=performance.now();
      if(now<this.endAt&&now>=this.nextLaunch){
        const chance=Math.random(),volley=chance<.045?3:chance<.245?2:1;
        for(let i=0;i<volley;i++)this.launch();
        this.nextLaunch=now+rand(420,660);
      }
      // Compact in place: avoids 60-120 new filter arrays/second at peak.
      let j=0;
      for(let i=0;i<this.rockets.length;i++){
        const r=this.rockets[i];r.age+=dt;
        const p=clamp(r.age/r.life,0,1);
        r.trail.push({x:r.x,y:r.y});if(r.trail.length>17)r.trail.shift();
        const rise=1-Math.pow(1-p,1.36);
        r.x=r.fromX+(r.toX-r.fromX)*p+Math.sin(Math.PI*p)*r.wiggle;
        r.y=r.fromY+(r.toY-r.fromY)*rise;
        if(p>=1)this.burst(r.x,r.y);
        else this.rockets[j++]=r;
      }
      this.rockets.length=j;
      let k=0;
      for(let i=0;i<this.sparks.length;i++){
        const v=this.sparks[i];v.age+=dt;if(v.age>=v.life)continue;
        const drag=Math.pow(v.friction,dt*60);
        v.vx*=drag;v.vy=v.vy*drag+v.gravity*dt;
        v.x+=v.vx*dt;v.y+=v.vy*dt;
        if(v.x>-100&&v.x<this.w+100&&v.y<this.h+100)this.sparks[k++]=v;
      }
      this.sparks.length=k;
    }
    getSparkSprite(color){
      let sprite=this.sparkSprites.get(color);
      if(sprite)return sprite;
      sprite=document.createElement('canvas');sprite.width=sprite.height=24;
      const g=sprite.getContext('2d',{alpha:true});
      const grad=g.createRadialGradient(12,12,0,12,12,10);
      grad.addColorStop(0,'#ffffff');grad.addColorStop(.12,'#fffdf7');
      grad.addColorStop(.28,color);grad.addColorStop(.58,color+'aa');grad.addColorStop(1,color+'00');
      g.fillStyle=grad;g.fillRect(0,0,24,24);
      this.sparkSprites.set(color,sprite);return sprite;
    }
    render(){
      const before=performance.now(),c=this.ctx;
      c.clearRect(0,0,this.w,this.h);
      c.save();c.globalCompositeOperation='lighter';
      for(const r of this.rockets){
        if(r.trail.length){
          c.lineWidth=1.15;c.shadowBlur=0;c.strokeStyle='rgba(250,222,164,.22)';
          c.beginPath();c.moveTo(r.trail[0].x,r.trail[0].y);
          for(let i=1;i<r.trail.length;i++)c.lineTo(r.trail[i].x,r.trail[i].y);
          c.lineTo(r.x,r.y);c.stroke();
        }
        c.globalAlpha=.94;c.fillStyle='#fff5cb';
        c.beginPath();c.arc(r.x,r.y,1.75,0,Math.PI*2);c.fill();
      }
      c.shadowBlur=0;
      for(let i=0;i<this.sparks.length;i++){
        const v=this.sparks[i],fade=Math.pow(Math.max(0,1-v.age/v.life),.82);
        // Brighter sharp centers. Reduced per-spark paths keep busy bursts fluid.
        if((i&3)===0){
          c.lineWidth=Math.max(.5,v.radius*.53);c.strokeStyle=v.color;c.globalAlpha=.25*fade;
          c.beginPath();c.moveTo(v.x-v.vx*.09,v.y-v.vy*.09);
          c.lineTo(v.x,v.y);c.stroke();
        }
        c.globalAlpha=fade*.92;
        const size=Math.max(3.5,v.radius*5.1);
        c.drawImage(this.getSparkSprite(v.color),v.x-size*.5,v.y-size*.5,size,size);
        c.globalAlpha=fade*.86;c.fillStyle=v.color;
        c.fillRect(v.x-.64,v.y-.64,1.28,1.28);
      }
      c.restore();
      this.drawCostMs+=performance.now()-before;this.drawSamples++;
    }
    tick=(time)=>{
      if(!this.running)return;
      if(!this.last)this.last=time;
      const dt=clamp((time-this.last)/1000||0,0,.05);this.last=time;
      this.step(dt);if(!this.drawLast||time-this.drawLast>=17){this.render();this.drawLast=time;}
      if(time>this.endAt&&!this.rockets.length&&!this.sparks.length){this.stop();return;}
      this.raf=requestAnimationFrame(this.tick);
    };
    stop(){
      this.running=false;this.pausedByPage=false;cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.drawLast=0;
      this.rockets.length=0;this.sparks.length=0;
      this.ctx?.clearRect(0,0,this.w,this.h);this.audio.stop();
    }
  }
  window.MisteraFireworks=MisteraFireworks;
})();
