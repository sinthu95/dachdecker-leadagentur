/**
 * Interaktionsprüfung: mobiles Menü, dreistufige Formularstrecke inklusive
 * Absenden, Herkunftserfassung über UTM-Parameter, Concept-Case-Rundgang und
 * das Verhalten bei prefers-reduced-motion.
 *
 *   node tools/pruefen-interaktion.mjs http://127.0.0.1:4321
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] || 'http://127.0.0.1:4321';
const befunde = [];
const ok = (t) => console.log(`  ok    ${t}`);
const fehler = (t) => {
  befunde.push(t);
  console.log(`  FEHLT ${t}`);
};

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

/* ---------------------------------------------------------- mobiles Menü */
console.log('\nMobiles Menü');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(basis, { waitUntil: 'networkidle0' });

  await page.click('[data-menue-auf]');
  await new Promise((r) => setTimeout(r, 300));
  const offen = await page.evaluate(
    () => document.querySelector('[data-menue]')?.hasAttribute('open') ?? false,
  );
  offen ? ok('Menü öffnet') : fehler('Menü öffnet nicht');

  const erweitert = await page.$eval('[data-menue-auf]', (e) => e.getAttribute('aria-expanded'));
  erweitert === 'true' ? ok('aria-expanded=true') : fehler(`aria-expanded=${erweitert}`);

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 300));
  const zu = await page.evaluate(
    () => !document.querySelector('[data-menue]')?.hasAttribute('open'),
  );
  zu ? ok('Escape schließt') : fehler('Escape schließt nicht');

  await page.close();
}

/* ------------------------------------------------------ Formularstrecke */
console.log('\nFormularstrecke (dreistufig)');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  // Mit Kampagnenparametern aufrufen, um die Herkunftserfassung zu prüfen
  await page.goto(`${basis}/kontakt?utm_source=google&utm_campaign=dach_test&gclid=abc123`, {
    waitUntil: 'networkidle0',
  });

  const sichtbar = await page.$$eval('[data-schritt]', (f) => f.filter((x) => !x.hidden).length);
  sichtbar === 1 ? ok('nur ein Schritt sichtbar') : fehler(`${sichtbar} Schritte sichtbar`);

  // Weiter ohne Pflichtfelder darf nicht springen
  await page.click('[data-weiter]');
  await new Promise((r) => setTimeout(r, 200));
  const nochSchritt1 = await page.$eval('[data-schritt]', (f) => !f.hidden);
  nochSchritt1
    ? ok('Weiter blockiert bei leeren Pflichtfeldern')
    : fehler('Weiter springt trotz Fehler');

  await page.type('#betrieb', 'Dachdeckerei Beispiel GmbH');
  await page.type('#ort', '45549 Sprockhövel');
  await page.select('#mitarbeiter', '10–19');
  await page.click('[data-weiter]');
  await new Promise((r) => setTimeout(r, 300));
  let index = await page.$$eval('[data-schritt]', (f) => f.findIndex((x) => !x.hidden));
  index === 1 ? ok('Schritt 1 → 2') : fehler(`nach Schritt 1 bei Index ${index}`);

  // Pflicht-Mehrfachauswahl blockiert
  await page.click('[data-weiter]');
  await new Promise((r) => setTimeout(r, 200));
  index = await page.$$eval('[data-schritt]', (f) => f.findIndex((x) => !x.hidden));
  const meldung = await page.evaluate(() =>
    [...document.querySelectorAll('[data-schritt]:not([hidden]) [data-gruppenfehler]')]
      .map((e) => e.textContent.trim())
      .find(Boolean) || '',
  );
  index === 1 && meldung
    ? ok(`Pflichtgruppe blockiert: „${meldung}"`)
    : fehler('Pflichtgruppe blockiert nicht');

  await page.evaluate(() => {
    document.querySelector('input[name="leistungen"]').click();
    document.querySelector('input[name="kapazitaet"]').click();
  });
  await page.click('[data-weiter]');
  await new Promise((r) => setTimeout(r, 300));
  index = await page.$$eval('[data-schritt]', (f) => f.findIndex((x) => !x.hidden));
  index === 2 ? ok('Schritt 2 → 3') : fehler(`nach Schritt 2 bei Index ${index}`);

  const zaehler = await page.$eval('[data-schritt-zaehler]', (e) => e.textContent.trim());
  zaehler === 'Schritt 03 / 03' ? ok(`Zähler: ${zaehler}`) : fehler(`Zähler: ${zaehler}`);

  // Herkunftsfelder müssen jetzt im Formular stecken
  const herkunft = await page.$$eval('[data-herkunft-felder] input', (f) =>
    f.map((i) => `${i.name}=${i.value}`),
  );
  const hatQuelle = herkunft.some((h) => h.includes('utm_source=google'));
  const hatGclid = herkunft.some((h) => h.includes('gclid=abc123'));
  const hatLanding = herkunft.some((h) => h.includes('landingpage=/kontakt'));
  hatQuelle && hatGclid && hatLanding
    ? ok(`Herkunft erfasst: ${herkunft.join(', ')}`)
    : fehler(`Herkunft unvollständig: ${herkunft.join(', ')}`);

  // Zurück muss funktionieren
  await page.click('[data-zurueck]');
  await new Promise((r) => setTimeout(r, 250));
  index = await page.$$eval('[data-schritt]', (f) => f.findIndex((x) => !x.hidden));
  index === 1 ? ok('Zurück funktioniert') : fehler(`Zurück landet bei ${index}`);
  await page.click('[data-weiter]');
  await new Promise((r) => setTimeout(r, 250));

  await page.type('#name', 'Sinthusan Sinnathurai');
  await page.type('#telefon', '+49 178 8162328');
  await page.type('#email', 'test@example.org');
  await page.evaluate(() => {
    document.querySelector('input[name="einwilligung"]').click();
  });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
    page.click('[data-senden]'),
  ]);
  const ziel = new URL(page.url()).pathname;
  ziel === '/danke' ? ok('Absenden → /danke') : fehler(`Absenden → ${ziel}`);

  const noindex = await page.$eval('meta[name="robots"]', (m) => m.content);
  noindex.includes('noindex') ? ok('/danke ist noindex') : fehler(`/danke robots: ${noindex}`);
  await page.close();
}

/* ------------------------------------------------ Formular ohne JavaScript */
console.log('\nFormular ohne JavaScript');
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${basis}/kontakt`, { waitUntil: 'domcontentloaded' });
  const sichtbar = await page.$$eval('[data-schritt]', (f) => f.filter((x) => !x.hidden).length);
  sichtbar === 3
    ? ok('alle drei Abschnitte sichtbar und absendbar')
    : fehler(`${sichtbar} von 3 sichtbar`);
  const sendenSichtbar = await page.$eval('[data-senden]', (b) => !b.hidden);
  sendenSichtbar ? ok('Absendeknopf sichtbar') : fehler('Absendeknopf verborgen');
  await page.close();
}

/* -------------------------------------------- Pflichtprüfung serverseitig */
console.log('\nServerseitige Pflichtprüfung');
{
  const page = await browser.newPage();
  await page.goto(basis, { waitUntil: 'domcontentloaded' });
  const antwort = await page.evaluate(async () => {
    const daten = new URLSearchParams({ betrieb: 'Nur ein Feld' });
    const r = await fetch('/api/anfrage', {
      method: 'POST',
      body: daten,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      redirect: 'manual',
    });
    return { status: r.status, typ: r.type };
  });
  antwort.status === 0 || antwort.status === 303
    ? ok(`unvollständige Anfrage abgewiesen (${antwort.typ}, Status ${antwort.status})`)
    : fehler(`unerwarteter Status ${antwort.status}`);
  await page.close();
}

/* ------------------------------------------------- Concept-Case-Rundgang */
console.log('\nConcept-Case-Rundgang');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(basis, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const buehne = await page.evaluate(() => {
    const el = document.querySelector('[data-case]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, hoehe: r.height };
  });
  if (!buehne) {
    fehler('Rundgang nicht gefunden');
  } else {
    const messen = async (anteil) => {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        buehne.top + (buehne.hoehe - 900) * anteil,
      );
      await new Promise((r) => setTimeout(r, 250));
      return page.evaluate(() => {
        const bild = document.querySelector('[data-case-bild]');
        const aktiv = [...document.querySelectorAll('[data-case-notiz]')].findIndex((n) =>
          n.classList.contains('opacity-100'),
        );
        return { transform: getComputedStyle(bild).transform, aktiv };
      });
    };
    const a = await messen(0.02);
    const b = await messen(0.5);
    const c = await messen(0.98);
    const y = (t) => (t === 'none' ? 0 : Number.parseFloat(t.split(',')[5]));
    y(b.transform) < y(a.transform) && y(c.transform) < y(b.transform)
      ? ok(`Bild läuft mit (${Math.round(y(a.transform))} → ${Math.round(y(c.transform))} px)`)
      : fehler(`Bild bewegt sich nicht: ${a.transform} / ${c.transform}`);
    a.aktiv === 0 && c.aktiv > a.aktiv
      ? ok(`Anmerkung wechselt (Station ${a.aktiv + 1} → ${c.aktiv + 1})`)
      : fehler(`Anmerkung wechselt nicht (${a.aktiv} → ${c.aktiv})`);
  }
  await page.close();
}

/* ------------------------------------------------- Bewegungsreduktion */
console.log('\nBewegungsreduktion');
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(basis, { waitUntil: 'networkidle0' });
  const zustand = await page.evaluate(() => {
    const el = document.querySelector('.steig');
    const stil = getComputedStyle(el);
    return { opacity: stil.opacity, transform: stil.transform };
  });
  Number(zustand.opacity) === 1
    ? ok('Inhalte sofort sichtbar, keine Enthüllung')
    : fehler(`Opazität ${zustand.opacity}`);

  const caseTransform = await page.evaluate(async () => {
    const buehne = document.querySelector('[data-case]');
    const r = buehne.getBoundingClientRect();
    window.scrollTo(0, r.top + window.scrollY + (r.height - 900) * 0.6);
    await new Promise((f) => setTimeout(f, 300));
    return getComputedStyle(document.querySelector('[data-case-bild]')).transform;
  });
  caseTransform === 'none' || caseTransform === 'matrix(1, 0, 0, 1, 0, 0)'
    ? ok('Rundgang scrubbt nicht mit')
    : fehler(`Rundgang bewegt trotzdem: ${caseTransform}`);
  await page.close();
}

await browser.close();
console.log(`\n${befunde.length} Befunde`);
process.exit(befunde.length ? 1 : 0);
