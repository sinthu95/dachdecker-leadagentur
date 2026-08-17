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
 * Eigene Domains aus `DOMAINS` werden am Projekt eingetragen. Das ist kein
 * DNS-Eingriff: Cloudflare merkt sich nur den Namen und prüft von sich aus,
 * ob ein CNAME darauf zeigt. Der CNAME selbst wird bei STRATO gesetzt, von
 * Hand — dieses Werkzeug hat dort keinen Zugang und soll ihn nicht haben.
 *
 * Was hier NICHT passiert: keine Git-Anbindung. Das Projekt wird per
 * Direktupload beliefert.
 */
import {
  PROJEKT,
  PRODUKTIONSZWEIG,
  KV_LEADS,
  DOMAINS,
  BINDUNGEN,
  api,
  kontoPfad,
  zugang,
  projektLesen,
  fehlerAbfangen,
  tokenPruefen,
  kontenLesen,
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
  let liste;
  try {
    liste = await api(kontoPfad('/storage/kv/namespaces?per_page=100'));
  } catch (fehler) {
    // Hier ist bereits erwiesen, dass der Token gültig ist und zum Konto
    // gehört — es kann also nur noch die Berechtigung sein.
    throw new Error(
      `Zugriff auf Workers KV verweigert: ${fehler.message}\n` +
        '  Der Token ist gültig, das Konto stimmt. Es fehlt die Berechtigung\n' +
        '  „Workers KV Storage" (Account, Bearbeiten).\n' +
        '  Nachzutragen auf dash.cloudflare.com/profile/api-tokens am\n' +
        '  bestehenden Token über „Edit" — ein neuer Token ist nicht nötig.',
    );
  }
  const treffer = liste.find((n) => n.id === KV_LEADS);
  if (!treffer) {
    throw new Error(
      `KV-Namensraum ${KV_LEADS} ist in diesem Konto nicht vorhanden.\n` +
        `  Gefunden wurden ${liste.length} andere Namensräume.`,
    );
  }
  return treffer;
}

const { konto } = zugang();

// --- Zugang zuerst, und in der Reihenfolge, die den Fehler eingrenzt -------
console.log('\nZugang');
let tokenInfo;
try {
  tokenInfo = await tokenPruefen();
} catch (fehler) {
  throw new Error(
    `Der Token selbst wird abgelehnt: ${fehler.message}\n` +
      '  Das ist kein Berechtigungsproblem, sondern der Wert des Tokens:\n' +
      '  abgelaufen, widerrufen, oder beim Einfügen verändert — ein\n' +
      '  Zeilenumbruch oder ein Leerzeichen am Ende genügt dafür.',
  );
}
ok(
  `Token aktiv (Status „${tokenInfo.status}"` +
    `${tokenInfo.expires_on ? `, gültig bis ${tokenInfo.expires_on}` : ', ohne Ablaufdatum'})`,
);

// Konto-IDs werden hier bewusst nicht ausgegeben: Dieses Repository ist
// öffentlich und damit auch dieses Protokoll. Die eigene ID ist als Secret
// geschwärzt, fremde wären es nicht.
const konten = await kontenLesen();
if (konten === null) {
  info('Kontoliste nicht lesbar — dieser Token darf sie nicht sehen. Kein Fehler.');
} else if (konten.some((k) => k.id === konto)) {
  ok('CLOUDFLARE_ACCOUNT_ID gehört zu diesem Token');
} else {
  throw new Error(
    'Der Token gehört nicht zu dem Konto aus CLOUDFLARE_ACCOUNT_ID.\n' +
      `  Er sieht ${konten.length} Konto/Konten, die konfigurierte ID ist nicht darunter.\n` +
      '  Entweder die ID korrigieren oder den Token im richtigen Konto erzeugen.',
  );
}

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

// --- Eigene Domains -------------------------------------------------------
// Anlegen ist ungefährlich und wiederholbar: Cloudflare nimmt den Namen
// entgegen und prüft selbst, ob der CNAME darauf zeigt. Fehlt er noch, bleibt
// die Domain auf „pending" stehen — ohne dass irgendetwas kaputtgeht.
if (DOMAINS.length) {
  console.log('\nEigene Domains');
  const vorhanden = await api(kontoPfad(`/pages/projects/${PROJEKT}/domains`));
  const bekannt = new Map((vorhanden ?? []).map((d) => [d.name, d]));

  for (const name of DOMAINS) {
    let eintrag = bekannt.get(name);
    if (!eintrag) {
      eintrag = await api(kontoPfad(`/pages/projects/${PROJEKT}/domains`), {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      info(`${name} angelegt`);
    }
    const stand = eintrag?.status ?? 'unbekannt';
    if (stand === 'active') {
      ok(`${name} aktiv`);
    } else {
      // Kein Fehler: Solange der CNAME bei STRATO fehlt, kann Cloudflare gar
      // nicht bestätigen. Der Lauf soll deswegen nicht rot werden.
      info(
        `${name} steht auf „${stand}" — erwartet, solange bei STRATO kein\n` +
          `        CNAME ${name.split('.')[0]} → ${PROJEKT}.pages.dev. eingetragen ist`,
      );
    }
  }
}

console.log(
  `\nBereit. Produktionszweig: ${PRODUKTIONSZWEIG} (nur eine Beschriftung — ` +
    'es besteht keine Verbindung zu GitHub).\n' +
    'Weiter mit: npm run pages:ausliefern\n',
);
