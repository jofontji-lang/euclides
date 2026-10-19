// Generador de la web «Euclides · Los Elementos».
// Uso:  node build.mjs     → escribe la web completa en la carpeta _site/
// No necesita instalar nada: solo Node.js 18 o superior.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "_site");
fs.rmSync(OUT, { recursive: true, force: true });
const SITE = "https://euclides.matematicasjosepfont.es";
const HOME = "https://matematicasjosepfont.es";

const libros = JSON.parse(fs.readFileSync(path.join(ROOT, "data/libros.json"), "utf8"));
const libro1 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/libro-1.json"), "utf8"));

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = s => String(s).replace(/<[^>]+>/g, "");
const pages = [];

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  if (rel.endsWith("index.html")) pages.push(rel.replace(/index\.html$/, ""));
}

// ---------- Plantilla común ----------
function layout({ rel, title, description, active, body, figures = false, absolute = false }) {
  const depth = rel.split("/").length - 1;
  const r = absolute ? "/" : "../".repeat(depth) || "./";
  const url = SITE + "/" + rel.replace(/index\.html$/, "");
  const nav = [
    ["inicio", r, "Inicio"],
    ["libro-1", r + "libro-1/", "Libro I"],
    ["proposiciones", r + "libro-1/#proposiciones", "Proposiciones"],
    ["sobre", r + "sobre/", "La edición"],
  ].map(([k, href, t]) => `<a href="${href}"${active === k ? ' aria-current="page"' : ""}>${t}</a>`).join("");
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
<link rel="stylesheet" href="${r}assets/style.css">
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
<script src="${r}assets/site.js" defer></script>
${figures ? `<script src="${r}assets/figures.js" defer></script>` : ""}
</body>
</html>
`;
}

// Bloque de figura interactiva
const figureHTML = (id, stepsSel, { still = false } = {}) => {
  const vb = { "I.1": "0 0 400 310", "I.32": "0 0 400 300", "I.47": "0 -20 400 350" }[id];
  const aria = { "I.1": "Construcción del triángulo equilátero sobre AB", "I.32": "Ángulos de un triángulo y paralela por C", "I.47": "Cuadrados sobre los lados de un triángulo rectángulo" }[id];
  if (still) return `<div class="diagram" data-fig="${id}" data-steps="${stepsSel}" data-still><svg viewBox="${vb}" role="img" aria-label="${aria}"><g class="layer"></g></svg></div>`;
  const hint = { "I.1": "ARRASTRA A O B", "I.32": "ARRASTRA LOS VÉRTICES", "I.47": "ARRASTRA A" }[id];
  return `<div data-fig="${id}" data-steps="${stepsSel}">
  <div class="fig-toolbar"><div class="kicker">Figura dinámica</div><span>${hint}</span></div>
  <div class="diagram"><svg viewBox="${vb}" role="img" aria-label="${aria}"><g class="layer"></g></svg></div>
  <p class="readout"></p>
  <p class="step-text"></p>
  <div class="controls"><span class="step-count"></span><button type="button" class="prev">← Anterior</button><button type="button" class="next">Siguiente →</button><button type="button" class="reset quiet">Reiniciar ↺</button></div>
</div>`;
};

const kind = p => p.tipo === "problema" ? "Problema · Q.E.F." : "Teorema · Q.E.D.";
const props = libro1.proposiciones;

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

const featured = props.filter(p => p.figura);
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
  <p class="notice">El Libro I está completo: todas sus definiciones, postulados, nociones comunes y proposiciones. Los demás libros se irán incorporando con el mismo formato.</p>
</div></section>
<section class="section wrap">
  <div class="section-head"><div><div class="kicker">El lector geométrico</div><h2>${featured.length === 1 ? "Una demostración" : `${numeral(featured.length)} demostraciones`}<br>para empezar.</h2></div>
  <p>Cada una se construye paso a paso. Puedes deformar la figura y ver que la conclusión no depende del dibujo.</p></div>
  <div class="demos">${featured.map(p => `<a class="demo" href="libro-1/${p.n}/">
    ${figureHTML(p.figura, "#mini-" + p.n, { still: true })}
    <ol id="mini-${p.n}" hidden>${p.pasos.map(s => `<li>${s}</li>`).join("")}</ol>
    <span class="kicker">Proposición I.${p.n}</span><h3>${esc(p.titulo)}</h3><p>${esc(kind(p))}</p></a>`).join("")}</div>
</section>
<section class="about wrap divided">
  <div><div class="kicker">Criterio editorial</div><h2>Fidelidad sin fingir completitud.</h2>
  <p>Los enunciados siguen el orden y la numeración tradicionales y están traducidos al castellano actual para esta edición. No son una transcripción de una edición histórica concreta.</p>
  <p>Las figuras son construcciones originales, no facsímiles. Sus colores siguen la idea de Oliver Byrne (1847): cada segmento y cada ángulo lleva un color, y el texto los nombra con ese mismo color.</p></div>
  <div><div class="kicker">Cómo leer los estados</div>
  <div class="keyrow"><span class="tag">✓ Con figura</span><span>Proposición con figura interactiva y demostración completa paso a paso.</span></div>
  <div class="keyrow"><span class="tag pending">◷ Enunciado</span><span>Proposición con su enunciado; la figura y la demostración están en preparación.</span></div>
  <div class="keyrow"><span class="tag pending">◷ En preparación</span><span>Libro aún no incorporado a la edición.</span></div>
  <p class="more"><a href="sobre/">Más sobre la edición y las fuentes →</a></p></div>
</section>`
});
write("index.html", home);

// ---------- Libro I ----------
const items = (arr, cls = "") => `<ol class="items ${cls}">${arr.map((t, i) => `<li><span class="n">${i + 1}</span><span>${t}</span></li>`).join("")}</ol>`;
const tabsDef = [
  ["definiciones", "Definiciones", libro1.definiciones.length],
  ["postulados", "Postulados", libro1.postulados.length],
  ["nociones", "Nociones comunes", libro1.nociones.length],
  ["proposiciones", "Proposiciones", props.length],
];
const bookPage = layout({
  rel: "libro-1/index.html", active: "libro-1",
  title: "Libro I · Euclides · Los Elementos",
  description: "Libro I de los Elementos de Euclides: 23 definiciones, 5 postulados, 5 nociones comunes y 48 proposiciones, hasta el teorema de Pitágoras.",
  body: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="../">Elementos</a><span aria-hidden="true">›</span><span>Libro I</span></nav>
  <header class="book-head">
    <div class="big" aria-hidden="true">I</div>
    <div><div class="kicker">Libro primero</div><h1>${esc(libro1.titulo)}</h1><p>${esc(libro1.intro)}</p></div>
  </header>
  <div data-tabs>
    <div class="tabs" role="tablist" aria-label="Partes del Libro I">${tabsDef.map(([id, t, n]) => `<button class="tab" role="tab" type="button" id="tab-${id}" aria-controls="${id}" aria-selected="false">${t}<b>${n}</b></button>`).join("")}</div>
    <section class="panel" id="definiciones" role="tabpanel" aria-labelledby="tab-definiciones">
      <p class="panel-intro"><span class="kicker">ὅροι</span><br>Fijan el significado de los términos. No afirman que los objetos existan: eso lo garantizan los postulados y las construcciones.</p>
      ${items(libro1.definiciones, "defs")}
    </section>
    <section class="panel" id="postulados" role="tabpanel" aria-labelledby="tab-postulados">
      <p class="panel-intro"><span class="kicker">αἰτήματα</span><br>Lo que se pide conceder: las construcciones con regla y compás, y dos hechos sobre ángulos y rectas.</p>
      ${items(libro1.postulados)}
      <p class="note">El quinto postulado, el de las paralelas, no se usa hasta la <a href="29/">proposición I.29</a>. Las 28 proposiciones anteriores valen también en geometrías no euclídeas.</p>
    </section>
    <section class="panel" id="nociones" role="tabpanel" aria-labelledby="tab-nociones">
      <p class="panel-intro"><span class="kicker">κοιναὶ ἔννοιαι</span><br>Principios generales sobre magnitudes, válidos también fuera de la geometría.</p>
      ${items(libro1.nociones)}
    </section>
    <section class="panel" id="proposiciones" role="tabpanel" aria-labelledby="tab-proposiciones">
      <p class="panel-intro"><span class="kicker">προτάσεις</span><br>Los problemas piden construir algo y terminan con <i>Q.E.F.</i>, «lo que había que hacer». Los teoremas afirman algo y terminan con <i>Q.E.D.</i>, «lo que había que demostrar».</p>
      <div class="tools" role="group" aria-label="Filtrar proposiciones">
        <button type="button" class="chip" data-f="all" aria-pressed="true">Todas</button>
        <button type="button" class="chip" data-f="problema" aria-pressed="false">Problemas</button>
        <button type="button" class="chip" data-f="teorema" aria-pressed="false">Teoremas</button>
        <button type="button" class="chip" data-f="fig" aria-pressed="false">Con figura</button>
        <label class="search"><span aria-hidden="true">⌕</span><input id="buscar" type="search" placeholder="Buscar: paralelas, 47, isósceles…" aria-label="Buscar proposiciones"></label>
        <span class="count" id="count"></span>
      </div>
      <ol class="proplist" id="proplist">${props.map(p => `<li data-n="${p.n}" data-k="${p.tipo}"${p.figura ? ' data-fig="1"' : ""}><a href="${p.n}/">
        <span class="pn">I.${p.n}</span>
        <span><span class="pt">${esc(p.titulo)}</span><span class="pd">${esc(p.enunciado)}</span><span class="ps${p.figura ? " ready" : ""}">${p.tipo === "problema" ? "Problema" : "Teorema"} · ${p.figura ? "✓ Con figura interactiva" : "Enunciado"}</span></span>
        <span class="arrow" aria-hidden="true">↗</span></a></li>`).join("")}</ol>
      <p class="empty" id="empty" hidden>Ninguna proposición coincide con la búsqueda.</p>
    </section>
  </div>
</div>
<div class="spacer"></div>`
});
write("libro-1/index.html", bookPage);

// ---------- Fichas de proposición ----------
const citeLink = c => {
  let m;
  if ((m = c.match(/^I\.(\d+)$/))) return `<a href="../${m[1]}/">${c}</a>`;
  if (/^Post\./.test(c)) return `<a href="../#postulados">${c}</a>`;
  if (/^N\.C\./.test(c)) return `<a href="../#nociones">${c}</a>`;
  return `<span>${c}</span>`;
};
const usedBy = {};
props.forEach(p => (p.usa || []).forEach(c => { const m = c.match(/^I\.(\d+)$/); if (m) (usedBy[m[1]] ||= []).push(p.n); }));

for (const p of props) {
  const prev = props[p.n - 2], next = props[p.n];
  const uses = p.usa?.length ? `<div class="block"><div class="kicker">Se apoya en</div><div class="cites">${p.usa.map(citeLink).join("")}</div></div>` : "";
  const users = usedBy[p.n] ? `<div class="block"><div class="kicker">La usan</div><div class="cites">${usedBy[p.n].map(n => `<a href="../${n}/">I.${n}</a>`).join("")}</div></div>` : "";
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
      <p>Mientras tanto, puedes ver cómo funcionan las fichas completas en ${featured.map(f => `<a href="../${f.n}/">I.${f.n}</a>`).join(", ")}.</p></aside>
  </div>`;
  write(`libro-1/${p.n}/index.html`, layout({
    rel: `libro-1/${p.n}/index.html`, active: "proposiciones", figures: !!p.figura,
    title: `I.${p.n} · ${p.titulo} · Euclides`,
    description: `Proposición ${p.n} del Libro I de los Elementos de Euclides: ${strip(p.enunciado)}`,
    body: `
<div class="wrap">
  <nav class="crumbs" aria-label="Ruta"><a href="../../">Elementos</a><span aria-hidden="true">›</span><a href="../">Libro I</a><span aria-hidden="true">›</span><a href="../#proposiciones">Proposiciones</a><span aria-hidden="true">›</span><span>I.${p.n}</span></nav>
  <header class="prop-head"><div><div class="kicker">${kind(p)}</div><h1>Proposición I.${p.n}</h1><div class="sub">${esc(p.titulo)}</div></div></header>
</div>
<section class="reader"><div class="wrap">
  ${main}
  <nav class="pager" aria-label="Proposiciones vecinas">
    ${prev ? `<a href="../${prev.n}/"><span class="dir">← I.${prev.n}</span><span class="t">${esc(prev.titulo)}</span></a>` : `<a href="../#postulados"><span class="dir">← Principios</span><span class="t">Definiciones y postulados</span></a>`}
    ${next ? `<a class="next" href="../${next.n}/"><span class="dir">I.${next.n} →</span><span class="t">${esc(next.titulo)}</span></a>` : `<span class="next"><span class="dir">Libro II →</span><span class="t">En preparación</span></span>`}
  </nav>
</div></section>`
  }));
}

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
    <li>Libro I: completo en enunciados. Figuras interactivas en ${featured.map(f => `<a href="../libro-1/${f.n}/">I.${f.n}</a>`).join(", ")}.</li>
    <li>Libros II a XIII: en preparación.</li>
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
for (const f of ["style.css", "site.js", "figures.js", "og.png"]) fs.copyFileSync(path.join(ROOT, "src", f), path.join(OUT, "assets", f));
fs.writeFileSync(path.join(OUT, "assets/icon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#203b30"/><circle cx="32" cy="32" r="25" fill="none" stroke="#b18a4b" stroke-width="1.5"/><text x="32" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#f4f1e8">Ε</text></svg>`);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${SITE}/${p}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, "CNAME"), "euclides.matematicasjosepfont.es\n");
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

console.log(`Web generada en _site/: ${pages.length} páginas.`);
