/* V34: soft looping indicator for the next unlocked but undiscovered house/tree. */
(()=>{'use strict';
  const player=new Audio('assets/audio/Star_Shinning.mp3');
  player.preload='auto';player.loop=true;player.setAttribute('playsinline','');
  player.volume=.16;
  let entered=false,lastTarget='';
  const enabled=()=>{
    const mgr=window.__misteraAudio;
    return entered&&!document.hidden&&!!mgr?.soundEffectsEnabled&&mgr.soundEffectsVolume>0;
  };
  const active=()=>{
    const el=document.querySelector('#house-ready-stars .ready-star-marker');
    return el?.dataset?.target||'';
  };
  function update(){
    const target=active();
    if(!target||!enabled()){
      if(!player.paused)player.pause();lastTarget=target;return;
    }
    player.volume=Math.min(.22,.16*(window.__misteraAudio?.soundEffectsVolume||1)/2);
    if(lastTarget!==target){try{player.currentTime=0;}catch(_){}}
    lastTarget=target;
    if(player.paused){try{player.play()?.catch?.(()=>{});}catch(_){}}
  }
  window.addEventListener('mistera:entered',()=>{entered=true;update();});
  window.addEventListener('mistera:star-changed',update);
  window.addEventListener('pageshow',update);
  document.addEventListener('visibilitychange',update);
  document.addEventListener('pointerdown',()=>{if(entered)update();},{passive:true,capture:true});
  window.addEventListener('pagehide',()=>player.pause());
  window.MisteraStarSound={update,get current(){return lastTarget;}};
})();
