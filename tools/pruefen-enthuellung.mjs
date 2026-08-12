/**
 * Enthüllungen: Wird am Ende wirklich alles sichtbar?
 *
 * Diese Prüfung gibt es, weil genau hier ein Fehler unbemerkt blieb: Die
 * Bildmaske versteckte sich per `clip-path` auf null Höhe — und ein so
 * beschnittenes Element hat für den IntersectionObserver die Fläche null.
 * Es meldete nie ein Erscheinen und blieb dauerhaft unsichtbar. Sämtliche
 * Aufnahmewerkzeuge setzen `.sichtbar` von Hand und sahen den Fehler deshalb
 * nicht. Hier wird ausschließlich beobachtet, nie nachgeholfen.
 *
 *   node tools/pruefen-enthuellung.mjs http://127.0.0.1:4321
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] ?? 'http://127.0.0.1:4321';
const SEITEN = ['/', '/leistungen', '/dachdecker', '/demo', '/ueber-uns', '/kontakt', '/danke'];
const KLASSEN = ['steig', 'zeilen', 'zieh', 'zieh-y', 'zeichne', 'bildmaske'];

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const befunde = [];

for (const [name, w, h, mobil] of [
  ['1440', 1440, 900, false],
  ['390', 390, 844, true],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobil, hasTouch: mobil });
  console.log(`\n${name} px`);

  for (const pfad of SEITEN) {
    await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0' });
    // Weiches Scrollen abschalten: Sonst überholt die Schleife die Animation
    // und die Seite hält nie lange genug an einer Stelle.
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.evaluate(async () => {
      await new Promise((f) => {
        let y = 0;
        const s = () => {
          y += window.innerHeight * 0.6;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(s, 120);
          else setTimeout(f, 1400);
        };
        s();
      });
    });

    const stand = await page.evaluate((klassen) => {
      const ergebnis = {};
      for (const k of klassen) {
        const alle = [...document.querySelectorAll('.' + k)].filter(
          (e) => e.getClientRects().length > 0,
        );
        const offen = alle.filter((e) => !e.classList.contains('sichtbar'));
        ergebnis[k] = {
          dargestellt: alle.length,
          offen: offen.length,
          beispiel: offen[0]
            ? (offen[0].textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) ||
              offen[0].className.slice(0, 40)
            : null,
        };
      }
      return ergebnis;
    }, KLASSEN);

    const teile = [];
    for (const k of KLASSEN) {
      const s = stand[k];
      if (!s.dargestellt) continue;
      teile.push(`${k} ${s.dargestellt - s.offen}/${s.dargestellt}`);
      if (s.offen) {
        befunde.push(
          `${pfad} @${name}: ${s.offen} von ${s.dargestellt} .${k} bleiben unsichtbar — z. B. „${s.beispiel}"`,
        );
      }
    }
    console.log(`  ${pfad.padEnd(14)} ${teile.join(' · ')}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n${befunde.length} Befunde`);
befunde.forEach((f) => console.log('  ' + f));
process.exit(befunde.length ? 1 : 0);
