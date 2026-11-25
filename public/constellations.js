'use strict';
/* MISTERA V22 - responsive celestial two-zone layout and faceted sparse constellation hearts. */
(function () {
  const NS='http://www.w3.org/2000/svg';
  const paths={
    A:[[[0,12],[4,0],[8,12]],[[1.5,8],[6.5,8]]],
    B:[[[0,0],[0,12],[6,12],[8,10],[8,8],[6,6],[0,6]],[[0,0],[6,0],[8,2],[8,4],[6,6]]],
    C:[[[8,1],[5,0],[1,2],[0,6],[1,10],[5,12],[8,11]]],
    D:[[[0,0],[0,12],[5,12],[8,9],[8,3],[5,0],[0,0]]],
    E:[[[8,0],[0,0],[0,12],[8,12]],[[0,6],[6,6]]],
    F:[[[0,12],[0,0],[8,0]],[[0,6],[6,6]]],
    G:[[[8,2],[5,0],[1,2],[0,6],[1,10],[5,12],[8,10],[8,7],[5,7]]],
    H:[[[0,0],[0,12]],[[8,0],[8,12]],[[0,6],[8,6]]],
    I:[[[0,0],[8,0]],[[4,0],[4,12]],[[0,12],[8,12]]],
    J:[[[8,0],[8,9],[5,12],[1,11],[0,9]]],
    K:[[[0,0],[0,12]],[[8,0],[0,7],[8,12]]],
    L:[[[0,0],[0,12],[8,12]]],
    M:[[[0,12],[0,0],[4,6],[8,0],[8,12]]],
    N:[[[0,12],[0,0],[8,12],[8,0]]],
    '\u00d1':[[[0,12],[0,0],[8,12],[8,0]],[[1,-3],[3,-5],[5,-3],[7,-5]]],
    O:[[[4,0],[0,3],[0,9],[4,12],[8,9],[8,3],[4,0]]],
    P:[[[0,12],[0,0],[6,0],[8,2],[8,5],[6,7],[0,7]]],
    Q:[[[4,0],[0,3],[0,9],[4,12],[8,9],[8,3],[4,0]],[[5,9],[9,13]]],
    R:[[[0,12],[0,0],[6,0],[8,2],[8,5],[6,7],[0,7]],[[4,7],[8,12]]],
    S:[[[8,1],[5,0],[1,1],[0,4],[2,6],[6,6],[8,8],[7,11],[3,12],[0,11]]],
    T:[[[0,0],[8,0]],[[4,0],[4,12]]],
    U:[[[0,0],[0,9],[3,12],[5,12],[8,9],[8,0]]],
    V:[[[0,0],[4,12],[8,0]]],
    W:[[[0,0],[2,12],[4,6],[6,12],[8,0]]],
    X:[[[0,0],[8,12]],[[8,0],[0,12]]],
    Y:[[[0,0],[4,6],[8,0]],[[4,6],[4,12]]],
    Z:[[[0,0],[8,0],[0,12],[8,12]]],
    '0':[[[4,0],[0,3],[0,9],[4,12],[8,9],[8,3],[4,0]]],
    '1':[[[1,3],[4,0],[4,12]],[[1,12],[7,12]]],
    '2':[[[0,2],[3,0],[6,0],[8,3],[7,6],[0,12],[8,12]]],
    '3':[[[0,0],[8,0],[4,6],[8,9],[6,12],[0,12]]],
    '4':[[[7,12],[7,0]],[[0,0],[0,7],[8,7]]],
    '5':[[[8,0],[0,0],[0,6],[6,6],[8,8],[6,12],[0,12]]],
    '6':[[[8,0],[2,2],[0,6],[0,10],[3,12],[7,11],[8,8],[6,6],[0,6]]],
    '7':[[[0,0],[8,0],[3,12]]],
    '8':[[[4,0],[0,3],[4,6],[8,3],[4,0]],[[4,6],[0,9],[4,12],[8,9],[4,6]]],
    '9':[[[8,6],[2,6],[0,4],[2,0],[6,0],[8,4],[8,9],[5,12],[0,12]]],
    ',':[[[4,10],[3,14]]],
    '!':[[[4,0],[4,8]],[[4,12],[4,12]]],
    '?':[[[0,3],[2,0],[6,0],[8,3],[4,7],[4,9]],[[4,12],[4,12]]],
    '\u2665':[[[3.95,13],[.72,9.15],[.05,5.9],[.55,2.8],[1.58,.85],[3.03,1.43],[4.20,3.30],[5.53,.75],[7.23,1.65],[8.46,4.45],[7.48,7.58],[3.95,13]]]
  };
  // Inline hearts use short, angled strokes with unequal upper lobes.
  // The distinct V22 outline also contains fewer intermediate stars than
  // ordinary letters; do not approximate a rounded emoji or a Bezier curve.
  paths['\u2665']=paths['\u2665'].map(stroke=>stroke.map(([x,y])=>[4+(x-4)*1.34,y]));
  // Accented letters are rendered as real accent star strokes; source strings stay intact.
  for (const [accented,base] of Object.entries({'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U'})) {
    paths[accented]=[...paths[base],[[3,-2],[6,-6]]];
  }
  const svgEl=(name,attrs={})=>{
    const el=document.createElementNS(NS,name);
    for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
    return el;
  };
  // Keep Á, É, Í, Ó, Ú, Ñ and commas; convert only the supplied ❤️ to star geometry.
  const normalize=(s)=>String(s).toUpperCase().replace(/\u2764\uFE0F/g,'\u2665')
    .replace(/[^A-Z0-9ÁÉÍÓÚÑ !?,\u2665]/g,' ').replace(/\s+/g,' ').trim().slice(0,38);
  function splitRows(text){
    if(text.length<=11)return [text];
    let best=null,score=Infinity;
    for(let i=1;i<text.length;i++){
      if(text[i-1]!==' '&&text[i]!==' ')continue;
      const first=text.slice(0,i).trim(),second=text.slice(i).trim();
      if(!first||!second)continue;
      const excess=Math.max(0,Math.max(first.length,second.length)-18);
      const cost=Math.abs(first.length-second.length)+excess*100;
      if(cost<score){score=cost;best=[first,second];}
    }
    if(best)return best;
    const center=Math.ceil(text.length/2);
    return [text.slice(0,center),text.slice(center)];
  }

// Stable seeded variation: stars do not jump between renders or device rotations.
const rand=(n)=>((Math.sin((n+1)*42.283)*43758.5453)%1+1)%1;
const hash=(s)=>[...s].reduce((h,ch)=>((h*31+ch.charCodeAt(0))>>>0),2166136261);
class MisteraConstellations {
  constructor(svg){this.svg=svg;this.last='';}
  skyHeightUnits(){
    // Layout updates the viewBox to preserve 1:1 horizontal/vertical scale.
    return Math.max(1,this.svg.viewBox.baseVal.height||300);
  }
  safeZone(){
    const svgRect=this.svg.getBoundingClientRect();
    const moon=document.querySelector('.sky-panel > .moon')?.getBoundingClientRect();
    const width=Math.max(1,svgRect.width);
    const moonX=moon ? (moon.left-svgRect.left)*941/width : 941*.76;
    // Independent of the temporary test controls. The optical center of any
    // phrase/heart must be the midpoint between the left side and the moon's
    // nearest edge; only a small typographic inset and moon clearance apply.
    const left=44;
    const safeRight=Math.min(941-46,moonX-42);
    return {left,width:Math.max(180,safeRight-left),safeRight};
  }
  clear(){this.last='';this.svg.replaceChildren();this.svg.classList.remove('is-visible');}
  render(input,options={}){
    const text=normalize(input);
    if(!text){this.clear();return '';}
    this.last=text;
    this.svg.dataset.sourceText=typeof input==='string'?input:String(input);
    this.svg.dataset.composition=options.heartCombo?'letter-heart':'phrase';
    this.svg.classList.remove('is-visible');
    this.svg.replaceChildren();
    const rows=splitRows(text),zone=this.safeZone(),zoneLeft=zone.left,zoneWidth=zone.width;
    const yShift=this.skyHeightUnits()/2-150;
    this.svg.dataset.safeRight=String(zone.safeRight);
    const wordSeed=hash(text);
    let vectorCount=0,starCount=0;
    rows.forEach((line,row)=>{
      const glyphs=[...line];
      const advances=glyphs.map((letter,i)=>letter===' '?9.1+(rand(wordSeed+row*900+i*19)-.5)*1.2:
        letter==='♥'?14.6:11.7+(rand(wordSeed+row*905+i*23)-.5)*1.5);
      const glyphUnits=advances.reduce((s,n)=>s+n,0)-3.0;
      const scale=Math.min(6.35,zoneWidth/Math.max(1,glyphUnits));
      const lineWidth=glyphUnits*scale;
      const xStart=zoneLeft+(zoneWidth-lineWidth)/2;
      const yStart=yShift+(options.heartCombo?45:(rows.length===1?121:(row===0?70:177)));
      let pen=0;
      glyphs.forEach((letter,column)=>{
        const glyphSeed=wordSeed+row*12011+column*1717+letter.charCodeAt(0)*23;
        const baseX=xStart+(pen+(rand(glyphSeed+7)-.5)*.7)*scale;
        const baseY=yStart+(rand(glyphSeed+19)-.5)*1.50*scale;
        const width=1+(rand(glyphSeed+41)-.5)*.115;
        const height=1+(rand(glyphSeed+45)-.5)*.115;
        const shear=(rand(glyphSeed+65)-.5)*.13;
        pen+=advances[column];
        if(letter===' '||!paths[letter])return;
        const g=svgEl('g',{'class':'constellation-letter'});
        const vertexCache=new Map(),starCache=new Map();
        const project=(x,y)=>[
          baseX+(x*width+(12-y)*shear)*scale,
          baseY+y*height*scale
        ];
        // Slightly asymmetric, hand-placed vertices; no perfect geometry or equal spacing.
        const anchor=(node)=>{
          const key=node.join(',');
          if(vertexCache.has(key))return vertexCache.get(key);
          const jitter=hash(key)+glyphSeed;
          const px=node[0]+(rand(jitter+15)-.5)*1.34;
          const py=node[1]+(rand(jitter+29)-.5)*1.42;
          const pos=project(px,py);
          vertexCache.set(key,pos);return pos;
        };
        function addStar(x,y,key,satellite=false){
          const uniq=`${x.toFixed(2)}:${y.toFixed(2)}`;
          if(starCache.has(uniq))return;
          starCache.set(uniq,true);
          const v=hash(key)+glyphSeed;
          const highlight=!satellite&&rand(v+13)>.955;
          // Radius is in the full SVG viewBox, not inside a scaled glyph group.
          // At 390px viewport this is 1-2.5 CSS pixels in diameter,
          // matching the ordinary background stars.
          const radius=satellite ? 1.1+rand(v+23)*.42 :
            highlight?2.78:1.35+rand(v+23)*1.10;
          const star=svgEl('circle',{
            cx:x.toFixed(2),cy:y.toFixed(2),r:radius.toFixed(2),
            'class':'constellation-star'+(highlight?' bright':'')
          });
          const baseline=.57+rand(v+37)*.23;
          const amp=.11+rand(v+41)*.13;
          star.style.setProperty('--star-base',baseline.toFixed(3));
          star.style.setProperty('--star-bright',Math.min(.94,baseline+amp).toFixed(3));
          star.style.setProperty('--star-soft',Math.max(.47,baseline-amp).toFixed(3));
          star.style.setProperty('--star-period',(14+rand(v+53)*30).toFixed(2)+'s');
          star.style.setProperty('--star-delay',(-rand(v+79)*110).toFixed(2)+'s');
          if(satellite)star.style.setProperty('--star-color','#ccdbec');
          g.appendChild(star);starCount++;
        }
        paths[letter].forEach((stroke,strokeIndex)=>{
          for(let j=0;j<stroke.length-1;j++){
            const a=anchor(stroke[j]); const b=anchor(stroke[j+1]);
            const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
            // Place a few stars unevenly along long spans, preserving letter legibility.
            const targetGap=(letter==='\u2665' ? 34 : 19)+rand(glyphSeed+strokeIndex*153+j*99)*(letter==='\u2665'?13:12);
            const pieces=Math.max(1,Math.round(len/targetGap));
            let previous=a;
            addStar(...a,`${strokeIndex}:${j}:start`);
            for(let k=1;k<=pieces;k++){
              const t=k===pieces?1:Math.max(.08,Math.min(.92,k/pieces+(rand(glyphSeed+strokeIndex*1001+j*107+k*43)-.5)*.16/pieces));
              const along=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
              if(k!==pieces){
                const normal=[-(b[1]-a[1])/Math.max(1,len),(b[0]-a[0])/Math.max(1,len)];
                const bend=(rand(glyphSeed+j*733+k*139)-.5)*3.2;
                along[0]+=normal[0]*bend;along[1]+=normal[1]*bend;
              }else{along[0]=b[0];along[1]=b[1];}
              const v=glyphSeed+strokeIndex*1907+j*137+k*23;
              const line=svgEl('line',{
                x1:previous[0].toFixed(2),y1:previous[1].toFixed(2),
                x2:along[0].toFixed(2),y2:along[1].toFixed(2),
                'class':'constellation-stroke',
                'vector-effect':'non-scaling-stroke'
              });
              const baseline=.34+rand(v+11)*.21;
              const amp=.085+rand(v+17)*.12;
              line.style.setProperty('--line-base',baseline.toFixed(3));
              line.style.setProperty('--line-bright',Math.min(.67,baseline+amp).toFixed(3));
              line.style.setProperty('--line-soft',Math.max(.23,baseline-amp).toFixed(3));
              line.style.setProperty('--line-period',(19+rand(v+31)*37).toFixed(2)+'s');
              line.style.setProperty('--line-delay',(-rand(v+71)*113).toFixed(2)+'s');
              line.style.strokeWidth=(.52+rand(v+57)*.23).toFixed(2)+'px';
              g.appendChild(line);vectorCount++;
              addStar(...along,`${strokeIndex}:${j}:${k}`);
              previous=along;
            }
          }
          if(stroke.length===1)addStar(...anchor(stroke[0]),`${strokeIndex}:single`);
        });
        // One or two sparse neighboring stars help the word feel like a real sky,
        // rather than a rigid point-font. They never create another letter.
        if(letter!=='\u2665' && rand(glyphSeed+11)>.59){
          const x=baseX+(2+rand(glyphSeed+93)*6.5)*scale;
          const y=baseY+(-3+rand(glyphSeed+111)*1.6)*scale;
          addStar(x,y,'satellite',true);
        }
        this.svg.appendChild(g);
      });
    });
    this.svg.dataset.vectors=String(vectorCount);
    this.svg.dataset.stars=String(starCount);
    // Only a slow global fade on show/hide. All continuous light changes are
    // independent, random-seeded per STAR and per VECTOR; no letter pulses.
    requestAnimationFrame(()=>this.svg.classList.add('is-visible'));
    return text;
  }
  // Celestial heart made from an irregular, angular closed polyline: the joins
  // are deliberate corners, never a rounded Bezier or mathematical heart curve.
  // The outline comprises faint line segments between natural, uneven star points.
  renderSpecial(entry){
    const combo=!!entry.text;
    if(combo)this.render(entry.text,{heartCombo:true});
    else{this.last=entry.id;this.svg.classList.remove('is-visible');this.svg.replaceChildren();}
    this.svg.dataset.composition=entry.id;
    const zone=this.safeZone();
    const group=svgEl('g',{'class':'constellation-heart','data-heart-id':entry.id});
    const seed=hash(entry.id);
    const skyMid=this.skyHeightUnits()/2;
    const cx=zone.left+zone.width*.5,cy=skyMid+(combo?50:0);
    // Deliberately preserve the shape seen on the iPhone SE in reference 4.
    // Both axes use the same units regardless of the screen's aspect ratio.
    const baseRx=combo?91:101,baseRy=combo?65:83;
    const availableHeight=combo?this.skyHeightUnits()-cy-13:skyMid-13;
    const uniformScale=Math.min(1,Math.max(.40,availableHeight/(baseRy*1.115)));
    const rx=baseRx*uniformScale,ry=baseRy*uniformScale;
    // V22: fewer CORNERS, fewer STARS and a more angular silhouette.
    // Uneven peaks, a slightly off-center notch, asymmetric shoulders and a
    // skewed pointed bottom. No round lobes, no smooth cubic curves.
    const anchors=[
      [-.045,-.36],[-.28,-.77],[-.54,-1.01],[-.84,-.91],
      [-1.015,-.54],[-.89,-.13],[-.55,.29],[.035,1.07],
      [.34,.68],[.64,.24],[1.03,-.25],[.96,-.60],
      [.75,-.91],[.46,-.77],[.18,-.46],[-.045,-.36]
    ];
    const pts=anchors.map(([ax,ay],i)=>{
      if(i===anchors.length-1)return null;
      const jitterX=(rand(seed+i*181)-.5)*.085;
      const jitterY=(rand(seed+i*127)-.5)*.095;
      return {x:cx+(ax+jitterX)*rx,y:cy+(ay+jitterY)*ry};
    });
    pts[pts.length-1]=pts[0];
    let stars=0,segments=0;
    const drawStar=(x,y,i,satellite=false)=>{
      const rad=(satellite?.79:1.12)+(rand(seed+i*137)*.96);
      const dot=svgEl('circle',{cx:x.toFixed(2),cy:y.toFixed(2),r:rad.toFixed(2),
        class:'constellation-star heart-dot'+(satellite?' satellite':i%19===0?' bright':'')});
      const base=satellite?.43:.58+rand(seed+i*103)*.23;
      dot.style.setProperty('--star-base',base.toFixed(3));
      dot.style.setProperty('--star-bright',Math.min(.93,base+.15).toFixed(3));
      dot.style.setProperty('--star-soft',Math.max(.34,base-.17).toFixed(3));
      dot.style.setProperty('--star-period',(15+rand(seed+i*29)*31).toFixed(1)+'s');
      dot.style.setProperty('--star-delay',(-rand(seed+i*17)*60).toFixed(1)+'s');
      group.appendChild(dot);stars++;
    };
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],length=Math.hypot(b.x-a.x,b.y-a.y);
      const splits=Math.max(1,Math.ceil(length/(28+rand(seed+i*19)*11)));
      let prev=a;
      drawStar(a.x,a.y,i*19);
      for(let j=1;j<=splits;j++){
        const t=j===splits?1:Math.min(.93,Math.max(.07,j/splits+(rand(seed+i*47+j*19)-.5)*.08));
        // Point on a STRAIGHT segment, not a smooth/rounded path.
        const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        const line=svgEl('line',{x1:prev.x.toFixed(2),y1:prev.y.toFixed(2),
          x2:x.toFixed(2),y2:y.toFixed(2),class:'constellation-stroke heart-segment',
          'vector-effect':'non-scaling-stroke'});
        const alpha=.20+rand(seed+i*79+j*41)*.13;
        line.style.setProperty('--line-base',alpha.toFixed(3));
        line.style.setProperty('--line-bright',Math.min(.52,alpha+.11).toFixed(3));
        line.style.setProperty('--line-soft',Math.max(.12,alpha-.07).toFixed(3));
        line.style.setProperty('--line-period',(18+rand(seed+i*91+j*51)*30).toFixed(1)+'s');
        line.style.setProperty('--line-delay',(-rand(seed+i*103+j*71)*65).toFixed(1)+'s');
        line.style.strokeWidth=(.43+rand(seed+i*27+j*19)*.21).toFixed(2)+'px';
        group.appendChild(line);segments++;
        if(j<splits)drawStar(x,y,i*31+j);
        prev={x,y};
      }
    }
    // Just three nearby, much fainter satellites: the heart should be spare.
    for(let i=0;i<3;i++){
      const a=pts[(i*3+2)% (pts.length-1)];
      drawStar(a.x+(rand(seed+300+i*47)-.5)*19,
        a.y+(rand(seed+600+i*83)-.5)*15,250+i,true);
    }
    this.svg.appendChild(group);
    this.svg.dataset.heartStars=String(stars);
    this.svg.dataset.heartSegments=String(segments);
    this.svg.dataset.heartGeometry='v22-sparse-faceted-asymmetric';
    requestAnimationFrame(()=>this.svg.classList.add('is-visible'));
    return entry.id;
  }

}
  window.MisteraConstellations=MisteraConstellations;
})();
