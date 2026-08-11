/**
 * Vollseiten-Aufnahmen aller Seiten zur Ansicht.
 *
 *   node tools/shot-alle.mjs <basis-url> <zielordner> [breite]
 */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const [, , basis, ordner, breiteArg = '1440'] = process.argv;
const breite = Number.parseInt(breiteArg, 10);
const mobil = breite < 700;
mkdirSync(ordner, { recursive: true });

const SEITEN = [
  ['leistungen', '/leistungen'],
  ['dachdecker', '/dachdecker'],
  ['demo', '/demo'],
  ['ueber-uns', '/ueber-uns'],
  ['kontakt', '/kontakt'],
  ['danke', '/danke'],
  ['impressum', '/impressum'],
  ['datenschutz', '/datenschutz'],
  ['404', '/adresse-die-es-nicht-gibt'],
];

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});

for (const [name, pfad] of SEITEN) {
  const page = await browser.newPage();
  await page.setViewport({
    width: breite,
    height: mobil ? 844 : 900,
    deviceScaleFactor: 1,
    isMobile: mobil,
    hasTouch: mobil,
  });
  await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  await page.evaluate(async () => {
    await new Promise((fertig) => {
      let y = 0;
      const schritt = () => {
        y += window.innerHeight * 0.7;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(schritt, 70);
        else setTimeout(fertig, 500);
      };
      schritt();
    });
    document
      .querySelectorAll('.steig, .zeilen, .zieh, .zieh-y, .zeichne, .bildmaske')
      .forEach((el) => el.classList.add('sichtbar'));
    window.scrollTo(0, 0);

    // Der gepinnte Rundgang ist im Standbild eine leere Fläche über mehrere
    // Bildschirmhöhen. Für die Aufnahme wird er auf eine Höhe gestaucht.
    const buehne = document.querySelector('[data-case]');
    if (buehne) {
      buehne.style.height = '100vh';
      const innen = buehne.firstElementChild;
      if (innen) innen.style.position = 'static';
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  const roh = await page.screenshot({ fullPage: true, captureBeyondViewport: true });
  const meta = await sharp(roh).metadata();
  const ziel = `${ordner}/${name}.png`;
  await sharp(roh)
    .resize({ width: mobil ? breite : 1000 })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(ziel);
  const fertig = await sharp(ziel).metadata();
  console.log(
    `${name.padEnd(12)} ${String(meta.height).padStart(6)}px → ${ziel} (${fertig.width}×${fertig.height})`,
  );
  await page.close();
}

await browser.close();
