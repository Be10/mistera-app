'use strict';
/* MISTERA V17 — 5s first clear sky, 10s display, 10s clear sky.
 * The first visit is blank for 5s. Never changes the approved stellar art.
 * All stages use wall clock time; the permanent Christmas dedication overrides
 * every automatic or manual state from 2026-12-25T00:00:00-05:00 onward.
 */
(function(){
  const CHRISTMAS_START=Date.parse('2026-12-25T00:00:00-05:00');
  const INTRO_MS=5000;
  const VISIBLE_MS=10000;
  const BLANK_MS=10000;
  const FADE_MS=2200;
  const FINAL='Feliz Navidad ❤️';
  const HISTORY_KEY='mistera-star-history-v14';
  const PHRASES=Object.freeze(window.MISTERA_STAR_REPERTOIRE||[]);
  const SPECIALS=Object.freeze(window.MISTERA_STAR_SPECIALS||[]);
  const choiceId=e=>e.kind==='heart'?e.id:`P-${e.editorial_id}`;
  const entryById=id=>SPECIALS.find(e=>e.id===id)||PHRASES.find(e=>`P-${e.editorial_id}`===id);
  const random=a=>a[Math.floor(Math.random()*a.length)];
  const get=k=>{try{return localStorage.getItem(k);}catch(_){return null;}};
  const put=(k,v)=>{try{localStorage.setItem(k,v);}catch(_){}};
  function readHistory(){
    try{const v=JSON.parse(get(HISTORY_KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-15):[];}
    catch(_){return [];}
  }
  class MisteraSkyMessages{
    constructor(draw,{status,christmasStatus}={}){
      this.draw=draw;this.status=status;this.christmasStatus=christmasStatus;
      this.mode='auto';this.manual='';this.simulated=false;
      this.lastText='';this.lastKey='';this.activeChoice=null;this.previewChoice=null;
      this.history=readHistory();this.phase='intro';this._firstAutoShown=false;
      this.nextTransitionAt=Date.now()+INTRO_MS;
      this.timer=null;this._clearTimer=null;this._lastSkyHeight=null;
      this._visibleStartedAt=null;
    }
    getTime(){return this.simulated?CHRISTMAS_START+1000:Date.now();}
    isChristmas(){return this.getTime()>=CHRISTMAS_START;}
    getCurrent(){return {mode:this.mode,phrase:this.lastText,christmas:this.isChristmas(),
      simulated:this.simulated,phase:this.phase,nextInSeconds:Math.max(0,Math.ceil((this.nextTransitionAt-Date.now())/1000)),
      kind:this.activeChoice?.kind||'phrase',recent:this.history.slice()};}
    _setStatus(msg){if(this.status)this.status.textContent=msg;}
    _christmasStatus(){if(this.christmasStatus)this.christmasStatus.textContent=
      this.simulated?'Simulación activa · 25/12/2026 00:00 (Perú)':
      this.isChristmas()?'Navidad 2026 · dedicatoria final permanente':
      'Hora real · mensaje final: 25/12/2026 00:00 (Perú)';}
    choose(){
      const recent=new Set(this.history.slice(-15));
      const recentTexts=new Set([...recent].map(id=>entryById(id)?.text).filter(Boolean));
      const eligible=e=>!recent.has(choiceId(e))&&(!e.text||!recentTexts.has(e.text));
      const skyHeight=document.getElementById('sky-panel')?.getBoundingClientRect().height||130;
      const fits=e=>skyHeight>=82 || (e.kind==='heart'?
        (skyHeight>=60&&e.id==='CE-01'):
        (e.text.length<=16&&e.text.split(/\s+/).length<=2));
      let entry=null;
      const prev=this.history.at(-1);
      if(Math.random()<.07&&!prev?.startsWith('CE-')){
        const hearts=SPECIALS.filter(e=>fits(e)&&eligible(e));
        if(hearts.length)entry=random(hearts);
      }
      if(!entry){
        const probability=Math.random();
        const category=probability<.55?'romantica':probability<.85?'poetica':'navidena';
        const preferred=PHRASES.filter(e=>e.category===category&&fits(e)&&eligible(e));
        const all=PHRASES.filter(e=>fits(e)&&eligible(e));
        entry=random(preferred.length?preferred:all.length?all:PHRASES.filter(fits));
      }
      if(!entry)return null;
      this.history.push(choiceId(entry));this.history=this.history.slice(-15);
      put(HISTORY_KEY,JSON.stringify(this.history));return entry;
    }
    _renderChoice(entry){
      if(!entry)return;
      if(entry.kind==='heart')this.draw.renderSpecial(entry);
      else this.draw.render(entry.text);
      this.activeChoice=entry;this.lastKey=choiceId(entry);
      this.lastText=entry.kind==='heart'?entry.id:entry.text;
    }
    _clearAfterFade(){
      if(this._clearTimer)clearTimeout(this._clearTimer);
      this._clearTimer=setTimeout(()=>{
        this._clearTimer=null;
        if(this.phase==='blank'&&this.mode==='auto'&&!this.isChristmas())this.draw.clear();
      },FADE_MS+100);
    }
    _show(entry=undefined){
      if(this._clearTimer){clearTimeout(this._clearTimer);this._clearTimer=null;}
      if(document.hidden)return;
      // Each new page visit begins with the imperfect CE-01 heart exactly once.
      // Do not replay the fixed intro when returning from a manual test mode.
      let selection=entry||this.previewChoice;
      if(!selection && !this._firstAutoShown){
        selection=SPECIALS.find(e=>e.id==='CE-01')||this.choose();
        if(selection){this.history.push(choiceId(selection));this.history=this.history.slice(-15);put(HISTORY_KEY,JSON.stringify(this.history));}
      }
      if(!selection)selection=this.choose();
      this._firstAutoShown=true;this.previewChoice=null;
      this._renderChoice(selection);
      this.phase='visible';this._visibleStartedAt=Date.now();
      this.nextTransitionAt=this._visibleStartedAt+VISIBLE_MS;
      this._setStatus(`Visible 10 s · ${this.lastText}`);
    }
    _hide(){
      this.draw.svg.classList.remove('is-visible'); // preserve nodes during CSS fade
      this.lastText='';this.lastKey='';this.phase='blank';this.activeChoice=null;
      this.nextTransitionAt=Date.now()+BLANK_MS;
      this._clearAfterFade();
      this._setStatus('Cielo despejado · próximo mensaje en 10 segundos');
    }
    _resetCycle(){
      if(this._clearTimer){clearTimeout(this._clearTimer);this._clearTimer=null;}
      this.draw.clear();this.lastText='';this.lastKey='';this.activeChoice=null;
      this.phase='intro';this.nextTransitionAt=Date.now()+INTRO_MS;
      this._setStatus('Cielo despejado · primer mensaje en unos segundos');
    }
    _showChristmas(force=false){
      if(this._clearTimer){clearTimeout(this._clearTimer);this._clearTimer=null;}
      if(force||this.lastKey!=='permanent-christmas'){
        this.draw.render(FINAL);this.lastText=FINAL;this.lastKey='permanent-christmas';
      }
      this.phase='permanent';this.nextTransitionAt=Infinity;
      this._setStatus(`Mensaje permanente: ${FINAL}`);
    }
    refresh(force=false){
      if(this.isChristmas()){
        this._showChristmas(force);this._christmasStatus();return this.lastText;
      }
      if(this.phase==='permanent')this._resetCycle();
      if(this.mode==='hidden'){
        if(force||this.lastKey!=='hidden')this.draw.clear();
        this.lastText='';this.lastKey='hidden';
        this._setStatus('Constelaciones ocultas (prueba).');
      }else if(this.mode==='manual'){
        if(force||this.lastKey!==`manual:${this.manual}`){
          this.draw.render(this.manual);this.lastText=this.manual;
          this.lastKey=`manual:${this.manual}`;
        }
        this._setStatus(`Prueba manual · ${this.manual}`);
      }else if(this.phase==='visible'){
        if(force&&this.activeChoice)this._renderChoice(this.activeChoice);
        if(Date.now()>=this.nextTransitionAt)this._hide();
      }else if(Date.now()>=this.nextTransitionAt){
        if(document.hidden){
          this.phase='blank';this.nextTransitionAt=Date.now()+BLANK_MS;
          this.draw.clear();
        }else this._show();
      }
      this._christmasStatus();return this.lastText;
    }
    setManual(s){if(this.isChristmas())return this.refresh();
      this.mode='manual';this.manual=s;this.refresh(true);}
    hide(){if(this.isChristmas())return this.refresh();
      this.mode='hidden';this.refresh(true);}
    setAuto(){this.mode='auto';this.previewChoice=null;this._resetCycle();return this.refresh();}
    previewNext(){if(this.isChristmas())return this.refresh();
      this.mode='auto';this._show(this.choose());return this.refresh();}
    simulateChristmas(v){this.simulated=!!v;this.mode='auto';
      if(this.simulated)this._showChristmas(true);
      else this._resetCycle();return this.refresh();}
    onLayoutChange(){
      const panel=document.getElementById('sky-panel');
      const rect=panel?.getBoundingClientRect();
      const height=rect?.height||130;
      const width=rect?.width||390;
      const moonLeft=panel?.querySelector('.moon')?.getBoundingClientRect().left||0;
      // Width and moon position matter even when the height has not changed.
      // Only re-render when something material changes: tiny browser-bar
      // variations should not make star constellations visibly jump.
      const next={height,width,moonLeft};
      const previous=this._lastSkyLayout;
      if(previous && Math.abs(height-previous.height)<3 &&
        Math.abs(width-previous.width)<2 && Math.abs(moonLeft-previous.moonLeft)<3)return;
      this._lastSkyLayout=next;
      this._lastSkyHeight=height;
      if(this.isChristmas()){this._showChristmas(true);return;}
      if(this.mode==='manual'){this.draw.render(this.manual);return;}
      if(this.mode!=='auto'||this.phase!=='visible'||!this.activeChoice)return;
      const e=this.activeChoice;
      const tooLong=height<82&&(e.kind==='heart'?(height<60||e.id!=='CE-01'):
        (e.text.length>16||e.text.split(/\s+/).length>2));
      if(tooLong)this._renderChoice(this.choose());
      else this._renderChoice(e);
    }
    tick(){this.refresh();}
    start(){
      this._resetCycle();this.refresh();
      this.timer=setInterval(()=>this.tick(),1000); // V32: half as many background checks
      document.addEventListener('visibilitychange',()=>{
        if(document.hidden&&this.mode==='auto'&&this.phase==='visible'&&!this.isChristmas())this._hide();
        else if(!document.hidden)this.tick();
      });
    }
  }
  MisteraSkyMessages.CHRISTMAS_START=CHRISTMAS_START;
  MisteraSkyMessages.FINAL=FINAL;
  MisteraSkyMessages.REPERTOIRE_COUNT=PHRASES.length;
  MisteraSkyMessages.INTRO_MS=INTRO_MS;
  MisteraSkyMessages.VISIBLE_MS=VISIBLE_MS;
  MisteraSkyMessages.BLANK_MS=BLANK_MS;
  window.MisteraSkyMessages=MisteraSkyMessages;
})();
