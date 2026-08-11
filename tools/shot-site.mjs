/**
 * Aufnahmen der eigenen Seite für die Sichtprüfung.
 * Lange Seiten werden in lesbare Streifen zerlegt und nebeneinander montiert.
 *
 *   node tools/shot-site.mjs <basis-url> <pfad> <breite> <ziel.png> [streifen]
 */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const [, , basis, pfad = '/', breiteArg = '1440', ziel = 'shot.png', streifenArg = '5'] =
  process.argv;
const breite = Number.parseInt(breiteArg, 10);
const streifen = Number.parseInt(streifenArg, 10);
const mobil = breite < 700;

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({
  width: breite,
  height: mobil ? 844 : 900,
  deviceScaleFactor: 1,
  isMobile: mobil,
  hasTouch: mobil,
});
await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0', timeout: 60000 });

// Alle Enthüllungen auslösen, damit die Aufnahme den Endzustand zeigt
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
// Der gepinnte Rundgang ist 5,6 Bildschirmhöhen hoch und würde die Ganzseiten-
// aufnahme mit leerer Fläche fluten. Für die Aufnahme wird er auf seine
// natürliche Höhe gesetzt — am ausgelieferten Stand ändert das nichts.
await page.addStyleTag({
  content: '[data-case]{height:auto!important}[data-case] .sticky{position:static!important;height:auto!important}',
});
await page.evaluate(async () => {
  await new Promise((fertig) => {
    let y = 0;
    const schritt = () => {
      y += window.innerHeight * 0.7;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(schritt, 130);
      else setTimeout(fertig, 500);
    };
    schritt();
  });
  document
    .querySelectorAll('.steig, .zeilen, .zieh, .zieh-y, .zeichne, .bildmaske')
    .forEach((el) => el.classList.add('sichtbar'));
  // Auf faul geladene Bilder warten, sonst zeigt die Aufnahme leere Rahmen.
  await Promise.all(
    Array.from(document.images)
      .filter((b) => b.currentSrc && !b.complete)
      .map((b) => new Promise((f) => b.addEventListener('load', f, { once: true }))),
  );
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 700));

const roh = await page.screenshot({ fullPage: true, captureBeyondViewport: true });
const meta = await sharp(roh).metadata();
console.log(`${pfad} @${breite}: ${meta.width}×${meta.height}`);
await browser.close();

// In Streifen zerlegen und nebeneinander montieren
const spaltenH = Math.ceil(meta.height / streifen);
const skala = mobil ? 1 : 0.42;
const sB = Math.round(meta.width * skala);
const sH = Math.round(spaltenH * skala);
const teile = [];
for (let i = 0; i < streifen; i++) {
  const top = i * spaltenH;
  const h = Math.min(spaltenH, meta.height - top);
  if (h <= 0) break;
  const stueck = await sharp(roh)
    .extract({ left: 0, top, width: meta.width, height: h })
    .resize({ width: sB })
    .png()
    .toBuffer();
  const { height: hoehe } = await sharp(stueck).metadata();
  teile.push({ input: stueck, left: i * (sB + 6), top: 0, hoehe });
}
// Die Rundung beim Skalieren kann einzelne Streifen um ein Pixel wachsen lassen.
const leinwandH = Math.max(sH, ...teile.map((t) => t.hoehe));
await sharp({
  create: { width: teile.length * (sB + 6), height: leinwandH, channels: 3, background: '#444' },
})
  .composite(teile)
  .png()
  .toFile(ziel);
console.log('→', ziel);
