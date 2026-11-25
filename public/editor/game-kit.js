// MISTERA personal: zero-dependency interactive games for editor and recipient.
(() => {
  'use strict';
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value != null) node.textContent = String(value);
    return node;
  };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]/g, '').trim();
  function mount(host, game, options = {}) {
    if (!host) return;
    host.replaceChildren();
    const type = game?.type || 'none';
    if (type === 'none') return;
    let finished=false;
    const complete=()=>{if(finished)return;finished=true;host.dispatchEvent(new CustomEvent('mistera:complete',{bubbles:false}));if(typeof options.onComplete==='function')options.onComplete();};
    const panel = el('div', 'mini-game');
    const header = el('div', 'mini-game-label', type === 'scratch' ? 'TARJETA SECRETA' : type === 'riddle' ? 'ACERTIJO' : 'ROMPECABEZAS');
    const status = el('p', 'mini-game-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.append(header);
    if (type === 'scratch') {
      const frame = el('div', 'mini-scratch-frame');
      const answer = el('div', 'mini-scratch-answer', game.message || 'Una sorpresa para ti');
      const canvas = el('canvas', 'mini-scratch-canvas');
      canvas.setAttribute('aria-label', 'Raspa con el dedo o el mouse para descubrir el mensaje');
      const button = el('button', 'mini-game-button', 'Revelar sin raspar');
      button.type = 'button';
      frame.append(answer, canvas); panel.append(frame, button, status);
      host.append(panel);
      const paint = () => {
        const r = frame.getBoundingClientRect();
        const w = Math.max(150, r.width), h = Math.max(130, r.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr); ctx.fillStyle = '#aa7e87';ctx.fillRect(0,0,w,h);
        ctx.fillStyle = '#fff5e7';ctx.textAlign = 'center';ctx.font = '600 17px Georgia';
        ctx.fillText('RASPA AQUI', w/2, h/2);
        ctx.globalCompositeOperation = 'destination-out';ctx.lineWidth = 35;ctx.lineJoin = 'round';ctx.lineCap = 'round';
        let down = false, distance = 0, old = null;
        const pos = event => {const b = canvas.getBoundingClientRect(); return {x:(event.clientX-b.left)*w/b.width,y:(event.clientY-b.top)*h/b.height};};
        const move = event => {
          if (!down) return;
          const p = pos(event); if (!old) old = p;
          ctx.beginPath();ctx.moveTo(old.x,old.y);ctx.lineTo(p.x,p.y);ctx.stroke();
          distance += Math.hypot(p.x-old.x,p.y-old.y); old=p;
          if (distance > w*3) { canvas.style.opacity = '0';canvas.style.pointerEvents='none';status.textContent='\u2728 Mensaje descubierto';complete(); }
        };
        canvas.addEventListener('pointerdown', event => {down=true;old=pos(event);canvas.setPointerCapture(event.pointerId);move(event);});
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', () => {down=false;old=null;});
        canvas.addEventListener('pointercancel', () => {down=false;old=null;});
      };
      requestAnimationFrame(paint);
      button.addEventListener('click', () => {canvas.hidden=true;status.textContent='\u2728 Mensaje descubierto';complete();});
    } else if (type === 'riddle') {
      const question = el('p', 'mini-riddle-question', game.question || 'Una pregunta para ti');
      const form = el('form', 'mini-riddle-form');
      const input = el('input'); input.type='text';input.placeholder='Escribe tu respuesta'; input.setAttribute('aria-label','Respuesta');input.autocomplete='off';
      const check = el('button', 'mini-game-button', 'Comprobar'); check.type='submit';
      form.append(input, check);panel.append(question, form, status);
      if (game.hint) {
        const hintBtn=el('button','mini-hint-button','Ver una pista');hintBtn.type='button';
        hintBtn.addEventListener('click',()=>{hintBtn.textContent=game.hint;hintBtn.disabled=true;});
        panel.append(hintBtn);
      }
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!game.answer) {status.textContent='Falta la respuesta en el editor.';return;}
        const correct = normalize(input.value) === normalize(game.answer);
        status.textContent = correct ? '\u2728 \u00a1Acertaste! Una sorpresa desbloqueada.' : 'Aun no, prueba otra vez.';
        status.classList.toggle('won', correct);if(correct)complete();
      });
      host.append(panel);
    } else if (type === 'puzzle') {
      if (!options.photo) {
        panel.append(el('p', 'mini-game-status', 'Sube por lo menos una foto para activar este rompecabezas.'));
        host.append(panel);return;
      }
      const instruction=el('p', 'mini-riddle-question', 'Toca dos piezas para intercambiar su lugar y reconstruir nuestra foto.');
      const grid=el('div', 'mini-puzzle-grid'); grid.setAttribute('aria-label','Rompecabezas de nueve piezas');
      const order=[0,1,2,3,4,5,6,7,8];
      for (let i=8;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      if (order.every((v,i)=>v===i)) [order[0],order[1]]=[order[1],order[0]];
      let selected=null;
      const buttons=[];
      function update() {
        buttons.forEach((button,index)=>{
          const tile=order[index];
          button.style.backgroundImage=`url("${String(options.photo).replace(/["\\]/g,'')}")`;
          button.style.backgroundPosition=`${(tile%3)*50}% ${Math.floor(tile/3)*50}%`;
          button.classList.toggle('picked', selected===index);
          button.setAttribute('aria-label',`Pieza ${index+1}`);
        });
        if (order.every((v,i)=>v===i)) {status.textContent='\u2728 \u00a1Lo lograste! Esta foto es nuestra.';status.classList.add('won');grid.classList.add('solved');complete();}
      }
      for(let i=0;i<9;i++) {
        const button=el('button','mini-puzzle-piece');button.type='button';
        button.addEventListener('click',()=>{
          if (grid.classList.contains('solved')) return;
          if (selected===null) selected=i;
          else { [order[selected],order[i]]=[order[i],order[selected]]; selected=null; }
          update();
        });
        grid.append(button);buttons.push(button);
      }
      panel.append(instruction,grid,status);host.append(panel);update();
    }
  }
  window.MISTERA_GAMES={mount};
})();
