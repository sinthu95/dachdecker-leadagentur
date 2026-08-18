/**
 * Baut den Worker `ss-leadcraft` bei Cloudflare ab.
 *
 *   node tools/worker-abbauen.mjs            nur nachsehen und berichten
 *   BESTAETIGUNG="ss-leadcraft abbauen" node tools/worker-abbauen.mjs   löschen
 *
 * Warum überhaupt: Ausgeliefert wird über Cloudflare Pages. Der Worker wird
 * von keinem Ablauf mehr beliefert, trägt keine eigene Domain und ist damit
 * eine Fehlerquelle ohne Nutzen — zwei Wege ins Netz, von denen nur einer
 * benutzt wird, und beide mit Zugriff auf denselben Anfragenspeicher.
 *
 * Dieses Werkzeug ist absichtlich eng gebaut, weil ein Löschbefehl nichts
 * verzeiht:
 *
 *   - Es fasst **genau einen** Namen an, und der steht hier fest. Kein
 *     Argument, keine Umgebungsvariable bestimmt ihn; ein Tippfehler an
 *     anderer Stelle kann also nicht das falsche Skript treffen.
 *   - Ohne die wörtliche Bestätigung wird nichts gelöscht. Der Lauf ohne sie
 *     ist ein reiner Bericht — der Normalfall, wenn jemand nur nachsehen will.
 *   - Der Namensraum LEADS wird **nicht** angefasst. Er ist eine Ressource des
 *     Kontos, kein Teil des Skripts; das Löschen eines Workers nimmt ihn nicht
 *     mit. Nach dem Abbau wird genau das nachgewiesen, statt es anzunehmen.
 *   - Andere Skripte im Konto — insbesondere die Dachdecker-Demo — werden
 *     weder verändert noch namentlich protokolliert. Dieses Repository ist
 *     öffentlich, seine Ablaufprotokolle also auch.
 */
import {
  KV_LEADS,
  PROJEKT,
  api,
  kontoPfad,
  zugang,
  tokenPruefen,
  kontenLesen,
  fehlerAbfangen,
} from './pages-konfig.mjs';

fehlerAbfangen();

/** Der einzige Name, den dieses Werkzeug anfassen darf. */
const WORKER = 'ss-leadcraft';

/** Wortlaut, ohne den nichts gelöscht wird. */
const LOSUNG = `${WORKER} abbauen`;

const ok = (text) => console.log(`  ok    ${text}`);
const info = (text) => console.log(`  ·     ${text}`);

// Ein Skript, das den Namen des Pages-Projekts trägt, wäre das Projekt selbst.
// Das kann mit der festen Belegung oben nicht passieren — geprüft wird es
// trotzdem, weil die Folge eines Irrtums hier das Abschalten der Website wäre.
if (WORKER === PROJEKT) {
  throw new Error('Der Worker-Name ist der Projektname. Abbruch, bevor etwas passiert.');
}

const { konto } = zugang();

console.log('\nZugang');
const tokenInfo = await tokenPruefen();
ok(`Token aktiv (Status „${tokenInfo.status}")`);

const konten = await kontenLesen();
if (konten === null) {
  info('Kontoliste nicht lesbar — dieser Token darf sie nicht sehen. Kein Fehler.');
} else if (konten.some((k) => k.id === konto)) {
  ok('CLOUDFLARE_ACCOUNT_ID gehört zu diesem Token');
} else {
  throw new Error('Der Token gehört nicht zu dem Konto aus CLOUDFLARE_ACCOUNT_ID.');
}

// --- Bestand aufnehmen -----------------------------------------------------
console.log('\nBestand');
let skripte;
try {
  skripte = await api(kontoPfad('/workers/scripts'));
} catch (fehler) {
  throw new Error(
    `Die Worker-Skripte sind mit diesem Token nicht lesbar: ${fehler.message}\n` +
      '  Der Token trägt „Cloudflare Pages" und „Workers KV Storage". Zum\n' +
      '  Abbauen eines Workers braucht er zusätzlich „Workers Scripts"\n' +
      '  (Account, Bearbeiten). Nachzutragen am bestehenden Token über „Edit"\n' +
      '  auf dash.cloudflare.com/profile/api-tokens — ein neuer Token ist nicht\n' +
      '  nötig.\n' +
      '  Alternativ löscht ein Mensch das Skript in der Oberfläche; dieses\n' +
      '  Werkzeug weist danach nach, dass es weg ist.',
  );
}

const treffer = (skripte ?? []).find((s) => s.id === WORKER);
const andere = (skripte ?? []).filter((s) => s.id !== WORKER).length;

if (!treffer) {
  ok(`${WORKER} besteht nicht (mehr) — nichts abzubauen`);
} else {
  info(`${WORKER} besteht, zuletzt geändert ${treffer.modified_on ?? 'unbekannt'}`);
}
// Nur die Zahl, nicht die Namen: Das Protokoll ist öffentlich.
info(`${andere} weitere Skripte im Konto — keines davon wird angefasst`);

// --- Abbau -----------------------------------------------------------------
if (process.env.BESTAETIGUNG !== LOSUNG) {
  console.log(
    `\nNur nachgesehen, nichts gelöscht.\n` +
      `Zum Abbauen: BESTAETIGUNG="${LOSUNG}"\n`,
  );
  process.exit(0);
}

if (treffer) {
  console.log('\nAbbau');
  await api(kontoPfad(`/workers/scripts/${WORKER}`), { method: 'DELETE' });
  ok(`${WORKER} gelöscht`);
}

// --- Gegenprobe ------------------------------------------------------------
// Nicht dem Rückgabewert glauben, sondern nachlesen — und vor allem nachweisen,
// dass der Anfragenspeicher unberührt ist. Das ist der Teil, bei dem ein Irrtum
// echte Anfragen kosten würde.
console.log('\nGegenprobe');
const danach = await api(kontoPfad('/workers/scripts'));
let fehler = 0;

if ((danach ?? []).some((s) => s.id === WORKER)) {
  console.log(`  FEHLER ${WORKER} steht weiterhin im Konto`);
  fehler += 1;
} else {
  ok(`${WORKER} ist im Konto nicht mehr vorhanden`);
}

const namensraeume = await api(kontoPfad('/storage/kv/namespaces?per_page=100'));
const leads = (namensraeume ?? []).find((n) => n.id === KV_LEADS);
if (leads) {
  ok(`Anfragenspeicher unberührt: „${leads.title}" besteht weiter`);
} else {
  console.log('  FEHLER Der Namensraum LEADS ist nicht mehr auffindbar');
  fehler += 1;
}

if (fehler) {
  console.error('\nAbbruch: Der Stand nach dem Abbau ist nicht der erwartete.');
  process.exit(1);
}

console.log(
  '\nFertig. Die Auslieferung läuft unverändert über Pages —\n' +
    'dieser Abbau hat sie nicht berührt.\n',
);
