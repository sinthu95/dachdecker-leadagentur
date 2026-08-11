/**
 * Erzeugt die Bildschirmaufnahmen der Dachdecker-Demo für den Concept Case.
 *
 * Die Demo liegt in einem eigenen Repository und wird dafür nicht verändert:
 * Es wird eine Kopie gebaut und lokal ausgeliefert, aufgenommen wird nur das
 * gerenderte Ergebnis.
 *
 *   node tools/shot-demo.mjs http://127.0.0.1:4399/
 */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const URL_DEMO = process.argv[2] || 'http://127.0.0.1:4399/';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ZIEL = new global.URL('../public/images/demo/', import.meta.url).pathname;
mkdirSync(ZIEL, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});

async function aufnehmen({ breite, hoehe, dsf, datei, zielBreite, maxHoehe = null }) {
  const page = await browser.newPage();
  await page.setViewport({ width: breite, height: hoehe, deviceScaleFactor: dsf });
  await page.goto(URL_DEMO, { waitUntil: 'networkidle0', timeout: 60000 });

  // Enthüllungsanimationen der Demo auslösen und Bewegung danach stilllegen,
  // damit die Aufnahme deterministisch ist.
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
  await new Promise((r) => setTimeout(r, 600));

  // WebP kann höchstens 16383 Pixel je Kante. Sehr lange Seiten werden deshalb
  // oben beschnitten — für den Rahmen wird ohnehin nur ein Ausschnitt gebraucht.
  const roh = maxHoehe
    ? await page.screenshot({
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: breite, height: maxHoehe, scale: dsf },
      })
    : await page.screenshot({ fullPage: true, captureBeyondViewport: true });
  await page.close();

  const bild = sharp(roh);
  const meta = await bild.metadata();
  await bild.resize({ width: zielBreite }).webp({ quality: 80 }).toFile(ZIEL + datei);
  const fertig = await sharp(ZIEL + datei).metadata();
  console.log(`${datei}: ${meta.width}×${meta.height} → ${fertig.width}×${fertig.height}`);
  return fertig;
}

const desktop = await aufnehmen({
  breite: 1440,
  hoehe: 900,
  dsf: 1,
  datei: 'demo-desktop.webp',
  zielBreite: 1200,
});

const mobil = await aufnehmen({
  breite: 390,
  hoehe: 844,
  dsf: 2,
  datei: 'demo-mobil.webp',
  zielBreite: 430,
  maxHoehe: 5200,
});

await browser.close();
console.log(JSON.stringify({ desktop, mobil }, null, 2));
