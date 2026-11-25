(() => {
  'use strict';
  const root = document.getElementById('root');
  const toastBox = document.getElementById('toast');
  const reactions = ['\u2764\ufe0f','\ud83e\udd79','\ud83e\udd70','\ud83d\ude18','\u2728'];
  let calendar = null;
  let activeDay = null;
  let currentModal = null;
  let currentPhoto = 0;
  let lastFocused = null;
  let toastTimeout;
  const BLOCKS=['letter','photos','audio','video','voucher','game'];
  // Individual gold engravings: no emoji, no repeating typographic flourish.
  const GOLD_MOTIFS=[
    '<path d="M40 62C28 51 15 41 19 29c3-11 17-12 21-3 5-9 19-8 21 3 3 12-9 22-21 33Z"/>',
    '<path d="M40 15v50M15 40h50M22 22l36 36M58 22 22 58M40 15l-5 7m5-7 5 7M15 40l7-5m-7 5 7 5M40 65l-5-7m5 7 5-7M65 40l-7-5m7 5-7 5"/>',
    '<path d="M54 17A25 25 0 1 0 63 57 22 22 0 0 1 54 17ZM27 25l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>',
    '<circle cx="27" cy="26" r="9"/><path d="M34 33 60 59h-9v-7h-7v-7L34 35"/>',
    '<path d="m40 13 7 19 19 8-19 7-7 19-8-19-19-7 19-8Z"/><circle cx="40" cy="40" r="6"/>',
    '<path d="M40 38C20 13 10 34 20 43c7 7 16 2 20-5 4 7 13 12 20 5 10-9 0-30-20-5ZM40 39v20m-8-9 8 9 8-9"/>',
    '<path d="M40 63V18M38 31c-12-2-16-9-17-15 13 0 18 6 17 15Zm4 10c12-3 17-9 17-16-13 1-19 7-17 16Zm-4 11c-10-2-16-6-18-13 11-1 17 4 18 13Z"/>',
    '<path d="m17 40 23-21 23 21v24H17Z M11 41l29-27 29 27 M33 64V48h14v16 M25 43h5m20 0h5"/>',
    '<path d="M40 63V16m0 15C27 31 25 23 23 20c12 0 16 3 17 11Zm0 11c12-1 16-8 18-12-12 0-18 5-18 12Zm0 11C29 52 24 46 22 43c11-1 17 3 18 10Z"/>',
    '<path d="M28 63h24M33 58h14M40 58V37m-9 0h18M40 17c-9 9-8 14 0 20 9-6 9-11 0-20Z"/>',
    '<path d="M19 55V34c0-12 9-19 21-19s21 7 21 19v21H19Z M19 37 13 29 M61 37l6-8 M28 52c2-5 6-5 9-1m6 0c3-4 7-4 9 1 M35 57l5 3 5-3"/>',
    '<path d="M40 19c-13-13-28 7-15 17-16 0-15 23 2 23 3 12 20 12 25 0 17 0 18-23 2-23 13-10-2-30-14-17Z M40 63V34"/>',
    '<path d="M22 45h36M26 45c0-14 6-21 14-21s14 7 14 21H26ZM21 49h38M35 58h10M40 16v8"/>',
    '<circle cx="40" cy="40" r="21"/><path d="M40 16v48M16 40h48M24 24l32 32M56 24 24 56M40 16l7 6-7 7-7-7ZM40 64l7-6-7-7-7 7Z"/>',
    '<path d="M22 22h36v39H22ZM29 30h22M29 38h22M29 46h16 M31 15v8m18-8v8"/>',
    '<path d="M23 48h33M27 48l3 12h18l4-12M29 30h31v12c0 5-5 6-8 6H29V30Zm31 3h7v7c0 4-3 7-8 7"/>',
    '<circle cx="31" cy="39" r="15"/><circle cx="49" cy="39" r="15"/><path d="M28 57h24"/>',
    '<path d="M40 16 22 40h10L17 55h46L48 40h10ZM40 55v11"/>',
    '<path d="M16 26h48v33H16ZM16 26l24 18 24-18M16 59l20-17m28 17L44 42"/>',
    '<path d="M29 63h22M25 56h30V29H25ZM31 29v-8h18v8M40 29v27M25 34l-6 6m36-6 6 6"/>',
    '<path d="M20 51c8-10 14-12 20-7 6-5 12-3 20 7M20 51l-5-13 14 6M60 51l5-13-14 6M37 31c-5-11-13-9-15-1 5 2 10 3 15 1Zm6 0c5-11 13-9 15-1-5 2-10 3-15 1Z"/>',
    '<path d="M24 52 28 30l12 8 12-8 4 22H24ZM24 52v9h32v-9M28 30l-4-10m32 10 4-10"/>',
    '<path d="M20 28c13-14 29-14 42 0M25 33c11-10 19-10 30 0M40 32v31M40 43l-12 12m12 0 12 8"/>',
    '<path d="m40 12 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z M20 62h40M29 53l11 9 11-9"/>'
  ];
  const doorEngraving=(day)=>`<svg class="door-seal" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="seal-ring" cx="40" cy="40" r="32"/>${GOLD_MOTIFS[(day-1)%24]}</svg>`;
  function garland(){const count=15;const bulbs=Array.from({length:count},(_,i)=>{const t=i/(count-1),x=30+940*t,y=15+210*t*(1-t);return `<g class="garland-lamp" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})" style="--i:${i}"><path d="M0 0v8" class="garland-hook"/><rect x="-4" y="7" width="8" height="7" rx="2" class="garland-socket"/><ellipse cx="0" cy="22" rx="7" ry="10" class="garland-bulb"/></g>`;}).join('');return `<svg class="garland-svg" viewBox="0 0 1000 100" preserveAspectRatio="none" role="presentation" aria-hidden="true"><path class="garland-cable" d="M30 15 Q500 120 970 15"/><circle class="garland-anchor" cx="30" cy="15" r="4"/><circle class="garland-anchor" cx="970" cy="15" r="4"/>${bulbs}</svg>`;}

  const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const writeStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const text = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const mediaUrl = (path) => typeof path === 'string' && (/^\/media\/(?:day-\d{2}|finale)\/[a-zA-Z0-9._-]+$/.test(path) || (window.MISTERA_PREVIEW === true && /^blob:https?:\/\//.test(path))) ? path : '';
  const weekWord = (num) => num === 1 ? 'sorpresa' : 'sorpresas';
  function toast(message) { toastBox.textContent = message; toastBox.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toastBox.classList.remove('visible'), 3500); }
  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i=0; i<24; i++) {
      const el = document.createElement('span'); el.className='confetti';
      el.style.left=`${Math.round(Math.random()*100)}vw`;
      el.style.top=`${Math.round(Math.random()*25-15)}vh`;
      el.style.background=['#e7a9b5','#efcc9d','#d9a6c9','#ffedd7'][i%4];
      el.style.setProperty('--x',`${Math.round(Math.random()*130-65)}px`);
      el.style.setProperty('--rot',`${Math.round(Math.random()*800-400)}deg`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }
  }
  function makeStars() {
    const area = document.getElementById('stars');
    for(let i=0;i<70;i++) { const s=document.createElement('i'); s.className='star';
      s.style.left=`${(i*37.17)%100}%`; s.style.top=`${(i*61.73)%100}%`;
      s.style.setProperty('--opacity',String(.2+((i*19)%70)/100));
      s.style.setProperty('--duration',`${2+(i%6)}s`); area.appendChild(s); }
  }
  async function request(url, options) {
    const response = await fetch(url, {credentials:'same-origin',cache:'no-store',...options});
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) { const e=new Error(data?.error || `Error ${response.status}`); e.status=response.status; throw e; }
    return data;
  }
  function renderLogin(message='') {
    calendar=null;
    root.innerHTML=`<section class="login-shell"><div class="login-art" aria-hidden="true"><span class="login-art-title">Nuestro rincón de diciembre</span><img class="login-village" src="/winter-village.svg" alt=""><span class="login-seal">24<br><small>cartitas de amor</small></span></div><div class="login-copy"><span class="eyebrow">✦ SOLO PARA TI ✦</span><h1>Nuestro diciembre <em>empieza contigo.</em></h1><p>Hay una sorpresa para ti cada día de diciembre.</p><form class="login-form" id="loginForm"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Nuestra clave secreta" aria-label="Clave secreta" required><button class="button" type="submit">Descubrir mi regalo <span aria-hidden="true">♥</span></button></form><div id="loginError" class="login-error" role="alert">${text(message)}</div></div></section>`;
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const form=event.currentTarget; const field=form.elements.password;
      const button=form.querySelector('button'); button.disabled=true; button.textContent='Un momento...';
      try { await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:field.value})}); field.value=''; await loadCalendar(); }
      catch (err) { document.getElementById('loginError').textContent=err.status===429?'Demasiados intentos. Intenta mas tarde.':'La clave no coincide. Vuelve a intentarlo.';button.disabled=false;button.innerHTML='Entrar &#8594;'; }
    });
  }
  async function loadCalendar() {
    try { calendar=await request('/api/calendar'); renderCalendar(); }
    catch(err) { if (err.status===401) renderLogin(); else renderFailure(); }
  }
  function renderFailure() { root.innerHTML='<section class="loading-state"><p>No pudimos cargar el calendario. Comprueba tu conexi\u00f3n.</p><button class="button" id="retry">Volver a intentar</button></section>';document.getElementById('retry').onclick=loadCalendar; }
  function renderCalendar() {
    const seen=readStore('mistera-opened-v1',{});
    const total=calendar.days.filter(day => seen[day.day] && day.available).length;
    const available=calendar.days.filter(day => day.available).length;

    let subtitle='Cada d\u00eda, una nueva raz\u00f3n para sonre\u00edr.';
    if(!available) subtitle=`La primera puerta se abrir\u00e1 el ${text(calendar.startDateLabel)}. Hasta entonces, esta sorpresa te espera.`;
    else if(available<24) subtitle=`Hoy hay ${available} ${weekWord(available)} disponibles. Las siguientes se ir\u00e1n revelando a su tiempo.`;
    else subtitle='Todas las puertas est\u00e1n abiertas. Vuelve cuando quieras a nuestros recuerdos.';
    const latestDay=Math.max(0,...calendar.days.filter(day=>day.available).map(day=>day.day));
    const doors=calendar.days.map(day=>{
      const opened=!!seen[day.day] && day.available;
      const state=day.available?(opened?'opened':'available'):'locked';
      const caption=opened?'Un recuerdo':day.available?'Abrir ahora':'Pr\u00f3ximamente';
      const special=(day.day===24?' door-special':'')+(day.day===latestDay&&day.available?' door-today':'');
      return `<button class="door ${state}${special}" style="--door-delay:${day.day*22}ms" data-day="${day.day}" aria-label="Día ${day.day}: ${day.available?(opened?'volver a ver':'abrir sorpresa'):'todavía cerrado'}" ${day.available?'':'disabled'}><span class="door-edge" aria-hidden="true"></span><span class="door-gold-corners" aria-hidden="true"></span><span class="door-knob" aria-hidden="true"></span><span class="door-top"><span class="door-tag">${opened?'✓':day.available&&day.day===latestDay?'HOY':''}</span></span><span class="door-symbol" aria-hidden="true">${doorEngraving(day.day)}</span><span class="door-number">${String(day.day).padStart(2,'0')}</span><span class="door-caption">${caption}</span><span class="door-bottom" aria-hidden="true"></span></button>`;
    }).join('');
    // No hint, icon or placeholder may reveal the existence of the finale before day 24 is opened.
    const finaleReady=calendar.hasFinale===true&&calendar.finaleAvailable===true&&!!seen[24];
    const finaleCard=finaleReady
      ? `<section class="finale-teaser finale-ready"><span class="finale-bow" aria-hidden="true">💝</span><div class="finale-copy"><span class="eyebrow">✦ SOLO DESPUÉS DE NUESTRA VENTANITA 24 ✦</span><strong>Una última sorpresa para ti</strong><p>Creías que habíamos llegado al final... pero mi corazón tenía guardado un regalo más.</p><button class="finale-cta" id="openFinaleBtn" type="button">Descubrir mi último secreto <span aria-hidden="true">♡</span></button></div><span class="finale-flare" aria-hidden="true">✧</span></section>`
      : '';
    root.innerHTML=`<section class="hero"><div class="hero-lights" aria-hidden="true">${garland()}</div><div class="hero-copy"><span class="hero-pill">ADVIENTO 2026</span><h1>Un diciembre <em>para ti.</em></h1>${calendar.subtitle?`<p class="lede">${text(calendar.subtitle)}</p>`:''}</div><div class="hero-scenery"><img src="/winter-village.svg" alt="" class="village-picture" loading="eager"></div></section><section class="summary"><div class="summary-copy"><h2>24 sorpresas</h2><p>${text(subtitle)}</p></div><div class="progress-wrap" role="status" aria-label="${total} de 24 sorpresas abiertas"><div class="progress-heading"><strong>${total}<span> / 24</span></strong><span>abiertas</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(total/24*100)}%"></div></div></div></section><section class="calendar-section"><div class="calendar-heading"><span>DICIEMBRE</span><div class="calendar-legend"><span><b class="legend-dot available-dot"></b>Disponible</span><span><b class="legend-dot locked-dot"></b>Cerrada</span></div></div><section class="calendar" aria-label="Calendario de Adviento">${doors}</section></section>${finaleCard}`;
    root.querySelectorAll('.door.available,.door.opened').forEach(el=>el.addEventListener('click',()=>openDay(Number(el.dataset.day))));
    root.querySelector('#openFinaleBtn')?.addEventListener('click',openFinale);
  }
  async function openDay(day) {
    const button=root.querySelector(`[data-day="${day}"]`);
    if(!button || button.disabled)return;
    button.disabled=true;button.classList.add('unsealing');
    try {
      const data=await request(`/api/day/${day}`);
      if(day===24&&data?.finaleReveal===true){calendar.hasFinale=true;calendar.finaleAvailable=true;}
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-paused')) await new Promise(resolve=>setTimeout(resolve,310));
      const seen=readStore('mistera-opened-v1',{});
      const first=!seen[day]; seen[day]=true;writeStore('mistera-opened-v1',seen);
      activeDay=day; currentPhoto=0; lastFocused=document.activeElement;
      renderCalendar(); showSurprise(data); if(first)celebrate();
    } catch(err) { if(err.status===423)toast('Todav\u00eda no es el d\u00eda de esta sorpresa.');else if(err.status===401)renderLogin();else toast('No pudimos abrir esta sorpresa. Vuelve a intentarlo.'); }
    finally { const newButton=root.querySelector(`[data-day="${day}"]`);if(newButton)newButton.disabled=false; }
  }
  async function openFinale() {
    if (!calendar?.hasFinale||!calendar.finaleAvailable||!readStore('mistera-opened-v1',{})[24]) {toast('El Gran Final aparece despu\u00e9s de abrir el d\u00eda 24.');return;}
    try {
      let data;
      try{data=await request('/api/finale');}
      catch(error){if(error.status!==423)throw error;
        // Restore the server-side finale permit after the recipient signs in again.
        await request('/api/day/24');data=await request('/api/finale');}
      const seen=readStore('mistera-opened-v1',{});const first=!seen.finale;seen.finale=true;writeStore('mistera-opened-v1',seen);
      if(currentModal)closeModal();
      activeDay='finale';currentPhoto=0;lastFocused=document.activeElement;
      renderCalendar();showSurprise(data);if(first)celebrate();
    }catch(error){toast(error.status===423?'El Gran Final todav\u00eda est\u00e1 cerrado.':'No fue posible abrir el Gran Final. Intenta otra vez.');}
  }
  function humanDate(iso) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return '';
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-PE',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
  }
  function exportVoucherCalendar(voucher, title) {
    const day=String(voucher.suggestedDate||'').replace(/-/g,'');if(!/^\d{8}$/.test(day))return;
    const time=/^\d{2}:\d{2}$/.test(voucher.suggestedTime||'')?voucher.suggestedTime.replace(':','')+'00':null;
    const start=time?`DTSTART;TZID=America/Lima:${day}T${time}`:`DTSTART;VALUE=DATE:${day}`;
    const nextDay=new Date(Date.parse(voucher.suggestedDate+'T12:00:00Z')+86400000).toISOString().slice(0,10).replace(/-/g,'');
    const nextHour=time?Number(time.slice(0,2))+1:0;
    const end=time?`DTEND;TZID=America/Lima:${nextHour>=24?nextDay:day}T${String(nextHour%24).padStart(2,'0')}${time.slice(2)}`:`DTEND;VALUE=DATE:${nextDay}`;
    const safe=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MISTERA//Adviento Personal//ES','BEGIN:VEVENT',`UID:${Math.random().toString(36).slice(2)}@mistera.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,start,end,`SUMMARY:${safe(title)}`,`DESCRIPTION:${safe(voucher.details)}`,`LOCATION:${safe(voucher.location)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));const a=document.createElement('a');a.href=url;a.download='nuestro-plan-mistera.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
  }
  function youtubeId(input) {
    if (typeof input!=='string'||!input)return '';
    try { const url=new URL(input);if(url.protocol!=='https:')return '';
      if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname))return /^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get('v')||'')?url.searchParams.get('v'):'';
      if(url.hostname==='youtu.be'){const id=url.pathname.slice(1);return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';}
    } catch {} return '';
  }
  function showSurprise(data) {
    const isFinale=activeDay==='finale';
    const game=data.game||{type:'none'};
    const photos=(Array.isArray(data.photos)?data.photos:[]).map(p=>mediaUrl(p.src)).filter(Boolean);
    const audio=mediaUrl(data.audio),video=mediaUrl(data.video),yt=youtubeId(data.youtube);
    const voucherData=data.voucher?.title?data.voucher:null;
    const savedVouchers=readStore('mistera-vouchers-v1',{}),vState=savedVouchers[activeDay]||{};
    const options=voucherData?.type==='choice'&&Array.isArray(voucherData.options)?voucherData.options.filter(x=>typeof x==='string'&&x.trim()).slice(0,6):[];
    const sections={};
    if(data.letter)sections.letter=`<section class="letter" aria-label="Carta"><p>${text(data.letter)}</p></section>`;
    if(photos.length)sections.photos=`<section class="media-section"><div class="photo-stage"><img id="activePhoto" alt="Fotografía de la sorpresa" src="${photos[0]}" loading="eager"></div>${photos.length>1?`<div class="photo-controls"><button type="button" id="photoPrev" aria-label="Fotografía anterior">‹</button><span id="photoCounter">1 de ${photos.length}</span><button type="button" id="photoNext" aria-label="Fotografía siguiente">›</button></div>`:''}</section>`;
    if(audio)sections.audio=`<section class="media-section"><audio controls preload="none" src="${audio}" aria-label="Grabación de audio"></audio></section>`;
    if(video||yt)sections.video=video?`<section class="media-section"><video controls playsinline preload="metadata" src="${video}" aria-label="Video de la sorpresa"></video></section>`:`<section class="media-section"><iframe class="video-embed" src="https://www.youtube-nocookie.com/embed/${yt}?rel=0" title="Video de esta sorpresa" loading="lazy" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></section>`;
    if(voucherData){const v=voucherData;
      sections.voucher=`<section class="voucher"><div class="voucher-kicker">VALE POR</div><h3>${text(v.title)}</h3>${v.details?`<p>${text(v.details)}</p>`:''}
      ${options.length?`<div class="voucher-choices"><label for="voucherChoice">Elige una opción</label><select id="voucherChoice"><option value="">Selecciona</option>${options.map((option,i)=>`<option value="${i}" ${vState?.choice===option?'selected':''}>${text(option)}</option>`).join('')}</select></div>`:''}
      ${v.suggestedDate?`<p class="voucher-meta"><strong>Fecha:</strong> ${text(humanDate(v.suggestedDate))}${v.suggestedTime?' · '+text(v.suggestedTime):''}</p>`:''}
      ${v.expiresAt?`<p class="voucher-meta"><strong>Hasta:</strong> ${text(humanDate(v.expiresAt))}</p>`:''}
      ${v.location?`<p class="voucher-meta"><strong>Lugar:</strong> ${text(v.location)}</p>`:''}
      <div class="voucher-actions"><button class="button secondary" id="redeemBtn" type="button">${vState.redeemed?'Marcar disponible':'Marcar utilizado'}</button><button class="button secondary" id="shareVoucherBtn" type="button">Compartir</button><button class="button secondary" id="whatsappVoucherBtn" type="button">WhatsApp</button></div>
      ${v.suggestedDate?'<button class="button ghost" id="calendarVoucherBtn" type="button">Añadir al calendario</button>':''}</section>`;
    }
    if(game.type&&game.type!=='none')sections.game='<section class="media-section game-section"><div id="miniGameMount"></div></section>';
    const finaleNext=activeDay===24&&calendar?.hasFinale&&calendar.finaleAvailable?'<section class="finale-next"><p>Hay un último regalo que aún no has descubierto.</p><button type="button" id="continueFinale">Abrir regalo secreto</button></section>':'';
    const fbStore=readStore('mistera-feedback-v5',{}),fb=fbStore[activeDay]||{};
    const priorReaction=readStore('mistera-reactions-v1',{})[activeDay];
    const selected=fb.reaction||priorReaction||'';
    const feedbackHTML=`<section class="reaction" aria-label="Responder"><div class="reaction-buttons">${reactions.map(r=>`<button class="${selected===r?'selected':''}" type="button" data-reaction="${r}" aria-label="Reaccionar con ${r}" aria-pressed="${selected===r?'true':'false'}">${r}</button>`).join('')}</div><label class="reaction-label" for="messageReply">Mensaje opcional</label><textarea id="messageReply" rows="3" maxlength="650" placeholder="Escribe algo si quieres…">${text(fb.message||'')}</textarea><div class="reaction-actions"><button class="button secondary" id="saveFeedback" type="button">Guardar</button><button class="button secondary" id="shareReaction" type="button">Compartir</button><button class="button secondary whatsapp-action" id="whatsappFeedback" type="button">WhatsApp</button></div></section>`;
    const order=Array.isArray(data.blockOrder)?Array.from(new Set(data.blockOrder.filter(x=>BLOCKS.includes(x)))):BLOCKS;
    for(const b of BLOCKS)if(!order.includes(b))order.push(b);
    const gate=!!data.gameGate&&!!sections.game;
    const renderOrder=(keys)=>keys.filter(k=>sections[k]).map(k=>sections[k]).join('');
    const gatesDone=readStore('mistera-games-done-v5',{});const done=!!gatesDone[activeDay];
    const inner=gate?`${sections.game}<div class="gated-reveal" id="gatedContent" ${done?'':'hidden'}><header class="gated-title"><h2 id="surpriseTitle">${text(data.title||'Una sorpresa para ti')}</h2>${data.lead?`<p>${text(data.lead)}</p>`:''}</header>${renderOrder(order.filter(x=>x!=='game'))}${finaleNext}${feedbackHTML}</div>`:`${renderOrder(order)}${finaleNext}${feedbackHTML}`;
    const header=gate&&!done?`<span class="eyebrow">${isFinale?'GRAN FINAL':'DÍA '+activeDay+' · DICIEMBRE'}</span><h2 id="surpriseTitle">Un juego antes de descubrir tu sorpresa</h2>`:`<span class="eyebrow">${isFinale?'GRAN FINAL':'DÍA '+activeDay+' · DICIEMBRE'}</span>${gate?'':`<h2 id="surpriseTitle">${text(data.title||'Una sorpresa para ti')}</h2>${data.lead?`<p class="modal-lead">${text(data.lead)}</p>`:''}`}`;
    const overlay=document.createElement('div');overlay.className='modal-overlay'+(isFinale?' is-finale':'');overlay.id='surpriseOverlay';
    overlay.innerHTML=`<article class="modal" role="dialog" aria-modal="true" aria-labelledby="surpriseTitle" tabindex="-1"><button id="modalClose" class="modal-close" aria-label="Cerrar sorpresa" type="button">×</button><header class="modal-top">${header}</header>${inner}</article>`;
    lastFocused=lastFocused||document.activeElement;document.body.appendChild(overlay);currentModal=overlay;
    overlay.querySelector('#modalClose').addEventListener('click',closeModal);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
    overlay.querySelector('.modal').focus();
    const img=overlay.querySelector('#activePhoto');
    if(img&&photos.length>1){const navigate=delta=>{currentPhoto=(currentPhoto+delta+photos.length)%photos.length;img.src=photos[currentPhoto];overlay.querySelector('#photoCounter').textContent=`${currentPhoto+1} de ${photos.length}`;};overlay.querySelector('#photoPrev').addEventListener('click',()=>navigate(-1));overlay.querySelector('#photoNext').addEventListener('click',()=>navigate(1));}
    if(sections.game){window.MISTERA_GAMES?.mount(overlay.querySelector('#miniGameMount'),game,{photo:photos[0]||'',onComplete:()=>{
      if(!gate)return;
      const completion=readStore('mistera-games-done-v5',{});completion[activeDay]=true;writeStore('mistera-games-done-v5',completion);
      const content=overlay.querySelector('#gatedContent');if(content){content.hidden=false;const lockedTitle=overlay.querySelector('.modal-top h2');if(lockedTitle){lockedTitle.removeAttribute('id');lockedTitle.textContent='¡Lo conseguiste!';}content.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
      toast('Sorpresa descubierta.');
    }});}
    overlay.querySelector('#continueFinale')?.addEventListener('click',openFinale);
    overlay.querySelectorAll('[data-reaction]').forEach(button=>button.addEventListener('click',()=>{
      const f=readStore('mistera-feedback-v5',{});const current=f[activeDay]||{};f[activeDay]={...current,reaction:button.dataset.reaction};writeStore('mistera-feedback-v5',f);
      overlay.querySelectorAll('[data-reaction]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button?'true':'false');});
    }));
    function saveFeedback(){const all=readStore('mistera-feedback-v5',{});const reply=overlay.querySelector('#messageReply');if(!reply)return;const selected=overlay.querySelector('[data-reaction].selected');all[activeDay]={reaction:selected?.dataset.reaction||'',message:reply.value.trim().slice(0,650)};writeStore('mistera-feedback-v5',all);toast('Respuesta guardada en este dispositivo.');}
    function feedbackText(){const note=overlay.querySelector('#messageReply')?.value.trim()||'';const reaction=overlay.querySelector('[data-reaction].selected')?.dataset.reaction||'';return `MISTERA · ${activeDay==='finale'?'Gran Final':'Día '+activeDay}${reaction?' · '+reaction:''}${note?'\n'+note:''}`;}
    overlay.querySelector('#saveFeedback')?.addEventListener('click',saveFeedback);
    overlay.querySelector('#shareReaction')?.addEventListener('click',()=>{saveFeedback();shareText(feedbackText());});
    overlay.querySelector('#whatsappFeedback')?.addEventListener('click',()=>{saveFeedback();sendWhatsApp(feedbackText());});
    const voucher=overlay.querySelector('#redeemBtn');const choice=()=>{const selector=overlay.querySelector('#voucherChoice');return selector&&selector.value!==''?options[Number(selector.value)]:'';};
    if(voucher)voucher.addEventListener('click',()=>{const all=readStore('mistera-vouchers-v1',{});const old=all[activeDay]||{};const used=!!old.redeemed;if(!used&&options.length&&!choice()&&!old.choice){toast('Primero elige una opción.');return;}all[activeDay]={redeemed:!used,choice:choice()||old.choice||''};writeStore('mistera-vouchers-v1',all);voucher.textContent=all[activeDay].redeemed?'Marcar disponible':'Marcar utilizado';toast('Vale guardado en este dispositivo.');});
    const voucherText=()=>{const v=voucherData;const choiceSelected=choice()||readStore('mistera-vouchers-v1',{})[activeDay]?.choice;return `MISTERA · Vale: ${v.title}${choiceSelected?'\nElijo: '+choiceSelected:''}${v.suggestedDate?'\nFecha: '+humanDate(v.suggestedDate):''}${v.suggestedTime?' · '+v.suggestedTime:''}${v.location?'\nLugar: '+v.location:''}${v.expiresAt?'\nVálido hasta: '+humanDate(v.expiresAt):''}`;};
    overlay.querySelector('#shareVoucherBtn')?.addEventListener('click',()=>shareText(voucherText()));
    overlay.querySelector('#whatsappVoucherBtn')?.addEventListener('click',()=>sendWhatsApp(voucherText()));
    overlay.querySelector('#calendarVoucherBtn')?.addEventListener('click',()=>exportVoucherCalendar(voucherData,voucherData.title));
    document.addEventListener('keydown',modalKeydown);
  }
  async function shareText(message){
    try{if(navigator.share){await navigator.share({text:message});return;}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);toast('Mensaje copiado para compartir.');return;}
      window.prompt('Copia tu mensaje:',message);
    }catch(error){if(error?.name!=='AbortError')toast('No se pudo compartir.');}
  }
  function sendWhatsApp(message){
    const phone=/^[1-9]\d{7,14}$/.test(calendar?.senderWhatsapp||'')?calendar.senderWhatsapp:'';
    const url=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.click();
  }
  function modalKeydown(e){if(!currentModal)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){
    const focusable=Array.from(currentModal.querySelectorAll('button,input,a,[tabindex]')).filter(el=>!el.disabled&&el.tabIndex>=0);
    if(!focusable.length)return; const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }}
  function closeModal(){ if(!currentModal)return;currentModal.querySelectorAll('audio,video').forEach(x=>x.pause());currentModal.remove();currentModal=null;activeDay=null;document.removeEventListener('keydown',modalKeydown);(lastFocused?.isConnected?lastFocused:root.querySelector('.door.available'))?.focus(); }
  const effects=()=>document.getElementById('effectsToggle');
  function bindEffects(){
    const saved=readStore('mistera-effects-v3',true);
    document.documentElement.classList.toggle('motion-paused',!saved);
    const b=effects(); if(!b)return;
    b.textContent=saved?'✨ Pausar magia':'✨ Activar magia';b.setAttribute('aria-pressed',saved?'true':'false');
    b.addEventListener('click',()=>{
      const on=document.documentElement.classList.contains('motion-paused');
      document.documentElement.classList.toggle('motion-paused',!on);
      writeStore('mistera-effects-v3',on);
      b.textContent=on?'✨ Pausar magia':'✨ Activar magia';b.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  makeStars();bindEffects();loadCalendar();
})();
