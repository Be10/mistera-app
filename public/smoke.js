'use strict';
/* MISTERA V7 — Organic chimney smoke. Coordinates in the 941x1672 village canvas.
   Configurable emission positions and +25% default visibility. 100% local / free. */
(function () {
  const BASE_W = 941;
  const BASE_H = 1671;

  function smokeSprite(variant) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 112;
    const c = sprite.getContext('2d');
    const lobeSets = [
      [[.43,.57,.33,.28,.39],[.57,.48,.30,.29,.34],[.51,.40,.23,.24,.28],[.34,.48,.21,.19,.21],[.66,.60,.19,.22,.18]],
      [[.54,.53,.34,.29,.37],[.40,.43,.26,.24,.29],[.62,.38,.22,.24,.23],[.32,.61,.23,.20,.17],[.56,.65,.23,.20,.22]],
      [[.51,.51,.34,.32,.39],[.39,.52,.26,.25,.25],[.64,.44,.27,.22,.27],[.47,.35,.24,.21,.23],[.66,.65,.22,.23,.19]]
    ];
    for(const [x,y,rx,ry,a] of lobeSets[variant % lobeSets.length]) {
      c.save(); c.translate(x*112,y*112); c.scale(rx,ry);
      const gradient=c.createRadialGradient(-9,-8,2,0,0,56);
      gradient.addColorStop(0,`rgba(196,208,225,${a})`);
      gradient.addColorStop(.4,`rgba(167,185,207,${a*.73})`);
      gradient.addColorStop(.72,`rgba(132,156,183,${a*.32})`);
      gradient.addColorStop(1,'rgba(132,156,183,0)');
      c.fillStyle=gradient;c.beginPath();c.arc(0,0,56,0,Math.PI*2);c.fill();c.restore();
    }
    return sprite;
  }
  class ChimneySmoke {
    constructor({canvas,frame,houses,positions={}}) {
      this.canvas=canvas;
      this.frame=frame;
      this.ctx=canvas.getContext('2d',{alpha:true});
      this.emitters=new Map(houses.map(h=>[h.day,{
        day:h.day,x:h.chimney[0],y:h.chimney[1],t:Math.random()
      }]));
      this.sprites=[smokeSprite(0),smokeSprite(1),smokeSprite(2)];
      this.visibility=1.25;
      this.lit=new Set();
      this.particles=[];
      this.raf=0;
      this.prev=0;
      this.frameStep=0;
      this.setPositions(positions);
      this.resize=()=>{
        const r=frame.getBoundingClientRect();if(!r.width||!r.height)return;
        const dpr=Math.min(window.devicePixelRatio||1,1.8);
        const w=Math.max(1,Math.round(r.width*dpr));
        const h=Math.max(1,Math.round(r.height*dpr));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        this.ctx.setTransform(w/BASE_W,0,0,h/BASE_H,0,0);
      };
      this.observer=new ResizeObserver(this.resize);
      this.observer.observe(frame);
      this.resize();
    }
    setOpacityMultiplier(factor){
      if(Number.isFinite(factor))this.visibility=Math.max(.5,Math.min(2,factor));
    }
    setPositions(positions={}){
      Object.entries(positions).forEach(([id,point])=>{
        const day=Number(id);const e=this.emitters.get(day);
        if(!e||!Array.isArray(point)||point.length!==2)return;
        const [x,y]=point.map(Number);
        if(!Number.isFinite(x)||!Number.isFinite(y))return;
        const nx=Math.min(BASE_W,Math.max(0,x));
        const ny=Math.min(BASE_H,Math.max(0,y));
        if(nx!==e.x||ny!==e.y){
          e.x=nx;e.y=ny;e.t=.8;
          // Old puffs from a previous, incorrect location are removed.
          this.particles=this.particles.filter(p=>p.day!==day);
        }
      });
    }
    setLit(days,prefill=false){
      const incoming=new Set(days);
      for(const day of this.lit)if(!incoming.has(day)){
        this.particles=this.particles.filter(p=>p.day!==day);
      }
      for(const day of incoming){
        if(this.lit.has(day))continue;
        const e=this.emitters.get(day);if(!e)continue;
        e.t=.12+Math.random()*.35;
        if(prefill){
          for(let k=0;k<3;k++){
            const p=this.makeParticle(e);
            p.age=(k+.5)*p.life/3.8;
            this.particles.push(p);
          }
        }
      }
      this.lit=incoming;
      if(!this.lit.size)this.clear();
    }
    makeParticle(e){
      const life=4.8+Math.random()*2.2;
      return {
        day:e.day,x:e.x+(Math.random()-.5)*3,y:e.y-1.2,
        age:0,life,rise:(8.8+Math.random()*6.6)*2,
        drift:2.0+Math.random()*3.6,phase:Math.random()*6.283,
        swing:1.7+Math.random()*4.4,size:19+Math.random()*14,
        opacity:.50+Math.random()*.22,sprite:this.sprites[Math.floor(Math.random()*this.sprites.length)]
      };
    }
    step(delta){
      const dt=Math.min(delta,.12);
      for(const e of this.emitters.values()){
        if(!this.lit.has(e.day))continue;
        e.t+=dt;
        while(e.t>=.82){e.t-=.82;this.particles.push(this.makeParticle(e));}
      }
      for(const p of this.particles)p.age+=dt;
      this.particles=this.particles.filter(p=>p.age<p.life&&this.lit.has(p.day));
      this.draw();
    }
    draw(){
      const c=this.ctx;c.clearRect(0,0,BASE_W,BASE_H);
      if(!this.particles.length)return;
      const byHouse=new Map();
      for(const p of this.particles){if(!byHouse.has(p.day))byHouse.set(p.day,[]);byHouse.get(p.day).push(p);}
      for(const [day,puffs] of byHouse){
        const e=this.emitters.get(day);if(!e)continue;
        c.save();
        // Emitter is manually placed at the chimney LIP; hide smoke below it.
        c.beginPath();c.rect(e.x-95,0,190,Math.max(0,e.y+1));c.clip();
        for(const p of puffs){
          const age=p.age/p.life;
          const x=p.x+age*p.life*p.drift+Math.sin(age*7+p.phase)*p.swing*age;
          const y=p.y-p.age*p.rise;
          const size=p.size*(1+age*.75);
          const entrance=Math.min(1,p.age/.28);
          const exit=Math.pow(1-age,1.5);
          c.globalAlpha=Math.min(1,p.opacity*this.visibility*entrance*exit);
          c.drawImage(p.sprite,x-size*.5,y-size*.58,size,size*1.12);
        }
        c.restore();
      }
      c.globalAlpha=1;
    }
    tick=(now)=>{
      this.raf=window.requestAnimationFrame(this.tick);
      if(!this.prev){this.prev=now;return;}
      const dt=Math.min((now-this.prev)/1000,.1);
      this.prev=now;this.frameStep+=dt;
      if(this.frameStep<1/24)return;
      this.step(this.frameStep);this.frameStep=0;
    };
    start(){if(!this.raf&&this.lit.size&&this.ctx){this.prev=0;this.frameStep=0;this.raf=window.requestAnimationFrame(this.tick);}}
    stop(){if(this.raf)window.cancelAnimationFrame(this.raf);this.raf=0;this.prev=0;this.clear();}
    clear(){this.ctx?.clearRect(0,0,BASE_W,BASE_H);}
  }
  window.MisteraChimneySmoke=ChimneySmoke;
})();
