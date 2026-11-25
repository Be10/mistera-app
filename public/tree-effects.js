'use strict';
/* Overlay coordinates are sampled from the original unlit tree's alpha mask.
 * No points touch the star or presents. No external images or library required.
 */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const colors=['#d75b50','#87c5a4','#f7c37b'];
  window.MisteraTreeEffects=function(svg){
    if(!svg || !Array.isArray(window.MISTERA_TREE_POINTS))return;
    const batch=document.createDocumentFragment();
    for(const [x,y,c,r,period,delay,low,high] of window.MISTERA_TREE_POINTS){
      const el=document.createElementNS(NS,'circle');
      el.setAttribute('cx',x);el.setAttribute('cy',y);el.setAttribute('r',r);
      el.setAttribute('class','tree-twinkle');
      el.style.setProperty('--light-color',colors[c]);
      el.style.setProperty('--light-duration',period+'s');
      el.style.setProperty('--light-delay',delay+'s');
      el.style.setProperty('--light-low',low);
      el.style.setProperty('--light-mid',Math.min(.92, (low+high)*.55).toFixed(3));
      el.style.setProperty('--light-high',high);
      batch.appendChild(el);
    }
    svg.replaceChildren(batch);
  };
})();
