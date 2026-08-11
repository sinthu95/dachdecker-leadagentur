/**
 * Baut aus dist/ eine einzelne, in sich geschlossene HTML-Datei: alle Seiten,
 * Stile, Schriften, Bilder und das Skript eingebettet. Damit lässt sich der
 * Stand ohne Server im Browser durchklicken.
 *
 * Am Inhalt wird nichts geändert — die Seiten werden unverändert aus dem Build
 * übernommen. Ersetzt werden ausschließlich Verweise auf Dateien, die es ohne
 * Server nicht gäbe, durch eingebettete Daten.
 *
 *   npm run build && node tools/vorschau.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const dist = join(wurzel, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ fehlt — bitte zuerst „npm run build" ausführen.');
  process.exit(1);
}

const SEITEN = [
  ['/', 'index.html'],
  ['/leistungen', 'leistungen/index.html'],
  ['/dachdecker', 'dachdecker/index.html'],
  ['/demo', 'demo/index.html'],
  ['/ueber-uns', 'ueber-uns/index.html'],
  ['/kontakt', 'kontakt/index.html'],
  ['/danke', 'danke/index.html'],
  ['/impressum', 'impressum/index.html'],
  ['/datenschutz', 'datenschutz/index.html'],
  ['/404', '404.html'],
];

/* ------------------------------------------------ Stile, Schriften, Skript */
const astro = join(dist, '_astro');
const dateien = readdirSync(astro);
const cssDatei = dateien.find((d) => d.endsWith('.css'));
const jsDatei = dateien.find((d) => d.endsWith('.js'));

let css = readFileSync(join(astro, cssDatei), 'utf8');
for (const schrift of readdirSync(join(dist, 'fonts'))) {
  const daten = readFileSync(join(dist, 'fonts', schrift)).toString('base64');
  css = css.replaceAll(`/fonts/${schrift}`, `data:font/woff2;base64,${daten}`);
}
const js = readFileSync(join(astro, jsDatei), 'utf8');

/* ------------------------------------------------------------- Bilddateien */
const bilder = {};
const mime = { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml' };
function sammle(ordner, praefix) {
  for (const name of readdirSync(join(dist, ordner))) {
    const endung = name.split('.').pop();
    if (!mime[endung]) continue;
    const daten = readFileSync(join(dist, ordner, name)).toString('base64');
    bilder[`${praefix}/${name}`] = `data:${mime[endung]};base64,${daten}`;
  }
}
sammle('images/demo', '/images/demo');
bilder['/favicon.svg'] =
  'data:image/svg+xml;base64,' + readFileSync(join(dist, 'favicon.svg')).toString('base64');

/* -------------------------------------------------------- Seiten aufbauen */
const seiten = {};
for (const [pfad, datei] of SEITEN) {
  let html = readFileSync(join(dist, datei), 'utf8');

  // Stil- und Skriptverweise durch Platzhalter ersetzen; beides wird zur
  // Laufzeit einmal eingesetzt, statt zehnmal in der Datei zu liegen.
  html = html.replace(
    /<link rel="stylesheet" href="[^"]*\.css"\s*\/?>/g,
    '<style>__CSS__</style>',
  );
  html = html.replace(
    /<script type="module" src="[^"]*\.js"><\/script>/g,
    '<script type="module">__JS__<\/script>',
  );
  // Bildverweise durch eingebettete Daten ersetzen
  for (const schluessel of Object.keys(bilder)) {
    html = html.replaceAll(`"${schluessel}"`, `"__BILD:${schluessel}__"`);
  }
  // Vorladen von Schriften entfernen — sie stecken jetzt im Stil.
  html = html.replace(/<link rel="preload"[^>]*>/g, '');

  seiten[pfad] = html;
}

/* ------------------------------------------------------------- Rahmenseite */
const daten = JSON.stringify({ seiten, bilder });

const rahmen = `<title>S&S Leadcraft — Vorschau</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin:0; padding:0; height:100%; background:#0b0e12; }
  body { display:flex; flex-direction:column; font-family:ui-monospace,Consolas,monospace; }
  #buehne { flex:1; display:flex; justify-content:center; background:#0b0e12; overflow:hidden; }
  #rahmen { width:100%; height:100%; border:0; background:#0b0e12; transition:width .3s ease; }
  #rahmen.telefon { width:390px; border-left:1px solid #2a323d; border-right:1px solid #2a323d; }
  #leiste {
    flex:0 0 auto; display:flex; align-items:center; gap:1rem; flex-wrap:wrap;
    padding:.5rem .9rem; background:#161a20; border-top:1px solid #2a323d;
    font-size:11px; letter-spacing:.08em; color:#8c949e;
  }
  #leiste b { color:#e7e7e4; font-weight:500; }
  #leiste .tag {
    text-transform:uppercase; letter-spacing:.16em; font-size:10px;
    border:1px solid #3c4653; padding:.15rem .45rem; color:#7c9bea;
  }
  #leiste button {
    font:inherit; letter-spacing:.1em; text-transform:uppercase; font-size:10px;
    background:transparent; color:#8c949e; border:1px solid #3c4653;
    padding:.3rem .7rem; cursor:pointer;
  }
  #leiste button[aria-pressed="true"] { color:#0b0e12; background:#e7e7e4; border-color:#e7e7e4; }
  #leiste .weg { margin-left:auto; }
  #hinweis { color:#e0745c; }
</style>

<div id="buehne"><iframe id="rahmen" title="Vorschau der Website"></iframe></div>

<div id="leiste">
  <span class="tag">Vorschau</span>
  <b id="pfad">/</b>
  <span id="hinweis"></span>
  <span class="weg"></span>
  <span>Snapshot ohne Server — Formularversand inaktiv</span>
  <button id="btn-desktop" aria-pressed="true">Desktop</button>
  <button id="btn-telefon" aria-pressed="false">Telefon 390px</button>
</div>

<script type="application/json" id="daten">${daten.replace(/<\//g, '<\\/')}</script>
<script>
(function () {
  var d = JSON.parse(document.getElementById('daten').textContent);
  var css = ${JSON.stringify(css)};
  var js  = ${JSON.stringify(js)};
  var rahmen = document.getElementById('rahmen');
  var pfadAnzeige = document.getElementById('pfad');
  var hinweis = document.getElementById('hinweis');

  // Wird in jede Seite eingesetzt: fängt interne Verweise und das Absenden des
  // Formulars ab, weil es im Snapshot keinen Server gibt.
  var bruecke = [
    '<' + 'script>',
    'document.addEventListener("click", function (e) {',
    '  var a = e.target.closest && e.target.closest("a[href]");',
    '  if (!a) return;',
    '  var href = a.getAttribute("href");',
    '  if (!href) return;',
    '  if (href.charAt(0) === "#") return;',
    '  if (href.charAt(0) === "/") {',
    '    e.preventDefault();',
    '    parent.postMessage({ typ: "gehe", href: href.split("#")[0] || "/" }, "*");',
    '  } else if (/^https?:/.test(href)) {',
    '    e.preventDefault(); window.open(href, "_blank", "noopener");',
    '  }',
    '}, true);',
    'document.addEventListener("submit", function (e) {',
    '  e.preventDefault();',
    '  parent.postMessage({ typ: "formular" }, "*");',
    '});',
    '<' + '/script>'
  ].join('\\n');

  function zeige(pfad) {
    var html = d.seiten[pfad] || d.seiten['/404'];
    html = html.replace('__CSS__', function () { return css; });
    html = html.replace('__JS__', function () { return js; });
    html = html.replace(/__BILD:([^"]+)__/g, function (_, k) { return d.bilder[k] || ''; });
    html = html.replace('</body>', bruecke + '</body>');
    rahmen.srcdoc = html;
    pfadAnzeige.textContent = pfad;
    hinweis.textContent = '';
  }

  addEventListener('message', function (e) {
    if (!e.data) return;
    if (e.data.typ === 'gehe') zeige(e.data.href);
    if (e.data.typ === 'formular') {
      zeige('/danke');
      hinweis.textContent = 'Snapshot: es wurde nichts verschickt.';
    }
  });

  var bd = document.getElementById('btn-desktop');
  var bt = document.getElementById('btn-telefon');
  function breite(telefon) {
    rahmen.classList.toggle('telefon', telefon);
    bd.setAttribute('aria-pressed', String(!telefon));
    bt.setAttribute('aria-pressed', String(telefon));
  }
  bd.onclick = function () { breite(false); };
  bt.onclick = function () { breite(true); };

  zeige('/');

  // Sollte der Rahmen blockiert werden, darf die Seite nicht einfach leer sein.
  setTimeout(function () {
    var leer = false;
    try {
      leer = !rahmen.contentDocument || !rahmen.contentDocument.querySelector('h1');
    } catch (e) {
      leer = true;
    }
    if (leer) {
      document.getElementById('buehne').innerHTML =
        '<div style="max-width:34rem;margin:auto;padding:2rem;color:#e7e7e4;' +
        'font-family:system-ui,sans-serif;line-height:1.6">' +
        '<p style="color:#e0745c;font-size:11px;letter-spacing:.16em;' +
        'text-transform:uppercase;margin:0 0 .8rem">Vorschau blockiert</p>' +
        '<p style="margin:0 0 1rem">Dieser Betrachter konnte den eingebetteten ' +
        'Rahmen nicht anzeigen. Laden Sie die Datei herunter und öffnen Sie sie ' +
        'lokal im Browser, oder starten Sie die Seite direkt aus dem ' +
        'Repository mit <code>npm run dev</code>.</p></div>';
    }
  }, 2000);
})();
<\/script>`;

const ziel = join(wurzel, 'vorschau.html');
writeFileSync(ziel, rahmen);
const kb = (Buffer.byteLength(rahmen) / 1024 / 1024).toFixed(2);
console.log(`vorschau.html geschrieben — ${kb} MB, ${Object.keys(seiten).length} Seiten, ${Object.keys(bilder).length} Bilder`);
