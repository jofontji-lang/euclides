// Generador de la web «Euclides · Los Elementos».
// Uso:  node build.mjs     → escribe la web completa en la carpeta _site/
// No necesita instalar nada: solo Node.js 18 o superior.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "_site");
fs.rmSync(OUT, { recursive: true, force: true });
const SITE = "https://euclides.matematicasjosepfont.es";
const HOME = "https://matematicasjosepfont.es";

const libros = JSON.parse(fs.readFileSync(path.join(ROOT, "data/libros.json"), "utf8"));
// Libros disponibles, con sus datos (data/libro-N.json)
const disponibles = libros.filter(b => b.disponible).map(b => ({ ...b, ...JSON.parse(fs.readFileSync(path.join(ROOT, `data/${b.slug}.json`), "utf8")) }));
const libroPorNumero = Object.fromEntries(disponibles.map(b => [b.numero, b]));
const ordinal = { I: "primero", II: "segundo", III: "tercero", IV: "cuarto", V: "quinto", VI: "sexto", VII: "séptimo", VIII: "octavo", IX: "noveno", X: "décimo", XI: "undécimo", XII: "duodécimo", XIII: "decimotercero" };

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = s => String(s).replace(/<[^>]+>/g, "");
const pages = [];
// Huella del contenido de cada archivo de src/: se añade como ?v=… para que el navegador descargue la versión nueva al cambiar.
const ver = Object.fromEntries(["style.css", "site.js", "figures.js", "mapa.js"].map(f =>
  [f, createHash("sha1").update(fs.readFileSync(path.join(ROOT, "src", f))).digest("hex").slice(0, 8)]));

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  if (rel.endsWith("index.html")) pages.push(rel.replace(/index\.html$/, ""));
}

// ---------- Plantilla común ----------
function layout({ rel, title, description, active, body, figures = false, script = "", absolute = false }) {
  const depth = rel.split("/").length - 1;
  const r = absolute ? "/" : "../".repeat(depth) || "./";
  const url = SITE + "/" + rel.replace(/index\.html$/, "");
  const link = (k, href, t) => `<a href="${href}"${active === k ? ' aria-current="page"' : ""}>${t}</a>`;
  // «Libros» abre una lista con los libros disponibles (site.js); en el móvil se muestra ya desplegada.
  const enLibro = disponibles.some(b => b.slug === active);
  const librosMenu = `<div class="nav-books">
    <button type="button" class="nav-drop${enLibro ? " current" : ""}" aria-expanded="false" aria-controls="menu-libros">Libros <span aria-hidden="true">▾</span></button>
    <div class="drop" id="menu-libros">${disponibles.map(b => `<a href="${r}${b.slug}/"${active === b.slug ? ' aria-current="page"' : ""}><span class="drop-n">Libro ${b.numero}</span><span class="drop-t">${esc(b.titulo)}</span></a>`).join("")}<a class="drop-all" href="${r}#libros">Los trece libros →</a></div>
  </div>`;
  const nav = link("inicio", r, "Inicio") + librosMenu + link("mapa", r + "mapa/", "Mapa") + link("sobre", r + "sobre/", "La edición");
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Euclides · Los Elementos">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Euclides · Los Elementos: la arquitectura lógica de las matemáticas">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#203b30">
<link rel="icon" href="${r}assets/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="${r}assets/style.css?v=${ver["style.css"]}">
</head>
<body>
<div class="topline"></div>
<header class="site-header"><div class="wrap">
  <a class="brand" href="${r}" aria-label="Euclides, inicio"><div class="brandmark">Ε</div><div class="brandname">EUCLIDES<span>LOS ELEMENTOS · EDICIÓN DIGITAL</span></div></a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">MENÚ</button>
  <nav class="nav" id="nav" aria-label="Principal">${nav}<a class="out" href="${HOME}">Matemáticas Josep Font ↗</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="footer"><div class="wrap">
  <div><div class="logo">EUCLIDES</div><p>Una edición digital para mirar, leer y demostrar.<br>Preparada por Josep Font Jiménez · <a href="${HOME}">matematicasjosepfont.es</a></p></div>
  <div class="footer-right">ΜΕΤΡΟΝ ΑΡΙΣΤΟΝ<br><span>LA MEDIDA ES LO MEJOR</span></div>
</div></footer>
<script src="${r}assets/site.js?v=${ver["site.js"]}" defer></script>
${figures ? `<script src="${r}assets/figures.js?v=${ver["figures.js"]}" defer></script>` : ""}${script ? `<script src="${r}assets/${script}?v=${ver[script]}" defer></script>` : ""}
</body>
</html>
`;
}

// Bloque de figura interactiva
const figureHTML = (id, stepsSel, { still = false } = {}) => {
  const vb = { "I.1": "0 0 400 310", "I.32": "0 0 400 300", "I.47": "0 -20 400 350", "II.4": "0 0 400 330", "II.11": "0 0 400 380", "III.31": "0 0 400 330" }[id];
  const aria = { "I.1": "Construcción del triángulo equilátero sobre AB", "I.32": "Ángulos de un triángulo y paralela por C", "I.47": "Cuadrados sobre los lados de un triángulo rectángulo", "II.4": "Cuadrado sobre AB dividido en los cuadrados sobre AC y CB y dos rectángulos iguales", "II.11": "Construcción de la sección áurea: el cuadrado sobre AH es igual al rectángulo comprendido por AB y HB", "III.31": "Triángulo inscrito en una semicircunferencia con el ángulo recto en A" }[id];
  if (still) return `<div class="diagram" data-fig="${id}" data-steps="${stepsSel}" data-still><svg viewBox="${vb}" role="img" aria-label="${aria}"><g class="layer"></g></svg></div>`;
  const hint = { "I.1": "ARRASTRA A O B", "I.32": "ARRASTRA LOS VÉRTICES", "I.47": "ARRASTRA A", "II.4": "ARRASTRA C", "II.11": "ARRASTRA B", "III.31": "ARRASTRA A" }[id];
  return `<div data-fig="${id}" data-steps="${stepsSel}">
  <div class="fig-toolbar"><div class="kicker">Figura dinámica</div><span>${hint}</span></div>
  <div class="diagram"><svg viewBox="${vb}" role="img" aria-label="${aria}"><g class="layer"></g></svg></div>
  <p class="readout"></p>
  <p class="step-text"></p>
  <div class="controls"><span class="step-count"></span><button type="button" class="prev">← Anterior</button><button type="button" class="next">Siguiente →</button><button type="button" class="reset quiet">Reiniciar ↺</button></div>
</div>`;
};

const kind = p => p.tipo === "problema" ? "Problema · Q.E.F." : "Teorema · Q.E.D.";

// ---------- Portada ----------
// Figura de I.47 (triángulo 3-4-5): los cuadrados sobre AB y AC tienen la misma área
// que los dos rectángulos en que la altura desde A divide el cuadrado sobre BC.
// Se traza una vez al cargar la página (animación en style.css, sección «Portada»).
const heroArt = `<svg class="pyth" viewBox="0 0 500 410" role="img" aria-label="Proposición I.47: cuadrados sobre los lados de un triángulo rectángulo; la altura divide el cuadrado de la hipotenusa en dos rectángulos iguales a los otros dos cuadrados">
  <g class="fills">
    <path class="red" d="M170 215 272.4 138.2 195.6 35.8 93.2 112.6Z"/><path class="red" d="M170 215H272.4V375H170Z"/>
    <path class="blue" d="M272.4 138.2 330 215 406.8 157.4 349.2 80.6Z"/><path class="blue" d="M272.4 215H330V375H272.4Z"/>
    <path class="sage" d="M170 215 272.4 138.2 330 215Z"/>
  </g>
  <path class="aux" d="M272.4 138.2 170 375M93.2 112.6 330 215M272.4 138.2 330 375M406.8 157.4 170 215"/>
  <path class="draw d1" pathLength="1" d="M170 215 272.4 138.2 330 215Z"/>
  <path class="draw d2" pathLength="1" d="M170 215 93.2 112.6 195.6 35.8 272.4 138.2"/>
  <path class="draw d3" pathLength="1" d="M272.4 138.2 349.2 80.6 406.8 157.4 330 215"/>
  <path class="draw d4" pathLength="1" d="M170 215V375H330V215"/>
  <path class="draw d5 alt" pathLength="1" d="M272.4 138.2V375"/>
  <g class="pts"><circle cx="170" cy="215" r="3.5"/><circle cx="272.4" cy="138.2" r="3.5"/><circle cx="330" cy="215" r="3.5"/>
    <text x="268" y="126">A</text><text x="154" y="220">B</text><text x="338" y="226">C</text></g>
</svg>`;

// Proposiciones con figura interactiva, de todos los libros
const featured = disponibles.flatMap(b => b.proposiciones.filter(p => p.figura).map(p => ({ ...p, id: `${b.numero}.${p.n}`, href: `${b.slug}/${p.n}/` })));
// «los Libros I y II», «los Libros I, II y III»…
const completo = disponibles.length === libros.length;
const listaLibros = completo ? "los trece libros" : disponibles.length === 1 ? `el Libro ${disponibles[0].numero}`
  : `los Libros ${disponibles.slice(0, -1).map(b => b.numero).join(", ")} y ${disponibles.at(-1).numero}`;
const numeral = n => ["Cero", "Una", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez", "Once", "Doce"][n] ?? String(n);
const home = layout({
  rel: "index.html", active: "inicio", figures: true,
  title: "Euclides · Los Elementos",
  description: "Los Elementos de Euclides en una edición digital en castellano: definiciones, postulados y proposiciones con figuras interactivas.",
  body: `
<section class="hero wrap">
  <div>
    <div class="kicker">Alejandría, c. 300 a. C.</div>
    <h1>La arquitectura<br>lógica de las<br><em>matemáticas</em></h1>
    <p class="intro">Hacia el 300 a. C., Euclides reunió en trece libros la geometría y la aritmética de su tiempo. Partiendo de unas pocas definiciones, postulados y nociones comunes, demostró cientos de proposiciones encadenadas: un modelo de rigor que se ha enseñado durante más de dos mil años.</p>
    <div class="actions"><a class="btn" href="libro-1/">Empezar por el Libro I ↗</a><a class="btn secondary" href="libro-1/47/">Ver el teorema de Pitágoras</a></div>
    <div class="meta">
      <div><strong>13</strong><span>libros</span></div>
      <div><strong>465</strong><span>proposiciones</span></div>
      <div><strong>${featured.length}</strong><span>figuras interactivas</span></div>
    </div>
  </div>
  <div class="hero-art">${heroArt}<div class="art-caption">FIG. I.47 — EL CUADRADO DE LA HIPOTENUSA</div></div>
</section>
<div class="rule wrap">ΣΤΟΙΧΕΙΑ · Elementos</div>
<section class="section library" id="libros"><div class="wrap">
  <div class="section-head"><div><div class="kicker">El archivo euclidiano</div><h2>Trece libros.<br>Una sola estructura.</h2></div>
  <p>De los fundamentos de la geometría plana a las proporciones, la aritmética, los inconmensurables y los cinco sólidos regulares.</p></div>
  <ol class="books">${libros.map(b => b.disponible
    ? `<li class="ready"><a class="card" href="${b.slug}/"><span class="roman">LIBER ${b.numero}</span><strong>${esc(b.titulo)}</strong><small>${b.proposiciones} proposiciones</small><span class="status ready">Disponible</span></a></li>`
    : `<li><div class="card"><span class="roman">LIBER ${b.numero}</span><strong>${esc(b.titulo)}</strong><small>${b.proposiciones} proposiciones</small><span class="status">En preparación</span></div></li>`).join("")}</ol>
  <p class="notice">${completo ? "Los trece libros están completos, con todas sus definiciones y proposiciones. Las figuras interactivas y las demostraciones paso a paso se irán añadiendo poco a poco." : `${disponibles.length === 1 ? "Ya está disponible" : "Ya están disponibles"} ${listaLibros}, con todas sus definiciones y proposiciones. Los demás libros se irán incorporando con el mismo formato.`}</p>
</div></section>
<section class="section wrap">
  <div class="section-head"><div><div class="kicker">El lector geométrico</div><h2>${featured.length === 1 ? "Una demostración" : `${numeral(featured.length)} demostraciones`}<br>para empezar.</h2></div>
  <p>Cada una se construye paso a paso. Puedes deformar la figura y ver que la conclusión no depende del dibujo.</p></div>
  <div class="demos cols-${featured.length <= 5 ? featured.length : Math.ceil(featured.length / Math.ceil(featured.length / 5))}">${featured.map(p => `<a class="demo" href="${p.href}">
    ${figureHTML(p.figura, "#mini-" + p.id.replace(".", "-"), { still: true })}
    <ol id="mini-${p.id.replace(".", "-")}" hidden>${p.pasos.map(s => `<li>${s}</li>`).join("")}</ol>
    <span class="kicker">Proposición ${p.id}</span><h3>${esc(p.titulo)}</h3><p>${esc(kind(p))}</p></a>`).join("")}</div>
</section>
<section class="about wrap divided">
  <div><div class="kicker">Criterio editorial</div><h2>Fidelidad sin fingir completitud.</h2>
  <p>Los enunciados siguen el orden y la numeración tradicionales y están traducidos al castellano actual para esta edición. No son una transcripción de una edición histórica concreta.</p>
  <p>Las figuras son construcciones originales, no facsímiles. Sus colores siguen la idea de Oliver Byrne (1847): cada segmento y cada ángulo lleva un color, y el texto los nombra con ese mismo color.</p></div>
  <div><div class="kicker">Cómo leer los estados</div>
  <div class="keyrow"><span class="tag">✓ Con figura</span><span>Proposición con figura interactiva y demostración completa paso a paso.</span></div>
  <div class="keyrow"><span class="tag pending">◷ Enunciado</span><span>Proposición con su enunciado; la figura y la demostración están en preparación.</span></div>
  ${completo ? "" : `<div class="keyrow"><span class="tag pending">◷ En preparación</span><span>Libro aún no incorporado a la edición.</span></div>`}
  <p class="more"><a href="sobre/">Más sobre la edición y las fuentes →</a></p></div>
</section>`
});
write("index.html", home);

// ---------- Páginas de libro ----------
const items = (arr, cls = "") => `<ol class="items ${cls}">${arr.map((t, i) => `<li><span class="n">${i + 1}</span><span>${t}</span></li>`).join("")}</ol>`;
for (const b of disponibles) {
  const tabsDef = [
    ["definiciones", "Definiciones", b.definiciones],
    ["postulados", "Postulados", b.postulados],
    ["nociones", "Nociones comunes", b.nociones],
    ["proposiciones", "Proposiciones", b.proposiciones],
  ].filter(([, , arr]) => arr?.length);
  const panels = {
    definiciones: `<p class="panel-intro"><span class="kicker">ὅροι</span><br>Fijan el significado de los términos. No afirman que los objetos existan: eso lo garantizan los postulados y las construcciones.</p>
      ${b.gruposDefiniciones
        // Libro X: tres grupos de definiciones, cada uno numerado desde 1 y con su título
        ? b.gruposDefiniciones.reduce((acc, g) => ({ i: acc.i + g.n, html: acc.html + `<h3 class="defs-group">${esc(g.titulo)}</h3>${items(b.definiciones.slice(acc.i, acc.i + g.n), "defs")}` }), { i: 0, html: "" }).html
        : items(b.definiciones || [], "defs")}`,
    postulados: `<p class="panel-intro"><span class="kicker">αἰτήματα</span><br>Lo que se pide conceder: las construcciones con regla y compás, y dos hechos sobre ángulos y rectas.</p>
      ${items(b.postulados || [])}
      <p class="note">El quinto postulado, el de las paralelas, no se usa hasta la <a href="29/">proposición I.29</a>. Las 28 proposiciones anteriores valen también en geometrías no euclídeas.</p>`,
    nociones: `<p class="panel-intro"><span class="kicker">κοιναὶ ἔννοιαι</span><br>Principios generales sobre magnitudes, válidos también fuera de la geometría.</p>
      ${items(b.nociones || [])}`,
    proposiciones: `<p class="panel-intro"><span class="kicker">προτάσεις</span><br>Los problemas piden construir algo y terminan con <i>Q.E.F.</i>, «lo que había que hacer». Los teoremas afirman algo y terminan con <i>Q.E.D.</i>, «lo que había que demostrar».</p>
      <div class="tools" role="group" aria-label="Filtrar proposiciones">
        <button type="button" class="chip" data-f="all" aria-pressed="true">Todas</button>
        <button type="button" class="chip" data-f="problema" aria-pressed="false">Problemas</button>
        <button type="button" class="chip" data-f="teorema" aria-pressed="false">Teoremas</button>
        ${b.proposiciones.some(p => p.figura) ? `<button type="button" class="chip" data-f="fig" aria-pressed="false">Con figura</button>` : ""}
        <label class="search"><span aria-hidden="true">⌕</span><input id="buscar" type="search" placeholder="${esc(b.buscar || "Buscar: paralelas, 47, isósceles…")}" aria-label="Buscar proposiciones"></label>
        <span class="count" id="count"></span>
      </div>
      <ol class="proplist" id="proplist">${b.proposiciones.map(p => `<li data-n="${p.n}" data-k="${p.tipo}"${p.figura ? ' data-fig="1"' : ""}><a href="${p.n}/">
        <span class="pn">${b.numero}.${p.n}</span>
        <span><span class="pt">${esc(p.titulo)}</span><span class="pd">${esc(p.enunciado)}</span><span class="ps${p.figura ? " ready" : ""}">${p.tipo === "problema" ? "Problema" : "Teorema"} · ${p.figura ? "✓ Con figura interactiva" : "Enunciado"}</span></span>
        <span class="arrow" aria-hidden="true">↗</span></a></li>`).join("")}</ol>
      <p class="empty" id="empty" hidden>Ninguna proposición coincide con la búsqueda.</p>`,
  };
  const partes = tabsDef.map(([, t, arr]) => `${arr.length} ${t.toLowerCase()}`);
  write(`${b.slug}/index.html`, layout({
    rel: `${b.slug}/index.html`, active: b.slug,
    title: `Libro ${b.numero} · Euclides · Los Elementos`,
    description: `Libro ${b.numero} de los Elementos de Euclides (${b.titulo}): ${partes.length > 1 ? partes.slice(0, -1).join(", ") + " y " : ""}${partes.at(-1)}.`,
    body: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="../">Elementos</a><span aria-hidden="true">›</span><span>Libro ${b.numero}</span></nav>
  <header class="book-head">
    <div class="big" aria-hidden="true">${b.numero}</div>
    <div><div class="kicker">Libro ${ordinal[b.numero]}</div><h1>${esc(b.titulo)}</h1><p>${esc(b.intro)}</p></div>
  </header>
  <div data-tabs>
    <div class="tabs" role="tablist" aria-label="Partes del Libro ${b.numero}">${tabsDef.map(([id, t, arr]) => `<button class="tab" role="tab" type="button" id="tab-${id}" aria-controls="${id}" aria-selected="false">${t}<b>${arr.length}</b></button>`).join("")}</div>
    ${tabsDef.map(([id]) => `<section class="panel" id="${id}" role="tabpanel" aria-labelledby="tab-${id}">
      ${panels[id]}
    </section>`).join("\n    ")}
  </div>
</div>
<div class="spacer"></div>`
  }));
}

// ---------- Fichas de proposición ----------
// Las citas («I.5», «II.4», «Post. 1», «N.C. 2») enlazan a su ficha si el libro está disponible.
const citeLink = c => {
  let m;
  if ((m = c.match(/^([IVX]+)\.(\d+)$/)) && libroPorNumero[m[1]]) return `<a href="../../${libroPorNumero[m[1]].slug}/${m[2]}/">${c}</a>`;
  if (/^Post\./.test(c)) return `<a href="../../libro-1/#postulados">${c}</a>`;
  if (/^N\.C\./.test(c)) return `<a href="../../libro-1/#nociones">${c}</a>`;
  return `<span>${c}</span>`;
};
const usedBy = {};
for (const b of disponibles) for (const p of b.proposiciones) for (const c of p.usa || []) {
  if (/^[IVX]+\.\d+$/.test(c)) (usedBy[c] ||= []).push(`${b.numero}.${p.n}`);
}

disponibles.forEach((b, bi) => {
  const props = b.proposiciones, sig = disponibles[bi + 1];
  const sigNumero = libros[libros.findIndex(x => x.numero === b.numero) + 1]?.numero;
  for (const p of props) {
    const id = `${b.numero}.${p.n}`;
    const prev = props[p.n - 2], next = props[p.n];
    const uses = p.usa?.length ? `<div class="block"><div class="kicker">Se apoya en</div><div class="cites">${p.usa.map(citeLink).join("")}</div></div>` : "";
    const users = usedBy[id] ? `<div class="block"><div class="kicker">La usan</div><div class="cites">${usedBy[id].map(citeLink).join("")}</div></div>` : "";
    const statement = `<article class="paper">
      <div class="kicker">Enunciado</div>
      <h2>${esc(p.enunciado)}</h2>
      <span class="tag${p.figura ? "" : " pending"}">${p.figura ? "✓ Con figura y demostración" : "◷ Figura en preparación"}</span>
      ${uses}${users}
      ${p.nota ? `<div class="block"><div class="kicker">Nota</div><p class="small">${esc(p.nota)}</p></div>` : ""}
    </article>`;
    const main = p.figura ? `
  <div class="grid2">
    ${statement}
    <div class="paper">${figureHTML(p.figura, "#pasos")}</div>
  </div>
  <section class="proof">
    <div class="kicker">${p.tipo === "problema" ? "Construcción y demostración" : "Demostración"}</div>
    <h3>Paso a paso</h3>
    <p class="small muted hint">Pulsa un paso para verlo en la figura.</p>
    <ol id="pasos">${p.pasos.map(s => `<li>${s}</li>`).join("")}</ol>
  </section>` : `
  <div class="grid2">
    ${statement}
    <aside class="pending-card"><div class="kicker">Estado de la ficha</div><h3>Figura y demostración en preparación</h3>
      <p>Esta proposición ya tiene su enunciado completo. La construcción interactiva y la demostración paso a paso se añadirán más adelante.</p>
      <p>Mientras tanto, puedes ver cómo funcionan las fichas completas en ${featured.map(f => citeLink(f.id)).join(", ")}.</p></aside>
  </div>`;
    const before = prev
      ? `<a href="../${prev.n}/"><span class="dir">← ${b.numero}.${prev.n}</span><span class="t">${esc(prev.titulo)}</span></a>`
      : b.definiciones?.length ? `<a href="../#${b.postulados ? "postulados" : "definiciones"}"><span class="dir">← Principios</span><span class="t">${b.postulados ? "Definiciones y postulados" : "Definiciones"}</span></a>`
      // Libro sin definiciones: se vuelve a la última proposición del libro anterior
      : (ant => `<a href="../../${ant.slug}/${ant.proposiciones.length}/"><span class="dir">← ${ant.numero}.${ant.proposiciones.length}</span><span class="t">${esc(ant.proposiciones.at(-1).titulo)}</span></a>`)(disponibles[bi - 1]);
    const after = next
      ? `<a class="next" href="../${next.n}/"><span class="dir">${b.numero}.${next.n} →</span><span class="t">${esc(next.titulo)}</span></a>`
      : sig ? `<a class="next" href="../../${sig.slug}/"><span class="dir">Libro ${sig.numero} →</span><span class="t">${esc(sig.titulo)}</span></a>`
      : sigNumero ? `<span class="next"><span class="dir">Libro ${sigNumero} →</span><span class="t">En preparación</span></span>` : "";
    write(`${b.slug}/${p.n}/index.html`, layout({
      rel: `${b.slug}/${p.n}/index.html`, active: b.slug, figures: !!p.figura,
      title: `${id} · ${p.titulo} · Euclides`,
      description: `Proposición ${p.n} del Libro ${b.numero} de los Elementos de Euclides: ${strip(p.enunciado)}`,
      body: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="../../">Elementos</a><span aria-hidden="true">›</span><a href="../">Libro ${b.numero}</a><span aria-hidden="true">›</span><a href="../#proposiciones">Proposiciones</a><span aria-hidden="true">›</span><span>${id}</span></nav>
  <header class="prop-head"><div><div class="kicker">${kind(p)}</div><h1>Proposición ${id}</h1><div class="sub">${esc(p.titulo)}</div></div></header>
</div>
<section class="reader"><div class="wrap">
  ${main}
  <nav class="pager" aria-label="Proposiciones vecinas">
    ${before}
    ${after}
  </nav>
</div></section>`
    }));
  }
});

// ---------- Mapa de dependencias ----------
// Nodos: postulados, nociones comunes y proposiciones de los libros disponibles; aristas: las citas «usa».
// src/mapa.js lo dibuja como un diagrama de arcos vertical.
const libro1 = libroPorNumero.I;
const nodos = [
  ...libro1.postulados.map((t, i) => ({ id: `Post. ${i + 1}`, grupo: "Principios", titulo: `Postulado ${i + 1}`, texto: strip(t), href: "libro-1/#postulados" })),
  ...libro1.nociones.map((t, i) => ({ id: `N.C. ${i + 1}`, grupo: "Principios", titulo: `Noción común ${i + 1}`, texto: strip(t), href: "libro-1/#nociones" })),
  ...disponibles.flatMap(b => b.proposiciones.map(p => ({ id: `${b.numero}.${p.n}`, grupo: `Libro ${b.numero}`, titulo: p.titulo, texto: strip(p.enunciado), href: `${b.slug}/${p.n}/`, usa: p.usa || [] }))),
];
const ids = new Set(nodos.map(n => n.id));
nodos.forEach(n => { n.usa = (n.usa || []).filter(c => ids.has(c)); });
const citas = {};
nodos.forEach(n => n.usa.forEach(c => { citas[c] = (citas[c] || 0) + 1; }));
const masCitada = Object.entries(citas).filter(([c]) => !/^(Post|N\.C)/.test(c)).sort((a, b) => b[1] - a[1])[0];
const numAristas = nodos.reduce((s, n) => s + n.usa.length, 0);
write("mapa/index.html", layout({
  rel: "mapa/index.html", active: "mapa", script: "mapa.js",
  title: "Mapa de dependencias · Euclides · Los Elementos",
  description: `Cómo se apoyan unas en otras las ${nodos.length - 10} proposiciones de ${listaLibros} de los Elementos de Euclides, hasta los postulados y las nociones comunes.`,
  body: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="../">Elementos</a><span aria-hidden="true">›</span><span>Mapa</span></nav>
  <header class="map-head">
    <div class="kicker">Mapa de dependencias</div>
    <h1>Cada proposición se apoya<br>en las anteriores.</h1>
    <p>Las ${nodos.length - 10} proposiciones de ${listaLibros}, los 5 postulados y las 5 nociones comunes, unidos por las ${numAristas} citas de sus demostraciones. Pulsa una proposición: en <span class="sg sg-red">rojo</span>, todo lo que necesita hasta llegar a los postulados; en <span class="sg sg-blue">azul</span>, todo lo que se construye sobre ella.</p>
    <p class="small muted">La más citada es <a href="../${nodos.find(n => n.id === masCitada[0]).href}">${masCitada[0]}</a>, ${esc(nodos.find(n => n.id === masCitada[0]).titulo.toLowerCase())}: la usan directamente ${masCitada[1]} proposiciones.</p>
  </header>
  <div class="map-books tools" id="map-books" role="group" aria-label="Libros que se muestran en el mapa">
    <button type="button" class="chip" data-libro="all" aria-pressed="true">Todos</button>
    ${disponibles.map(b => `<button type="button" class="chip" data-libro="${b.numero}" aria-pressed="false" aria-label="Libro ${b.numero}" title="Libro ${b.numero}: ${esc(b.titulo)}">${b.numero}</button>`).join("")}
    <span class="count" id="map-count" aria-live="polite"></span>
  </div>
  <div class="map">
    <aside class="map-info" id="map-info" aria-live="polite"><p class="muted">Cargando el mapa…</p></aside>
    <div class="map-graph" id="map-graph"><noscript><p>El mapa necesita JavaScript. Las dependencias de cada proposición están también en su ficha, en «Se apoya en» y «La usan».</p></noscript></div>
  </div>
  <script type="application/json" id="map-data">${JSON.stringify(nodos.map(({ id, grupo, titulo, texto, href, usa }) => ({ id, grupo, titulo, texto, href, usa }))).replace(/</g, "\\u003c")}</script>
</div>
<div class="spacer"></div>`
}));

// ---------- La edición ----------
write("sobre/index.html", layout({
  rel: "sobre/index.html", active: "sobre",
  title: "La edición · Euclides · Los Elementos",
  description: "Criterio editorial, traducción y fuentes de esta edición digital de los Elementos de Euclides.",
  body: `
<div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="../">Elementos</a><span aria-hidden="true">›</span><span>La edición</span></nav>
<article class="prose">
  <div class="kicker">Sobre esta edición</div>
  <h1>Una edición para leer, mirar y demostrar.</h1>
  <p>Los <i>Elementos</i> reúnen en trece libros la geometría y la aritmética griegas hasta el siglo III a. C. Durante más de dos mil años fueron el modelo de cómo se razona en matemáticas: unas pocas definiciones y postulados, y a partir de ellos, una cadena de proposiciones en la que cada paso se apoya en los anteriores.</p>
  <p>Esta web quiere hacer visible esa cadena. Cada proposición tiene su propia página, enlazada con las proposiciones y postulados en los que se apoya, y las más importantes tienen una figura que se puede manipular.</p>
  <h2>Texto</h2>
  <p>Los enunciados están traducidos al castellano actual para esta edición, siguiendo el orden y la numeración tradicionales (los de la edición de Heiberg). Se ha buscado la claridad antes que la literalidad, sin cambiar el contenido matemático.</p>
  <h2>Figuras</h2>
  <p>Las figuras son construcciones originales programadas para esta web. Siguen la idea de Oliver Byrne, que en 1847 publicó los seis primeros libros con los segmentos y ángulos coloreados en lugar de nombrados con letras. Aquí se combinan ambas cosas: cada elemento lleva su letra y su color, y el texto lo nombra con el mismo color.</p>
  <h2>Estado</h2>
  <ul>
    ${disponibles.map(b => `<li>Libro ${b.numero}: completo en enunciados.${b.proposiciones.some(p => p.figura) ? ` Figuras interactivas en ${featured.filter(f => f.id.startsWith(b.numero + ".")).map(f => `<a href="../${f.href}">${f.id}</a>`).join(", ")}.` : " Figuras en preparación."}</li>`).join("\n    ")}
    ${completo ? "" : `<li>Libros ${libros.find(b => !b.disponible).numero} a XIII: en preparación.</li>`}
  </ul>
  <h2>Para contrastar</h2>
  <ul>
    <li><a href="https://mathcs.clarku.edu/~djoyce/java/elements/elements.html">David E. Joyce, <i>Euclid's Elements</i></a>, Clark University (en inglés).</li>
    <li>Euclides, <i>Elementos</i>, trad. María Luisa Puertas Castaños, Biblioteca Clásica Gredos (3 vols.).</li>
    <li>T. L. Heath, <i>The Thirteen Books of Euclid's Elements</i>, Cambridge, 1908.</li>
  </ul>
</article></div>`
}));

// ---------- 404 ----------
fs.writeFileSync(path.join(OUT, "404.html"), layout({
  rel: "404.html", absolute: true, title: "Página no encontrada · Euclides",
  description: "Esta página no existe.",
  body: `<div class="wrap"><article class="prose"><div class="kicker">Error 404</div><h1>Esta página no existe.</h1>
  <p>Puede que la dirección esté mal escrita o que la proposición aún no esté publicada.</p>
  <div class="actions spaced"><a class="btn" href="/">Volver al inicio</a><a class="btn secondary" href="/libro-1/#proposiciones">Ver las proposiciones del Libro I</a></div></article></div>`
}));

// ---------- Recursos, sitemap y dominio ----------
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
for (const f of ["style.css", "site.js", "figures.js", "mapa.js", "og.png"]) fs.copyFileSync(path.join(ROOT, "src", f), path.join(OUT, "assets", f));
fs.writeFileSync(path.join(OUT, "assets/icon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#203b30"/><circle cx="32" cy="32" r="25" fill="none" stroke="#b18a4b" stroke-width="1.5"/><text x="32" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#f4f1e8">Ε</text></svg>`);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${SITE}/${p}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "CNAME"), "euclides.matematicasjosepfont.es\n");
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

console.log(`Web generada en _site/: ${pages.length} páginas.`);
