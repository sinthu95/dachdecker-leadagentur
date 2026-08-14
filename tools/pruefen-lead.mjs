/**
 * Prüft die Lead-Strecke an der echten Pages-Laufzeit, nicht am Entwicklungsserver.
 *
 *   node tools/pruefen-lead.mjs
 *
 * Der Entwicklungsserver verhält sich an entscheidenden Stellen anders — der
 * Herkunftsschutz greift dort zum Beispiel gar nicht. Deshalb startet dieses
 * Werkzeug `wrangler pages dev`, also dieselbe Laufzeit, die auch bei
 * Cloudflare Pages läuft. Bindungen kommen über Schalter herein;
 * `wrangler.jsonc` wird dabei nicht angefasst.
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
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as warten } from 'node:timers/promises';

const HAFEN = Number(process.argv[2] ?? 8791);
const BASIS = `http://127.0.0.1:${HAFEN}`;
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

/**
 * Bindungen kommen als Schalter, nicht über eine Ersatzkonfiguration.
 * `wrangler pages dev` nimmt `--kv` und `--binding` direkt entgegen; damit
 * bleibt wrangler.jsonc unangetastet und die Prüfung kann beide Zustände
 * herstellen — mit Ablage und ohne.
 */
function bindungen(mitKv, mitMail) {
  const s = [];
  if (mitKv) s.push('--kv', 'LEADS');
  if (mitMail) for (const [k, v] of Object.entries(MAIL_VARS)) s.push('--binding', `${k}=${v}`);
  return s;
}

/**
 * `kind.kill()` beendet nur den npx-Wrapper — der Workerd darunter läuft
 * weiter und beantwortet weiter Anfragen. Ohne eigene Prozessgruppe trifft der
 * zweite Durchgang deshalb noch den Worker des ersten, und die Prüfung misst
 * die falsche Konfiguration. Genau das ist hier einmal passiert.
 */
async function workerStarten(hafen, schalter = []) {
  const basis = `http://127.0.0.1:${hafen}`;
  const kind = spawn(
    'npx',
    [
      'wrangler', 'pages', 'dev',
      '--port', String(hafen),
      '--inspector-port', String(hafen + 1000),
      '--persist-to', ZUSTAND,
      '--log-level', 'log',
      ...schalter,
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
 * Die abgelegten Datensätze aus der lokalen Ablage.
 *
 * `wrangler pages dev --kv LEADS` legt die Werte als einzelne JSON-Dateien
 * unter <zustand>/v3/kv/LEADS/blobs/ ab. Sie direkt zu lesen ist zuverlässiger
 * als der Umweg über `wrangler kv key get`: Dieser bräuchte eine
 * Konfigurationsdatei, um die Bindung aufzulösen — und die gibt es hier
 * bewusst nicht mehr, damit wrangler.jsonc unangetastet bleibt.
 *
 * Der Schlüssel steht im Datensatz selbst: aus `kennung` und dem Vorhandensein
 * von `verdacht` ergibt er sich eindeutig.
 */
function kvDatensaetze() {
  const wurzel = join(ZUSTAND, 'v3', 'kv', 'LEADS', 'blobs');
  if (!existsSync(wurzel)) return [];
  const saetze = [];
  for (const name of readdirSync(wurzel)) {
    try {
      const roh = readFileSync(join(wurzel, name), 'utf8');
      if (!roh.startsWith('{')) continue;
      saetze.push(JSON.parse(roh));
    } catch {
      /* keine JSON-Ablage — überspringen */
    }
  }
  return saetze;
}

// ---------------------------------------------------------------------------

rmSync(ZUSTAND, { recursive: true, force: true });
let gesamtProtokoll = '';

try {
  // === Durchgang A: KV vorhanden, Mailversand konfiguriert und fehlschlagend =
  console.log('\nMit KV-Ablage, Mailversand schlägt fehl');
  let worker = await workerStarten(HAFEN, bindungen(true, true));
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

  await warten(1200);
  gesamtProtokoll += worker.protokoll();
  await worker.beenden();

  const saetze = kvDatensaetze();
  const echte = saetze.filter((s) => !s.verdacht);
  const verdaechtige = saetze.filter((s) => s.verdacht);

  console.log('\nAblage');
  pruefe(echte.length === 3, `drei gültige Anfragen abgelegt (gefunden: ${echte.length})`);
  pruefe(
    verdaechtige.length === 2,
    `zwei Verdachtsfälle abgelegt statt verworfen (gefunden: ${verdaechtige.length})`,
  );

  // Der Datensatz muss vollständig lesbar zurückkommen — eine Ablage, aus der
  // sich die Anfrage nicht rekonstruieren lässt, wäre keine.
  const satz = echte[0];
  pruefe(
    Boolean(satz && satz.name && satz.telefon && satz.email && satz.leistungen?.length),
    'abgelegter Datensatz ist vollständig lesbar',
  );
  pruefe(
    Boolean(verdaechtige[0]?.verdacht),
    'Verdachtsfall trägt den Grund im Datensatz',
  );
  pruefe(
    /schluessel=anfrage:/.test(gesamtProtokoll) && /schluessel=verdacht:/.test(gesamtProtokoll),
    'Schlüssel trennen echte Anfragen von Verdachtsfällen',
  );
  pruefe(
    /mail=fehlgeschlagen/.test(gesamtProtokoll),
    'Mailausfall wird vermerkt — die Anfrage liegt trotzdem im KV',
  );
  pruefe(
    /mail=unterdrueckt \(Verdacht\)/.test(gesamtProtokoll),
    'Verdachtsfälle werden nicht versendet',
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
  worker = await workerStarten(HAFEN + 2, bindungen(false, false));
  const b1 = await senden(worker.basis, vollstaendig({ betrieb: 'Notfall GmbH' }));
  pruefe(b1.status === 303 && /\/danke$/.test(b1.ziel ?? ''), 'Anfrage wird angenommen');
  await warten(1200);
  const notfall = worker.protokoll();
  await worker.beenden();
  pruefe(
    /weder abgelegt noch versendet/.test(notfall) && notfall.includes(KLARDATEN.telefon),
    'Notfallausgabe enthält die vollständige Anfrage — sonst wäre sie verloren',
  );
} finally {
  rmSync(ZUSTAND, { recursive: true, force: true });
}

console.log(`\n${fehler} Befunde`);
process.exit(fehler ? 1 : 0);
