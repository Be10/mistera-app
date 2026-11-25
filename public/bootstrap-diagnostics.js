'use strict';
/* MISTERA V23 - visible failure diagnostics if one of the required scripts is absent.
 * Never changes the normal UI, audio, navigation, canvas or controls.
 */
(() => {
  const failed = new Set();
  let displayed = false;
  const expected = [
    ['villa (mapa)', () => typeof VILLA_MAP !== 'undefined' && VILLA_MAP?.houses?.length === 24],
    ['capas', () => !!window.MISTERA_LAYERS],
    ['humo', () => typeof window.MisteraChimneySmoke === 'function'],
    ['constelaciones', () => typeof window.MisteraConstellations === 'function'],
    ['efectos de arbol', () => typeof window.MisteraTreeEffects === 'function'],
    ['sonido', () => !!window.__misteraAudio],
    ['efectos de sonido', () => !!window.__misteraAudio?._v18EffectsInstalled],
    ['fuegos artificiales', () => typeof window.MisteraFireworks === 'function'],
    ['mensajes estelares', () => typeof window.MisteraSkyMessages === 'function'],
    ['plan de 25 sorpresas', () => window.MisteraSurprises?.list()?.length === 25],
    ['motor de experiencias', () => typeof window.MisteraExperience?.show === 'function'],
    ['editor clasico', () => typeof window.MisteraDrafts?.show === 'function'],
    ['interacciones', () => window.__misteraAppReady === true]
  ];
  function show() {
    if(displayed || window.__misteraAppReady === true)return;
    if(!document.body)return;
    const missing = expected.filter(([,has])=>{
      try{return !has();}catch(_){return true;}
    }).map(([name])=>name);
    if(!missing.length && !failed.size && !window.__misteraBootError)return;
    displayed=true;
    const banner=document.createElement('section');
    banner.id='mistera-init-error';banner.setAttribute('role','alert');
    banner.style.cssText='position:fixed;z-index:2147483647;left:12px;right:12px;top:12px;margin:auto;max-width:480px;padding:16px 18px;background:#132640;color:#fff2d7;border:1px solid #e5b878;border-radius:13px;box-shadow:0 12px 38px #0009;font:14px/1.5 system-ui,sans-serif;text-align:left;';
    const heading=document.createElement('strong');heading.textContent='MISTERA no pudo cargar todos sus componentes';
    const detail=document.createElement('p');detail.style.margin='7px 0 0';
    const cause=missing.length?missing.join(', '):Array.from(failed).join(', ');
    detail.textContent='Faltan o fallaron: '+(cause||'un componente requerido')+'. Descarga y extrae el ZIP completo y abre la demo mediante Iniciar_Mistera_V23.bat. Si ya lo hiciste, prueba a recargar sin caché.';
    banner.append(heading,detail);document.body.appendChild(banner);
  }
  window.addEventListener('error', e=>{
    if(e.target?.tagName==='SCRIPT'){
      failed.add(e.target.getAttribute('src')||'script sin identificar');
    } else if(e.error)failed.add(e.error.message||'error JavaScript');
  }, true);
  window.addEventListener('DOMContentLoaded',()=>setTimeout(show,100));
  window.addEventListener('mistera:ready',()=>{const el=document.getElementById('mistera-init-error');el?.remove();});
  window.MisteraBootDiagnostics={getErrors:()=>[...failed],show};
})();
