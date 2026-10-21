/* Mapa de dependencias: diagrama de arcos vertical.
   Cada fila es una pieza (postulado, noción común o proposición) en el orden de los Elementos, y cada arco une
   una pieza con otra que la cita. Al elegir una se marcan en rojo sus antecedentes y en azul sus consecuencias.
   Los datos vienen de <script id="map-data"> (los genera build.mjs a partir de los campos «usa»). */
(function(){
const data=JSON.parse(document.getElementById("map-data").textContent);
const host=document.getElementById("map-graph"),info=document.getElementById("map-info"),map=host.closest(".map");
const NS="http://www.w3.org/2000/svg";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const byId={};data.forEach(n=>{byId[n.id]=n});
const usedBy={};data.forEach(n=>n.usa.forEach(c=>(usedBy[c]||=[]).push(n.id)));
const deps=id=>byId[id].usa,users=id=>usedBy[id]||[];
const closure=(id,next)=>{const seen=new Set,st=[...next(id)];while(st.length){const k=st.pop();if(!seen.has(k)){seen.add(k);st.push(...next(k))}}return seen};
const isPrinciple=id=>/^(Post|N\.C)/.test(id);

/* Posiciones verticales: una fila por pieza y un rótulo al empezar cada grupo */
const ROW=20;let y=6,group=null;const heads=[];
data.forEach(n=>{if(n.grupo!==group){if(group)y+=14;heads.push({t:n.grupo,y:y+12});y+=24;group=n.grupo}n.y=y+ROW/2;y+=ROW});
const H=y+8;
const edges=data.flatMap(n=>n.usa.map(c=>({from:c,to:n.id,d:n.y-byId[c].y})));
const maxD=Math.max(...edges.map(e=>e.d));

let sel=null,width=0,rows={},arcs=[];
function el(tag,attrs){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e}

function draw(){
  width=host.clientWidth;if(!width)return;
  const narrow=width<560,LX=narrow?58:290,maxR=Math.max(40,width-LX-12),chars=Math.floor((LX-62)/6.3);
  const svg=el("svg",{viewBox:`0 0 ${width} ${H}`,width,height:H,role:"group","aria-label":"Mapa de dependencias"});
  const gArcs=el("g",{class:"arcs"}),gRows=el("g",{});
  heads.forEach(h=>{const t=el("text",{x:0,y:h.y,class:"head"});t.textContent=h.t.toUpperCase();gRows.append(t)});
  arcs=edges.map(e=>{const a=byId[e.from].y,b=byId[e.to].y,rx=maxR*Math.pow(e.d/maxD,.55);
    const p=el("path",{d:`M${LX} ${a}A${rx.toFixed(1)} ${(e.d/2).toFixed(1)} 0 0 1 ${LX} ${b}`,class:"arc"});gArcs.append(p);return{...e,p}});
  rows={};
  data.forEach(n=>{
    const g=el("g",{class:"row"+(isPrinciple(n.id)?" principle":""),tabindex:0,role:"button","aria-label":`${n.id}, ${n.titulo}`});
    g.append(el("rect",{x:0,y:n.y-ROW/2,width:LX+8,height:ROW,class:"hit"}));
    const id=el("text",{x:0,y:n.y+4,class:"rid"});id.textContent=n.id;g.append(id);
    if(!narrow){const s=isPrinciple(n.id)?n.texto:n.titulo,t=el("text",{x:58,y:n.y+4,class:"rt"});t.textContent=s.length>chars?s.slice(0,chars-1)+"…":s;g.append(t)}
    g.append(el("circle",{cx:LX,cy:n.y,r:3.6,class:"dot"}));
    g.addEventListener("click",()=>select(n.id,true));
    g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(n.id,true)}});
    g.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")paint(n.id)});
    g.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")paint(sel)});
    gRows.append(g);rows[n.id]=g;
  });
  svg.append(gArcs,gRows);host.replaceChildren(svg);
  paint(sel);
}

/* Marca la pieza elegida, sus antecedentes (rojo) y sus consecuencias (azul) */
function paint(id){
  map.classList.toggle("has-sel",!!id);
  const A=id?closure(id,deps):new Set,D=id?closure(id,users):new Set;
  for(const k in rows)rows[k].setAttribute("class","row"+(isPrinciple(k)?" principle":"")+(k===id?" sel":A.has(k)?" anc":D.has(k)?" desc":id?" dim":""));
  const top=[];
  arcs.forEach(a=>{const anc=id&&A.has(a.from)&&(a.to===id||A.has(a.to)),desc=id&&D.has(a.to)&&(a.from===id||D.has(a.from));
    a.p.setAttribute("class","arc"+(anc?" anc":desc?" desc":""));if(anc||desc)top.push(a.p)});
  top.forEach(p=>p.parentNode.append(p));
  if(id)showInfo(id,A,D);
}

function showInfo(id,A,D){
  const n=byId[id],count=s=>{let p=0,po=0,nc=0;s.forEach(k=>/^Post/.test(k)?po++:/^N\.C/.test(k)?nc++:p++);return{p,po,nc}};
  const a=count(A),pl=(k,s,pls)=>`${k} ${k===1?s:pls}`;
  const chips=list=>list.length?list.map(k=>`<button type="button" class="chip" data-go="${esc(k)}">${esc(k)}</button>`).join(""):`<span class="muted">Ninguna</span>`;
  info.innerHTML=`<div class="kicker">${isPrinciple(id)?"Principio":`Proposición ${esc(id)}`}</div>
    <h2>${esc(n.titulo)}</h2>
    <p class="map-text">${esc(n.texto)}</p>
    <dl class="map-stats">
      ${isPrinciple(id)?"":`<div class="anc"><dt>Necesita</dt><dd><b>${a.p}</b> ${a.p===1?"proposición":"proposiciones"}, ${pl(a.po,"postulado","postulados")} y ${pl(a.nc,"noción común","nociones comunes")}</dd></div>`}
      <div class="desc"><dt>La usan</dt><dd><b>${D.size}</b> ${D.size===1?"proposición":"proposiciones"}, directa o indirectamente</dd></div>
    </dl>
    ${isPrinciple(id)?"":`<div class="map-direct"><div class="kicker">Se apoya directamente en</div><div class="chips">${chips(n.usa)}</div></div>`}
    <div class="map-direct"><div class="kicker">La usan directamente</div><div class="chips">${chips(users(id))}</div></div>
    <p class="map-link"><a href="../${n.href}">${isPrinciple(id)?(/^Post/.test(id)?"Ver los postulados":"Ver las nociones comunes"):"Ver la ficha"} →</a></p>`;
  info.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>select(b.dataset.go,true,true)));
}

function select(id,push,scroll){
  if(!byId[id])return;sel=id;paint(id);
  if(push)history.replaceState(null,"","#"+encodeURIComponent(id));
  if(scroll){const r=rows[id];if(r&&r.scrollIntoView)r.scrollIntoView({block:"center",behavior:"smooth"})}
}

const start=decodeURIComponent(location.hash.slice(1));
sel=byId[start]?start:"I.47";
draw();
new ResizeObserver(()=>{if(host.clientWidth!==width)draw()}).observe(host);
})();
