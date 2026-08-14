/**
 * Legt das Pages-Projekt an und hängt den bestehenden KV-Namensraum LEADS
 * daran — beides über die Cloudflare-API, ohne Oberfläche.
 *
 *   node tools/pages-einrichten.mjs
 *
 * Der Aufruf ist wiederholbar: Existiert das Projekt schon, werden nur die
 * Bindungen nachgezogen. Er ist außerdem eng begrenzt — angefasst wird
 * ausschließlich das Projekt `dachdecker-leadagentur-pages`. Der Worker
 * `ss-leadcraft`, der Namensraum selbst und dessen Inhalt bleiben unberührt;
 * der Namensraum wird nur referenziert, nicht angelegt und nicht geleert.
 *
 * Was hier NICHT passiert: keine eigene Domain, kein DNS-Eintrag, keine
 * Git-Anbindung. Das Projekt wird per Direktupload beliefert.
 */
import {
  PROJEKT,
  PRODUKTIONSZWEIG,
  KV_LEADS,
  BINDUNGEN,
  api,
  kontoPfad,
  zugang,
  projektLesen,
  fehlerAbfangen,
} from './pages-konfig.mjs';

fehlerAbfangen();

const ok = (text) => console.log(`  ok    ${text}`);
const info = (text) => console.log(`  ·     ${text}`);

/**
 * Prüft vorab, ob der Namensraum überhaupt erreichbar ist. Ohne diesen
 * Schritt entstünde bei einem Tippfehler in der ID ein Projekt mit einer
 * Bindung ins Leere — und der Fehler fiele erst beim Absenden des Formulars
 * auf, wo er dann wie ein Fehler des Endpunkts aussähe.
 */
async function namensraumPruefen() {
  const liste = await api(kontoPfad('/storage/kv/namespaces?per_page=100'));
  const treffer = liste.find((n) => n.id === KV_LEADS);
  if (!treffer) {
    throw new Error(
      `KV-Namensraum ${KV_LEADS} ist in diesem Konto nicht vorhanden.\n` +
        `  Vorhanden sind: ${liste.map((n) => `${n.title} (${n.id})`).join(', ') || '—'}`,
    );
  }
  return treffer;
}

const { konto } = zugang();
console.log(`\nKonto ${konto}`);

console.log('\nKV-Namensraum');
const namensraum = await namensraumPruefen();
ok(`LEADS gefunden: „${namensraum.title}" (${KV_LEADS})`);

console.log('\nPages-Projekt');
let projekt = await projektLesen();

if (!projekt) {
  info(`${PROJEKT} existiert noch nicht — wird angelegt`);
  projekt = await api(kontoPfad('/pages/projects'), {
    method: 'POST',
    body: JSON.stringify({
      name: PROJEKT,
      production_branch: PRODUKTIONSZWEIG,
      // Beide Umgebungen gleich ausstatten: Bei Pages erbt die Vorschau
      // nichts von der Produktion. Der Testlauf läuft als Vorschau.
      deployment_configs: { production: BINDUNGEN, preview: BINDUNGEN },
    }),
  });
  ok(`angelegt: ${PROJEKT}`);
} else {
  info(`${PROJEKT} existiert bereits — Bindungen werden nachgezogen`);
  projekt = await api(kontoPfad(`/pages/projects/${PROJEKT}`), {
    method: 'PATCH',
    body: JSON.stringify({
      deployment_configs: { production: BINDUNGEN, preview: BINDUNGEN },
    }),
  });
  ok('Bindungen aktualisiert');
}

// --- Gegenprobe: nicht dem Rückgabewert glauben, sondern nachlesen ---------
// Ein PATCH, den die API annimmt, ohne die Bindung zu setzen, wäre der
// unangenehmste Fall: Alles meldet Erfolg, und der Endpunkt findet später
// kein LEADS.
const geprueft = await projektLesen();
let fehler = 0;
for (const umgebung of ['production', 'preview']) {
  const gesetzt = geprueft?.deployment_configs?.[umgebung]?.kv_namespaces?.LEADS?.namespace_id;
  if (gesetzt === KV_LEADS) {
    ok(`Bindung LEADS steht in „${umgebung}"`);
  } else {
    console.log(
      `  FEHLER Bindung LEADS fehlt in „${umgebung}" (gelesen: ${gesetzt ?? '—'})`,
    );
    fehler += 1;
  }
}

if (fehler) {
  console.error('\nAbbruch: Die Bindung ist nicht gesetzt.');
  process.exit(1);
}

console.log(
  `\nBereit. Produktionszweig: ${PRODUKTIONSZWEIG} (nur eine Beschriftung — ` +
    'es besteht keine Verbindung zu GitHub).\n' +
    'Weiter mit: npm run pages:ausliefern\n',
);
