/**
 * Gemeinsame Grundlage der drei Pages-Werkzeuge:
 * `pages-einrichten.mjs`, `pages-ausliefern.mjs`, `pruefen-pages.mjs`.
 *
 * Hier steht, was das Pages-Projekt ausmacht — und nur hier. Ein zweiter Ort
 * mit derselben Namensraum-ID wäre der Anfang zweier auseinanderlaufender
 * Wahrheiten.
 *
 * Warum die Bindungen nicht in einer Wrangler-Datei stehen
 * -------------------------------------------------------
 * Der naheliegende Weg wäre `wrangler.pages.jsonc` neben `wrangler.jsonc`,
 * gelesen über `-c`. Wrangler lehnt das ab:
 *
 *   ✘ Pages does not support custom paths for the Wrangler configuration file
 *
 * Es bliebe nur, `pages_build_output_dir` in `wrangler.jsonc` einzutragen —
 * dann hielte Wrangler die Datei für ein Pages-Projekt und `wrangler deploy`
 * für den bestehenden Worker wäre kaputt. Das ist ausgeschlossen.
 *
 * Deshalb tragen nicht die Auslieferung, sondern das Projekt selbst die
 * Bindungen: gesetzt über die REST-API in `deployment_configs`. Das ist der
 * vorgesehene Weg für Projekte ohne Git-Anbindung. `wrangler pages deploy`
 * meldet dabei, dass es `wrangler.jsonc` gefunden hat und übergeht —
 * genau das soll es tun.
 */

/** Name des Pages-Projekts. Nicht der Worker; der heißt `ss-leadcraft`. */
export const PROJEKT = 'dachdecker-leadagentur-pages';

/** Zweig, aus dem der Testlauf ausgeliefert wird. */
export const ZWEIG = 'claude/cloudflare-pages-migration-zfj110';

/**
 * Produktionszweig des Pages-Projekts.
 *
 * Das ist eine reine Beschriftung innerhalb von Cloudflare: Das Projekt wird
 * per Direktupload beliefert, es gibt keine Verbindung zu GitHub. Cloudflare
 * baut hier nichts, beobachtet keinen Zweig und löst bei einem Push nichts
 * aus. `main` im Repository bleibt davon unberührt.
 *
 * Folge für den Testlauf: Eine Auslieferung aus `ZWEIG` ist damit keine
 * Produktions-, sondern eine Vorschauauslieferung. Genau so ist es gewollt —
 * und der Grund, warum die Bindungen unten in *beiden* Umgebungen stehen.
 */
export const PRODUKTIONSZWEIG = 'main';

/**
 * Bestehender Namensraum, derselbe wie in `wrangler.jsonc`. Bewusst kein
 * neuer: Anfragen sollen an einer Stelle liegen, gleich über welchen Weg sie
 * hereinkamen. Die ID ist kein Geheimnis, sie benennt nur den Namensraum.
 */
export const KV_LEADS = '71bb7eb8ae0d4c659ace074645a6a72c';

/** Wie beim Worker: dieselbe Laufzeit soll denselben Code ausführen. */
export const KOMPATIBILITAET_DATUM = '2026-08-11';
export const KOMPATIBILITAET_FLAGGEN = ['nodejs_compat'];

/**
 * Was Cloudflare je Umgebung hinterlegt bekommt.
 *
 * Produktion und Vorschau erben bei Pages nichts voneinander — was in der
 * einen steht, fehlt in der anderen. Beide bekommen deshalb denselben Satz.
 */
export const BINDUNGEN = {
  compatibility_date: KOMPATIBILITAET_DATUM,
  compatibility_flags: KOMPATIBILITAET_FLAGGEN,
  kv_namespaces: { LEADS: { namespace_id: KV_LEADS } },
};

const BASIS = 'https://api.cloudflare.com/client/v4';

/**
 * Liest die Zugangsdaten aus der Umgebung und bricht mit einer Meldung ab,
 * die sagt, was zu tun ist — nicht mit `undefined` irgendwo im Aufruf.
 */
export function zugang() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const konto = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN ist nicht gesetzt.\n' +
        '  Der Token braucht die Berechtigungen: Cloudflare Pages → Bearbeiten\n' +
        '  und Workers KV Storage → Bearbeiten.',
    );
  }
  if (!konto) throw new Error('CLOUDFLARE_ACCOUNT_ID ist nicht gesetzt.');
  return { token, konto };
}

/** Fehler der Cloudflare-API mit Code und Klartext, nicht nur „HTTP 400". */
export class ApiFehler extends Error {
  constructor(pfad, status, koerper) {
    const liste = Array.isArray(koerper?.errors) ? koerper.errors : [];
    const text = liste.length
      ? liste.map((f) => `${f.message} [code: ${f.code}]`).join('; ')
      : `HTTP ${status}`;
    super(`${pfad}: ${text}`);
    this.name = 'ApiFehler';
    this.status = status;
    this.codes = liste.map((f) => f.code);
  }
}

/**
 * Aufruf der Cloudflare-API mit ausgepacktem `result`.
 *
 * Cloudflare antwortet auch auf Fehler mit HTTP 200 und `success: false`;
 * beide Fälle werden hier gleich behandelt.
 */
export async function api(pfad, optionen = {}) {
  const { token } = zugang();
  const antwort = await fetch(`${BASIS}${pfad}`, {
    ...optionen,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(optionen.headers ?? {}),
    },
  });

  let koerper = null;
  try {
    koerper = await antwort.json();
  } catch {
    /* z. B. eine leere Antwort auf DELETE */
  }

  if (!antwort.ok || (koerper && koerper.success === false)) {
    throw new ApiFehler(pfad, antwort.status, koerper);
  }
  return koerper?.result ?? null;
}

/**
 * Bricht mit einer lesbaren Zeile ab statt mit einem Stapelabzug.
 *
 * Diese Werkzeuge laufen an einer Stelle, an der etwas schiefgehen darf —
 * fehlender Token, abgelaufene Berechtigung, Namensraum weg. Wer das liest,
 * soll den Grund sehen, nicht die Zeilennummer in `node:internal`.
 */
export function fehlerAbfangen() {
  const zeigen = (fehler) => {
    console.error(`\nFEHLER  ${fehler?.message ?? fehler}\n`);
    process.exit(1);
  };
  process.on('unhandledRejection', zeigen);
  process.on('uncaughtException', zeigen);
}

/** Kontobezogener Pfad — spart das ständige Einsetzen der Konto-ID. */
export function kontoPfad(rest) {
  const { konto } = zugang();
  return `/accounts/${konto}${rest}`;
}

// ---------------------------------------------------------------------------
// KV-Zugriff. Die Werte-Endpunkte liefern den rohen Inhalt, nicht die
// übliche Hülle mit `result` — deshalb hier eigene Aufrufe statt `api()`.
// ---------------------------------------------------------------------------

const kvBasis = () => kontoPfad(`/storage/kv/namespaces/${KV_LEADS}`);

/** Schlüssel mit einem Präfix, über alle Seiten hinweg. */
export async function kvSchluessel(praefix = '') {
  const gesammelt = [];
  let cursor = '';
  do {
    const frage = new URLSearchParams({ limit: '1000' });
    if (praefix) frage.set('prefix', praefix);
    if (cursor) frage.set('cursor', cursor);
    const { token } = zugang();
    const antwort = await fetch(`${BASIS}${kvBasis()}/keys?${frage}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const koerper = await antwort.json();
    if (!antwort.ok || koerper.success === false) {
      throw new ApiFehler(`${kvBasis()}/keys`, antwort.status, koerper);
    }
    gesammelt.push(...koerper.result.map((e) => e.name));
    cursor = koerper.result_info?.cursor ?? '';
  } while (cursor);
  return gesammelt;
}

/** Wert eines Schlüssels als Text. `null`, wenn er nicht existiert. */
export async function kvWert(schluessel) {
  const { token } = zugang();
  const antwort = await fetch(
    `${BASIS}${kvBasis()}/values/${encodeURIComponent(schluessel)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (antwort.status === 404) return null;
  if (!antwort.ok) {
    throw new ApiFehler(`${kvBasis()}/values`, antwort.status, await antwort.json().catch(() => null));
  }
  return await antwort.text();
}

/** Löscht einen Schlüssel. Für das Aufräumen der Prüfdatensätze. */
export async function kvLoeschen(schluessel) {
  await api(`${kvBasis()}/values/${encodeURIComponent(schluessel)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------

/** Projektangaben oder `null`, wenn es das Projekt noch nicht gibt. */
export async function projektLesen() {
  try {
    return await api(kontoPfad(`/pages/projects/${PROJEKT}`));
  } catch (fehler) {
    // 8000007 = „Project not found". Alles andere ist ein echter Fehler und
    // darf nicht als „gibt es noch nicht" durchgehen.
    if (fehler instanceof ApiFehler && fehler.codes.includes(8000007)) return null;
    throw fehler;
  }
}

/** Jüngste Auslieferung, wahlweise auf einen Zweig eingegrenzt. */
export async function letzteAusspielung(zweig = null) {
  const liste = await api(kontoPfad(`/pages/projects/${PROJEKT}/deployments?per_page=25`));
  const passend = zweig
    ? liste.filter((a) => a.deployment_trigger?.metadata?.branch === zweig)
    : liste;
  return passend[0] ?? null;
}
