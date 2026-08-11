/**
 * Aufnahme eines einzelnen Bereichs in echter Viewportgröße — für die
 * Beurteilung von Komposition und Weißraum, die im Streifenbild verlorengeht.
 *
 *   node tools/shot-teil.mjs <basis> <pfad> <breite> <selektor|scrollY> <ziel.png>
 */
import puppeteer from 'puppeteer-core';

const [, , basis, pfad, breiteArg, ziel_, datei] = process.argv;
const breite = Number.parseInt(breiteArg, 10);
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

await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await page.evaluate(async () => {
  await new Promise((f) => {
    let y = 0;
    const s = () => {
      y += window.innerHeight * 0.7;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(s, 60);
      else setTimeout(f, 400);
    };
    s();
  });
  document
    .querySelectorAll('.steig, .zeilen, .zieh, .zieh-y, .zeichne, .bildmaske')
    .forEach((el) => el.classList.add('sichtbar'));
});

const ziel = ziel_ ?? '0';
if (/^\d+$/.test(ziel)) {
  await page.evaluate((y) => window.scrollTo(0, Number(y)), ziel);
} else {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
  }, ziel);
}
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: datei });
console.log('→', datei);
await browser.close();
