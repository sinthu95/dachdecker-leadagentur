/**
 * Prüft eine ausgelieferte Pages-Adresse — die echte, im Netz, nicht den
 * Entwicklungsserver.
 *
 *   node tools/pruefen-pages.mjs [https://…pages.dev]
 *
 * Ohne Argument wird die jüngste Ausspielung des aktuellen Zweigs genommen.
 *
 * Nachgewiesen wird in dieser Reihenfolge:
 *   1. Jede Seite kommt an, mit gestalteter Fehlerseite. Ob sie in den Index
 *      darf, richtet sich nach PUBLIC_SITE_URL: ohne Domain muss noindex
 *      stehen, mit Domain müssen kanonische Adresse und Sitemap greifen.
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
 * Versand: Der Routinelauf füllt absichtlich den Honigtopf aus. Die Anfrage
 * wird dann als Verdachtsfall abgelegt und ausdrücklich nicht versendet — die
 * Ablage ist genauso geprüft, aber der echte Posteingang bekommt nicht bei
 * jeder Auslieferung etwas, das wie ein Lead aussieht.
 *
 * Den Versandweg prüft man eigens:
 *
 *   PRUEFUNG_VERSAND=1 node tools/pruefen-pages.mjs
 *
 * Dann geht eine echte Benachrichtigung hinaus. Ob sie ankommt, sieht dieses
 * Werkzeug nicht — das muss im Posteingang nachgesehen werden.
 */
import { readdirSync, existsSync } from 'node:fs';
import { setTimeout as warten } from 'node:timers/promises';
import {
  zweigJetzt,
  letzteAusspielung,
  kvSchluessel,
  kvWert,
  kvLoeschen,
  fehlerAbfangen,
  projektLesen,
} from './pages-konfig.mjs';

fehlerAbfangen();

let fehler = 0;
let hinweise = 0;
const ok = (text) => console.log(`  ok    ${text}`);
const nok = (text) => {
  console.log(`  FEHLER ${text}`);
  fehler += 1;
};
/**
 * Etwas, das nicht kaputt ist, aber anders als beim Worker — und worüber
 * entschieden werden muss. Es lässt den Lauf durchgehen, geht aber nicht
 * unter: Ein Unterschied, den niemand sieht, wird später als Überraschung
 * entdeckt.
 */
const hinweis = (text) => {
  console.log(`  HINWEIS ${text}`);
  hinweise += 1;
};
const pruefe = (bedingung, text) => (bedingung ? ok(text) : nok(text));

// --- Adresse ---------------------------------------------------------------
let basis = process.argv[2];
if (!basis) {
  const ausspielung = (await letzteAusspielung(zweigJetzt())) ?? (await letzteAusspielung());
  if (!ausspielung) {
    console.error(`\nKeine Ausspielung gefunden. Zuerst: npm run pages:ausliefern\n`);
    process.exit(1);
  }
  basis = ausspielung.url;
}
basis = basis.replace(/\/$/, '');
console.log(`\nGeprüft wird ${basis}`);

/**
 * Ein Aufruf gegen die ausgelieferte Adresse.
 *
 * Mit Wiederholung, aber nur für lesende Aufrufe: Ein wiederholtes POST
 * könnte eine zweite Anfrage ablegen, und dann prüfte dieses Werkzeug einen
 * Zustand, den es selbst erzeugt hat.
 */
async function hole(pfad, optionen = {}, versuche = 3) {
  let letzter;
  for (let i = 0; i < versuche; i += 1) {
    try {
      return await fetch(`${basis}${pfad}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
        ...optionen,
      });
    } catch (fehler) {
      letzter = fehler;
      if (optionen.method && optionen.method !== 'GET') break;
      await warten(2000);
    }
  }
  // `fetch failed` allein sagt nichts. Der Grund steht in `cause`.
  throw new Error(
    `${pfad}: ${letzter?.cause?.message ?? letzter?.message ?? 'Aufruf fehlgeschlagen'}`,
  );
}

/**
 * Wartet, bis die Adresse antwortet.
 *
 * Bei einem frisch angelegten Projekt liegen zwischen „Deployment complete"
 * und der ersten beantwortbaren Anfrage einige Sekunden — der Name muss erst
 * im DNS stehen. Ohne diese Schleife prüfte das Werkzeug gegen einen Namen,
 * den es noch nicht gibt, und meldete „fetch failed" statt eines Befunds.
 */
async function erreichbarWarten(sekunden = 180) {
  const bis = Date.now() + sekunden * 1000;
  let letzter = 'keine Antwort';
  let versuch = 0;
  while (Date.now() < bis) {
    versuch += 1;
    try {
      const antwort = await fetch(`${basis}/`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      // Alles unterhalb 500 heißt: Es antwortet jemand. Ob richtig, prüfen
      // die eigentlichen Befunde weiter unten.
      if (antwort.status < 500) return versuch;
      letzter = `HTTP ${antwort.status}`;
    } catch (fehler) {
      letzter = fehler?.cause?.message ?? fehler?.message ?? 'unbekannt';
    }
    await warten(3000);
  }
  throw new Error(
    `${basis} antwortet nach ${sekunden} s nicht. Zuletzt: ${letzter}\n` +
      '  Die Auslieferung selbst war erfolgreich — geprüft werden kann sie\n' +
      '  aber erst, wenn der Name erreichbar ist.',
  );
}

// --- 1. Seiten -------------------------------------------------------------
// Die Liste kommt aus dem Buildergebnis, nicht aus einer gepflegten Aufzählung:
// Eine neue Seite ist damit automatisch mitgeprüft.
// Beide Ablagen werden erkannt: `kontakt.html` (build.format: 'file', der
// aktuelle Stand) und `kontakt/index.html` (build.format: 'directory').
// Sonst fände dieses Werkzeug nach einem Wechsel der Einstellung keine
// einzige Seite mehr und meldete trotzdem „0 Befunde".
function seitenAusBuild() {
  if (!existsSync('dist')) return ['/'];
  const gefunden = new Set(['/']);
  for (const eintrag of readdirSync('dist', { withFileTypes: true })) {
    if (eintrag.name.startsWith('_')) continue;
    if (eintrag.isDirectory()) {
      if (existsSync(`dist/${eintrag.name}/index.html`)) gefunden.add(`/${eintrag.name}`);
    } else if (eintrag.name.endsWith('.html')) {
      // `index.html` ist bereits „/", `404.html` wird eigens geprüft.
      if (eintrag.name === 'index.html' || eintrag.name === '404.html') continue;
      gefunden.add(`/${eintrag.name.replace(/\.html$/, '')}`);
    }
  }
  return [...gefunden];
}

const versuche = await erreichbarWarten();
console.log(
  versuche === 1
    ? '  ·     Adresse antwortet sofort'
    : `  ·     Adresse antwortet ab Versuch ${versuche}`,
);

const UMLEITUNG = [301, 302, 307, 308];
const pfadVon = (ort) => (ort?.startsWith('http') ? new URL(ort).pathname : ort || '');

console.log('\nSeiten');
for (const pfad of seitenAusBuild()) {
  const erste = await hole(pfad);
  if (UMLEITUNG.includes(erste.status)) {
    // Erreichbar bleibt erreichbar, auch über eine Umleitung. Ob die
    // Kanonisierung passt, ist eine eigene Frage — siehe unten.
    const ziel = pfadVon(erste.headers.get('location'));
    const zweite = await hole(ziel);
    const text = zweite.status === 200 ? await zweite.text() : '';
    pruefe(
      zweite.status === 200 && text.includes('<title>'),
      `${pfad} → ${erste.status} auf ${ziel} → 200 (${zweite.status})`,
    );
  } else {
    const text = erste.status === 200 ? await erste.text() : '';
    pruefe(erste.status === 200 && text.includes('<title>'), `${pfad} → 200 (${erste.status})`);
  }
}

const robots = await hole('/robots.txt');
pruefe(robots.status === 200, `/robots.txt → 200 (${robots.status})`);

// HSTS kommt aus `public/_headers`. Die Datei ist leicht zu übersehen und
// verschwindet lautlos, wenn jemand sie verschiebt — dann fällt niemandem
// etwas auf, weil die Seite weiter funktioniert. Deshalb hier geprüft.
const hsts = (await hole('/')).headers.get('strict-transport-security');
pruefe(
  Boolean(hsts && /max-age=\d{7,}/.test(hsts)),
  `HSTS gesetzt (${hsts ?? 'fehlt'})`,
);

// Indexierung: Die Erwartung dreht sich mit PUBLIC_SITE_URL.
//
// Ohne Domain baut die Seite bewusst mit noindex, und das ist auf einer
// *.pages.dev-Adresse keine Nebensache — sonst konkurriert sie später mit der
// echten Domain um dieselben Suchbegriffe. Mit gesetzter Domain muss genau
// das Gegenteil gelten, sonst geht die Seite unsichtbar live.
//
// Beides fest zu prüfen ginge nicht: Eine Prüfung, die nach dem Setzen der
// Domain reihenweise Fehler meldet, wird abgeschaltet statt gelesen.
const domain = (process.env.PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
const start = await hole('/');
const startText = await start.text();
const hatNoindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(startText);

if (!domain) {
  pruefe(hatNoindex, 'ohne PUBLIC_SITE_URL: noindex gesetzt — gehört nicht in den Index');
} else {
  pruefe(!hatNoindex, `mit PUBLIC_SITE_URL: kein noindex (${domain})`);
  const kanonisch = startText.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
  pruefe(
    kanonisch === `${domain}/` || kanonisch === domain,
    `kanonische Adresse zeigt auf die Domain (gelesen: ${kanonisch ?? '—'})`,
  );
  const sitemap = await hole('/sitemap-index.xml');
  pruefe(sitemap.status === 200, `Sitemap vorhanden (${sitemap.status})`);
}

// Welche Form ist die kanonische? Der Worker setzt über
// `html_handling: "drop-trailing-slash"` die Form ohne Schrägstrich durch —
// dieselbe, die `trailingSlash: 'never'` in allen internen Verweisen erzeugt.
// Pages kennt diese Einstellung nicht und entscheidet nach der Dateiablage:
// Aus `kontakt/index.html` folgt `/kontakt/` als kanonische Form.
const ohneStrich = await hole('/kontakt');
const mitStrich = await hole('/kontakt/');

if (ohneStrich.status === 200 && UMLEITUNG.includes(mitStrich.status)) {
  ok('kanonisch ist /kontakt — interne Verweise treffen ohne Umweg');
} else if (mitStrich.status === 200 && UMLEITUNG.includes(ohneStrich.status)) {
  hinweis(
    `Pages kanonisiert MIT Schrägstrich: /kontakt → ${ohneStrich.status} → /kontakt/.\n` +
      '        Interne Verweise stehen ohne Schrägstrich; jeder interne Klick kostet\n' +
      '        damit eine zusätzliche Rundreise. Der Worker vermeidet das über\n' +
      '        html_handling. Zu beheben mit build.format: "file" in astro.config.ts —\n' +
      '        das ändert aber auch den Buildstand des Workers und ist deshalb\n' +
      '        eine Entscheidung, kein Nebenbei.',
  );
} else {
  nok(
    `/kontakt (${ohneStrich.status}) und /kontakt/ (${mitStrich.status}) ` +
      'ergeben keine eindeutige kanonische Form',
  );
}

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
  // Realistische Ausfülldauer: über der Untergrenze von 1500 ms.
  geladen: String(Date.now() - 30_000),
  ...zusatz,
});

/**
 * Der Routinelauf füllt den Honigtopf absichtlich aus.
 *
 * Damit legt der Endpunkt die Anfrage unter `verdacht:` ab und versendet sie
 * ausdrücklich nicht. Die Ablage ist genauso geprüft wie vorher — aber es
 * geht bei jeder Auslieferung keine Mail an den echten Posteingang, die dort
 * wie ein Lead aussähe. Wer eine Prüfung baut, die den Betrieb stört, bekommt
 * sie abgeschaltet.
 *
 * Der Versandweg wird eigens geprüft: mit PRUEFUNG_VERSAND=1. Dann geht eine
 * echte Benachrichtigung hinaus — einmal, auf Zuruf.
 */
const versandPruefen = process.env.PRUEFUNG_VERSAND === '1';

/**
 * Steht der Zugang zu Resend überhaupt am Projekt?
 *
 * Ohne diese Frage behauptete der Prüflauf am Ende „eine Benachrichtigung ist
 * unterwegs", ohne es wissen zu können — genau die Sorte Meldung, die später
 * jemand glaubt. Gelesen wird nur, ob ein Wert vorhanden ist; Cloudflare gibt
 * `secret_text` ohne Inhalt zurück, der Schlüssel bleibt unlesbar.
 */
async function versandEingerichtet() {
  const projekt = await projektLesen();
  const vars = projekt?.deployment_configs?.production?.env_vars ?? {};
  return ['RESEND_API_KEY', 'LEAD_NOTIFY_EMAIL', 'LEAD_FROM_EMAIL'].filter((n) => !vars[n]);
}

const zeitpunktVorher = new Date().toISOString();

const gueltig = await senden({
  ...vollstaendig(),
  einwilligung: 'ja',
  ...(versandPruefen ? {} : { firmenzusatz: 'Prüflauf — kein Versand' }),
});
pruefe(
  gueltig.status === 303 && (gueltig.headers.get('location') ?? '').endsWith('/danke'),
  `gültige Anfrage → 303 /danke (${gueltig.status} ${gueltig.headers.get('location') ?? '—'})`,
);
console.log(
  versandPruefen
    ? '  ·     PRUEFUNG_VERSAND=1 — diese Anfrage löst eine echte Benachrichtigung aus'
    : '  ·     Honigtopf gesetzt — wird abgelegt, aber nicht versendet',
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

// Der Routinelauf legt unter `verdacht:` ab (Honigtopf), der Versandlauf
// unter `anfrage:`. Gesucht wird deshalb im passenden Bereich.
const PRAEFIX = versandPruefen ? 'anfrage:' : 'verdacht:';

async function suchen(gesuchteMarke) {
  for (let versuch = 0; versuch < 10; versuch += 1) {
    const alle = await kvSchluessel(PRAEFIX);
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
  nok(`keine Ablage unter „${PRAEFIX}" — nach 15 s kein Datensatz mit der Prüfmarke`);
} else {
  ok(`Anfrage im KV gefunden: ${treffer.schluessel}`);

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
  // Der Honigtopf muss auch wirklich gegriffen haben: Wäre der Datensatz
  // keiner, ginge bei jeder Auslieferung eine Mail hinaus, und niemand merkte
  // es, weil die Ablage ja stimmt.
  pruefe(
    versandPruefen ? !satz?.verdacht : Boolean(satz?.verdacht?.honigtopf),
    versandPruefen
      ? 'Datensatz ist kein Verdachtsfall — Versand war also erlaubt'
      : 'Honigtopf hat gegriffen — kein Versand ausgelöst',
  );
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

  if (versandPruefen) {
    const fehlend = await versandEingerichtet();
    if (fehlend.length) {
      nok(
        `Versand nicht eingerichtet — am Projekt fehlt: ${fehlend.join(', ')}. ` +
          'Es ist keine Benachrichtigung hinausgegangen.',
      );
    } else {
      hinweis(
        'Zugang steht; eine echte Benachrichtigung sollte unterwegs sein. Ob sie ' +
          'ankommt, kann dieses Werkzeug nicht sehen — bitte im Posteingang nachsehen.',
      );
    }
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

// --- Altlasten ------------------------------------------------------------
// Ein abgebrochener Lauf hinterlässt seinen Prüfdatensatz. LEADS ist der echte
// Anfragenspeicher — solche Reste gehören heraus, bevor jemand sie für eine
// echte Anfrage hält. Erkennbar sind sie am Namen des Prüfbetriebs; nur diese
// werden gelöscht, echte Anfragen niemals.
console.log('\nAltlasten früherer Prüfläufe');
const MARKE_PRAEFIX = 'Prüfbetrieb pruefung-';
let entfernt = 0;
let geprueft = 0;
for (const schluessel of await kvSchluessel()) {
  // Obergrenze, damit ein voller Anfragenspeicher diesen Schritt nicht in
  // einen minutenlangen Lauf über fremde Datensätze verwandelt.
  if (geprueft >= 500) break;
  geprueft += 1;
  const roh = await kvWert(schluessel);
  if (!roh?.includes(MARKE_PRAEFIX)) continue;
  try {
    await kvLoeschen(schluessel);
    entfernt += 1;
    console.log(`  ·     entfernt: ${schluessel}`);
  } catch (f) {
    nok(`Altlast ${schluessel} nicht löschbar: ${f.message}`);
  }
}
ok(entfernt === 0 ? 'keine Reste gefunden' : `${entfernt} Reste entfernt`);

console.log(
  `\n${fehler} Befunde, ${hinweise} Hinweis${hinweise === 1 ? '' : 'e'}\n`,
);
process.exit(fehler ? 1 : 0);
