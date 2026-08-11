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
    .querySelectorAll('.steig, .zeilen, .zieh, .zeichne')
    .forEach((el) => el.classList.add('sichtbar'));
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
  teile.push({ input: stueck, left: i * (sB + 6), top: 0 });
}
await sharp({
  create: { width: teile.length * (sB + 6), height: sH, channels: 3, background: '#444' },
})
  .composite(teile)
  .png()
  .toFile(ziel);
console.log('→', ziel);
