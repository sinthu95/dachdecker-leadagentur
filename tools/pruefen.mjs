/**
 * Funktionscheck: ruft jede Seite auf, sammelt alle Links und Ziele, prüft sie
 * auf tote Verweise, meldet Konsolenfehler, fehlende Alternativtexte,
 * Überschriftenfehler und horizontales Überlaufen in Desktop- und Mobilbreite.
 *
 *   node tools/pruefen.mjs http://127.0.0.1:4321
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] || 'http://127.0.0.1:4321';
const SEITEN = [
  '/',
  '/leistungen',
  '/dachdecker',
  '/demo',
  '/ueber-uns',
  '/kontakt',
  '/danke',
  '/impressum',
  '/datenschutz',
  // Bewusst eine unbekannte Adresse: prueft Statuscode und Fehlerseite in
  // einem. Ein direkter Aufruf von /404 liefert die Datei als normales Asset
  // mit 200 aus und sagt daher nichts ueber das Fehlerverhalten.
  '/adresse-die-es-nicht-gibt',
];
const BREITEN = [
  { name: 'desktop', w: 1440, h: 900, mobil: false },
  { name: 'mobil', w: 390, h: 844, mobil: true },
];

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const befunde = [];
const alleZiele = new Set();
const melden = (schwere, seite, text) => befunde.push({ schwere, seite, text });

for (const { name, w, h, mobil } of BREITEN) {
  for (const pfad of SEITEN) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobil, hasTouch: mobil });
    // Ohne das liefert der zweite Durchlauf 304 statt 200 — korrektes
    // Caching, aber es macht die Zusicherungen mehrdeutig.
    await page.setCacheEnabled(false);

    const konsole = [];
    page.on('console', (m) => m.type() === 'error' && konsole.push(m.text()));
    page.on('pageerror', (e) => konsole.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) =>
      konsole.push(`request fehlgeschlagen: ${r.url()} (${r.failure()?.errorText})`),
    );

    const antwort = await page.goto(new URL(pfad, basis).href, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    // Die Fehlerseite MUSS mit 404 antworten — das ist kein Befund.
    const erwartet = pfad === '/adresse-die-es-nicht-gibt' ? 404 : 200;
    if (!antwort || antwort.status() !== erwartet) {
      melden('FEHLER', `${pfad} @${name}`, `Statuscode ${antwort?.status()} (erwartet ${erwartet})`);
      await page.close();
      continue;
    }

    const bericht = await page.evaluate(() => {
      const r = {
        links: [],
        ueberschriften: [],
        bilderOhneAlt: 0,
        h1: document.querySelectorAll('h1').length,
        ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        titel: document.title,
        beschreibung:
          document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
        leereLinks: 0,
        kleineZiele: [],
      };
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        r.links.push(href);
        const text = (a.textContent || '').trim();
        if (!text && !a.getAttribute('aria-label')) r.leereLinks++;
      });
      document.querySelectorAll('img').forEach((i) => {
        if (!i.hasAttribute('alt')) r.bilderOhneAlt++;
      });
      document.querySelectorAll('h1,h2,h3,h4').forEach((h) =>
        r.ueberschriften.push(Number(h.tagName[1])),
      );
      // Tippziele auf Mobilgeraeten
      if (window.innerWidth < 700) {
        document.querySelectorAll('a, button').forEach((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          // Links innerhalb eines Fliesstextabsatzes sind nach WCAG 2.5.8
          // ausdrücklich ausgenommen.
          if (el.closest('p')) return;
          if (b.height < 24 && (el.textContent || '').trim().length > 0) {
            r.kleineZiele.push(
              `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 28)}" ${Math.round(b.height)}px`,
            );
          }
        });
      }
      return r;
    });

    bericht.links.forEach((l) => {
      if (l.startsWith('/')) alleZiele.add(l.split('#')[0].split('?')[0] || '/');
    });

    if (bericht.ueberlauf > 1)
      melden('FEHLER', `${pfad} @${name}`, `horizontaler Überlauf: ${bericht.ueberlauf}px`);
    if (bericht.h1 !== 1) melden('FEHLER', `${pfad} @${name}`, `${bericht.h1}× h1`);
    if (bericht.bilderOhneAlt) melden('FEHLER', `${pfad} @${name}`, `${bericht.bilderOhneAlt} Bilder ohne alt`);
    if (bericht.leereLinks) melden('WARNUNG', `${pfad} @${name}`, `${bericht.leereLinks} Links ohne Text`);
    if (!bericht.beschreibung) melden('FEHLER', `${pfad} @${name}`, 'keine Beschreibung');
    if (bericht.titel.length > 65)
      melden('WARNUNG', `${pfad} @${name}`, `Titel ${bericht.titel.length} Zeichen`);
    if (bericht.beschreibung.length > 175)
      melden('WARNUNG', `${pfad} @${name}`, `Beschreibung ${bericht.beschreibung.length} Zeichen`);

    // Überschriftenebenen ohne Sprünge
    let vorher = 0;
    bericht.ueberschriften.forEach((stufe) => {
      if (vorher && stufe > vorher + 1)
        melden('WARNUNG', `${pfad} @${name}`, `Überschriftensprung h${vorher} → h${stufe}`);
      vorher = stufe;
    });

    if (bericht.kleineZiele.length)
      melden(
        'WARNUNG',
        `${pfad} @${name}`,
        `zu kleine Tippziele: ${bericht.kleineZiele.slice(0, 4).join(' · ')}`,
      );

    konsole
      .filter((k) => !(erwartet === 404 && k.includes('status of 404')))
      .forEach((k) => melden('FEHLER', `${pfad} @${name}`, k));
    await page.close();
  }
}

// Alle intern verlinkten Ziele wirklich abrufen
const page = await browser.newPage();
for (const ziel of [...alleZiele].sort()) {
  const antwort = await page.goto(new URL(ziel, basis).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  const status = antwort?.status() ?? 0;
  if (status >= 400) melden('FEHLER', 'Verlinkung', `${ziel} → ${status}`);
}
await page.close();
await browser.close();

console.log(`\nVerlinkte interne Ziele geprüft: ${[...alleZiele].sort().join(', ')}\n`);
const fehler = befunde.filter((b) => b.schwere === 'FEHLER');
const warn = befunde.filter((b) => b.schwere === 'WARNUNG');
for (const b of [...fehler, ...warn]) console.log(`${b.schwere.padEnd(8)} ${b.seite.padEnd(26)} ${b.text}`);
console.log(`\n${fehler.length} Fehler, ${warn.length} Warnungen`);
process.exit(fehler.length ? 1 : 0);
