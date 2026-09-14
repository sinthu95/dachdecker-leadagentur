/**
 * Prüft die Lead-Strecke am echten Worker, nicht am Entwicklungsserver.
 *
 *   node tools/pruefen-lead.mjs
 *
 * Der Entwicklungsserver verhält sich an entscheidenden Stellen anders — der
 * Herkunftsschutz greift dort zum Beispiel gar nicht. Deshalb startet dieses
 * Werkzeug `wrangler dev --local`, also dieselbe Laufzeit, die auch bei
 * Cloudflare läuft, mit einer eigenen Konfiguration. `wrangler.jsonc` wird
 * dabei nicht angefasst.
 *
 * Nachgewiesen wird:
 *   1. Eine gültige Anfrage liegt danach im KV.
 *   2. Eine realistisch lange Ausfülldauer führt nicht zum stillen Verlust.
 *   3. Fällt der Mailversand aus, ist die Anfrage trotzdem abgelegt.
 *   4. Honigtopf und Zeitfalle greifen weiter — ohne die Anfrage wegzuwerfen.
 *   5. Im Protokoll stehen keine Klardaten, solange die Ablage funktioniert.
 *
 * Es wird keine echte E-Mail versendet: Der hinterlegte Schlüssel ist erfunden
 * und die Zieladresse liegt auf `.invalid`.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { setTimeout as warten } from 'node:timers/promises';

const HAFEN = Number(process.argv[2] ?? 8791);
const BASIS = `http://127.0.0.1:${HAFEN}`;
const KONFIG = 'wrangler.pruefen-lead.jsonc';
const ZUSTAND = '.wrangler/pruefen-lead';

/* Erfundene Zugangsdaten. Sie sollen fehlschlagen — genau das ist Fall 3. */
const MAIL_VARS = {
  RESEND_API_KEY: 're_pruefung_kein_echter_schluessel',
  LEAD_NOTIFY_EMAIL: 'posteingang@pruefung.invalid',
  LEAD_FROM_EMAIL: 'formular@pruefung.invalid',
};

/* Erkennungsmerkmale, die im Protokoll nicht auftauchen dürfen. */
const KLARDATEN = {
  name: 'Grete Musterfrau',
  telefon: '02324 9988776',
  email: 'grete.musterfrau@pruefung.invalid',
  betrieb: 'Dachdeckerei Musterfrau',
};

let fehler = 0;
const ok = (text) => console.log(`  ok    ${text}`);
const nok = (text) => {
  console.log(`  FEHLER ${text}`);
  fehler += 1;
};
const pruefe = (bedingung, text) => (bedingung ? ok(text) : nok(text));

function konfigSchreiben(mitKv, mitMail) {
  const roh = readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const cfg = JSON.parse(roh);
  cfg.vars = { ...(cfg.vars ?? {}), ...(mitMail ? MAIL_VARS : {}) };
  if (mitKv) cfg.kv_namespaces = [{ binding: 'LEADS', id: 'pruefen-lead-lokal' }];
  else delete cfg.kv_namespaces;
  writeFileSync(KONFIG, JSON.stringify(cfg, null, 2));
}

/**
 * `kind.kill()` beendet nur den npx-Wrapper — der Workerd darunter läuft
 * weiter und beantwortet weiter Anfragen. Ohne eigene Prozessgruppe trifft der
 * zweite Durchgang deshalb noch den Worker des ersten, und die Prüfung misst
 * die falsche Konfiguration. Genau das ist hier einmal passiert.
 */
async function workerStarten(hafen) {
  const basis = `http://127.0.0.1:${hafen}`;
  const kind = spawn(
    'npx',
    [
      'wrangler', 'dev', '--local',
      '--port', String(hafen),
      '--inspector-port', String(hafen + 1000),
      '-c', KONFIG,
      '--persist-to', ZUSTAND,
      '--log-level', 'log',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  );
  let protokoll = '';
  kind.stdout.on('data', (d) => (protokoll += d.toString()));
  kind.stderr.on('data', (d) => (protokoll += d.toString()));

  const beenden = async () => {
    try {
      process.kill(-kind.pid, 'SIGKILL');
    } catch {
      /* schon beendet */
    }
    // Warten, bis der Hafen wirklich frei ist.
    for (let i = 0; i < 30; i += 1) {
      await warten(500);
      try {
        await fetch(`${basis}/`, { signal: AbortSignal.timeout(1000) });
      } catch {
        return;
      }
    }
  };

  for (let i = 0; i < 60; i += 1) {
    await warten(1000);
    try {
      const a = await fetch(`${basis}/`, { signal: AbortSignal.timeout(2000) });
      if (a.ok) return { basis, beenden, protokoll: () => protokoll };
    } catch {
      /* noch nicht bereit */
    }
  }
  await beenden();
  throw new Error(`Worker kam nicht hoch:\n${protokoll.slice(-1500)}`);
}

async function senden(basis, felder) {
  const antwort = await fetch(`${basis}/api/anfrage`, {
    method: 'POST',
    headers: { Origin: basis, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(felder),
    redirect: 'manual',
  });
  return { status: antwort.status, ziel: antwort.headers.get('location') };
}

const vollstaendig = (zusatz = {}) => ({
  betrieb: KLARDATEN.betrieb,
  ort: 'Sprockhövel',
  leistungen: 'Neueindeckung',
  kapazitaet: '4 bis 10 zusätzliche Aufträge',
  name: KLARDATEN.name,
  telefon: KLARDATEN.telefon,
  email: KLARDATEN.email,
  einwilligung: 'ja',
  ...zusatz,
});

/**
 * Alle Schlüssel aus der lokalen KV-Ablage — über Wranglers eigenen Zugriff.
 * Direkt in die SQLite-Dateien zu sehen wäre unzuverlässig: Nach dem Beenden
 * des Workers steht ein Teil der Einträge noch im WAL und nicht in der
 * Hauptdatei.
 */
function kvLesen(unterbefehl) {
  const ergebnis = spawnSync(
    'npx',
    ['wrangler', 'kv', ...unterbefehl, '--binding', 'LEADS', '--local',
     '--persist-to', ZUSTAND, '-c', KONFIG],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return ergebnis.stdout ?? '';
}

function kvSchluessel() {
  const roh = kvLesen(['key', 'list']);
  const anfang = roh.indexOf('[');
  if (anfang < 0) return [];
  try {
    return JSON.parse(roh.slice(anfang)).map((e) => e.name);
  } catch {
    return [];
  }
}

function kvDatensatz(schluessel) {
  const roh = kvLesen(['key', 'get', schluessel]);
  const anfang = roh.indexOf('{');
  if (anfang < 0) return null;
  try {
    return JSON.parse(roh.slice(anfang));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------

rmSync(ZUSTAND, { recursive: true, force: true });
let gesamtProtokoll = '';

try {
  // === Durchgang A: KV vorhanden, Mailversand konfiguriert und fehlschlagend =
  console.log('\nMit KV-Ablage, Mailversand schlägt fehl');
  konfigSchreiben(true, true);
  let worker = await workerStarten(HAFEN);
  const b = worker.basis;

  const a1 = await senden(b, vollstaendig());
  pruefe(a1.status === 303 && /\/danke$/.test(a1.ziel ?? ''), 'gültige Anfrage → 303 /danke');

  // Lange Ausfülldauer: der Zeitstempel liegt weit zurück.
  const a2 = await senden(
    b,
    vollstaendig({ geladen: String(Date.now() - 11 * 60 * 1000), betrieb: 'Langsam GmbH' }),
  );
  pruefe(a2.status === 303 && /\/danke$/.test(a2.ziel ?? ''), 'elf Minuten Ausfülldauer → 303 /danke');

  // Kurz nach dem Laden, aber über der Untergrenze — der Fall, der früher verlorenging.
  const a3 = await senden(
    b,
    vollstaendig({ geladen: String(Date.now() - 2000), betrieb: 'Schnell nach Ablehnung' }),
  );
  pruefe(a3.status === 303 && /\/danke$/.test(a3.ziel ?? ''), 'zwei Sekunden nach dem Laden → 303 /danke');

  // Pflichtangabe fehlt, und zwar sofort nach dem Laden: früher kam hier die
  // Dankeseite statt der Fehlermeldung.
  const a4 = await senden(b, {
    ...vollstaendig({ geladen: String(Date.now()) }),
    einwilligung: '',
  });
  pruefe(
    a4.status === 303 && /fehler=pflichtfelder/.test(a4.ziel ?? ''),
    'fehlende Einwilligung sofort nach dem Laden → Fehlermeldung, nicht Dankeseite',
  );

  // Spamschutz
  const a5 = await senden(b, vollstaendig({ firmenzusatz: 'bot', betrieb: 'Honigtopf' }));
  pruefe(a5.status === 303 && /\/danke$/.test(a5.ziel ?? ''), 'Honigtopf → 303 /danke, keine Rückmeldung');

  const a6 = await senden(b, vollstaendig({ geladen: String(Date.now()), betrieb: 'Zu schnell' }));
  pruefe(a6.status === 303 && /\/danke$/.test(a6.ziel ?? ''), 'Absenden ohne Verzögerung → 303 /danke');

  const a7 = await senden(b, { betrieb: 'Unvollständig', ort: 'X' });
  pruefe(
    a7.status === 303 && /fehler=pflichtfelder/.test(a7.ziel ?? ''),
    'unvollständige Anfrage → Fehlermeldung',
  );

  const a8 = await senden(b, vollstaendig({ email: 'keine-adresse' }));
  pruefe(
    a8.status === 303 && /fehler=pflichtfelder/.test(a8.ziel ?? ''),
    'unbrauchbare E-Mail-Adresse → Fehlermeldung',
  );

  /* --- Herkunftsseite: zweigleisiges Formular (ab Phase 4) -----------------
     Die Seiten zeigen verschiedene Leistungslisten. Führte eine Ablehnung
     weiter pauschal nach `/kontakt`, liefen die wiederhergestellten Haken
     einer Branchenanfrage dort ins Leere. Deshalb muss die Ablehnung zu der
     Seite zurückführen, von der die Anfrage kam — und der mitgesendete Wert
     muss geprüft werden, sonst wäre das eine offene Weiterleitung. */
  console.log('\nHerkunftsseite');

  const a9 = await senden(b, {
    ...vollstaendig({ betrieb: 'Dachdecker Herkunft', leistungen: 'Flachdach' }),
    herkunft_seite: '/dachdecker',
    herkunft_gclid: 'EAIaIQobCh_ERFUNDENE_KLICKKENNUNG_0815',
    herkunft_utm_source: 'google',
    herkunft_utm_medium: 'cpc',
    herkunft_utm_campaign: 'dach_sanierung',
  });
  pruefe(a9.status === 303 && /\/danke$/.test(a9.ziel ?? ''), 'Anfrage von /dachdecker → 303 /danke');

  const a10 = await senden(b, {
    ...vollstaendig({ betrieb: 'Zurueck zur Branche' }),
    einwilligung: '',
    herkunft_seite: '/dachdecker',
  });
  pruefe(
    a10.status === 303 && (a10.ziel ?? '').startsWith('/dachdecker?fehler='),
    `Ablehnung führt auf die Seite zurück, von der sie kam (${a10.ziel})`,
  );

  const a11 = await senden(b, {
    ...vollstaendig({ betrieb: 'Fremdes Ziel' }),
    einwilligung: '',
    herkunft_seite: 'https://boese.example/weiterleitung',
  });
  pruefe(
    a11.status === 303 && (a11.ziel ?? '').startsWith('/kontakt?fehler='),
    `fremde Herkunftsseite wird verworfen, nicht weitergeleitet (${a11.ziel})`,
  );

  const a12 = await senden(b, {
    ...vollstaendig({ betrieb: 'Neutral Herkunft', leistungen: 'Google Ads' }),
    branche: 'Sanitär und Heizung',
    herkunft_seite: '/',
  });
  pruefe(a12.status === 303 && /\/danke$/.test(a12.ziel ?? ''), 'Anfrage von / → 303 /danke');

  /* Herkunftsschutz gegen fremde Seiten. Er kommt von Astro (`checkOrigin`,
     für serverseitig gerenderte Routen standardmäßig an) und steht deshalb an
     keiner Stelle im eigenen Code — genau darum wird er hier nachgewiesen:
     Eine Einstellung, die niemand prüft, fällt irgendwann still weg. */
  console.log('\nHerkunftsschutz');
  const fremd = async (kopfzeilen) =>
    (
      await fetch(`${b}/api/anfrage`, {
        method: 'POST',
        headers: { ...kopfzeilen, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(vollstaendig({ betrieb: 'Fremdaufruf' })),
        redirect: 'manual',
      })
    ).status;
  pruefe((await fremd({ Origin: 'https://boese.example' })) === 403, 'fremder Origin → 403');
  pruefe((await fremd({})) === 403, 'Anfrage ohne Origin → 403');

  await warten(1200);
  gesamtProtokoll += worker.protokoll();
  await worker.beenden();

  const schluessel = kvSchluessel();
  const echte = schluessel.filter((s) => s.startsWith('anfrage:'));
  const verdaechtige = schluessel.filter((s) => s.startsWith('verdacht:'));

  console.log('\nAblage');
  pruefe(echte.length === 5, `fünf gültige Anfragen abgelegt (gefunden: ${echte.length})`);
  pruefe(
    verdaechtige.length === 2,
    `zwei Verdachtsfälle abgelegt statt verworfen (gefunden: ${verdaechtige.length})`,
  );

  // Der Datensatz muss vollständig lesbar zurückkommen — eine Ablage, aus der
  // sich die Anfrage nicht rekonstruieren lässt, wäre keine.
  const satz = echte.length ? kvDatensatz(echte[0]) : null;
  pruefe(
    Boolean(satz && satz.name && satz.telefon && satz.email && satz.leistungen?.length),
    'abgelegter Datensatz ist vollständig lesbar',
  );
  const verdachtssatz = verdaechtige.length ? kvDatensatz(verdaechtige[0]) : null;
  pruefe(
    Boolean(verdachtssatz?.verdacht),
    'Verdachtsfall trägt den Grund im Datensatz',
  );
  pruefe(
    /mail=fehlgeschlagen/.test(gesamtProtokoll),
    'Mailausfall wird vermerkt — die Anfrage liegt trotzdem im KV',
  );
  pruefe(
    /mail=unterdrueckt \(Verdacht\)/.test(gesamtProtokoll),
    'Verdachtsfälle werden nicht versendet',
  );

  /* Was von der Herkunft tatsächlich im Datensatz landet. Die Suche läuft über
     den Betriebsnamen, weil die Schlüssel Zeitstempel und UUID tragen. */
  const saetze = echte.map((s) => kvDatensatz(s)).filter(Boolean);
  const dachSatz = saetze.find((s) => s.betrieb === 'Dachdecker Herkunft');
  const neutralSatz = saetze.find((s) => s.betrieb === 'Neutral Herkunft');

  console.log('\nHerkunft im Datensatz');
  pruefe(dachSatz?.herkunft?.seite === '/dachdecker', 'Branchenanfrage trägt herkunft.seite = /dachdecker');
  pruefe(dachSatz?.branche === 'Dachdecker', 'Branchenanfrage bekommt die Branche aus der Seite ergänzt');
  pruefe(neutralSatz?.herkunft?.seite === '/', 'allgemeine Anfrage trägt herkunft.seite = /');
  pruefe(
    neutralSatz?.branche === 'Sanitär und Heizung',
    'allgemeine Anfrage übernimmt die Branche aus dem Freitextfeld',
  );
  pruefe(
    typeof dachSatz?.herkunft?.gclid === 'string' && dachSatz.herkunft.gclid.length > 10,
    'die Klickkennung steht vollständig im Datensatz',
  );

  console.log('\nProtokoll ohne Klardaten');
  for (const [feld, wert] of Object.entries(KLARDATEN)) {
    pruefe(!gesamtProtokoll.includes(wert), `kein „${feld}" im Protokoll`);
  }
  pruefe(
    /Anfrage abgelegt \[[0-9a-f-]{36}\]/.test(gesamtProtokoll),
    'Protokoll nennt nur Kennung und Schlüssel',
  );

  // === Durchgang B: keine KV-Bindung, kein Mailversand ======================
  // Der Notfallzweig. Hier sollen Klardaten im Protokoll stehen: Es ist dann
  // der einzige Ort, an dem die Anfrage noch existiert.
  console.log('\nOhne KV und ohne Mailversand: Notfallausgabe');
  konfigSchreiben(false, false);
  worker = await workerStarten(HAFEN + 2);
  const b1 = await senden(worker.basis, vollstaendig({ betrieb: 'Notfall GmbH' }));
  pruefe(b1.status === 303 && /\/danke$/.test(b1.ziel ?? ''), 'Anfrage wird angenommen');

  /* Derselbe Zweig gibt die Benachrichtigung im Wortlaut aus. Das ist die
     einzige Stelle, an der sich der Text prüfen lässt, ohne eine Mail zu
     versenden — deshalb laufen hier beide Gleise durch. */
  const GCLID = 'EAIaIQobCh_ERFUNDENE_KLICKKENNUNG_NOTFALL';
  await senden(worker.basis, {
    ...vollstaendig({ betrieb: 'Mailbild Branche', leistungen: 'Flachdach' }),
    herkunft_seite: '/dachdecker',
    herkunft_utm_source: 'google',
    herkunft_utm_medium: 'cpc',
    herkunft_utm_campaign: 'dach_sanierung',
    herkunft_gclid: GCLID,
    herkunft_referrer: 'https://www.google.com/search?q=dachsanierung+kosten&sehr=lang',
    herkunft_landingpage: '/dachdecker',
  });
  await senden(worker.basis, {
    ...vollstaendig({ betrieb: 'Mailbild Allgemein', leistungen: 'Google Ads' }),
    branche: 'Sanitär und Heizung',
    herkunft_seite: '/kontakt',
    herkunft_landingpage: '/leistungen',
  });

  await warten(1200);
  const notfall = worker.protokoll();
  await worker.beenden();
  pruefe(
    /weder abgelegt noch versendet/.test(notfall) && notfall.includes(KLARDATEN.telefon),
    'Notfallausgabe enthält die vollständige Anfrage — sonst wäre sie verloren',
  );

  console.log('\nWortlaut der Benachrichtigung');
  /* Der Worker rückt jede Protokollzeile ein. Die Blöcke werden deshalb
     einzeln herausgeschnitten und wieder linksbündig gestellt — sonst prüfte
     man die Einrückung von workerd statt den eigenen Text. */
  const bloecke = [...notfall.matchAll(/Neue Potenzialanalyse-Anfrage[\s\S]*?Eingegangen: *\S+/g)].map(
    (m) => m[0].replace(/^[ \t]+/gm, ''),
  );
  const teil = (marke) => bloecke.find((b) => b.includes(`Betrieb:        ${marke}`)) ?? '';
  const mailBranche = teil('Mailbild Branche');
  const mailAllgemein = teil('Mailbild Allgemein');

  pruefe(/Herkunftsseite: \/dachdecker/.test(mailBranche), 'Branchenmail nennt die Herkunftsseite');
  pruefe(/Branche:        Dachdecker/.test(mailBranche), 'Branchenmail nennt die Branche');
  pruefe(/\nLeistungen:     Flachdach/.test(mailBranche), 'Branchenmail beschriftet die Auswahl als Leistungen');
  pruefe(
    /Kampagne:       google \/ cpc \/ dach_sanierung/.test(mailBranche),
    'Kampagne steht lesbar statt als JSON',
  );
  pruefe(/Bezahlt über:   Google Ads/.test(mailBranche), 'bezahlter Klick wird benannt');
  pruefe(!mailBranche.includes(GCLID), 'die rohe Klickkennung steht nicht in der Mail');
  pruefe(
    /Verweis von:    www\.google\.com\n/.test(mailBranche),
    'Verweis nennt nur den Host, nicht die ganze Adresse',
  );
  pruefe(
    !/Einstiegsseite/.test(mailBranche),
    'Einstiegsseite entfällt, wenn sie der Herkunftsseite entspricht',
  );

  pruefe(/Herkunftsseite: \/kontakt/.test(mailAllgemein), 'allgemeine Mail nennt die Herkunftsseite');
  pruefe(/Branche:        Sanitär und Heizung/.test(mailAllgemein), 'allgemeine Mail nennt den Branchenfreitext');
  pruefe(
    /\nSchwerpunkte:   Google Ads/.test(mailAllgemein),
    'allgemeine Mail beschriftet die Auswahl als Schwerpunkte',
  );
  pruefe(
    /Einstiegsseite: \/leistungen/.test(mailAllgemein),
    'abweichende Einstiegsseite wird genannt',
  );
  pruefe(!/\{|\}/.test(mailAllgemein.split('Eingegangen')[0]), 'kein JSON-Rohwert in der Mail');
} finally {
  rmSync(KONFIG, { force: true });
  rmSync(ZUSTAND, { recursive: true, force: true });
}

console.log(`\n${fehler} Befunde`);
process.exit(fehler ? 1 : 0);
