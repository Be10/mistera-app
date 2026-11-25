/* MISTERA V38: approved one-time letter after the existing gold entrance button.
 * Storage is scoped to TEST and PRD, never to a build version. The D1 read
 * receipt uses the existing append-only gift progress mechanism. */
(()=>{'use strict';
  const ENV=document.documentElement.classList.contains('mistera-prd')?'prd':'test';
  const KEY=`mistera-welcome-seen-${ENV}`,LEGACY='mistera-welcome-seen-v1',FIELD='mistera-intro-seen';
  let message='';
  const ready=(async()=>{
    try{
      const response=await fetch('content/mensaje-bienvenida.json',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      if(data?.enabled===true&&typeof data.message==='string')message=data.message.trim().slice(0,6500);
    }catch(_){}
  })();
  const seen=()=>{
    try{if(localStorage.getItem(KEY)==='yes'||localStorage.getItem(LEGACY)==='yes')return true;}catch(_){}
    return !!window.MisteraSurprises?.isCompleted?.(25,FIELD);
  };
  async function shouldShow(){
    await ready;
    if(!message)return false;
    try{await Promise.race([window.MisteraCloud?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,2200))]);}catch(_){}
    return !seen();
  }
  function markSeen(){
    try{localStorage.setItem(KEY,'yes');}catch(_){}
    try{window.MisteraSurprises?.complete?.(25,FIELD,true);}catch(_){}
    try{window.MisteraCloud?.sync?.();}catch(_){}
  }
  window.MisteraWelcome={shouldShow,markSeen,get message(){return message;}};
})();
