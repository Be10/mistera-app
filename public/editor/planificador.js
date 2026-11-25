/* MISTERA V23 · Editor local y reversible, separado del receptor. */
(() => {
  'use strict';
  const S=window.MisteraSurprises, $=id=>document.getElementById(id);
  const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const label=(parent,text,node)=>{const l=el('label',text);l.append(node);parent.append(l);return node;};
  const inp=(v,kind='text')=>{const i=el(kind==='textarea'?'textarea':'input');if(kind!=='textarea')i.type=kind;i.value=v??'';return i;};
  const select=(value,items)=>{const s=el('select');items.forEach(([key,title])=>{const op=el('option',title);op.value=key;s.append(op);});s.value=value??'';return s;};
  const mkBtn=(name,cb,cls='studio-btn secondary')=>{const b=el('button',name,cls);b.type='button';b.addEventListener('click',cb);return b;};
  const toast=msg=>{const t=$('studio-toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,3200);};
  const blockTypes={letter:'Carta', 'flip-letter':'Carta reversible',scratch:'Raspadita',riddle:'Acertijo',puzzle:'Rompecabezas',voucher:'Vale',physical:'Regalo físico',gallery:'Galería',music:'Dedicatoria musical',video:'Video',story:'Historia ilustrada',image:'Ilustración',tickets:'Entradas',intro:'Presentación',reveal:'Revelación'};
  let selected=1,previewProgress={},pendingTimer=0;
  const day=()=>S.get(selected);
  function save(message){try{day().minigameType=(day().blocks.find(b=>['scratch','riddle','puzzle'].includes(b.type))||{type:'none'}).type;S.saveDay(selected,day());$('save-badge').textContent=message||'Guardado local ✓';updateGrid();refreshPreview();}catch(error){$('save-badge').textContent='Error al guardar';toast(error.message);}}
  function connect(id,key,parse=x=>x){$(id).addEventListener('input',e=>{day()[key]=parse(e.target.value);save();if(key==='title')$('day-title').textContent=day().title;});}
  function updateGrid(){const list=$('day-grid');list.replaceChildren();for(let n=1;n<=25;n++){
    const d=S.get(n);const b=mkBtn(String(n).padStart(2,'0'),()=>selectDay(n),'studio-day');b.dataset.status=d.planningStatus;b.title=`${d.title} · ${d.planningStatus}`;b.setAttribute('aria-current',String(selected===n));list.append(b);
  }}
  function fields(){const d=day();$('field-title').value=d.title||'';$('field-description').value=d.description||'';
    $('field-unlock').value=(d.unlockAt||'').slice(0,16);$('field-type').value=d.experienceType||'';
    $('field-status').value=d.planningStatus||'PROPUESTA';$('field-publication').value=d.publicationStatus||'BORRADOR';$('field-availability').value=d.availabilityStatus||'PROGRAMADO';
    $('field-audio').value=d.audioBehavior||'inherit';$('field-animation').value=d.animation||'soft-reveal';$('field-transition').value=d.transition||'fade';
    $('field-notes').value=d.editorNotes||'';$('field-pending').value=(d.mediaPending||[]).join('\n');
    $('day-title').textContent=d.title;$('day-eyebrow').textContent=`DÍA ${String(selected).padStart(2,'0')} · ${(d.date||'').split('-').reverse().join('/')}`;
    $('field-move-day').value=String(selected);
  }
  function selectDay(n){selected=Math.min(25,Math.max(1,n));previewProgress={};fields();updateGrid();renderBlocks();refreshPreview();}
  function refreshPreview(){const d=day();$('preview-title').textContent=d.title||`Día ${selected}`;
    $('preview-description').textContent=d.description||'Sorpresa por configurar';window.MisteraExperience.mount(selected,$('preview-live'),{preview:true,previewProgress});
  }
  function field(parent,record,key,caption,{type='text',options=null,placeholder='',min=null,max=null,step=null}={}){
    const node=options?select(record[key],options):inp(record[key],type);if(placeholder)node.placeholder=placeholder;
    if(min!==null)node.min=min;if(max!==null)node.max=max;if(step!==null)node.step=step;
    label(parent,caption,node);
    node.addEventListener((type==='text'||type==='textarea')?'input':'change',()=>{
      record[key]=type==='number'?Number(node.value):node.value;save();
    });return node;
  }
  function assetInput(parent,record,key,caption,accept,kind='image'){
    const wrap=el('div',undefined,'studio-asset-input');const container=el('div');const input=el('input');input.type='file';input.accept=accept;
    label(container,caption,input);const ref=el('div',record[key]?'Asignado: '+record[key]:'Recurso pendiente','studio-asset-ref');container.append(ref);
    const clear=mkBtn('Quitar',()=>{record[key]='';save();renderBlocks();});wrap.append(container,clear);parent.append(wrap);
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;
      try{ref.textContent='Guardando archivo...';record[key]=await S.putMedia(file);save();renderBlocks();toast('Archivo guardado en este navegador.');}
      catch(error){ref.textContent=error.message;toast(error.message);}
    });
  }
  function dependentField(host,block){const opts=[['','Sin dependencia'],...day().blocks.filter(b=>b!==block).map(b=>[b.id,b.title||blockTypes[b.type]||b.type])];
    field(host,block,'requires','Mostrar solo después de completar', {options:opts});
  }
  function renderScenes(host,block){
    const title=el('h4','Viñetas de la historia');host.append(title);
    (block.scenes||[]).forEach((scene,i)=>{
      const box=el('div',undefined,'studio-scene');box.append(el('strong',`Viñeta ${i+1}`));
      const controls=el('div',undefined,'studio-mini-actions');
      controls.append(mkBtn('↑',()=>moveScene(i,-1)),mkBtn('↓',()=>moveScene(i,1)),mkBtn('Eliminar',()=>{block.scenes.splice(i,1);save();renderBlocks();},'studio-btn secondary'));
      box.append(controls);field(box,scene,'title','Título');field(box,scene,'description','Descripción escénica',{type:'textarea'});
      field(box,scene,'narration','Narración editable',{type:'textarea'});
      assetInput(box,scene,'image','Imagen de esta viñeta','image/*');host.append(box);
    });
    host.append(mkBtn('+ Añadir viñeta',()=>{block.scenes=block.scenes||[];block.scenes.push({id:'scene-'+Date.now(),title:'Nueva viñeta',description:'',image:'',narration:''});save();renderBlocks();}));
    function moveScene(i,dir){const t=i+dir;if(t<0||t>=block.scenes.length)return;[block.scenes[i],block.scenes[t]]=[block.scenes[t],block.scenes[i]];save();renderBlocks();}
  }
  function galleryUpload(box,block){const list=el('div','Imágenes guardadas: '+(block.images?.length||0),'studio-asset-ref');box.append(list);
    for(const [i,ref] of (block.images||[]).entries())box.append(mkBtn(`Quitar foto ${i+1}`,()=>{block.images.splice(i,1);save();renderBlocks();}));
    const upload=el('input');upload.type='file';upload.accept='image/*';upload.multiple=true;label(box,'Añadir fotografías',upload);
    upload.addEventListener('change',async()=>{try{block.images=block.images||[];for(const file of Array.from(upload.files||[])){if(block.images.length>=15)throw Error('Máximo 15 fotos por galería.');block.images.push(await S.putMedia(file));}save();renderBlocks();}catch(error){toast(error.message);}});
  }
  function renderSpecialFields(host,d){
    $('block-count').textContent='Experiencia especial';
    const note=el('p','Estos datos están integrados con la escena interactiva del día. Se guardan en este navegador; puedes exportar el JSON. Los medios publicados se conservan en assets/sorpresas/dia-01.','studio-hint');host.append(note);
    const pane=el('section',undefined,'studio-block');host.append(pane);
    if(d.specialExperience==='cinema-v33'){
      pane.append(el('h3','Día 01 · Raspa, descubre y entradas'));
      const c=d.cinema;
      field(pane,c,'scratchInstruction','Indicación antes de raspar');
      field(pane,c,'scratchCoverText','Texto sobre el raspado');
      field(pane,c,'scratchThreshold','Porcentaje para completar el raspado (0.65 a 0.70)',{type:'number',min:'.65',max:'.70',step:'.01'});
      field(pane,c,'flipPrompt','Indicación para tocar la tarjeta');
      field(pane,c,'letter','Mensaje exacto del reverso',{type:'textarea'});
      field(pane,c,'movie','Nombre de la película');
      field(pane,c,'date','Fecha real de la función',{type:'date'});
      field(pane,c,'time','Hora');field(pane,c,'room','Sala');
      field(pane,c,'seats','Butacas (una sola entrada)');
      field(pane,c,'ticketNote','Detalle romántico de entrada');
      field(pane,c,'cover','Archivo del arte de raspado (ruta)');
      assetInput(pane,c,'cover','Sustituir imagen de raspado','image/*');
      field(pane,c,'overlay','Archivo del título transparente (ruta)');
      assetInput(pane,c,'overlay','Sustituir título superpuesto','image/png');
      field(pane,c,'poster','Archivo del cartel de la entrada (ruta)');
      assetInput(pane,c,'poster','Sustituir cartel de entrada','image/*');
    }else{
      pane.append(el('h3','Día 02 · Carta, acertijo y pistas'));
      const sec=d.secret;
      field(pane,sec,'openPrompt','Texto de la carta doblada');
      field(pane,sec,'riddle','Acertijo completo con saltos de línea',{type:'textarea'});
      (sec.hints||[]).forEach((v,i)=>{
        const input=inp(v,'textarea');label(pane,`Pista ${i+1} (orden fijo)`,input);
        input.addEventListener('input',()=>{sec.hints[i]=input.value;save();});
      });
      field(pane,sec,'foundNote','Notita final aprobada',{type:'textarea'});
    }
  }
  function renderBlocks(){const host=$('block-list');host.replaceChildren();const d=day();
    if((selected===1&&d.specialExperience==='cinema-v33')||(selected===2&&d.specialExperience==='secret-v33')){
      renderSpecialFields(host,d);return;
    }
    $('block-count').textContent=d.blocks.length+' bloques';
    d.blocks.forEach((block,index)=>{
      const box=el('article',undefined,'studio-block'),top=el('div',undefined,'studio-block-top');top.append(el('strong',`${index+1}. ${blockTypes[block.type]||block.type}`));
      const buttons=el('div',undefined,'studio-mini-actions');buttons.append(mkBtn('↑',()=>move(index,-1)),mkBtn('↓',()=>move(index,1)),mkBtn('Duplicar',()=>{const newBlock=clone(block);newBlock.id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);d.blocks.splice(index+1,0,newBlock);save();renderBlocks();}),mkBtn('×',()=>{if(confirm('¿Quitar este bloque de la sorpresa?')){d.blocks.splice(index,1);d.blocks.forEach(b=>{if(b.requires===block.id)b.requires='';});save();renderBlocks();}},'studio-btn danger'));top.append(buttons);box.append(top);
      field(box,block,'type','Tipo de componente',{options:Object.entries(blockTypes).map(([k,v])=>[k,v])});
      box.querySelector('select')?.addEventListener('change',()=>{renderBlocks();});
      field(box,block,'title','Título de este bloque');
      if(!['puzzle','story'].includes(block.type))field(box,block,'body','Contenido / mensaje',{type:'textarea'});
      dependentField(box,block);
      const b=block.type;
      if(b==='scratch'){
        field(box,block,'message','Texto revelado');field(box,block,'coverText','Texto sobre superficie');field(box,block,'threshold','Umbral de raspado (0,12–0,9)',{type:'number',min:'.12',max:'.9',step:'.02'});
        assetInput(box,block,'image','Portada que aparece después del raspado','image/*');
      } else if(b==='riddle'){
        field(box,block,'question','Acertijo',{type:'textarea'});field(box,block,'answer','Respuesta correcta');field(box,block,'hint','Pista opcional');
      } else if(b==='puzzle'){
        field(box,block,'pieces','Piezas',{options:[['9','9 piezas'],['16','16 piezas']]});assetInput(box,block,'image','Imagen que se armará','image/*');
      } else if(b==='physical'){
        field(box,block,'item','Nombre / descripción del regalo físico');field(box,block,'foundLabel','Texto del botón Encontrado');assetInput(box,block,'image','Fotografía del regalo','image/*');
      } else if(b==='voucher'){
        field(box,block,'place','Lugar');field(box,block,'conditions','Condiciones de canje',{type:'textarea'});field(box,block,'expiresAt','Válido hasta (opcional)',{type:'date'});
      } else if(b==='flip-letter'){
        field(box,block,'backText','Texto del reverso',{type:'textarea'});assetInput(box,block,'image','Foto o ilustración al reverso','image/*');
      } else if(b==='story'){
        field(box,block,'intro','Introducción',{type:'textarea'});assetInput(box,block,'music','Música para la historia (autorizada)','audio/*');renderScenes(box,block);
      } else if(b==='gallery')galleryUpload(box,block);
      else if(b==='music'){
        field(box,block,'songTitle','Título de canción');field(box,block,'artist','Autor o intérprete');assetInput(box,block,'audio','Audio autorizado','audio/*');
      } else if(b==='video')assetInput(box,block,'video','Video personal','video/*');
      else if(['image','tickets','reveal'].includes(b)){
        if(b==='tickets')field(box,block,'date','Fecha de uso',{type:'date'});assetInput(box,block,'image','Fotografía / portada / entrada real','image/*');
      }
      field(box,block,'transition','Transición');field(box,block,'effect','Efecto visual');
      field(box,block,'audioBehavior','Audio de este bloque',{options:[['inherit','Heredar'],['pause-ambient','Pausar ambiente'],['silent','Sin audio propio']]});
      host.append(box);
    });
  }
  function move(i,dir){const a=day().blocks,n=i+dir;if(n<0||n>=a.length)return;[a[i],a[n]]=[a[n],a[i]];save();renderBlocks();}
  function exportJSON(){const text=JSON.stringify(S.getAll(),null,2);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=el('a');a.href=url;a.download='sorpresas-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Exportación lista: reemplaza content/sorpresas-2026.json y publica una nueva versión. Los medios se respaldan aparte.');}
  function init(){const pick=$('field-move-day');for(let i=1;i<=25;i++){const option=el('option',`Día ${String(i).padStart(2,'0')}`);option.value=i;pick.append(option);}
    for(const [id,key] of [['field-title','title'],['field-description','description'],['field-type','experienceType'],['field-status','planningStatus'],['field-publication','publicationStatus'],['field-availability','availabilityStatus'],['field-audio','audioBehavior'],['field-animation','animation'],['field-transition','transition'],['field-notes','editorNotes']])connect(id,key);
    $('field-unlock').addEventListener('change',e=>{if(!e.target.value)return;day().unlockAt=e.target.value+':00-05:00';day().date=e.target.value.slice(0,10);save();});
    $('field-pending').addEventListener('input',e=>{day().mediaPending=e.target.value.split('\n').map(s=>s.trim()).filter(Boolean);save();});
    $('add-block').addEventListener('click',()=>{const type=$('new-block-type').value,d=day();d.blocks.push({id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),type,title:blockTypes[type],body:'',image:'',audio:'',video:'',requires:'',transition:'fade',effect:'soft',scenes:type==='story'?[]:undefined});save();renderBlocks();});
    $('reset-day').addEventListener('click',()=>{if(!confirm(`¿Restaurar la planificación original del día ${selected}? Se perderán tus cambios de este día.`))return;S.resetDay(selected);selectDay(selected);});
    $('swap-day').addEventListener('click',()=>{const n=Number($('field-move-day').value);if(n===selected)return toast('Elige otro día.');
      if(!confirm(`¿Intercambiar las sorpresas de los días ${selected} y ${n}? Esta acción es una edición manual.`))return;
      const all=S.getAll(),a=all.days[selected-1],b=all.days[n-1];[all.days[selected-1],all.days[n-1]]=[b,a];
      for(const k of [selected,n]){all.days[k-1].day=k;all.days[k-1].date=`2026-12-${String(k).padStart(2,'0')}`;all.days[k-1].unlockAt=`2026-12-${String(k).padStart(2,'0')}T00:00:00-05:00`;}
      S.saveAll(all);selectDay(n);toast('Sorpresas intercambiadas.');
    });
    $('preview-reset').addEventListener('click',()=>{previewProgress={};refreshPreview();});
    $('export-json').addEventListener('click',exportJSON);
    $('import-json').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;
      try{const payload=JSON.parse(await file.text());if(!confirm('¿Sustituir manualmente los 25 borradores de este navegador por el archivo seleccionado?'))return;S.saveAll(payload);selectDay(1);toast('Configuración importada. Comprueba los recursos multimedia.');}catch(error){toast(error.message);}finally{e.target.value='';}
    });
    $('import-legacy').addEventListener('click',()=>{let legacy;try{legacy=JSON.parse(localStorage.getItem('mistera-personal-editor-v1')||'null');}catch(_){ }
      if(!legacy?.days?.length)return toast('No se encontró un borrador del Editor V5 en este navegador.');
      if(!confirm('¿Importar manualmente títulos, cartas, acertijos y vales del Editor V5? Esto sustituirá partes del plan actual, incluidos días 1–5. Las fotos deben copiarse aparte.'))return;
      const all=S.getAll();for(let n=1;n<=25;n++){const old=n===25?legacy.finale:legacy.days[n-1],d=all.days[n-1];if(!old)continue;
        if(old.title?.trim())d.title=old.title;
        if(old.lead?.trim())d.description=old.lead;
        if(old.letter?.trim())d.blocks.push({id:`legacy-${n}-letter`,type:'letter',title:'Carta importada del V5',body:old.letter});
        if(old.voucher?.enabled)d.blocks.push({id:`legacy-${n}-voucher`,type:'voucher',title:old.voucher.title||'Vale importado',body:old.voucher.details||'',conditions:old.voucher.location||''});
        if(old.game?.type&&old.game.type!=='none')d.blocks.push({id:`legacy-${n}-game`,type:old.game.type,title:'Minijuego importado',message:old.game.message,question:old.game.question,answer:old.game.answer,hint:old.game.hint});
      }
      S.saveAll(all);selectDay(selected);toast('Datos de texto del Editor V5 incorporados manualmente.');
    });
    selectDay(1);
  }
  init();
})();
