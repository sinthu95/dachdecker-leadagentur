/**
 * Erzeugt public/og.png (1200×630) für Vorschaubilder in sozialen Netzwerken
 * und Messengern. Wird im Browser gerendert, damit die eigenen Schriften und
 * der 38°-Winkel exakt so aussehen wie auf der Website.
 *
 *   node tools/og-bild.mjs
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';

const wurzel = new URL('..', import.meta.url).pathname;
const b64 = (p) => readFileSync(wurzel + p).toString('base64');

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:'IS';src:url(data:font/woff2;base64,${b64('public/fonts/instrumentsans.woff2')}) format('woff2');font-weight:400 700}
@font-face{font-family:'PM';src:url(data:font/woff2;base64,${b64('public/fonts/plexmono500.woff2')}) format('woff2');font-weight:500}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0B0E12;color:#E7E7E4;font-family:'IS',sans-serif;
     position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px}
svg.linie{position:absolute;inset:0;width:100%;height:100%}
.raster{position:absolute;inset:0;opacity:.06;
  background-image:repeating-linear-gradient(to right,#E7E7E4 0 1px,transparent 1px calc(100%/6))}
.kopf{position:relative;display:flex;align-items:baseline;gap:14px;
  font-family:'PM',monospace;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#8C949E}
.kopf b{color:#E7E7E4;font-weight:500}
.marke{position:relative;display:inline-block;font-weight:600;letter-spacing:-.03em;color:#E7E7E4}
h1{position:relative;font-size:74px;line-height:1.02;letter-spacing:-.04em;font-weight:600;max-width:15.5ch}
h1 em{font-style:normal;color:#7C9BEA}
.fuss{position:relative;display:flex;align-items:center;justify-content:space-between;
  font-family:'PM',monospace;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:#8C949E}
.bem{display:flex;align-items:center;gap:12px}
.bem i{display:block;width:90px;height:1px;background:#4A72D8;position:relative}
.bem i::before,.bem i::after{content:'';position:absolute;top:-4px;width:1px;height:9px;background:#4A72D8}
.bem i::before{left:0}.bem i::after{right:0}
</style>
<div class="raster"></div>
<svg class="linie" viewBox="0 0 1200 630" preserveAspectRatio="none">
  <path d="M-40 560 600 100 1240 560" fill="none" stroke="#4A72D8" stroke-width="1.4"/>
  <path d="M-40 620 600 160 1240 620" fill="none" stroke="#3C4653" stroke-width="1.2"/>
  <circle cx="600" cy="100" r="4" fill="#4A72D8"/>
</svg>
<p class="kopf"><span class="marke">S&amp;S Leadcraft</span> — Digitale Kundengewinnung für Dachdeckerbetriebe</p>
<h1>Der beste Dachdecker der Region ist selten der, den man <em>zuerst findet</em>.</h1>
<div class="fuss">
  <span>Ein Betrieb je Einzugsgebiet · Deutschlandweit</span>
  <span class="bem">Neigung <i></i> 38°</span>
</div>`;

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');
const bild = await page.screenshot({ type: 'png' });
writeFileSync(wurzel + 'public/og.png', bild);
await browser.close();
console.log(`public/og.png geschrieben (${(bild.length / 1024).toFixed(0)} KB)`);
