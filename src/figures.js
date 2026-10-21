/* Figuras interactivas de los Elementos.
   Cada figura se declara en FIGS con sus puntos iniciales, los puntos arrastrables y una función draw(P, paso, at).
   Los textos de los pasos se leen de la lista <ol id="pasos"> de la propia página. */
(function(){
const sub=(p,q)=>({x:p.x-q.x,y:p.y-q.y}),add=(p,q)=>({x:p.x+q.x,y:p.y+q.y}),mul=(p,k)=>({x:p.x*k,y:p.y*k});
const len=v=>Math.hypot(v.x,v.y),unit=v=>{const l=len(v)||1;return{x:v.x/l,y:v.y/l}},perp=v=>({x:-v.y,y:v.x}),dot=(a,b)=>a.x*b.x+a.y*b.y;
const mid=(p,q)=>mul(add(p,q),.5),f=n=>n.toFixed(1);
const fmt=n=>n.toLocaleString("es-ES",{minimumFractionDigits:1,maximumFractionDigits:1});
const ln=(p,q,c)=>`<line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(q.x)}" y2="${f(q.y)}" class="${c}"/>`;
const circ=(p,r,c)=>`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}" class="${c}"/>`;
const poly=(ps,c)=>`<polygon points="${ps.map(p=>f(p.x)+","+f(p.y)).join(" ")}" class="${c}"/>`;
const pt=p=>circ(p,2.8,"pt");
const lab=(p,t,from)=>{const d=unit(sub(p,from)),q=add(p,mul(d,15));return `<text x="${f(q.x)}" y="${f(q.y+5)}" text-anchor="middle" class="lab">${t}</text>`};
const angleAt=(V,P,Q)=>{const a=sub(P,V),b=sub(Q,V);return Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(len(a)*len(b)))))*180/Math.PI};
function wedge(V,P,Q,r,c){
  const a1=Math.atan2(P.y-V.y,P.x-V.x),a2=Math.atan2(Q.y-V.y,Q.x-V.x);
  let d=a2-a1;while(d>Math.PI)d-=2*Math.PI;while(d<=-Math.PI)d+=2*Math.PI;
  const x1=V.x+r*Math.cos(a1),y1=V.y+r*Math.sin(a1),x2=V.x+r*Math.cos(a1+d),y2=V.y+r*Math.sin(a1+d);
  return `<path d="M${f(V.x)} ${f(V.y)} L${f(x1)} ${f(y1)} A${r} ${r} 0 0 ${d>0?1:0} ${f(x2)} ${f(y2)} Z" class="${c}"/>`;
}
function squareOut(P,Q,R){let n=perp(sub(Q,P));if(dot(n,sub(R,P))>0)n=mul(n,-1);return[P,Q,add(Q,n),add(P,n)]}

const FIGS={};

/* I.1 — Triángulo equilátero */
FIGS["I.1"]={vb:[400,310],points:{A:{x:145,y:205},B:{x:255,y:205}},drag:["A","B"],
  move(P,k,p){const o=k==="A"?P.B:P.A;let q={x:Math.max(30,Math.min(370,p.x)),y:Math.max(40,Math.min(285,p.y))};
    const d=len(sub(q,o));if(d<40)q=add(o,mul(unit(sub(q,o)),40));if(d>125)q=add(o,mul(unit(sub(q,o)),125));P[k]=q},
  draw(P,s,at){const{A,B}=P,L=len(sub(B,A)),C=add(mid(A,B),mul(perp(sub(B,A)),-Math.sqrt(3)/2)),G=mul(add(add(A,B),C),1/3);
    return at(4,poly([A,B,C],"f-ink"))+at(1,circ(A,L,"cons"))+at(2,circ(B,L,"cons"))
      +ln(A,B,"ln-blue")+at(3,ln(C,A,"ln-red")+ln(C,B,"ln-sage")+pt(C)+lab(C,"C",G))+lab(A,"A",G)+lab(B,"B",G)},
  readout(P,s){const L=len(sub(P.B,P.A))/10;return s>=3?`AB = ${fmt(L)} · BC = ${fmt(L)} · CA = ${fmt(L)}`:`AB = ${fmt(L)}`}};

/* I.32 — Suma de los ángulos de un triángulo */
FIGS["I.32"]={vb:[400,300],points:{A:{x:150,y:70},B:{x:70,y:235},C:{x:250,y:235}},drag:["A","B","C"],
  draw(P,s,at){const{A,B,C}=P,G=mul(add(add(A,B),C),1/3);
    const u=unit(sub(C,B)),D=add(C,mul(u,105)),E=add(C,mul(unit(sub(A,B)),110));
    const m={x:u.y,y:-u.x},sw=dot(m,sub(A,C))>0?1:0,s1=add(C,mul(u,-44)),s2=add(C,mul(u,44));
    return wedge(A,B,C,22,"w-red")+wedge(B,A,C,22,"w-blue")+wedge(C,A,B,20,"w-sage")
      +at(3,wedge(C,A,E,30,"w-red"))+at(4,wedge(C,E,D,30,"w-blue"))
      +at(5,`<path d="M${f(s1.x)} ${f(s1.y)} A44 44 0 0 ${sw} ${f(s2.x)} ${f(s2.y)}" class="dash"/>`)
      +at(1,ln(C,D,"ln")+lab(D,"D",C))+at(2,ln(C,E,"ln")+lab(E,"E",C))
      +poly([A,B,C],"ln")+lab(A,"A",G)+lab(B,"B",G)+lab(C,"C",G)},
  readout(P){const a=angleAt(P.A,P.B,P.C),b=angleAt(P.B,P.A,P.C),c=angleAt(P.C,P.A,P.B);
    return `∠A = ${fmt(a)}° · ∠B = ${fmt(b)}° · ∠C = ${fmt(c)}° · suma = ${fmt(a+b+c)}°`}};

/* I.47 — Teorema de Pitágoras (ángulo recto en A, como en Euclides) */
const O={x:200,y:165},R=70;
FIGS["I.47"]={vb:[400,330],points:{A:{x:O.x-R*Math.cos(1.2),y:O.y-R*Math.sin(1.2)},B:{x:130,y:165},C:{x:270,y:165}},drag:["A"],
  move(P,k,p){let t=Math.atan2(-(p.y-O.y),p.x-O.x);if(t<0)t=p.x>O.x?0:Math.PI;
    t=Math.max(20*Math.PI/180,Math.min(160*Math.PI/180,t));P.A={x:O.x+R*Math.cos(t),y:O.y-R*Math.sin(t)}},
  draw(P,s,at){const{A,B,C}=P,G=mul(add(add(A,B),C),1/3);
    const sqAB=squareOut(B,A,C),sqAC=squareOut(A,C,B),sqBC=squareOut(B,C,A);
    const n=sub(sqBC[3],B),F=add(B,mul(sub(C,B),dot(sub(A,B),sub(C,B))/dot(sub(C,B),sub(C,B)))),L=add(F,n);
    const u1=unit(sub(B,A)),u2=unit(sub(C,A)),r1=add(A,mul(u1,10)),r2=add(r1,mul(u2,10)),r3=add(A,mul(u2,10));
    return `<path d="M${B.x} ${B.y} A${R} ${R} 0 0 1 ${C.x} ${C.y}" class="dash"/>`
      +at(1,poly(sqAB,"f-red")+poly(sqAC,"f-sage"))
      +at(2,poly(sqBC,"f-blue"))
      +at(4,poly([B,F,L,sqBC[3]],"f-red")+poly([F,C,sqBC[2],L],"f-sage"))+at(3,ln(A,L,"ln"))
      +`<polyline points="${f(r1.x)},${f(r1.y)} ${f(r2.x)},${f(r2.y)} ${f(r3.x)},${f(r3.y)}" class="ln"/>`
      +ln(A,B,"ln-red")+ln(A,C,"ln-sage")+ln(B,C,"ln-blue")
      +lab(A,"A",G)+lab(B,"B",{x:G.x+30,y:G.y-20})+lab(C,"C",{x:G.x-30,y:G.y-20})},
  readout(P){const ab=(len(sub(P.A,P.B))/10)**2,ac=(len(sub(P.A,P.C))/10)**2,bc=(len(sub(P.B,P.C))/10)**2;
    return `AB² = ${fmt(ab)} · AC² = ${fmt(ac)} · AB² + AC² = ${fmt(ab+ac)} · BC² = ${fmt(bc)}`}};

/* II.4 — Cuadrado de una suma: (AC + CB)² = AC² + CB² + 2·AC·CB.
   Cuadrado ADEB sobre AB; la diagonal BD y las paralelas por C y por G lo dividen en dos cuadrados y dos complementos. */
const Q={A:{x:80,y:45},B:{x:320,y:45},D:{x:80,y:285},E:{x:320,y:285}},QC={x:200,y:165};
FIGS["II.4"]={vb:[400,330],points:{C:{x:170,y:45}},drag:["C"],
  move(P,k,p){P.C={x:Math.max(Q.A.x+35,Math.min(Q.B.x-35,p.x)),y:Q.A.y}},
  draw(P,s,at){const{A,B,D,E}=Q,C=P.C,G={x:C.x,y:A.y+(B.x-C.x)},H={x:A.x,y:G.y},K={x:B.x,y:G.y},F={x:C.x,y:D.y};
    return at(3,poly([C,B,K,G],"f-blue"))+at(4,poly([H,G,F,D],"f-red"))+at(5,poly([A,C,G,H],"f-sage")+poly([G,K,E,F],"f-sage"))
      +at(1,poly([A,B,E,D],"ln")+ln(B,D,"cons")+lab(D,"D",QC)+lab(E,"E",QC))
      +at(2,ln(C,F,"ln")+ln(H,K,"ln")+pt(G)+lab(G,"G",{x:G.x-10,y:G.y-10})+lab(F,"F",{x:F.x,y:F.y-10})+lab(H,"H",{x:H.x+10,y:H.y})+lab(K,"K",{x:K.x-10,y:K.y}))
      +ln(A,C,"ln-red")+ln(C,B,"ln-blue")+lab(A,"A",QC)+lab(B,"B",QC)+lab(C,"C",{x:C.x,y:C.y+10})},
  readout(P,s){const a=(P.C.x-Q.A.x)/10,b=(Q.B.x-P.C.x)/10;
    return s<5?`AC = ${fmt(a)} · CB = ${fmt(b)}`:`AB² = ${fmt((a+b)**2)} · AC² + CB² + 2·AC·CB = ${fmt(a*a)} + ${fmt(b*b)} + ${fmt(2*a*b)} = ${fmt(a*a+b*b+2*a*b)}`}};

/* II.11 — Sección áurea: cortar AB en H con AB·HB = AH².
   Cuadrado ABDC hacia abajo; E punto medio de AC; F sobre la prolongación de CA con EF = EB; cuadrado AFGH hacia arriba. */
const AU={x:115,y:150};
FIGS["II.11"]={vb:[400,380],points:{B:{x:280,y:150}},drag:["B"],
  move(P,k,p){P.B={x:Math.max(AU.x+120,Math.min(AU.x+200,p.x)),y:AU.y}},
  draw(P,s,at){const A=AU,B=P.B,a=B.x-A.x,C={x:A.x,y:A.y+a},D={x:B.x,y:C.y},E={x:A.x,y:A.y+a/2},r=len(sub(B,E));
    const F={x:A.x,y:E.y-r},H={x:A.x+(r-a/2),y:A.y},G={x:H.x,y:F.y},K={x:H.x,y:C.y},Ctr={x:A.x+a/2,y:A.y+a/2};
    return (s===4?poly([F,G,K,C],"f-ink")+poly([A,B,D,C],"f-ink"):"")+at(3,poly([A,F,G,H],"f-red"))+at(5,poly([H,B,D,K],"f-blue"))
      +at(1,poly([A,B,D,C],"ln")+ln(B,E,"ln")+pt(E)+lab(E,"E",{x:E.x+10,y:E.y})+lab(C,"C",Ctr)+lab(D,"D",Ctr))
      +at(2,`<path d="M${f(B.x)} ${f(B.y)} A${f(r)} ${f(r)} 0 0 0 ${f(F.x)} ${f(F.y)}" class="cons"/>`+ln(A,F,"ln")+pt(F)+lab(F,"F",{x:F.x+10,y:F.y+10}))
      +at(3,ln(F,G,"ln")+ln(G,K,"ln")+lab(G,"G",{x:G.x-10,y:G.y+10})+lab(H,"H",{x:H.x-10,y:H.y+10})+lab(K,"K",{x:K.x,y:K.y-10}))
      +(s<3?ln(A,B,"ln-blue"):ln(A,H,"ln-red")+ln(H,B,"ln-blue"))
      +lab(A,"A",{x:A.x+10,y:A.y})+lab(B,"B",{x:B.x-10,y:B.y+10})},
  readout(P,s){const a=(P.B.x-AU.x)/10,h=a*(Math.sqrt(5)-1)/2,dec=n=>n.toLocaleString("es-ES",{minimumFractionDigits:3,maximumFractionDigits:3});
    if(s<3)return `AB = ${fmt(a)}`;
    if(s<5)return `AB = ${fmt(a)} · AH = ${fmt(h)} · HB = ${fmt(a-h)} · AB : AH = ${dec(a/h)}`;
    return `AH² = ${fmt(h*h)} · AB·HB = ${fmt(a*(a-h))} · AB : AH = ${dec(a/h)}`}};

/* Motor */
function init(root){
  const cfg=FIGS[root.dataset.fig];if(!cfg)return;
  const svg=root.querySelector("svg"),layer=svg.querySelector(".layer");
  const txt=root.querySelector(".step-text"),cnt=root.querySelector(".step-count"),out=root.querySelector(".readout");
  const prev=root.querySelector(".prev"),next=root.querySelector(".next"),reset=root.querySelector(".reset");
  const items=[...document.querySelectorAll(root.dataset.steps+" > li")];
  const steps=items.map(li=>li.innerHTML);
  const still=root.dataset.still!==undefined;
  const init=JSON.stringify(cfg.points);let P=JSON.parse(init),s=still?steps.length-1:0,animate=false,active=null;
  const[W,H]=cfg.vb;
  function render(){
    const at=(n,m)=>s>=n?`<g${animate&&n===s&&n>0?' class="enter"':""}>${m}</g>`:"";
    layer.innerHTML=cfg.draw(P,s,at)+(still?"":cfg.drag.map(k=>`<circle class="handle" cx="${f(P[k].x)}" cy="${f(P[k].y)}" r="7"/>`).join(""));
    if(txt)txt.innerHTML=steps[s];if(cnt)cnt.textContent=`Paso ${s+1} de ${steps.length}`;if(out)out.innerHTML=cfg.readout(P,s);
    if(prev)prev.disabled=s===0;if(next)next.disabled=s===steps.length-1;
    items.forEach((li,i)=>li.classList.toggle("current",i===s));animate=false;
  }
  if(!still){
    const toSvg=e=>{const m=svg.getScreenCTM();if(!m)return{x:0,y:0};const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return{x:p.x,y:p.y}};
    svg.addEventListener("pointerdown",e=>{const p=toSvg(e);let best=null,bd=26;
      for(const k of cfg.drag){const d=len(sub(P[k],p));if(d<bd){bd=d;best=k}}
      if(best){active=best;svg.setPointerCapture(e.pointerId);e.preventDefault()}});
    svg.addEventListener("pointermove",e=>{if(!active)return;const p=toSvg(e);
      if(cfg.move)cfg.move(P,active,p);else P[active]={x:Math.max(20,Math.min(W-20,p.x)),y:Math.max(20,Math.min(H-20,p.y))};render()});
    const stop=()=>{active=null};svg.addEventListener("pointerup",stop);svg.addEventListener("pointercancel",stop);
    prev.addEventListener("click",()=>{if(s>0){s--;render()}});
    next.addEventListener("click",()=>{if(s<steps.length-1){s++;animate=true;render()}});
    reset.addEventListener("click",()=>{P=JSON.parse(init);s=0;render()});
    items.forEach((li,i)=>{li.style.cursor="pointer";li.addEventListener("click",()=>{s=i;render()})});
  }
  render();
}
document.querySelectorAll("[data-fig]").forEach(init);
})();
