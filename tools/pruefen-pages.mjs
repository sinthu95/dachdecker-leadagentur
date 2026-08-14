/**
 * Prüft eine ausgelieferte Pages-Adresse — die echte, im Netz, nicht den
 * Entwicklungsserver.
 *
 *   node tools/pruefen-pages.mjs [https://…pages.dev]
 *
 * Ohne Argument wird die jüngste Ausspielung des Testzweigs genommen.
 *
 * Nachgewiesen wird in dieser Reihenfolge:
 *   1. Jede Seite kommt an, mit gestalteter Fehlerseite und ohne Index-Freigabe.
 *   2. Der Serverteil liegt nicht offen im Netz.
 *   3. /api/anfrage wird vom Serverteil beantwortet, nicht von der
 *      Asset-Schicht — bei Pages die Stelle, an der eine falsche
 *      Wegeführung sofort auffällt.
 *   4. Eine gültige Anfrage landet im KV-Namensraum LEADS und ist dort
 *      vollständig lesbar.
 *   5. Eine unvollständige Anfrage landet dort nicht.
 *
 * Der Prüfdatensatz wird danach wieder gelöscht: LEADS ist der echte
 * Anfragenspeicher, kein Spielplatz. Bleibt er wider Erwarten liegen, nennt
 * das Werkzeug den Schlüssel.
 *
 * Es wird keine E-Mail versendet — Verdachtsfälle nicht, und ohne
 * RESEND_API_KEY ohnehin nichts.
 */
import { readdirSync, existsSync } from 'node:fs';
import { setTimeout as warten } from 'node:timers/promises';
import {
  ZWEIG,
  letzteAusspielung,
  kvSchluessel,
  kvWert,
  kvLoeschen,
  fehlerAbfangen,
} from './pages-konfig.mjs';

fehlerAbfangen();

let fehler = 0;
const ok = (text) => console.log(`  ok    ${text}`);
const nok = (text) => {
  console.log(`  FEHLER ${text}`);
  fehler += 1;
};
const pruefe = (bedingung, text) => (bedingung ? ok(text) : nok(text));

// --- Adresse ---------------------------------------------------------------
let basis = process.argv[2];
if (!basis) {
  const ausspielung = (await letzteAusspielung(ZWEIG)) ?? (await letzteAusspielung());
  if (!ausspielung) {
    console.error(`\nKeine Ausspielung gefunden. Zuerst: npm run pages:ausliefern\n`);
    process.exit(1);
  }
  basis = ausspielung.url;
}
basis = basis.replace(/\/$/, '');
console.log(`\nGeprüft wird ${basis}`);

const hole = (pfad, optionen = {}) =>
  fetch(`${basis}${pfad}`, { redirect: 'manual', ...optionen });

// --- 1. Seiten -------------------------------------------------------------
// Die Liste kommt aus dem Buildergebnis, nicht aus einer gepflegten Aufzählung:
// Eine neue Seite ist damit automatisch mitgeprüft.
function seitenAusBuild() {
  if (!existsSync('dist')) return ['/'];
  const gefunden = ['/'];
  for (const eintrag of readdirSync('dist', { withFileTypes: true })) {
    if (!eintrag.isDirectory() || eintrag.name.startsWith('_')) continue;
    if (existsSync(`dist/${eintrag.name}/index.html`)) gefunden.push(`/${eintrag.name}`);
  }
  return gefunden;
}

console.log('\nSeiten');
for (const pfad of seitenAusBuild()) {
  const antwort = await hole(pfad);
  const text = antwort.ok ? await antwort.text() : '';
  pruefe(
    antwort.status === 200 && text.includes('<title>'),
    `${pfad} → 200 (${antwort.status})`,
  );
}

const robots = await hole('/robots.txt');
pruefe(robots.status === 200, `/robots.txt → 200 (${robots.status})`);

// Ohne PUBLIC_SITE_URL baut die Seite bewusst mit noindex. Auf einer
// *.pages.dev-Testadresse ist das keine Nebensache: Sonst konkurriert die
// Vorschau später mit der echten Domain um dieselben Suchbegriffe.
const start = await hole('/');
const startText = await start.text();
pruefe(
  /<meta[^>]+name="robots"[^>]+noindex/i.test(startText),
  'Startseite trägt noindex — die Testadresse gehört nicht in den Index',
);

// Schrägstrich am Ende: intern wird ohne verwiesen, Pages führt zusammen.
const mitStrich = await hole('/kontakt/');
pruefe(
  [301, 307, 308].includes(mitStrich.status) &&
    (mitStrich.headers.get('location') ?? '').endsWith('/kontakt'),
  `/kontakt/ → Umleitung auf /kontakt (${mitStrich.status})`,
);

// Unbekannte Adresse: die gestaltete Fehlerseite, nicht die nackte Meldung.
const unbekannt = await hole('/gibt-es-nicht');
const unbekanntText = await unbekannt.text();
pruefe(
  unbekannt.status === 404 && unbekanntText.includes('Seite nicht gefunden'),
  `unbekannte Adresse → 404 mit gestalteter Fehlerseite (${unbekannt.status})`,
);

// --- 2. Serverteil nicht öffentlich ---------------------------------------
console.log('\nServerteil');
for (const pfad of ['/_worker.js/index.js', '/_worker.js']) {
  const antwort = await hole(pfad);
  pruefe(antwort.status !== 200, `${pfad} wird nicht ausgeliefert (${antwort.status})`);
}

// --- 3. Wegeführung zum Endpunkt ------------------------------------------
// Die eigentliche Pages-Frage. Beim Worker regelt das `run_worker_first`,
// bei Pages die "include"-Liste in _routes.json. Greift sie nicht, beantwortet
// die Asset-Schicht den Pfad — GET ergäbe 404 und POST 405, und zwar ohne
// dass der Endpunkt je gefragt würde.
console.log('\nEndpunkt /api/anfrage');
const direkt = await hole('/api/anfrage');
pruefe(
  direkt.status === 302 && (direkt.headers.get('location') ?? '').startsWith('/kontakt'),
  `GET /api/anfrage → 302 zurück zum Formular (${direkt.status})`,
);

const marke = `pruefung-${crypto.randomUUID()}`;
const markeUnvollstaendig = `pruefung-unvollstaendig-${crypto.randomUUID()}`;

const senden = (felder) =>
  hole('/api/anfrage', {
    method: 'POST',
    headers: { Origin: basis, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(felder),
  });

const vollstaendig = (zusatz = {}) => ({
  betrieb: `Prüfbetrieb ${marke}`,
  ort: 'Sprockhövel',
  leistungen: 'Neueindeckung',
  kapazitaet: '4 bis 10 zusätzliche Aufträge',
  name: 'Prüflauf Pages',
  telefon: '00000 000000',
  email: 'pruefung@pruefung.invalid',
  // Realistische Ausfülldauer: über der Untergrenze von 1500 ms, damit die
  // Anfrage nicht als Verdachtsfall abgelegt wird.
  geladen: String(Date.now() - 30_000),
  ...zusatz,
});

const zeitpunktVorher = new Date().toISOString();

const gueltig = await senden({ ...vollstaendig(), einwilligung: 'ja' });
pruefe(
  gueltig.status === 303 && (gueltig.headers.get('location') ?? '').endsWith('/danke'),
  `gültige Anfrage → 303 /danke (${gueltig.status} ${gueltig.headers.get('location') ?? '—'})`,
);

const unvollstaendig = await senden({
  ...vollstaendig({ betrieb: `Prüfbetrieb ${markeUnvollstaendig}` }),
  einwilligung: '',
});
pruefe(
  unvollstaendig.status === 303 &&
    /fehler=pflichtfelder/.test(unvollstaendig.headers.get('location') ?? ''),
  `fehlende Einwilligung → 303 mit Fehlermeldung (${unvollstaendig.status})`,
);

// --- 4. Ablage im KV -------------------------------------------------------
// Die Schlüsselliste ist nicht sofort konsistent; deshalb mehrere Versuche.
console.log('\nAblage im Namensraum LEADS');

async function suchen(gesuchteMarke) {
  for (let versuch = 0; versuch < 10; versuch += 1) {
    const alle = await kvSchluessel('anfrage:');
    // Nur Schlüssel, die nach dem Absenden entstanden sind. Der Zeitstempel
    // steht im Schlüssel und ist als ISO-Text sortierbar.
    const neue = alle.filter((s) => (s.split(':').slice(1, -1).join(':') || '') >= zeitpunktVorher);
    for (const schluessel of neue) {
      const roh = await kvWert(schluessel);
      if (roh?.includes(gesuchteMarke)) return { schluessel, roh };
    }
    await warten(1500);
  }
  return null;
}

const treffer = await suchen(marke);
if (!treffer) {
  nok('gültige Anfrage im KV gefunden — nach 15 s kein Datensatz mit der Prüfmarke');
} else {
  ok(`gültige Anfrage im KV gefunden: ${treffer.schluessel}`);

  let satz = null;
  try {
    satz = JSON.parse(treffer.roh);
  } catch {
    /* bleibt null */
  }
  pruefe(
    Boolean(satz && satz.name && satz.telefon && satz.email && satz.leistungen?.length),
    'Datensatz ist vollständig lesbar',
  );
  pruefe(!satz?.verdacht, 'Datensatz ist kein Verdachtsfall');
  pruefe(
    typeof satz?.kennung === 'string' && treffer.schluessel.endsWith(satz.kennung),
    'Schlüssel und Kennung im Datensatz gehören zusammen',
  );

  // Aufräumen: LEADS ist der echte Anfragenspeicher.
  try {
    await kvLoeschen(treffer.schluessel);
    ok('Prüfdatensatz wieder gelöscht');
  } catch (f) {
    nok(`Prüfdatensatz konnte nicht gelöscht werden (${treffer.schluessel}): ${f.message}`);
  }
}

// Die abgelehnte Anfrage darf nirgends liegen — weder als Anfrage noch als
// Verdachtsfall. Sie wurde vor der Ablage abgewiesen.
const alleSchluessel = await kvSchluessel();
let abgelehntGefunden = null;
for (const schluessel of alleSchluessel.filter(
  (s) => (s.split(':').slice(1, -1).join(':') || '') >= zeitpunktVorher,
)) {
  const roh = await kvWert(schluessel);
  if (roh?.includes(markeUnvollstaendig)) {
    abgelehntGefunden = schluessel;
    break;
  }
}
if (abgelehntGefunden) {
  nok(`abgelehnte Anfrage wurde abgelegt (${abgelehntGefunden}) — sie sollte gar nicht erst ankommen`);
  await kvLoeschen(abgelehntGefunden).catch(() => {});
} else {
  ok('abgelehnte Anfrage wurde nicht abgelegt');
}

console.log(`\n${fehler} Befunde\n`);
process.exit(fehler ? 1 : 0);
