'use strict';
/* MISTERA - Escena V25, static/local prototype. User MP3 streamed with first gesture unlock. */
const NS = 'http://www.w3.org/2000/svg';
const W = 941, H = 1671;
const {houses: HOUSES, tree: TREE} = VILLA_MAP;
const LAYERS = window.MISTERA_LAYERS;
const $ = id => document.getElementById(id);
const root = document.documentElement;
const mediaReduce = matchMedia('(prefers-reduced-motion: reduce)');
const MISTERA_TEST_MODE = new URLSearchParams(location.search).get('mistera-pruebas')==='1';
const keys = {
  opened: 'mistera-escena-v5-opened'+(MISTERA_TEST_MODE?'-test':''),
  final: 'mistera-escena-v5-final'+(MISTERA_TEST_MODE?'-test':''),
  chimneys: 'mistera-escena-v5-chimneys',
  smoke: 'mistera-escena-v6-smoke-visibility',
  snow: 'mistera-escena-v9-snow-density',
  celebration: 'mistera-escena-v11-celebrated',
  vouchers: 'mistera-escena-v12-vouchers-demo'
};
let opened = new Set(), finalOpened = false, selectedDay = null, dialogKind = 'house', toastTimer;
let finalCelebrationQueued = false;
let vouchers=[];
try {
  const value=JSON.parse(localStorage.getItem(keys.vouchers)||'[]');
  if(Array.isArray(value))vouchers=value.filter(v=>Number.isInteger(v.day)&&v.day>=1&&v.day<=24).slice(0,24);
} catch(_){}

try {
  opened = new Set(JSON.parse(localStorage.getItem(keys.opened) || '[]').filter(d => Number.isInteger(d) && d >= 1 && d <= 24));
  finalOpened = localStorage.getItem(keys.final) === 'yes';
} catch (e) { opened = new Set(); finalOpened = false; }
const giftNow = () => window.__misteraDemoNow ?? Date.now();
const giftAt = day => {
  const configured=window.MisteraSurprises?.get(day)?.unlockAt;
  const actual=Date.parse(configured||'');
  return Number.isFinite(actual)?actual:Date.parse(`2026-12-${String(day).padStart(2,'0')}T00:00:00-05:00`);
};
const houseIsUnlocked = day => opened.has(day) ||
  ((window.MisteraSurprises?.get(day)?.availabilityStatus||'PROGRAMADO')==='PROGRAMADO' && giftNow() >= giftAt(day));
const nextUnopenedDay = () => HOUSES.find(h => !opened.has(h.day))?.day ?? null;
// Past-dated houses remain available even if the user started Advent late.
const activeDay = () => HOUSES.find(h => !opened.has(h.day) && houseIsUnlocked(h.day))?.day ?? null;
const unlockedTree = () => opened.size === 24;
const treeDateUnlocked = () => giftNow() >= giftAt(25);
const treeIsAvailable = () => unlockedTree() && treeDateUnlocked();
const store = (name, value) => { try { localStorage.setItem(name, value); } catch (e) {} };
const safeGet = name => { try { return localStorage.getItem(name); } catch(e) { return null; } };
function persist() {
  store(keys.opened, JSON.stringify([...opened].sort((a,b)=>a-b)));
  store(keys.final, finalOpened ? 'yes' : 'no');
  window.dispatchEvent(new Event('mistera:opened-change'));
}
function notify(message) {
  clearTimeout(toastTimer);
  const el = $('toast');el.textContent = message;el.hidden = false;
  toastTimer = setTimeout(() => {el.hidden = true;}, 3200);
}
function getChimneyPoints() {
  const positions = {};
  for(const h of HOUSES) positions[h.day] = [...(window.MISTERA_CHIMNEYS?.[h.day] || h.chimney)];
  try {
    const saved = JSON.parse(localStorage.getItem(keys.chimneys) || '{}');
    for(const [key,p] of Object.entries(saved)) {
      if(Number(key) >= 1 && Number(key) <= 24 && Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) {
        positions[key] = [Math.max(0,Math.min(W,p[0])),Math.max(0,Math.min(H,p[1]))];
      }
    }
  } catch (e) {}
  return positions;
}
function refreshChimneys() { window.__chimneySmoke?.setPositions(getChimneyPoints()); }
function svgEl(tag,attributes) {
  const node = document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attributes))node.setAttribute(k,String(v));
  return node;
}
function createHouseArtwork() {
  const holder = $('house-art-layers');
  for(const h of HOUSES) {
    const config = LAYERS.houses[String(h.day)];
    if(!config)continue;
    const sprite = document.createElementNS(NS,'image');
    sprite.setAttribute('class','lit-house-art');
    sprite.dataset.house = h.day;
    sprite.setAttribute('href',config.src);
    const [x,y,w,hgt] = config.rect;
    // All positions are SVG native pixels: identical coordinate system to the
    // base image. No CSS percentage rounding, overpaint or independent scaling.
    sprite.setAttribute('x',x);
    sprite.setAttribute('y',y);
    sprite.setAttribute('width',w);
    sprite.setAttribute('height',hgt);
    sprite.setAttribute('preserveAspectRatio','none');
    sprite.setAttribute('aria-hidden','true');
    holder.appendChild(sprite);
  }
}
function buildTargets() {
  const svg = $('targets-overlay');
  for(const h of HOUSES) {
    const pts = h.polygon.map(x => x.join(',')).join(' ');
    const shape = svgEl('polygon',{points:pts,class:'hotspot','data-day':h.day,tabindex:0,role:'button',
      'aria-label':`Casa ${h.day} del calendario`});
    const activate = () => openHouse(h.day);
    shape.addEventListener('click',activate);
    shape.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    svg.appendChild(shape);
    const [x0,y0,x1,y1] = h.bounds;
    const label = svgEl('text',{x:(x0+x1)/2,y:(y0+y1)/2+12,
      class:'house-number','text-anchor':'middle','aria-hidden':'true'});
    label.textContent=h.day;svg.appendChild(label);
  }
  const [x0,y0,x1,y1]=TREE.bounds;
  const center=(x0+x1)/2;
  const pts = [[center,y0],[center-30,y0+74],[center-80,y0+210],[x0+12,y1-57],
     [x0,y1-16],[x1,y1-16],[x1-12,y1-57],[center+80,y0+210],[center+30,y0+74]];
  const tree=svgEl('polygon',{id:'tree-target',class:'tree-target locked',points:pts.map(p=>p.join(',')).join(' '),
    tabindex:0,role:'button','aria-label':'Árbol central'});
  tree.addEventListener('click',()=>{if(unlockedTree())openFinal();});
  tree.addEventListener('keydown',e=>{if(unlockedTree()&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openFinal();}});
  svg.appendChild(tree);
}
function buildStars() {
  const el = $('stars');
  let seed=27;const rnd=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646};
  for(let i=0;i<34;i++) {
    const dot=document.createElement('i');dot.className='star-dot'+(i%9===0?' highlight':'');
    dot.style.left=(8+rnd()*84)+'%';dot.style.top=(rnd()*94+3)+'%';
    const size=1+rnd()*1.5;dot.style.width=dot.style.height=size+'px';
    dot.style.setProperty('--twinkle',(6+rnd()*8)+'s');
    dot.style.setProperty('--delay',(-rnd()*12)+'s');el.appendChild(dot);
  }
}
function buildClouds() {
  const presets=[{n:1,y:'2%',speed:160,delay:-70,opacity:.76,width:62},
    {n:4,y:'8%',speed:212,delay:-130,opacity:.73,width:48},
    {n:7,y:'12%',speed:194,delay:-32,opacity:.78,width:56},
    {n:9,y:'4%',speed:248,delay:-195,opacity:.70,width:67}];
  for(const c of presets) {
    const img=document.createElement('img');img.className='cloud';img.alt='';
    img.src=`assets/clouds/nube-${c.n}.png`;img.loading='lazy';img.decoding='async';
    img.style.top=c.y;img.style.width=c.width+'%';img.style.opacity=c.opacity;
    img.style.setProperty('--speed',c.speed+'s');img.style.setProperty('--delay',c.delay+'s');
    $('clouds').appendChild(img);
  }
}
function getMotionEnabled() {return !mediaReduce.matches && !root.classList.contains('no-motion');}
function syncTreeImage() {
  const lit=$('tree-on'),off=$('tree-off');
  // Completing day 24 makes the UNLIT tree glow gently. It does not load
  // or display the animated tree until the final surprise is actually opened.
  if(!unlockedTree() || !finalOpened) {
    lit.classList.remove('is-visible');off.classList.remove('is-hidden');
    lit.onload=null;lit.removeAttribute('src');return;
  }
  const url=getMotionEnabled() ? LAYERS.tree.on.src : LAYERS.tree.static.src;
  if(lit.getAttribute('src')!==url) {
    lit.classList.remove('is-visible');off.classList.remove('is-hidden');
    lit.onload=()=>{
      if(!unlockedTree() || !finalOpened || lit.getAttribute('src')!==url)return;
      lit.classList.add('is-visible');off.classList.add('is-hidden');
    };
    lit.src=url;
    if(lit.complete && lit.naturalWidth)lit.onload();
  } else if(lit.complete && lit.naturalWidth) {
    lit.classList.add('is-visible');off.classList.add('is-hidden');
  }
}
function syncReadyStarMotion(restart=false) {
  const marker=$('house-ready-stars').firstElementChild;
  if(!marker)return;
  const current=marker.getAnimations?.()||[];
  if(!getMotionEnabled()) {
    current.forEach(anim=>anim.cancel());
    marker.style.opacity='.9';
    marker.style.transform='translate(-50%,-50%)';
    return;
  }
  if(!restart && current.length)return;
  current.forEach(anim=>anim.cancel());
  marker.style.opacity='';marker.style.transform='';
  // Web Animations: slow floating, never fades below 50%; light shares its pulse.
  if(marker.animate)marker.animate([
    {offset:0,opacity:.62,transform:'translate(-50%,-50%) translateY(1px) scale(.989)'},
    {offset:.32,opacity:1,transform:'translate(-50%,-50%) translateY(-1.8px) scale(1.008)'},
    {offset:.68,opacity:.85,transform:'translate(-50%,-50%) translateY(-2.6px) scale(1)'},
    {offset:1,opacity:.62,transform:'translate(-50%,-50%) translateY(1px) scale(.989)'}
  ],{duration:9200,iterations:Infinity,easing:'ease-in-out'});
}
function renderHouseStar() {
  const holder=$('house-ready-stars');
  const day=activeDay();
  const onTree=day===null && unlockedTree() && !finalOpened;
  const house=HOUSES.find(h=>h.day===day);
  if(!house && !onTree){holder.replaceChildren();window.dispatchEvent(new Event('mistera:star-changed'));return;}
  let marker=holder.firstElementChild;
  if(!marker){
    marker=document.createElement('div');marker.className='ready-star-marker';
    const beam=document.createElement('div');beam.className='ready-star-light';
    const halo=document.createElement('div');halo.className='ready-star-halo';
    const star=document.createElement('img');star.className='ready-house-star';
    star.src='assets/ui/estrella-disponible.png';star.alt='';star.decoding='async';
    marker.append(beam,halo,star);holder.append(marker);
  }
  const bounds=onTree?TREE.bounds:house.bounds;
  const [x0,y0,x1]=bounds;
  marker.style.left=((((x0+x1)/2)/W)*100).toFixed(3)+'%';
  marker.style.top=((Math.max(25,y0+(onTree?38:-35))/H)*100).toFixed(3)+'%';
  marker.classList.toggle('on-tree',onTree);
  const target=onTree?'tree':String(day);
  const changed=marker.dataset.target!==target;
  marker.dataset.target=target;marker.dataset.day=onTree?'25':String(day);
  marker.querySelector('img').dataset.day=marker.dataset.day;
  syncReadyStarMotion(changed);
  window.dispatchEvent(new Event('mistera:star-changed'));
}
function activeVouchers(){return opened.size?vouchers.filter(v=>opened.has(v.day)):[];}
function renderTicketControls(){
  const area=$('cinema-ticket-section'),button=$('cinema-ticket-open');
  if(!area||!button)return;
  const available=!!window.MisteraSpecialDays?.ticketAvailable?.();
  area.hidden=!available;button.disabled=!available;
}
function renderVoucherControls(){
  const all=activeVouchers(),button=$('voucher-open'),hint=$('voucher-hint'),badge=$('voucher-count');
  // Do not expose even a disabled/blurred coupon label before a real reward exists.
  $('voucher-section').hidden=!all.length;
  button.disabled=!all.length;
  badge.hidden=!all.length;
  badge.textContent=String(all.length);
  hint.textContent=all.length?`${all.length} vale${all.length===1?'':'s'} recibido${all.length===1?'':'s'}.`:
    opened.size?'Todavía no has recibido vales.':'Disponible al recibir un vale en una sorpresa.';
  $('demo-grant-voucher').disabled=opened.size===0;
}
function openVoucherDialog(){
  const available=activeVouchers();if(!available.length)return;
  const list=$('voucher-list');list.replaceChildren();
  for(const voucher of available){
    const article=document.createElement('article');
    const title=document.createElement('strong');title.textContent=voucher.title||`Vale · Casa ${String(voucher.day).padStart(2,'0')}`;
    const caption=document.createElement('span');caption.textContent=voucher.details||'Una experiencia para disfrutar juntos.';
    article.append(title,caption);
    if(voucher.conditions){const conditions=document.createElement('small');conditions.textContent=voucher.conditions;article.append(conditions);}
    if(voucher.blockId){
      const used=window.MisteraSurprises?.isRedeemed(voucher.day,voucher.blockId);
      const button=document.createElement('button');button.type='button';button.className='secondary-btn';
      button.textContent=used?'✓ Canjeado':'Marcar como canjeado';button.disabled=!!used;
      button.addEventListener('click',()=>{
        if(!confirm('¿Confirmar que este vale ya fue utilizado?'))return;
        window.MisteraSurprises.redeem(voucher.day,voucher.blockId);
        openVoucherDialogContent();
      });
      article.append(button);
    }
    list.append(article);
  }
  if(!$('voucher-dialog').open)$('voucher-dialog').showModal();
}
function openVoucherDialogContent(){
  if(!$('voucher-dialog').open)return;
  $('voucher-dialog').close();openVoucherDialog();
}
function syncEditorialVouchers(){
  const S=window.MisteraSurprises;if(!S)return;
  let modified=false;
  for(const day of opened){
    const cfg=S.get(day);if(!cfg)continue;
    for(const block of cfg.blocks){
      if(block.type!=='voucher'||(block.requires&&!S.isCompleted(day,block.requires)))continue;
      if(vouchers.some(v=>v.day===day&&v.blockId===block.id))continue;
      vouchers.push({day,blockId:block.id,title:block.title||'Vale especial',details:block.body||'',conditions:block.conditions||''});modified=true;
    }
  }
  if(modified)store(keys.vouchers,JSON.stringify(vouchers));
  renderVoucherControls();renderTicketControls();
}

const HEADLINES = {
  soon:['FALTA POCO PARA TU PRÓXIMO REGALO','ESPERA SOLO UN POCO MÁS','TU SORPRESA ESTÁ CASI LISTA'],
  minutes:['SOLO UNOS MINUTOS MÁS','TU REGALO ESTÁ POR LLEGAR','UN ÚLTIMO INSTANTE DE ESPERA'],
  general:['DESCUBRE UNA SORPRESA PARA TI EN','UNA SORPRESA TE ESPERARÁ EN','DESCUBRE TU PRÓXIMO REGALO EN','VUELVE PARA DESCUBRIR UNA SORPRESA EN','UN DETALLE ESPECIAL LLEGARÁ EN'],
  tree:['FALTA POCO PARA NAVIDAD','UN ÚLTIMO REGALO SECRETO','LA NAVIDAD ESTÁ CERCA','EL ÁRBOL GUARDA UNA SORPRESA','NUESTRA ÚLTIMA SORPRESA SE ACERCA'],
  available:['UNA SORPRESA TE ESTÁ ESPERANDO','HOY HAY UN REGALO PARA TI','DESCUBRE ALGO ESPECIAL'],
  treeAvailable:['FELIZ NAVIDAD MI POLLITA','EL ÚLTIMO REGALO TE ESPERA','LA MAGIA FINAL ESTÁ AQUÍ'],
  complete:['TODOS TUS REGALOS DESCUBIERTOS','NUESTROS RECUERDOS, SIEMPRE CONTIGO','LA MAGIA CONTINÚA EN TUS RECUERDOS']
};
let lastHeadline='',nextHeadlineRotation=0;
function getNextGiftTarget(){
  const day=nextUnopenedDay()??(finalOpened?null:25);
  return day===null?null:{day,at:giftAt(day)};
}
function chooseDockHeadline(group){
  const pool=HEADLINES[group]||HEADLINES.general;
  const choices=pool.filter(x=>x!==lastHeadline);
  lastHeadline=choices[Math.floor(Math.random()*choices.length)]||pool[0];
  return lastHeadline;
}
function updateGiftCountdown(forceHeadline=false){
  const target=getNextGiftTarget();
  const diff=target?Math.max(0,target.at-giftNow()):0;
  const minutes=Math.ceil(diff/60000);
  $('countdown-days').textContent=String(Math.floor(minutes/1440)).padStart(2,'0');
  $('countdown-hours').textContent=String(Math.floor(minutes%1440/60)).padStart(2,'0');
  $('countdown-minutes').textContent=String(minutes%60).padStart(2,'0');
  let group='general';
  if(!target)group='complete';
  else if(target.day===25)group=diff===0?'treeAvailable':'tree';
  else if(diff===0)group='available';
  else if(diff<=15*60*1000)group='minutes';
  else if(diff<=3*3600000)group='soon';
  const now=Date.now();
  if(forceHeadline || now>=nextHeadlineRotation || $('dock-heading').dataset.group!==group){
    $('dock-heading').textContent=chooseDockHeadline(group);
    $('dock-heading').dataset.group=group;
    nextHeadlineRotation=now+25000;
  }
  // Recipient-facing copy does not show test years, gift IDs or technical notes.
  $('countdown-note').textContent=!target?'Cada casita guarda un pedacito de nosotros.':
    target.day===25?(diff===0?'La última sorpresa está esperándote.':'Nuestro último secreto despertará en Navidad.'): 
    diff===0?'Tu pequeña alegría ya está aquí.':
    diff<=3*3600000?'Solo un ratito más para sonreír juntos.':'Cada día guarda una nueva razón para sonreír.';
  $('gift-countdown').hidden=!target;
  $('countdown-note').classList.toggle('is-ready',!!target&&diff===0);
}
// V30: the crown returns with a refined entrance (Anime.js is already loaded
// for the loader); a native Web Animations fallback keeps it smooth offline.
// The continuous, barely perceptible sway belongs to its image in CSS, so the
// entrance's transforms never compete with the existing press rotation.
let wreathReturnAnimation=null;
function cancelWreathReturn(wreath){
  if(typeof window.anime?.remove==='function')window.anime.remove(wreath);
  if(wreathReturnAnimation){
    try{wreathReturnAnimation.pause?.();wreathReturnAnimation.cancel?.();}catch(_){}
    wreathReturnAnimation=null;
  }
  wreath.style.removeProperty('opacity');
  wreath.style.removeProperty('transform');
}
function revealWreath(wreath,restoreFocus=false){
  cancelWreathReturn(wreath);
  wreath.hidden=false;
  wreath.setAttribute('aria-expanded','false');
  if(restoreFocus)wreath.focus({preventScroll:true});
  if(!getMotionEnabled())return;
  if(typeof window.anime==='function'){
    const animation=window.anime({
      targets:wreath,opacity:[0,1],translateY:[9,0],scale:[.94,1],
      duration:255,easing:'easeOutCubic',
      complete:()=>{
        if(wreathReturnAnimation!==animation)return;
        wreathReturnAnimation=null;
        wreath.style.removeProperty('opacity');
        wreath.style.removeProperty('transform');
      }
    });
    wreathReturnAnimation=animation;
  }else if(typeof wreath.animate==='function'){
    const animation=wreath.animate([
      {opacity:0,transform:'translateY(9px) scale(.94)'},
      {opacity:1,transform:'translateY(0) scale(1)'}
    ],{duration:255,easing:'cubic-bezier(.16,1,.3,1)'});
    wreathReturnAnimation=animation;
    animation.finished.then(()=>{
      if(wreathReturnAnimation!==animation)return;
      wreathReturnAnimation=null;animation.cancel();
    },()=>{});
  }
}
function closeAdventDock(restoreWreathFocus=false){
  const dock=$('advent-dock'),wreath=$('wreath-nav-toggle');
  if(dock.hidden||dock.dataset.closing==='yes')return;
  dock.dataset.closing='yes';
  const finish=()=>{dock.hidden=true;dock.dataset.closing='no';
    revealWreath(wreath,restoreWreathFocus);};
  if(getMotionEnabled()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&dock.animate){
    dock.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(14px) scale(.96)'}],
      {duration:155,easing:'cubic-bezier(.4,0,1,1)'}).finished.then(finish,finish);
  }else finish();
}
function showAdventDock(){
  const dock=$('advent-dock'),wreath=$('wreath-nav-toggle');
  cancelWreathReturn(wreath);
  dock.hidden=false;dock.dataset.closing='no';wreath.hidden=true;
  wreath.setAttribute('aria-expanded','true');updateGiftCountdown(true);
  if(getMotionEnabled()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&dock.animate){
    dock.animate([{opacity:0,transform:'translateY(22px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1)'}],
      {duration:250,easing:'cubic-bezier(.16,1,.3,1)'});
  }
}
function showSurpriseDialog(){
  const dialog=$('surprise-dialog');if(dialog.open)return;
  dialog.showModal();
  if(getMotionEnabled()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&dialog.animate){
    // Only transform and opacity are animated; blur caused expensive repainting on phones.
    dialog.animate([{opacity:0,transform:'translateY(14px) scale(.974)'},
      {opacity:1,transform:'translateY(0) scale(1)'}],
      {duration:235,easing:'cubic-bezier(.16,1,.3,1)'});
  }
}
function closeSurpriseDialog(){
  const dialog=$('surprise-dialog');if(!dialog.open||dialog.dataset.closing==='yes')return;
  dialog.dataset.closing='yes';
  // Play in the same user gesture, before the fast close transition.
  window.__misteraAudio?.playInteractionSound?.(dialogKind==='final'?'tree':'close');
  const finish=()=>{if(dialog.open)dialog.close();dialog.dataset.closing='no';};
  if(getMotionEnabled()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&dialog.animate){
    dialog.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(16px) scale(.97)'}],
      {duration:145,easing:'cubic-bezier(.4,0,1,1)'}).finished.then(finish,finish);
  }else finish();
}
function initializeAdventDock(){
  const nav=$('advent-navigation'),wreath=$('wreath-nav-toggle'),dock=$('advent-dock');
  const settingsButton=$('dock-ambient-sound');
  const settingsPanel=$('dock-settings-panel'),musicButton=$('dock-music-toggle');
  const switchSettings=show=>{
    dock.classList.toggle('is-settings',show);
    settingsPanel.hidden=!show;
    settingsButton.setAttribute('aria-expanded',String(show));
    settingsButton.setAttribute('aria-label',show?'Volver al Dock':'Abrir ajustes');
    settingsButton.title=show?'Volver al Dock':'Ajustes';
    settingsButton.querySelector('.dock-gear-icon').toggleAttribute('hidden',show);
    settingsButton.querySelector('.dock-return-icon').toggleAttribute('hidden',!show);
  };
  wreath.addEventListener('click',()=>{
    if(wreath.dataset.busy==='yes')return;
    switchSettings(false);
    window.__misteraAudio?.playInteractionSound?.('dock');
    wreath.dataset.busy='yes';wreath.classList.add('is-wiggling');
    const open=()=>{wreath.classList.remove('is-wiggling');wreath.dataset.busy='no';showAdventDock();};
    if(!getMotionEnabled())open();else setTimeout(open,220);
  });
  document.addEventListener('pointerdown',e=>{if(!dock.hidden&&!nav.contains(e.target))closeAdventDock();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dock.hidden){closeAdventDock(true);}});
  $('dock-close').addEventListener('click',()=>{closeAdventDock(true);});
  settingsButton.addEventListener('click',()=>switchSettings(!dock.classList.contains('is-settings')));
  function syncSoundIcon(){
    const enabled=window.__misteraAudio.ambientMusicEnabled;
    musicButton.setAttribute('aria-pressed',String(enabled));
    $('dock-music-value').textContent=enabled?'Activado':'Silenciado';
  }
  musicButton.addEventListener('click',e=>{
    const manager=window.__misteraAudio;
    manager.setAmbientMusicEnabled(!manager.ambientMusicEnabled,e);
    const toggle=$('toggle-ambient-music');if(toggle)toggle.checked=manager.ambientMusicEnabled;
    syncSoundIcon();
  });
  window.addEventListener('mistera:ambient-toggle',syncSoundIcon);
  syncSoundIcon();
  $('dock-fullscreen-toggle').addEventListener('click',()=>window.MisteraFullscreen?.toggle?.());
  window.addEventListener('mistera:fullscreenchange',()=>{
    $('dock-fullscreen-value').textContent=window.MisteraFullscreen?.active?'Desactivar':'Activar';
  });
  const cloud=window.MisteraCloud;
  const status=$('dock-cloud-status');
  function updateCloudStatus(){status.textContent=cloud?.statusMessage?.()||'Progreso guardado en este dispositivo.';
    const enabled=!!cloud?.available&&!MISTERA_TEST_MODE;
    $('dock-copy-pairing').disabled=!enabled;$('dock-pairing-import').disabled=!enabled;
    $('dock-pairing-code').disabled=!enabled;
  }
  cloud?.onStatus?.(updateCloudStatus);updateCloudStatus();
  $('dock-copy-pairing').addEventListener('click',async()=>{
    const code=cloud?.pairingCode;
    if(!code){status.textContent='Sin servicio de sincronización disponible.';return;}
    try{await navigator.clipboard.writeText(code);status.textContent='Código copiado. Compártelo solo con tu otro dispositivo.';}
    catch(_){const input=$('dock-pairing-code');input.value=code;input.focus();input.select();status.textContent='Copia el código para usarlo en otro dispositivo.';}
  });
  $('dock-pairing-import').addEventListener('click',async()=>{
    const input=$('dock-pairing-code');
    if(!cloud?.connect){status.textContent='La sincronización en la nube requiere publicar el backend.';return;}
    const ok=await cloud.connect(input.value.trim());
    if(ok){input.value='';status.textContent='Dispositivos vinculados; los descubrimientos se conservarán.';}
    else status.textContent='Comprueba el código e inténtalo otra vez.';
  });
  $('cinema-ticket-open')?.addEventListener('click',()=>{
    if(!window.MisteraSpecialDays?.ticketAvailable?.())return;
    closeAdventDock();
    if(window.MisteraExperience?.openTicket?.()){
      dialogKind='house';showSurpriseDialog();
    }
  });
  window.addEventListener('mistera:ticket-state',renderTicketControls);
  window.addEventListener('mistera:surprise-progress',e=>{if(e.detail?.day===1)renderTicketControls();});
  $('voucher-open').addEventListener('click',()=>{
    if($('voucher-open').disabled)return;
    const button=$('voucher-open');button.classList.add('is-wiggling');
    setTimeout(()=>{button.classList.remove('is-wiggling');closeAdventDock();openVoucherDialog();},getMotionEnabled()?240:0);
  });
  $('voucher-dialog-close').addEventListener('click',()=>$('voucher-dialog').close());
  $('voucher-dialog').addEventListener('click',e=>{if(e.target===$('voucher-dialog'))$('voucher-dialog').close();});
  $('demo-grant-voucher').addEventListener('click',()=>{
    const day=Math.max(...opened);
    if(!Number.isFinite(day)||day<1){notify('Primero descubre una sorpresa.');return;}
    if(vouchers.some(v=>v.day===day)){notify('Esta casa ya tiene un vale de prueba.');return;}
    vouchers.push({day});store(keys.vouchers,JSON.stringify(vouchers));renderVoucherControls();
    notify(`Vale de prueba recibido desde la casa ${day}.`);
  });
  updateGiftCountdown(true);setInterval(updateGiftCountdown,10000);
}
function updateDays() {
  const list=$('day-list');
  if(list.children.length!==HOUSES.length){
    const fragment=document.createDocumentFragment();
    for(const h of HOUSES){
      const button=document.createElement('button');button.type='button';
      button.textContent=String(h.day).padStart(2,'0');
      button.addEventListener('click',()=>openHouse(h.day));fragment.appendChild(button);
    }
    list.replaceChildren(fragment);
  }
  HOUSES.forEach((h,i)=>{
    const button=list.children[i],isOpened=opened.has(h.day),available=houseIsUnlocked(h.day);
    button.className=isOpened?'opened':available?'available':'locked';
    button.setAttribute('aria-label',`Casa ${h.day}: ${isOpened?'abierta':available?'disponible':'cerrada'}`);
  });
}
function render() {
  const active=activeDay();
  $('next-label').textContent=finalOpened?'El regalo final ya se descubrió y el árbol está iluminado.':
    unlockedTree()?(treeIsAvailable()?'¡La sorpresa final del árbol está disponible!':'Las 24 casas fueron descubiertas. El árbol ya anuncia el regalo del 25 de diciembre, pero aún está bloqueado.'):
    active?`Casa ${active} disponible para descubrir.`:'Todavía no hay una sorpresa disponible. Elige una casa para consultar la cuenta regresiva.';
  $('open-next').textContent=unlockedTree()?(finalOpened?'Volver a ver el regalo final':'Abrir sorpresa del árbol'):`Abrir casa ${active??nextUnopenedDay()}`;
  $('open-next').onclick=()=>unlockedTree()?openFinal():openHouse(active??nextUnopenedDay());
  document.querySelectorAll('.lit-house-art').forEach(el=>el.classList.toggle('is-visible',opened.has(Number(el.dataset.house))));
  document.querySelectorAll('.hotspot').forEach(el=>{
    const day=Number(el.dataset.day);const selected=houseIsUnlocked(day)&&!opened.has(day);
    el.classList.toggle('active',selected);el.classList.toggle('opened',opened.has(day));
    el.setAttribute('aria-label',`Casa ${day}: ${opened.has(day)?'descubierta':houseIsUnlocked(day)?'disponible':'cerrada'}`);
  });
  const tree=$('tree-target');
  const visibleTreeTarget=unlockedTree();
  tree.classList.toggle('is-secret',!visibleTreeTarget);
  tree.classList.toggle('locked',visibleTreeTarget&&!treeIsAvailable());
  tree.classList.toggle('active',visibleTreeTarget&&!finalOpened);
  tree.setAttribute('tabindex',visibleTreeTarget?'0':'-1');
  tree.setAttribute('aria-hidden',String(!visibleTreeTarget));
  tree.style.pointerEvents=visibleTreeTarget?'auto':'none';
  tree.setAttribute('aria-label',!visibleTreeTarget?'':finalOpened?'Árbol: volver a ver sorpresa':treeIsAvailable()?'Árbol: regalo final disponible':'Árbol: todavía bloqueado');
  $('tree-art-layers').classList.toggle('is-ready',unlockedTree()&&!finalOpened);
  $('tree-art-layers').classList.toggle('is-awaiting-final',unlockedTree()&&!finalOpened&&!treeDateUnlocked());
  $('tree-art-layers').classList.toggle('is-finished',unlockedTree()&&finalOpened);
  syncTreeImage();updateDays();renderHouseStar();renderVoucherControls();renderTicketControls();updateGiftCountdown();
  if(window.__chimneySmoke){window.__chimneySmoke.setLit(opened);syncCanvas();}
}
function closeSettings() {$('settings').hidden=true;$('settings-button').setAttribute('aria-expanded','false');}
function openDockBecauseLocked(){
  window.__misteraAudio?.playInteractionSound('locked');
  closeSettings();
  showAdventDock();
}
function openHouse(day){
  if(!Number.isInteger(day)||day<1||day>24)return;
  if(!houseIsUnlocked(day)){openDockBecauseLocked();return;}
  const record=window.MisteraSurprises?.get(day);
  if(!MISTERA_TEST_MODE&&!opened.has(day)&&record?.publicationStatus!=='PUBLICADO'){
    notify('Esta casita aún guarda un pequeño secreto. ✨');return;
  }
  window.__misteraAudio?.playInteractionSound('open');
  selectedDay=day;dialogKind='house';
  const firstVisit=!opened.has(day);
  if(firstVisit){opened.add(day);persist();render();}
  $('dialog-kicker').textContent=`DÍA ${String(day).padStart(2,'0')}`;
  $('dialog-title').textContent='';
  $('dialog-copy').textContent='';
  closeSettings();closeAdventDock();
  window.MisteraExperience?.show(day);
  showSurpriseDialog();
  if(firstVisit&&!unlockedTree())notify('Una casita se iluminó ✨');
}
function openFinal(){
  if(!unlockedTree())return;
  if(!treeIsAvailable()&&!finalOpened){openDockBecauseLocked();return;}
  const finale=window.MisteraSurprises?.get(25);
  if(!MISTERA_TEST_MODE&&!finalOpened&&finale?.publicationStatus!=='PUBLICADO'){
    notify('La última sorpresa aún espera su momento. ✨');return;
  }
  window.__misteraAudio?.playInteractionSound('tree');
  selectedDay=null;dialogKind='final';
  const firstVisit=!finalOpened;
  if(firstVisit){finalOpened=true;persist();render();}
  $('dialog-kicker').textContent='NAVIDAD';
  $('dialog-title').textContent='';
  $('dialog-copy').textContent='';
  closeSettings();closeAdventDock();
  window.MisteraExperience?.show(25);
  showSurpriseDialog();
  if(firstVisit){window.__misteraAudio?.ensureEffectsActive?.();window.__misteraFireworks?.unlockAudio();startFinalCelebration();}
}
// The finale belongs to the FIRST actual reveal of day 25, not to midnight.
// Wait for the lit tree artwork to finish loading and its fade-in to complete.
function startFinalCelebration() {
  if(finalCelebrationQueued || safeGet(keys.celebration)==='yes')return;
  finalCelebrationQueued=true;
  const lit=$('tree-on');
  const launch=()=>{
    if(!finalCelebrationQueued)return;
    finalCelebrationQueued=false;
    if(!finalOpened || !getMotionEnabled())return;
    const ok=window.__misteraFireworks?.play({duration:60000});
    if(ok)store(keys.celebration,'yes');
  };
  const begin=()=>setTimeout(launch,1150); // match the shorter tree crossfade
  if(lit.complete && lit.naturalWidth)begin();
  else lit.addEventListener('load',begin,{once:true});
}
function positionSky() {
  const stage=$('stage').getBoundingClientRect();
  const frame=$('scene-frame').getBoundingClientRect();
  // The scene uses a stable small-viewport aspect; continuation fills the remaining strips.
  // Extend the painting by mirroring only its outer 0–12% on each side;
  // never stretch or crop the actual village and its SVG hotspots.
  const sides=[['scene-edge-left',frame.left-stage.left,'left'],
               ['scene-edge-right',stage.right-frame.right,'right']];
  const allowEdgeBleed=stage.width<=650 && frame.width>0;
  for(const [id,gap,which] of sides){
    const bleed=$(id);
    const width=Math.max(0,gap);
    bleed.hidden=!allowEdgeBleed||width<.3;
    if(!bleed.hidden){
      bleed.style.width=(width+2)+'px';
      bleed.style.height=frame.height+'px';
      bleed.style.top=(frame.top-stage.top)+'px';
      bleed.style.backgroundSize=frame.width+'px '+frame.height+'px';
      bleed.style[which]='-1px';
    }
  }

  // V20: the *visible screen top*, not the developer header, is the upper
  // boundary of the sky. Center BOTH the moon and the constellation between
  // that boundary and the beginning of the original PNG mountain silhouettes.
  // This is recomputed from actual layout on resize and mobile browser-bar changes.
  const skyline=frame.top-stage.top+frame.height*(279/H);
  const top=Math.max(0,-stage.top); // viewport's real top in stage coordinates
  const skyHeight=Math.max(36,skyline-top);
  const area=$('sky-panel');
  area.style.left=(frame.left-stage.left)+'px';
  area.style.width=frame.width+'px';
  area.style.top=top+'px';
  area.style.height=skyHeight+'px';
  area.style.setProperty('--sky-height',skyHeight+'px');
  // V21: one physical scale for BOTH celestial axes. The old fixed 941x300
  // viewBox with preserveAspectRatio=none stretched hearts vertically on short
  // devices. Match the viewport geometry in SVG units instead, then render
  // hearts/letters around the actual optical center of the visible sky.
  const constellation=area.querySelector('#constellation-layer');
  const skyHeightInUnits=skyHeight*941/Math.max(1,frame.width);
  constellation.setAttribute('viewBox',`0 0 941 ${skyHeightInUnits.toFixed(3)}`);
  constellation.setAttribute('preserveAspectRatio','xMidYMid meet');
  constellation.dataset.skyUnitsHeight=skyHeightInUnits.toFixed(3);
  // V22: the moon lives in a fixed right-hand sector of the real painting.
  // No layout, offset or collision logic may depend on the temporary "Pruebas"
  // button: that control will be removed before publication.
  // The moon has its OWN area; the lettering occupies the rectangle between
  // the left edge and the moon, with a natural gap on both sides.
  const moon=area.querySelector('.moon');
  if(moon){
    const moonSize=Math.min(frame.width*.12,skyHeight*.72,70);
    // 76% of the scene width to the moon's LEFT edge: with its 12% diameter,
    // its center is near 82% and the right-side margin remains at least 12%.
    // If the sky is unusually shallow, the moon becomes smaller but does not
    // drift towards the center of the composition.
    const moonLeft=frame.width*.76;
    moon.style.left=(100*moonLeft/frame.width).toFixed(3)+'%';
    moon.style.top='50%';
    moon.dataset.layoutLeftPx=moonLeft.toFixed(2);
    moon.dataset.layoutSizePx=moonSize.toFixed(2);
  }
  // Independent cloud atmosphere. NO horizontal/vertical clipping at the sky-panel edge.
  // It is painted below the village PNG, which masks clouds naturally against the mountains.
  const clouds=$('cloud-atmosphere');
  clouds.style.left=(frame.left-stage.left)+'px';
  clouds.style.width=frame.width+'px';
  clouds.style.top=top+'px';
  clouds.style.height=(skyHeight+frame.width*.43)+'px';
  // The flight area covers the full visible sky AND the plaza. This prevents the
  // initial ascending rockets being hidden behind a rectangular clipping layer.
  const flight=$('fireworks-flight-plane');
  const offset=frame.top-stage.top;
  flight.style.top=(-offset)+'px';
  flight.style.height=(frame.height+Math.max(0,offset))+'px';
  const flightTop=0;
  const flightSourceY=offset+frame.height*.636;
  window.__misteraFireworks?.setGeometry({
    headerBottom:top,
    skyBottom:skyline,
    flightSourceY,
    frameHeight:frame.height,
    sceneWidth:frame.width
  });
  window.__misteraFireworks?.resize();
  window.__misteraMessages?.onLayoutChange?.();
}
function animateSnow() {
  const canvas=$('snow-canvas'),ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  let w=0,h=0,flakes=[],raf=0,last=0,density=8;
  // Pre-rasterized soft points avoid a costly Canvas path and fillStyle change for each snowflake.
  const sprites=[0,1,2].map(i=>{
    const sprite=document.createElement('canvas');sprite.width=sprite.height=16;
    const g=sprite.getContext('2d');const r=2.4+i*1.25;
    const grad=g.createRadialGradient(8,8,0,8,8,7);
    grad.addColorStop(0,'rgba(248,251,255,.95)');grad.addColorStop(.42,'rgba(241,247,255,.55)');grad.addColorStop(1,'rgba(240,247,255,0)');
    g.fillStyle=grad;g.beginPath();g.arc(8,8,r+2,0,Math.PI*2);g.fill();return sprite;
  });
  const rand=()=>Math.random();
  function resize() {
    const rect=$('stage').getBoundingClientRect();
    const nw=Math.max(1,Math.round(rect.width)),nh=Math.max(1,Math.round(rect.height));
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    const cw=Math.round(nw*dpr),ch=Math.round(nh*dpr);
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(nw===w && nh===h && flakes.length)return;
    w=nw;h=nh;
    const count=Math.min(850,Math.max(12,Math.round(Math.max(24,Math.floor(w/12))*density)));
    flakes=Array.from({length:count},()=>({x:rand()*w,y:rand()*h,
      v:.16+rand()*.5,drift:.02+rand()*.22,
      alpha:.16+rand()*.38,size:2.2+rand()*3.1,sprite:sprites[Math.floor(rand()*3)]}));
  }
  function tick(now) {
    raf=requestAnimationFrame(tick);
    // Behind an opaque-ish dialog/dock the flakes need fewer redraws; this
    // leaves CPU/GPU headroom for responsive taps without changing density.
    const overlayOpen=$('surprise-dialog')?.open || !$('advent-dock').hidden || !$('settings').hidden;
    if(now-last<(overlayOpen?50:33))return; // 30 fps scene, 20 fps behind overlays
    const dt=Math.min(4,(now-last)/16.6||1);last=now;
    ctx.clearRect(0,0,w,h);
    for(const f of flakes){
      f.y+=f.v*dt;f.x+=f.drift*dt;
      if(f.y>h+4){f.y=-5;f.x=rand()*w;}if(f.x>w+4)f.x=-4;
      ctx.globalAlpha=f.alpha;
      ctx.drawImage(f.sprite,f.x-f.size*.5,f.y-f.size*.5,f.size,f.size);
    }
    ctx.globalAlpha=1;
  }
  new ResizeObserver(resize).observe($('stage'));resize();
  window.__snow={
    setDensity(value){density=Math.max(.5,Math.min(15,value));
      const count=Math.min(850,Math.max(12,Math.round(Math.max(24,Math.floor(w/12))*density)));
      if(count!==flakes.length){flakes=Array.from({length:count},()=>({x:rand()*w,y:rand()*h,
        v:.16+rand()*.5,drift:.02+rand()*.22,alpha:.16+rand()*.38,
        size:2.2+rand()*3.1,sprite:sprites[Math.floor(rand()*3)]}));}
    },
    getCount(){return flakes.length;},
    start(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}},
    stop(){cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,w,h);}
  };
}
function syncCanvas() {
  const run=getMotionEnabled() && document.visibilityState==='visible' && !document.body.classList.contains('mistera-booting');
  if(window.__snow) (run&&!root.classList.contains('no-snow'))?window.__snow.start():window.__snow.stop();
  if(window.__chimneySmoke) (run&&!root.classList.contains('no-smoke'))?window.__chimneySmoke.start():window.__chimneySmoke.stop();
}
function updateMusicDiagnostics(){
  const el=$('music-status');if(!el)return;
  const a=window.__misteraAudio;if(!a)return;
  const data=a.getStats();
  const sec=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'--:--';
  const state=!data.ambientMusicEnabled?'desactivada':data.musicError?'Error: '+data.musicError:
    data.musicAudible?'reproduciendo con salida audible':
    data.musicWaitingForInitialSeek?'cargando y buscando posición aleatoria':
    data.musicIsBuffering?'almacenando audio':
    data.musicPlaying?'reproduciendo (sin volumen aún)':
    'esperando interacción o permiso del navegador';
  el.textContent='Música: '+state+' · '+sec(data.musicTime)+' / '+sec(data.musicDuration)+
    ' · volumen '+Math.round(data.musicGain*100)+' %' +
    ' · chimenea '+(data.fireplace?.playing?'activa':'en espera')+' · viento '+(data.windLoaded?'listo':'cargando')+' · efectos '+data.audioState+' · salida '+data.musicOutput + (data.musicError ? ' · revisa el servidor/URL del MP3' : '');
}
function updateEffectsDiagnostics(){
  const el=$('effects-status');if(!el)return;
  const a=window.__misteraAudio,d=a?.getEffectDiagnostics?.()||{};
  const mode=a?.soundEffectsEnabled?'habilitados':'desactivados';
  el.textContent=`Efectos ${mode} · motor ${a?.context?.state||'sin iniciar'} · reproducción ${d.played||0} · intentos ${d.attempted||0} · bloqueos ${d.rejected||0}`+(d.lastError?` · ${d.lastError}`:'');
}
function initializeControls() {
  $('settings-button').onclick=()=>{
    if(!MISTERA_TEST_MODE){
      if(confirm('¿Entrar en modo Pruebas? Los cambios de prueba no modificarán los regalos descubiertos.')){const u=new URL(location.href);u.searchParams.set('mistera-pruebas','1');location.assign(u.toString());}
      return;
    }
    const sheet=$('settings');sheet.hidden=!sheet.hidden;
    $('settings-button').setAttribute('aria-expanded',String(!sheet.hidden));
    if(!sheet.hidden)updateMusicDiagnostics();
  };
  $('close-settings').onclick=closeSettings;
  $('dialog-close').onclick=closeSurpriseDialog;
  $('surprise-dialog').addEventListener('click',e=>{if(e.target===$('surprise-dialog'))closeSurpriseDialog();});
  $('surprise-dialog').addEventListener('cancel',e=>{e.preventDefault();closeSurpriseDialog();});
  $('toggle-days').onclick=()=>{
    const list=$('day-list');list.hidden=!list.hidden;
    $('toggle-days').setAttribute('aria-expanded',String(!list.hidden));
  };
  for(const [id,cls] of [['toggle-clouds','no-clouds'],['toggle-snow','no-snow'],['toggle-smoke','no-smoke']]) {
    $(id).addEventListener('change',e=>{root.classList.toggle(cls,!e.target.checked);syncCanvas();});
  }
  $('toggle-debug').addEventListener('change',e=>root.classList.toggle('debug-targets',e.target.checked));
  $('toggle-motion').addEventListener('change',e=>{root.classList.toggle('no-motion',!e.target.checked);syncCanvas();syncTreeImage();syncReadyStarMotion(true);});
  $('demo-date-mode').addEventListener('change',e=>{
    const value=e.target.value;
    window.__misteraDemoNow=value==='real'?null:Date.parse(value+'T00:15:00-05:00');
    render();
    notify(value==='real'?'Hora real de Perú restaurada.':'Fecha de prueba activa (no modifica el reloj real).');
  });
  $('demo-complete').onclick=()=>{
    HOUSES.forEach(h=>opened.add(h.day));persist();render();notify('Las 24 casas están iluminadas. El árbol anuncia el regalo final del 25 de diciembre.');
  };
  $('demo-reset').onclick=()=>{
    if(confirm('¿Reiniciar las 24 casas de esta prueba?')){
      opened.clear();vouchers=[];store(keys.vouchers,'[]');window.MisteraSurprises?.resetProgress?.();finalOpened=false;finalCelebrationQueued=false;store(keys.celebration,'no');persist();render();window.__misteraFireworks?.stop();notify('Aldea reiniciada.');
    }
  };
  const smokeStored=Math.max(70,Math.min(200,Number(safeGet(keys.smoke))||180));
  $('smoke-opacity').value=smokeStored;
  $('smoke-opacity-value').textContent=smokeStored+' %';
  window.__chimneySmoke.setOpacityMultiplier(smokeStored/100);
  $('smoke-opacity').addEventListener('input',e=>{
    const value=Math.max(70,Math.min(200,Number(e.target.value)||180));
    $('smoke-opacity-value').textContent=value+' %';
    window.__chimneySmoke.setOpacityMultiplier(value/100);store(keys.smoke,String(value));
  });
  const snowStored=Math.max(50,Math.min(1500,Number(safeGet(keys.snow))||800));
  $('snow-density').value=snowStored;
  $('snow-density-value').textContent=snowStored+' %';
  window.__snow.setDensity(snowStored/100);
  $('snow-density').addEventListener('input',e=>{
    const value=Math.max(50,Math.min(1500,Number(e.target.value)||1000));
    $('snow-density-value').textContent=value+' %';
    window.__snow.setDensity(value/100);store(keys.snow,String(value));
  });
  // A 15-minute rotating repertoire, manual previews, and a permanently fixed
  // "FELIZ NAVIDAD" after Christmas midnight in America/Lima.
  const messages=window.__misteraMessages;
  $('constellation-apply').addEventListener('click',()=>{
    const value=$('constellation-input').value.trim();
    if(!value){messages.hide();return;}
    messages.setManual(value);
  });
  $('constellation-clear').addEventListener('click',()=>messages.hide());
  $('constellation-auto').addEventListener('click',()=>messages.setAuto());
  $('constellation-next').addEventListener('click',()=>messages.previewNext());
  $('constellation-input').addEventListener('keydown',e=>{if(e.key==='Enter'){
    e.preventDefault();$('constellation-apply').click();
  }});
  // Development-only music diagnostics. Production UI stays visually unchanged.
  const audio=window.__misteraAudio;
  const musicToggle=$('toggle-ambient-music'),musicVolume=$('ambient-music-volume');
  musicToggle.checked=audio.ambientMusicEnabled;
  musicVolume.value=String(Math.round(audio.ambientMusicVolume*100/5)*5);
  $('ambient-music-volume-value').textContent=musicVolume.value+' %';
  musicToggle.addEventListener('change',e=>{
    audio.setAmbientMusicEnabled(e.target.checked,e);
    updateMusicDiagnostics();
  });
  musicVolume.addEventListener('input',e=>{
    audio.setAmbientMusicVolume(Number(e.target.value)/100);
    $('ambient-music-volume-value').textContent=e.target.value+' %';
    updateMusicDiagnostics();
  });
  $('music-retry').addEventListener('click',e=>{
    if(!audio.ambientMusicEnabled){audio.setAmbientMusicEnabled(true,e);musicToggle.checked=true;}
    audio.retryMusicFromGesture(e);
    updateMusicDiagnostics();
  });
  // Low-frequency polling only when the test panel is open.
  setInterval(()=>{if(!$('settings').hidden){updateMusicDiagnostics();updateEffectsDiagnostics();}},1500);
  const fireworkSound=$('toggle-firework-sound');
  const fireworkVolume=$('firework-volume');
  // Reuse the global preferences; the effect and music channels are independent.
  fireworkSound.checked=window.__misteraAudio.soundEffectsEnabled;
  fireworkVolume.value=String(Math.round(window.__misteraAudio.soundEffectsVolume*100/10)*10);
  $('firework-volume-value').textContent=fireworkVolume.value+' %';
  const syncFireworkAudio=()=>{
    window.__misteraFireworks.setSoundEnabled(fireworkSound.checked);
    window.__misteraFireworks.setVolume(Number(fireworkVolume.value)/100);
  };
  syncFireworkAudio();
  fireworkSound.addEventListener('change',event=>{
    syncFireworkAudio();
    if(fireworkSound.checked) {
      window.__misteraAudio.activateFromGesture(event);
      window.__misteraFireworks.unlockAudio();
    }
  });
  fireworkVolume.addEventListener('input',()=>{
    $('firework-volume-value').textContent=fireworkVolume.value+' %';syncFireworkAudio();
    // Persisted centrally by AudioManager.
  });
  $('effects-test').addEventListener('click',()=>{
    window.__misteraAudio?.playInteractionSound('open');
    setTimeout(()=>window.__misteraFireworks?.audio.launch(.25),240);
    setTimeout(()=>window.__misteraFireworks?.audio.explosion({size:1,travelDelay:.15}),600);
    setTimeout(updateEffectsDiagnostics,1450);
  });
  $('fireworks-test').addEventListener('click',()=>{
    if(!getMotionEnabled()){notify('Activa las animaciones para ver los fuegos artificiales.');return;}
    window.__misteraAudio?.ensureEffectsActive?.();window.__misteraFireworks.unlockAudio();
    window.__misteraFireworks.play({duration:14000});closeSettings();
  });
  $('simulate-christmas').addEventListener('click',()=>{
    messages.simulateChristmas(true);
    window.__misteraAudio?.ensureEffectsActive?.();window.__misteraFireworks.unlockAudio();
    if(getMotionEnabled())window.__misteraFireworks.play({duration:60000});
    // Do not cover the sky with a toast during the fireworks and lettering preview.
    closeSettings();
  });
  $('restore-real-time').addEventListener('click',()=>{
    messages.simulateChristmas(false);window.__misteraFireworks.stop();notify('Hora real restaurada.');
  });
  addEventListener('pageshow',refreshChimneys);
  addEventListener('storage',e=>{if(e.key===keys.chimneys)refreshChimneys();});
  document.addEventListener('visibilitychange',syncCanvas);
  mediaReduce.addEventListener('change',()=>{syncCanvas();syncTreeImage();syncReadyStarMotion(true);window.__misteraFireworks?.stop();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('settings').hidden)closeSettings();});
}
function init() {
  createHouseArtwork();buildTargets();buildStars();buildClouds();animateSnow();
  window.__misteraConstellations = new window.MisteraConstellations($('constellation-layer'));
  window.__misteraFireworks = new window.MisteraFireworks($('fireworks-canvas'),$('fireworks-flight-plane'));
  window.__misteraMessages = new window.MisteraSkyMessages(window.__misteraConstellations,{
    status:$('constellation-status'),christmasStatus:$('christmas-status')
  });
  window.MisteraTreeEffects($('tree-festive-points'));
  window.__chimneySmoke=new window.MisteraChimneySmoke({canvas:$('smoke-canvas'),frame:$('scene-frame'),houses:HOUSES,positions:getChimneyPoints()});
  initializeAdventDock();initializeControls();render();syncCanvas();
  window.addEventListener('mistera:surprise-progress',()=>{syncEditorialVouchers();});
  window.addEventListener('mistera:surprises-saved',()=>{render();syncEditorialVouchers();});
  window.addEventListener('mistera:published-content-refreshed',()=>{render();syncEditorialVouchers();});
  window.addEventListener('storage',e=>{if(e.key===window.MisteraSurprises?.configKey){location.reload();}});
  syncEditorialVouchers();
  const ro=new ResizeObserver(positionSky);ro.observe($('stage'));ro.observe($('scene-frame'));
  addEventListener('resize',positionSky);window.visualViewport?.addEventListener('resize',positionSky);
  positionSky();
  requestAnimationFrame(positionSky);
  if(!document.body.classList.contains('mistera-booting'))window.__misteraMessages.start();
  else window.addEventListener('mistera:entered',()=>{syncCanvas();window.__misteraMessages.start();}, {once:true});
}
window.MisteraRefreshFromCloud=()=>{
  if(MISTERA_TEST_MODE)return;
  try {
    const days=JSON.parse(localStorage.getItem(keys.opened)||'[]');
    opened=new Set(days.filter(d=>Number.isInteger(d)&&d>=1&&d<=24));
    finalOpened=localStorage.getItem(keys.final)==='yes';
    render();
  } catch(error){console.warn('[MISTERA] Sincronización en pantalla:',error);}
};
try {
  init();
  window.__misteraAppReady = true;
  window.dispatchEvent(new Event('mistera:ready'));
} catch (error) {
  window.__misteraBootError = error;
  console.error('[MISTERA] No se pudo inicializar la escena:', error);
  window.MisteraBootDiagnostics?.show?.();
}
