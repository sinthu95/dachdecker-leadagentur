/**
 * Misst die tatsächlich übertragenen Datenmengen sowie LCP und CLS gegen den
 * Produktionsbuild. Wir veröffentlichen keine Zahl, die wir nicht gemessen
 * haben — dieses Skript ist die Grundlage dafür.
 *
 *   node tools/messen.mjs http://127.0.0.1:8788
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] || 'http://127.0.0.1:8788';
const SEITEN = ['/', '/leistungen', '/dachdecker', '/demo', '/kontakt'];

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});

const kb = (b) => (b / 1024).toFixed(1).padStart(7);
console.log(
  'Seite            HTML     CSS      JS     Bilder  Fonts   Summe    LCP     CLS',
);
console.log('─'.repeat(84));

for (const pfad of SEITEN) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.setCacheEnabled(false);

  // Gedrosselt wie ein durchschnittliches Mobilfunknetz
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const groessen = { html: 0, css: 0, js: 0, bild: 0, font: 0, rest: 0 };
  page.on('response', async (r) => {
    try {
      const typ = r.request().resourceType();
      const laenge = Number(r.headers()['content-length'] || 0);
      const groesse = laenge || (await r.buffer().catch(() => ({ length: 0 }))).length || 0;
      if (typ === 'document') groessen.html += groesse;
      else if (typ === 'stylesheet') groessen.css += groesse;
      else if (typ === 'script') groessen.js += groesse;
      else if (typ === 'image') groessen.bild += groesse;
      else if (typ === 'font') groessen.font += groesse;
      else groessen.rest += groesse;
    } catch {
      /* Antwort nicht mehr lesbar */
    }
  });

  await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0', timeout: 90000 });

  const werte = await page.evaluate(
    () =>
      new Promise((fertig) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => fertig({ lcp, cls }), 1200);
      }),
  );

  const summe = Object.values(groessen).reduce((a, b) => a + b, 0);
  console.log(
    `${pfad.padEnd(14)} ${kb(groessen.html)} ${kb(groessen.css)} ${kb(groessen.js)} ${kb(groessen.bild)} ${kb(groessen.font)} ${kb(summe)}  ${(werte.lcp / 1000).toFixed(2)}s   ${werte.cls.toFixed(4)}`,
  );
  await page.close();
}

await browser.close();
console.log('\nAngaben in KB, unkomprimiert gemessen. Mobil, 4× CPU-Drosselung, ~1,6 Mbit/s.');
