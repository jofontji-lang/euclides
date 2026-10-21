/* Mapa de dependencias: diagrama de arcos vertical.
   Cada fila es una pieza (postulado, noción común o proposición) en el orden de los Elementos, y cada arco une
   una pieza con otra que la cita. Al elegir una se marcan en rojo sus antecedentes y en azul sus consecuencias.
   Los chips de encima eligen qué libros se dibujan (?libros=I,III en la URL); los libros ocultos se resumen en una
   banda en su sitio, y el panel sigue contando sus antecedentes y consecuencias.
   Los datos vienen de <script id="map-data"> (los genera build.mjs a partir de los campos «usa»). */
(function(){
const data=JSON.parse(document.getElementById("map-data").textContent);
const host=document.getElementById("map-graph"),info=document.getElementById("map-info"),map=host.closest(".map");
const bar=document.getElementById("map-books"),countEl=document.getElementById("map-count");
const NS="http://www.w3.org/2000/svg";
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const byId={};data.forEach(n=>{byId[n.id]=n});
const usedBy={};data.forEach(n=>n.usa.forEach(c=>(usedBy[c]||=[]).push(n.id)));
const deps=id=>byId[id].usa,users=id=>usedBy[id]||[];
const closure=(id,next)=>{const seen=new Set,st=[...next(id)];while(st.length){const k=st.pop();if(!seen.has(k)){seen.add(k);st.push(...next(k))}}return seen};
const isPrinciple=id=>/^(Post|N\.C)/.test(id);
const bookOf=id=>isPrinciple(id)?null:byId[id].grupo.replace(/^Libro /,"");

/* Grupos en orden: «Principios» y un grupo por libro */
const groups=[];data.forEach(n=>{let g=groups[groups.length-1];if(!g||g.t!==n.grupo)groups.push(g={t:n.grupo,book:bookOf(n.id),nodes:[]});g.nodes.push(n)});
const books=groups.filter(g=>g.book).map(g=>g.book);
const numProps=data.filter(n=>!isPrinciple(n.id)).length;

/* Libros visibles: null son todos; los principios se muestran siempre */
let shown=null;
const visible=id=>!shown||isPrinciple(id)||shown.has(bookOf(id));
const bookNames=bs=>bs.length>2?`${bs[0]}–${bs[bs.length-1]}`:bs.join(" y ");

/* Posiciones verticales: una fila por pieza visible, un rótulo al empezar cada grupo y una banda por cada tramo de libros ocultos */
const ROW=20,GAP=40;let H=0,heads=[],gaps=[],edges=[],maxD=1;
function layout(){
  let y=6;heads=[];gaps=[];data.forEach(n=>{n.y=null});
  groups.forEach(g=>{
    if(!g.book||!shown||shown.has(g.book)){if(y>6)y+=14;heads.push({t:g.t,y:y+12});y+=24;g.nodes.forEach(n=>{n.y=y+ROW/2;y+=ROW})}
    else{let gp=gaps[gaps.length-1];if(!gp||gp.end!==y){if(y>6)y+=14;gp={books:[],ids:new Set,y};gaps.push(gp);y+=GAP;gp.end=y}
      gp.books.push(g.book);g.nodes.forEach(n=>gp.ids.add(n.id))}
  });
  H=y+8;
  edges=data.flatMap(n=>n.y==null?[]:n.usa.filter(c=>byId[c].y!=null).map(c=>({from:c,to:n.id,d:n.y-byId[c].y})));
  maxD=Math.max(1,...edges.map(e=>e.d));
}

let sel=null,width=0,rows={},arcs=[];
function el(tag,attrs){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e}
const press=(e,fn)=>{e.addEventListener("click",fn);e.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();fn()}})};

function draw(){
  width=host.clientWidth;if(!width)return;
  const narrow=width<560,LX=narrow?58:290,maxR=Math.max(40,width-LX-12),chars=Math.floor((LX-62)/6.3);
  const svg=el("svg",{viewBox:`0 0 ${width} ${H}`,width,height:H,role:"group","aria-label":"Mapa de dependencias"});
  const gGaps=el("g",{}),gArcs=el("g",{class:"arcs"}),gRows=el("g",{});
  heads.forEach(h=>{const t=el("text",{x:0,y:h.y,class:"head"});t.textContent=h.t.toUpperCase();gRows.append(t)});
  gaps.forEach(gp=>{
    const one=gp.books.length===1,names=bookNames(gp.books);
    const g=el("g",{class:"gap",tabindex:0,role:"button","aria-label":`${one?"Libro":"Libros"} ${names}, ${one?"oculto":"ocultos"}: mostrar`});
    g.append(el("rect",{x:.5,y:gp.y+.5,width:width-1,height:GAP-1,class:"band"}));
    const t=el("text",{x:10,y:gp.y+16,class:"glab"});t.textContent=`${one?"LIBRO":"LIBROS"} ${names} · ${one?"OCULTO":"OCULTOS"} · + MOSTRAR`;
    gp.cnt=el("text",{x:10,y:gp.y+31,class:"gcnt"});g.append(t,gp.cnt);
    // Los libros aparecen en el sitio de la banda, así que no hace falta desplazar; el foco pasa a su primera fila
    press(g,()=>{gp.books.forEach(b=>shown.add(b));apply(false);const r=rows[groups.find(x=>x.book===gp.books[0]).nodes[0].id];if(r)r.focus({preventScroll:true})});
    gGaps.append(g);
  });
  arcs=edges.map(e=>{const a=byId[e.from].y,b=byId[e.to].y,rx=maxR*Math.pow(e.d/maxD,.55);
    const p=el("path",{d:`M${LX} ${a}A${rx.toFixed(1)} ${(e.d/2).toFixed(1)} 0 0 1 ${LX} ${b}`,class:"arc"});gArcs.append(p);return{...e,p}});
  rows={};
  data.forEach(n=>{
    if(n.y==null)return;
    const g=el("g",{class:"row"+(isPrinciple(n.id)?" principle":""),tabindex:0,role:"button","aria-label":`${n.id}, ${n.titulo}`});
    g.append(el("rect",{x:0,y:n.y-ROW/2,width:LX+8,height:ROW,class:"hit"}));
    const id=el("text",{x:0,y:n.y+4,class:"rid"});id.textContent=n.id;g.append(id);
    if(!narrow){const s=isPrinciple(n.id)?n.texto:n.titulo,t=el("text",{x:58,y:n.y+4,class:"rt"});t.textContent=s.length>chars?s.slice(0,chars-1)+"…":s;g.append(t)}
    g.append(el("circle",{cx:LX,cy:n.y,r:3.6,class:"dot"}));
    press(g,()=>select(n.id,true));
    g.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")paint(n.id)});
    g.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")paint(sel)});
    gRows.append(g);rows[n.id]=g;
  });
  svg.append(gGaps,gArcs,gRows);host.replaceChildren(svg);
  paint(sel);
}

/* Marca la pieza elegida, sus antecedentes (rojo) y sus consecuencias (azul); en las bandas, cuántos quedan ocultos */
function paint(id){
  map.classList.toggle("has-sel",!!id);
  const A=id?closure(id,deps):new Set,D=id?closure(id,users):new Set;
  for(const k in rows)rows[k].setAttribute("class","row"+(isPrinciple(k)?" principle":"")+(k===id?" sel":A.has(k)?" anc":D.has(k)?" desc":id?" dim":""));
  const top=[];
  arcs.forEach(a=>{const anc=id&&A.has(a.from)&&(a.to===id||A.has(a.to)),desc=id&&D.has(a.to)&&(a.from===id||D.has(a.from));
    a.p.setAttribute("class","arc"+(anc?" anc":desc?" desc":""));if(anc||desc)top.push(a.p)});
  top.forEach(p=>p.parentNode.append(p));
  gaps.forEach(gp=>{
    if(!gp.cnt)return;
    let a=0,d=0;if(id)gp.ids.forEach(k=>{if(A.has(k))a++;else if(D.has(k))d++});
    const parts=[];
    if(id&&gp.ids.has(id))parts.push(["s",`${id}, la elegida`]);
    if(a)parts.push(["a",`${a} ${a===1?"antecedente":"antecedentes"}`]);
    if(d)parts.push(["d",`${d} ${d===1?"consecuente":"consecuentes"}`]);
    if(id&&!parts.length)parts.push(["",`Nada relacionado con ${id}`]);
    gp.cnt.replaceChildren();
    parts.forEach(([c,s],i)=>{if(i)gp.cnt.append(" · ");const t=el("tspan",c?{class:c}:{});t.textContent=s;gp.cnt.append(t)});
  });
  if(id)showInfo(id,A,D);
}

function showInfo(id,A,D){
  const n=byId[id],count=s=>{let p=0,po=0,nc=0;s.forEach(k=>/^Post/.test(k)?po++:/^N\.C/.test(k)?nc++:p++);return{p,po,nc}};
  const a=count(A),pl=(k,s,pls)=>`${k} ${k===1?s:pls}`;
  const hidden=s=>[...s].filter(k=>!visible(k)).length,hA=hidden(A),hD=hidden(D);
  const out=k=>k?`<dd class="map-out">${k===1?"Una está en un libro oculto":`${k} están en libros ocultos`}</dd>`:"";
  const chips=list=>list.length?list.map(k=>visible(k)?`<button type="button" class="chip" data-go="${esc(k)}">${esc(k)}</button>`
      :`<button type="button" class="chip out" data-go="${esc(k)}" title="En el Libro ${esc(bookOf(k))}, que está oculto" aria-label="${esc(k)}, en un libro oculto">${esc(k)}</button>`).join(""):`<span class="muted">Ninguna</span>`;
  const self=!visible(id);
  info.innerHTML=`<div class="kicker">${isPrinciple(id)?"Principio":`Proposición ${esc(id)}`}${self?` · <span class="map-off">fuera de la vista</span>`:""}</div>
    <h2>${esc(n.titulo)}</h2>
    <p class="map-text">${esc(n.texto)}</p>
    <dl class="map-stats">
      ${isPrinciple(id)?"":`<div class="anc"><dt>Necesita</dt><dd><b>${a.p}</b> ${a.p===1?"proposición":"proposiciones"}, ${pl(a.po,"postulado","postulados")} y ${pl(a.nc,"noción común","nociones comunes")}</dd>${out(hA)}</div>`}
      <div class="desc"><dt>La usan</dt><dd><b>${D.size}</b> ${D.size===1?"proposición":"proposiciones"}, directa o indirectamente</dd>${out(hD)}</div>
    </dl>
    ${self?`<p class="map-show"><button type="button" class="chip" data-show="${esc(bookOf(id))}">Mostrar el Libro ${esc(bookOf(id))}</button></p>`
      :hA||hD?`<p class="map-show"><button type="button" class="chip" data-show="all">Mostrar todos los libros</button></p>`:""}
    ${isPrinciple(id)?"":`<div class="map-direct"><div class="kicker">Se apoya directamente en</div><div class="chips">${chips(n.usa)}</div></div>`}
    <div class="map-direct"><div class="kicker">La usan directamente</div><div class="chips">${chips(users(id))}</div></div>
    <p class="map-link"><a href="../${n.href}">${isPrinciple(id)?(/^Post/.test(id)?"Ver los postulados":"Ver las nociones comunes"):"Ver la ficha"} →</a></p>`;
  info.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.go;
    if(!visible(k)){shown.add(bookOf(k));apply(false)}select(k,true,true)}));
  info.querySelectorAll("[data-show]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.show;
    if(k==="all")shown=null;else shown.add(k);apply(false);if(k!=="all")select(id,true,true)}));
}

/* La URL guarda los libros elegidos y la pieza elegida: /mapa/?libros=I,III#I.47 */
function syncURL(){
  const q=shown?"?libros="+books.filter(b=>shown.has(b)).join(","):"";
  history.replaceState(null,"",location.pathname+q+(sel?"#"+encodeURIComponent(sel):""));
}

function select(id,push,scroll){
  if(!byId[id])return;sel=id;paint(id);
  if(push)syncURL();
  if(scroll){const r=rows[id];if(r&&r.scrollIntoView)r.scrollIntoView({block:"center",behavior:"smooth"})}
}

/* Chips de libros: «Todos» los muestra todos; desde «Todos», un libro muestra solo ese; después cada chip añade o quita su libro */
const chipsB=[...bar.querySelectorAll("[data-libro]")];
function updateBar(){
  chipsB.forEach(c=>c.setAttribute("aria-pressed",c.dataset.libro==="all"?!shown:!!shown&&shown.has(c.dataset.libro)));
  const v=shown?data.filter(n=>!isPrinciple(n.id)&&visible(n.id)).length:numProps;
  countEl.textContent=shown?`${v} de ${numProps} proposiciones`:`${numProps} proposiciones`;
}
function apply(keepPlace){
  if(shown&&(!shown.size||shown.size===books.length))shown=null;
  layout();draw();updateBar();syncURL();
  // Si el mapa ya se había desplazado bajo la barra, se vuelve a su principio para no quedar en un punto cualquiera
  if(keepPlace){const head=document.querySelector(".site-header"),off=(head?head.offsetHeight:0)+bar.offsetHeight+8;
    if(map.getBoundingClientRect().top<off)window.scrollTo({top:map.getBoundingClientRect().top+scrollY-off,behavior:"auto"})}
}
chipsB.forEach(c=>c.addEventListener("click",()=>{const b=c.dataset.libro;
  if(b==="all")shown=null;else if(!shown)shown=new Set([b]);else if(shown.has(b))shown.delete(b);else shown.add(b);
  apply(true)}));

const want=new URLSearchParams(location.search).get("libros");
if(want){const s=new Set(want.split(",").map(b=>b.trim().toUpperCase()).filter(b=>books.includes(b)));if(s.size)shown=s}
if(shown&&shown.size===books.length)shown=null;
let start="";try{start=decodeURIComponent(location.hash.slice(1))}catch(e){}
sel=byId[start]?start:visible("I.47")?"I.47":data.find(n=>!isPrinciple(n.id)&&visible(n.id)).id;
layout();draw();updateBar();
// En el móvil la fila de chips se desplaza en horizontal: se deja a la vista el primer libro elegido
if(shown){const c=chipsB.find(c=>c.getAttribute("aria-pressed")==="true");if(c&&bar.scrollWidth>bar.clientWidth)bar.scrollLeft=c.offsetLeft-bar.clientWidth/3}
new ResizeObserver(()=>{if(host.clientWidth!==width)draw()}).observe(host);
})();
