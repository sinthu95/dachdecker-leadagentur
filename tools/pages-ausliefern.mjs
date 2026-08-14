/**
 * Baut die Seite und liefert sie als Vorschau an Cloudflare Pages aus.
 *
 *   node tools/pages-ausliefern.mjs
 *
 * Gebaut wird hier, nicht bei Cloudflare: Das Projekt hat keine Git-Anbindung,
 * `wrangler pages deploy` lädt nur ein fertiges Verzeichnis hoch. Anders als
 * `wrangler deploy` baut es nicht von sich aus — der Schritt steht deshalb
 * ausdrücklich davor. Ohne ihn ginge ein altes `dist/` ins Netz, und der
 * Prüflauf danach bezöge sich auf den falschen Stand.
 *
 * Ausgeliefert wird auf `ZWEIG`, nicht auf den Produktionszweig. Cloudflare
 * legt das als Vorschau ab; die Adresse endet trotzdem auf *.pages.dev.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  PROJEKT,
  ZWEIG,
  projektLesen,
  letzteAusspielung,
  KV_LEADS,
  fehlerAbfangen,
} from './pages-konfig.mjs';

fehlerAbfangen();

function lauf(befehl, argumente) {
  const ergebnis = spawnSync(befehl, argumente, { stdio: 'inherit' });
  if (ergebnis.status !== 0) {
    throw new Error(`${befehl} ${argumente.join(' ')} — abgebrochen mit Status ${ergebnis.status}`);
  }
}

// --- Vorbedingung: das Projekt muss eingerichtet sein ----------------------
// Ein Deploy auf ein Projekt ohne Bindung liefe durch und ergäbe eine Seite,
// deren Formular ins Leere schreibt. Lieber hier abbrechen.
const projekt = await projektLesen();
if (!projekt) {
  console.error(
    `\nProjekt ${PROJEKT} existiert nicht.\n  Zuerst: npm run pages:einrichten\n`,
  );
  process.exit(1);
}
const gebunden = projekt.deployment_configs?.preview?.kv_namespaces?.LEADS?.namespace_id;
if (gebunden !== KV_LEADS) {
  console.error(
    `\nDem Projekt fehlt die Bindung LEADS in der Vorschauumgebung ` +
      `(gelesen: ${gebunden ?? '—'}).\n  Zuerst: npm run pages:einrichten\n`,
  );
  process.exit(1);
}

console.log('\nBauen');
lauf('npm', ['run', 'build']);

for (const pflicht of ['dist/_worker.js/index.js', 'dist/_routes.json', 'dist/index.html']) {
  if (!existsSync(pflicht)) {
    console.error(`\n${pflicht} fehlt nach dem Bauen — Auslieferung abgebrochen.\n`);
    process.exit(1);
  }
}

console.log(`\nAusliefern an ${PROJEKT}, Zweig ${ZWEIG}`);
// Wrangler meldet hier, dass es wrangler.jsonc gefunden hat und übergeht.
// Das ist richtig so: Diese Datei beschreibt den Worker, nicht Pages. Die
// Bindungen hängen am Projekt (siehe tools/pages-konfig.mjs).
lauf('npx', [
  'wrangler',
  'pages',
  'deploy',
  'dist',
  '--project-name',
  PROJEKT,
  '--branch',
  ZWEIG,
  // Mit Gleichheitszeichen, nicht als zweites Wort: Sonst läse Yargs „true"
  // als weiteres Verzeichnis und bräche mit „Unknown argument" ab.
  '--commit-dirty=true',
]);

// --- Adresse nicht aus der Ausgabe raten, sondern nachfragen ---------------
// Die Ausgabe von Wrangler ist Text und ändert sich zwischen Fassungen; die
// API nennt dieselbe Adresse verbindlich.
let ausspielung = await letzteAusspielung(ZWEIG);
if (!ausspielung) {
  // Der Zweigname steht bei Direktupload in `deployment_trigger`. Fehlt er
  // wider Erwarten, ist die soeben erzeugte Ausspielung trotzdem die jüngste.
  ausspielung = await letzteAusspielung();
  if (ausspielung) console.log(`\nHinweis: Ausspielung ohne Zweigangabe ${ZWEIG} gefunden.`);
}
if (!ausspielung) {
  console.error('\nAuslieferung gemeldet, aber keine Ausspielung gefunden.\n');
  process.exit(1);
}

const adressen = [ausspielung.url, ...(ausspielung.aliases ?? [])].filter(Boolean);
console.log('\nAdressen');
for (const adresse of adressen) console.log(`  ${adresse}`);

console.log(`\nWeiter mit: npm run pruefen:pages ${ausspielung.url}\n`);
