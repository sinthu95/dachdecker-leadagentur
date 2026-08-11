/**
 * Nimmt einzelne Abschnitte der Demo als Stationen für die Seite /demo auf.
 * Statt aus einer langen Aufnahme nach Augenmaß zu schneiden, werden die
 * tatsächlichen Abschnittselemente vermessen und exakt ausgeschnitten.
 *
 *   node tools/shot-stationen.mjs http://127.0.0.1:4399/ [--liste]
 */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const URL_DEMO = process.argv[2] || 'http://127.0.0.1:4399/';
const NUR_LISTE = process.argv.includes('--liste');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ZIEL = new global.URL('../public/images/demo/', import.meta.url).pathname;
mkdirSync(ZIEL, { recursive: true });

/** Welche Abschnitte welche Station belegen — nach dem Lauf mit --liste gesetzt. */
const STATIONEN = [
  { index: 0, datei: 'station-01-hero.webp', maxH: 830 },
  { index: 4, datei: 'station-02-leistungen.webp', maxH: 900 },
  { index: 5, datei: 'station-03-material.webp', maxH: 640 },
  { index: 6, datei: 'station-04-projekte.webp', maxH: 900 },
  { index: 8, datei: 'station-05-vertrauen.webp', maxH: 820 },
  { index: 9, datei: 'station-06-anfrage.webp', maxH: 750 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(URL_DEMO, { waitUntil: 'networkidle0', timeout: 60000 });

await page.evaluate(async () => {
  await new Promise((fertig) => {
    let y = 0;
    const schritt = () => {
      y += window.innerHeight * 0.8;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(schritt, 90);
      else {
        window.scrollTo(0, 0);
        setTimeout(fertig, 700);
      }
    };
    schritt();
  });
  // Endzustand der Enthüllungsanimationen erzwingen: sonst sind Abschnitte
  // weiter unten auf der Aufnahme noch ausgeblendet.
  document.querySelectorAll('.rise, .lines, .falz, .draw').forEach((el) =>
    el.classList.add('is-visible'),
  );

  const stil = document.createElement('style');
  stil.textContent = '*{animation:none!important;transition:none!important}';
  document.head.appendChild(stil);
});
await new Promise((r) => setTimeout(r, 500));

const abschnitte = await page.evaluate(() =>
  Array.from(document.querySelectorAll('main > *, body > section')).map((el, i) => {
    const r = el.getBoundingClientRect();
    return {
      i,
      tag: el.tagName.toLowerCase(),
      top: Math.round(r.top + window.scrollY),
      hoehe: Math.round(r.height),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70),
    };
  }),
);

console.table(abschnitte);

if (!NUR_LISTE) {
  for (const st of STATIONEN) {
    const a = abschnitte[st.index];
    if (!a) {
      console.warn(`Abschnitt ${st.index} fehlt — übersprungen`);
      continue;
    }
    const hoehe = Math.min(a.hoehe, st.maxH);
    const roh = await page.screenshot({
      captureBeyondViewport: true,
      clip: { x: 0, y: a.top, width: 1440, height: hoehe },
    });
    await sharp(roh).resize({ width: 1100 }).webp({ quality: 80 }).toFile(ZIEL + st.datei);
    const m = await sharp(ZIEL + st.datei).metadata();
    console.log(`${st.datei}: ${m.width}×${m.height}  (${a.text.slice(0, 44)}…)`);
  }
}

await browser.close();
