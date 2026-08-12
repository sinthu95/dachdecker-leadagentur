/**
 * Tastaturbedienung: Sprungmarke, Kopfzeile, mobiles Menü, Formularstrecke.
 * Prüft das, was ein Besucher ohne Maus tatsächlich tun muss.
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] ?? 'http://127.0.0.1:4321';
const befunde = [];
const ok = (t) => console.log('  ok    ' + t);
const fehler = (t) => {
  befunde.push(t);
  console.log('  FEHLT ' + t);
};

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const aktiv = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const k = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 34),
      href: el.getAttribute?.('href') ?? null,
      name: el.getAttribute?.('name') ?? null,
      sichtbar: k.top >= -2 && k.bottom <= window.innerHeight + 2 && k.width > 0,
      oben: Math.round(k.top),
      umriss: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
    };
  });

/* --------------------------------------------------------------- Desktop -- */
console.log('\nSprungmarke und Kopfzeile (1440 px)');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(new URL('/', basis).href, { waitUntil: 'networkidle0' });

  await page.keyboard.press('Tab');
  await new Promise((r) => setTimeout(r, 250));
  const erste = await aktiv(page);
  if (erste?.href === '#inhalt') ok('erster Tabstopp ist „Zum Inhalt springen"');
  else fehler(`erster Tabstopp ist ${JSON.stringify(erste)}`);
  if (erste?.sichtbar) ok(`Sprungmarke wird sichtbar (y=${erste.oben})`);
  else fehler('Sprungmarke bleibt beim Fokus unsichtbar');
  if (erste?.umriss) ok('Sprungmarke hat einen Fokusrahmen');
  else fehler('Sprungmarke ohne Fokusrahmen');

  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 600));
  const nachSprung = await page.evaluate(() => ({
    hash: location.hash,
    inhaltOben: Math.round(document.getElementById('inhalt').getBoundingClientRect().top),
    kopf: Math.round(document.querySelector('[data-header]').getBoundingClientRect().height),
  }));
  if (nachSprung.hash === '#inhalt') ok('Sprung setzt #inhalt');
  else fehler(`Sprung setzt ${nachSprung.hash || '(nichts)'}`);

  // Weiter durch die Kopfzeile: jeder Stopp muss sichtbar und umrandet sein
  const ohne = [];
  const weg = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    // Das Bild muss sich setzen. Die Seite scrollt weich; über mehrere
    // tausend Pixel dauert das länger als eine halbe Sekunde.
    await new Promise((r) => setTimeout(r, 1600));
    const a = await aktiv(page);
    if (!a) continue;
    if (!a.umriss) ohne.push(`${a.tag} „${a.text}"`);
    if (!a.sichtbar) weg.push(`${a.tag} „${a.text}" y=${a.oben}`);
  }
  if (!ohne.length) ok('alle geprüften Tabstopps haben einen Fokusrahmen');
  else fehler(`ohne Fokusrahmen: ${ohne.join(' · ')}`);
  if (!weg.length) ok('kein Tabstopp läuft aus dem Sichtbereich');
  else fehler(`außerhalb des Sichtbereichs: ${weg.join(' · ')}`);

  await page.close();
}

/* ---------------------------------------------------------------- Mobil --- */
console.log('\nMobiles Menü (390 px)');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(new URL('/', basis).href, { waitUntil: 'networkidle0' });

  await page.click('[data-menue-auf]');
  await new Promise((r) => setTimeout(r, 400));
  const offen = await page.evaluate(() => document.querySelector('[data-menue]')?.open === true);
  if (offen) ok('Menü öffnet');
  else fehler('Menü öffnet nicht');

  // Der Browser führt bei einem modalen Dialog einmal je Runde über das
  // Dokument selbst — entscheidend ist, dass kein Bedienelement der Seite
  // dahinter erreichbar wird.
  let dahinter = 0;
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const entkommen = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return false;
      return !el.closest('[data-menue]');
    });
    if (entkommen) dahinter++;
  }
  if (!dahinter) ok('kein Bedienelement hinter dem Menü erreichbar');
  else fehler(`${dahinter} Tabstopps landen hinter dem geöffneten Menü`);

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));
  const zu = await page.evaluate(() => document.querySelector('[data-menue]')?.open === false);
  if (zu) ok('Escape schließt');
  else fehler('Escape schließt nicht');

  const zurueck = await page.evaluate(
    () => document.activeElement?.hasAttribute('data-menue-auf') === true,
  );
  if (zurueck) ok('Fokus kehrt auf den Menüknopf zurück');
  else fehler('Fokus kehrt nach dem Schließen nicht zurück');

  await page.close();
}

/* --------------------------------------------------- Formular per Tastatur */
console.log('\nFormular nur mit der Tastatur (390 px)');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(new URL('/kontakt', basis).href, { waitUntil: 'networkidle0' });

  // Schritt 1 ausfüllen
  await page.focus('#betrieb');
  await page.keyboard.type('Dachdeckerei Beispiel');
  await page.focus('#ort');
  await page.keyboard.type('45549');

  // Weiter per Tastatur auslösen
  await page.focus('[data-weiter]');
  const w = await aktiv(page);
  if (w?.umriss) ok('„Weiter" bekommt einen Fokusrahmen');
  else fehler('„Weiter" ohne Fokusrahmen');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 400));
  const schritt = await page.evaluate(() => {
    const s = [...document.querySelectorAll('[data-schritt]')];
    return s.findIndex((f) => !f.hidden);
  });
  if (schritt === 1) ok('Enter auf „Weiter" führt zu Schritt 2');
  else fehler(`Enter auf „Weiter" führt zu Abschnitt ${schritt}`);

  // Auswahlfelder mit der Leertaste bedienen
  await page.focus('input[name="leistungen"]');
  await page.keyboard.press('Space');
  const gesetzt = await page.evaluate(
    () => document.querySelector('input[name="leistungen"]').checked,
  );
  if (gesetzt) ok('Auswahlfeld reagiert auf die Leertaste');
  else fehler('Auswahlfeld reagiert nicht auf die Leertaste');

  // Sichtbarer Fokus auf dem Auswahlfeld
  const wahlRing = await page.evaluate(() => {
    const el = document.querySelector('input[name="leistungen"]');
    const s = getComputedStyle(el.closest('.wahl'));
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  });
  if (wahlRing) ok('Auswahlfeld zeigt den Fokus auf der Beschriftung');
  else fehler('Auswahlfeld zeigt keinen sichtbaren Fokus');

  await page.close();
}

await browser.close();
console.log(`\n${befunde.length} Befunde`);
process.exit(befunde.length ? 1 : 0);
