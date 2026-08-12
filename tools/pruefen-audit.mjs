/**
 * Produktionsprüfung: Semantik, Zugänglichkeit, Überlauf, Tippziele, Bilder.
 *
 * Läuft jede Seite in zwei Breiten durch und meldet, was in der ausgelieferten
 * Fassung tatsächlich falsch wäre — nicht, was ein Werkzeug für unschön hält.
 * Jede Regel steht hier, weil ihr Bruch einen konkreten Schaden hätte:
 * ein Besucher kommt nicht weiter, ein Screenreader liest Unsinn vor, oder
 * die Seite schiebt sich auf dem Telefon seitlich weg.
 *
 *   node tools/pruefen-audit.mjs http://127.0.0.1:4321
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] ?? 'http://127.0.0.1:4321';
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
  '/gibt-es-nicht',
];
const BREITEN = [
  { name: '320', w: 320, h: 800, mobil: true },
  { name: '390', w: 390, h: 844, mobil: true },
  { name: '768', w: 768, h: 1024, mobil: true },
  { name: '1024', w: 1024, h: 800, mobil: false },
  { name: '1440', w: 1440, h: 900, mobil: false },
  { name: '1920', w: 1920, h: 1080, mobil: false },
];

const befunde = [];
const melde = (art, seite, breite, text) =>
  befunde.push({ art, seite, breite, text });

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});

/* ---------------------------------------------------------------------------
   Im Browser laufende Prüfung. Alles, was die tatsächliche Darstellung
   braucht, muss hier drin stehen.
   --------------------------------------------------------------------------- */
async function pruefeSeite(page, mobil) {
  return page.evaluate((istMobil) => {
    const fehler = [];
    const warnung = [];
    const kurz = (el) => {
      const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
      return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>${t ? ' „' + t + '"' : ''}`;
    };

    /* --- Sprache und Titel ------------------------------------------------ */
    if (document.documentElement.lang !== 'de') fehler.push('lang ist nicht „de"');
    if (!document.title.trim()) fehler.push('Titel fehlt');

    /* --- Doppelte IDs ----------------------------------------------------- */
    const gesehen = new Map();
    document.querySelectorAll('[id]').forEach((el) => {
      const n = (gesehen.get(el.id) ?? 0) + 1;
      gesehen.set(el.id, n);
      if (n === 2) fehler.push(`ID doppelt vergeben: #${el.id}`);
    });

    /* --- Überschriftenhierarchie ------------------------------------------ */
    const sichtbar = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      return el.getClientRects().length > 0 || el.classList.contains('sr-only');
    };
    const ueberschriften = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(sichtbar);
    const h1 = ueberschriften.filter((h) => h.tagName === 'H1');
    if (h1.length === 0) fehler.push('keine h1');
    if (h1.length > 1) fehler.push(`${h1.length} h1 auf einer Seite`);
    let vorher = 0;
    for (const h of ueberschriften) {
      const stufe = Number(h.tagName[1]);
      if (vorher && stufe > vorher + 1) {
        fehler.push(`Überschriftensprung h${vorher} → h${stufe}: ${kurz(h)}`);
      }
      if (!(h.textContent ?? '').trim()) fehler.push(`leere Überschrift ${kurz(h)}`);
      vorher = stufe;
    }

    /* --- Verweise --------------------------------------------------------- */
    document.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      const name = (a.textContent ?? '').replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label');
      if (!href) return fehler.push(`Verweis ohne href: ${kurz(a)}`);
      if (href === '#' || href.trim() === '') fehler.push(`Verweis ins Leere: ${kurz(a)}`);
      if (!name) fehler.push(`Verweis ohne lesbaren Namen: href="${href}"`);
      if (href.startsWith('#') && href.length > 1) {
        if (!document.querySelector(href)) fehler.push(`Sprungziel fehlt: ${href}`);
      }
      if (a.target === '_blank') {
        const rel = (a.getAttribute('rel') ?? '').toLowerCase();
        if (!rel.includes('noopener')) fehler.push(`target=_blank ohne rel=noopener: ${href}`);
      }
      if (href.startsWith('tel:')) {
        // Nur Ziffern und ein führendes Plus — sonst wählt das Telefon daneben.
        if (!/^tel:\+?[0-9]+$/.test(href)) fehler.push(`Telefonverweis unsauber: ${href}`);
      }
    });

    /* --- Bilder ----------------------------------------------------------- */
    document.querySelectorAll('img').forEach((b) => {
      if (b.getAttribute('alt') === null) fehler.push(`img ohne alt: ${b.currentSrc || b.src}`);
      if (!b.getAttribute('width') || !b.getAttribute('height')) {
        fehler.push(`img ohne width/height: ${b.getAttribute('src')}`);
      }
      // Unterhalb der Falte gehört jedes Bild auf faules Laden.
      const oben = b.getBoundingClientRect().top + window.scrollY;
      if (oben > window.innerHeight && b.getAttribute('loading') !== 'lazy') {
        fehler.push(`img unterhalb der Falte ohne loading="lazy": ${b.getAttribute('src')}`);
      }
    });

    /* --- Formularfelder --------------------------------------------------- */
    document.querySelectorAll('input, select, textarea').forEach((f) => {
      if (f.type === 'hidden') return;
      const id = f.getAttribute('id');
      const beschriftet =
        (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        f.closest('label') ||
        f.getAttribute('aria-label') ||
        f.getAttribute('aria-labelledby');
      if (!beschriftet) fehler.push(`Feld ohne Beschriftung: ${f.name || kurz(f)}`);
    });

    /* --- ARIA-Verweise ins Leere ------------------------------------------ */
    ['aria-labelledby', 'aria-describedby', 'aria-controls'].forEach((attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        (el.getAttribute(attr) ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .forEach((ziel) => {
            if (!document.getElementById(ziel)) {
              fehler.push(`${attr} zeigt auf fehlende ID „${ziel}": ${kurz(el)}`);
            }
          });
      });
    });

    /* --- Waagerechter Überlauf -------------------------------------------- */
    const dokBreite = document.documentElement.scrollWidth;
    if (dokBreite > window.innerWidth + 1) {
      fehler.push(`waagerechter Überlauf: ${dokBreite}px bei ${window.innerWidth}px Fenster`);
      // Die Verursacher benennen, sonst ist der Befund nicht behebbar.
      const taeter = [];
      document.querySelectorAll('body *').forEach((el) => {
        const k = el.getBoundingClientRect();
        if (k.width === 0 || k.height === 0) return;
        if (k.right > window.innerWidth + 1 || k.left < -1) {
          const s = getComputedStyle(el);
          if (s.position === 'fixed') return;
          taeter.push(`${kurz(el)} → ${Math.round(k.left)}…${Math.round(k.right)}`);
        }
      });
      taeter.slice(0, 6).forEach((t) => fehler.push(`  Überlauf verursacht durch ${t}`));
    }

    /* --- Kein Weg in die Sackgasse ---------------------------------------- */
    // Von jeder Seite muss beides erreichbar sein: die Anfrage und das Telefon.
    {
      const gezeichnet = (el) => el.getClientRects().length > 0;
      const verweise = [...document.querySelectorAll('a[href]')].filter(gezeichnet);
      const zurAnfrage = verweise.filter((a) => {
        const h = a.getAttribute('href');
        return h === '/kontakt' || h === '#potenzialanalyse';
      });
      const zumTelefon = verweise.filter((a) => a.getAttribute('href').startsWith('tel:'));
      if (!zurAnfrage.length && !document.querySelector('[data-anfrage]')) {
        fehler.push('kein sichtbarer Weg zur Potenzialanalyse');
      }
      if (!zumTelefon.length) fehler.push('kein Telefonverweis auf der Seite');
    }

    /* --- Tippziele auf dem Telefon ---------------------------------------- */
    if (istMobil) {
      const imFliesstext = (el) =>
        !!el.closest('p, li, dd, .fliess') && el.tagName === 'A' && !el.classList.contains('knopf');
      document.querySelectorAll('a, button, [role="button"], summary').forEach((el) => {
        if (!el.getClientRects().length) return;
        if (imFliesstext(el)) return;
        const k = el.getBoundingClientRect();
        if (k.height < 24 || k.width < 24) {
          warnung.push(`Tippziel ${Math.round(k.width)}×${Math.round(k.height)} px: ${kurz(el)}`);
        }
      });
    }

    /* --- Fokuszustände ---------------------------------------------------- */
    const fokussierbar = [...document.querySelectorAll('a[href], button, input, select, textarea, summary')]
      .filter((el) => el.getClientRects().length > 0)
      .slice(0, 40);
    for (const el of fokussierbar) {
      el.focus();
      const s = getComputedStyle(el);
      const hatRing =
        (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
        s.boxShadow !== 'none' ||
        el.matches(':focus-visible');
      if (!hatRing) warnung.push(`kein sichtbarer Fokus: ${kurz(el)}`);
      el.blur();
    }

    return { fehler, warnung };
  }, mobil);
}

/* ---------------------------------------------------------------------------
   Durchlauf
   --------------------------------------------------------------------------- */
for (const { name, w, h, mobil } of BREITEN) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobil, hasTouch: mobil });

  for (const pfad of SEITEN) {
    const antwort = await page.goto(new URL(pfad, basis).href, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });
    const status = antwort?.status() ?? 0;
    const erwartet = pfad === '/gibt-es-nicht' ? 404 : 200;
    if (status !== erwartet) melde('FEHLER', pfad, name, `Status ${status}, erwartet ${erwartet}`);

    // Enthüllungen auslösen, damit auch das gemessen wird, was erst beim
    // Scrollen erscheint. Lädt die Seite dabei neu — im Entwicklungsserver
    // etwa nach einer Dateiänderung —, wird der Durchlauf einmal wiederholt,
    // statt den ganzen Prüflauf abzubrechen.
    const durchscrollen = () =>
      page.evaluate(async () => {
        await new Promise((f) => {
          let y = 0;
          const s = () => {
            y += window.innerHeight * 0.9;
            window.scrollTo(0, y);
            if (y < document.body.scrollHeight) setTimeout(s, 30);
            else setTimeout(f, 250);
          };
          s();
        });
        window.scrollTo(0, 0);
      });
    try {
      await durchscrollen();
    } catch {
      await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0' });
      await durchscrollen();
    }

    const { fehler, warnung } = await pruefeSeite(page, mobil);
    fehler.forEach((t) => melde('FEHLER', pfad, name, t));
    warnung.forEach((t) => melde('WARNUNG', pfad, name, t));
  }
  await page.close();
}

await browser.close();

/* ---------------------------------------------------------------------------
   Ausgabe
   --------------------------------------------------------------------------- */
const fehler = befunde.filter((b) => b.art === 'FEHLER');
const warnungen = befunde.filter((b) => b.art === 'WARNUNG');

for (const b of befunde) {
  console.log(`${b.art.padEnd(8)} ${b.seite.padEnd(16)} @${b.breite.padEnd(8)} ${b.text}`);
}
console.log(`\n${fehler.length} Fehler, ${warnungen.length} Warnungen`);
process.exit(fehler.length ? 1 : 0);
