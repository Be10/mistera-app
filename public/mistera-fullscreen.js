/* V34 Fullscreen API: requires a user gesture. iPhone Safari has platform limitations. */
(()=>{'use strict';
  const doc=document,el=doc.documentElement;
  const entrySound=new Audio('assets/audio/Load_Screen_Button.mp3');entrySound.preload='auto';
  window.MisteraLoaderEntrySound={play(){
    try{entrySound.pause();entrySound.currentTime=0;entrySound.volume=.58;
      const p=entrySound.play();p?.catch?.(()=>{});}catch(_){}
  }};
  const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
  const toggle=async()=>{
    try{
      if(active()){
        if(doc.exitFullscreen)await doc.exitFullscreen();
        else if(doc.webkitExitFullscreen)await doc.webkitExitFullscreen();
      }else{
        const go=el.requestFullscreen||el.webkitRequestFullscreen;
        if(!go){
          const status=doc.getElementById('dock-cloud-status');
          if(status)status.textContent='Para verla sin barras, agrega MISTERA a la pantalla de inicio.';
          else alert('En este navegador, agrega MISTERA a la pantalla de inicio para disfrutarla a pantalla completa.');
          return false;
        }
        await go.call(el,{navigationUI:'hide'});
      }
      return true;
    }catch(_){return false;}
  };
  const notify=()=>{window.dispatchEvent(new Event('mistera:fullscreenchange'));
    const b=doc.getElementById('mistera-fullscreen-entrance');
    if(b){b.setAttribute('aria-pressed',String(active()));b.querySelector('strong').textContent=active()?'Ya estás a pantalla completa ✨':'Vive nuestra Navidad a pantalla completa';}
  };
  doc.addEventListener('fullscreenchange',notify);doc.addEventListener('webkitfullscreenchange',notify);
  doc.getElementById('mistera-fullscreen-entrance')?.addEventListener('click',()=>{toggle();});
  window.MisteraFullscreen={toggle,get active(){return active();}};
})();
