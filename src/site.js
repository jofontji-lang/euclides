/* Menú móvil, pestañas y buscador de proposiciones */
(function(){
const btn=document.querySelector(".menu-btn"),nav=document.querySelector(".nav");
if(btn&&nav)btn.addEventListener("click",()=>{const o=nav.classList.toggle("open");btn.setAttribute("aria-expanded",o)});

/* Pestañas: cada grupo [data-tabs] con botones [role=tab] que controlan paneles por id; se recuerda en la URL (#id) */
document.querySelectorAll("[data-tabs]").forEach(group=>{
  const tabs=[...group.querySelectorAll('[role="tab"]')];
  const show=(id,push)=>{tabs.forEach(t=>{const on=t.getAttribute("aria-controls")===id;t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;
      const p=document.getElementById(t.getAttribute("aria-controls"));if(p)p.hidden=!on});
    if(push)history.replaceState(null,"","#"+id)};
  tabs.forEach((t,i)=>{t.addEventListener("click",()=>show(t.getAttribute("aria-controls"),true));
    t.addEventListener("keydown",e=>{const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(!d)return;
      const n=tabs[(i+d+tabs.length)%tabs.length];n.focus();n.click()})});
  const h=location.hash.slice(1),ok=tabs.some(t=>t.getAttribute("aria-controls")===h);
  show(ok?h:tabs[0].getAttribute("aria-controls"),false);
});

/* Filtro de proposiciones */
const list=document.getElementById("proplist");
if(list){
  const q=document.getElementById("buscar"),count=document.getElementById("count"),empty=document.getElementById("empty");
  const chips=[...document.querySelectorAll(".chip[data-f]")];let filt="all";
  const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  const rows=[...list.children];const total=rows.length;
  const apply=()=>{const term=norm(q.value.trim()).replace(/^[ivx]+\.\s*/,"");let shown=0;
    rows.forEach(li=>{const okK=filt==="all"||li.dataset.k===filt||(filt==="fig"&&li.dataset.fig);
      const okT=!term||(/^\d+$/.test(term)?li.dataset.n===term:norm(li.textContent).includes(term));
      li.hidden=!(okK&&okT);if(!li.hidden)shown++});
    count.textContent=`${shown} de ${total}`;empty.hidden=shown>0};
  chips.forEach(c=>c.addEventListener("click",()=>{filt=c.dataset.f;chips.forEach(x=>x.setAttribute("aria-pressed",x===c));apply()}));
  q.addEventListener("input",apply);apply();
}
})();
