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

/** Zweig, aus dem der Testlauf ausgeliefert wird, wenn nichts anderes gilt. */
export const ZWEIG = 'claude/cloudflare-pages-migration-zfj110';

/**
 * Der Zweig, aus dem gerade ausgeliefert wird.
 *
 * In GitHub Actions steht er in GITHUB_REF_NAME. Er entscheidet alles Weitere:
 * Stimmt er mit dem Produktionszweig des Projekts überein, ist es eine
 * Produktionsauslieferung — und nur an der hängt eine eigene Domain. Jeder
 * andere Name ergibt eine Vorschau unter eigener Adresse.
 *
 * Deshalb wird er gelesen und nicht gesetzt: Ein fest verdrahteter Zweigname
 * hätte zur Folge, dass ein Push auf `main` eine Vorschau erzeugt und die
 * Domain weiter auf einen alten Stand zeigt — ohne dass irgendetwas
 * fehlschlägt.
 */
export function zweigJetzt() {
  return process.env.GITHUB_REF_NAME || ZWEIG;
}

/** Ist das die Produktionsauslieferung? */
export function istProduktion(zweig = zweigJetzt()) {
  return zweig === PRODUKTIONSZWEIG;
}

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

/**
 * Eigene Domains des Pages-Projekts.
 *
 * Bewusst eine Subdomain und nicht der Apex: Eine Apex-Domain kann nicht per
 * CNAME zeigen, sie verlangt den Wechsel der Nameserver zu Cloudflare. Bei
 * `ssleadcraft.de` liegen aber die Resend-Einträge für den Mailversand
 * (DKIM auf `resend._domainkey`, SPF auf `send`) — die müssten dabei
 * vollständig mitgenommen werden, und ein übersehener DKIM-Selektor fällt
 * erst auf, wenn Benachrichtigungen im Spam landen.
 *
 * Eine Subdomain braucht davon nichts: ein CNAME bei STRATO, fertig. Die
 * Nameserver bleiben, wo sie sind, und der Mailversand bleibt unberührt.
 *
 * Bei STRATO muss dafür stehen:
 *   CNAME  www  →  dachdecker-leadagentur-pages.pages.dev.
 */
export const DOMAINS = ['www.ssleadcraft.de'];

/**
 * Namentlich freigegebene Abmeldungen.
 *
 * Die Einrichtung räumt von sich aus nur Domains ab, die Cloudflare **nicht**
 * als aktiv führt. Eine aktive Domain wird nie automatisch entfernt: Sie
 * könnte gerade Verkehr ausliefern, und ein Werkzeug, das eine laufende
 * Adresse stilllegt, weil eine Liste sie nicht kennt, wäre gefährlich.
 *
 * Diese Liste ist der Weg daran vorbei — und zwar nur für den Namen, der hier
 * ausdrücklich steht. Cloudflare führt eine Domain noch als „active", wenn
 * das Zertifikat einmal ausgestellt wurde; ob überhaupt noch ein DNS-Eintrag
 * darauf zeigt, weiß es nicht. Genau dieser Fall ist gemeint.
 *
 * Die Liste ist ein Auftrag, kein Dauerzustand: Ist ein Name abgemeldet,
 * gehört er wieder heraus. Ein Eintrag, der jahrelang stehenbleibt, wird
 * irgendwann nicht mehr gelesen — und dann räumt er etwas ab, an das niemand
 * mehr gedacht hat.
 *
 * Bisher stand hier: `app.ssleadcraft.de`. Der CNAME bei STRATO war entfernt,
 * die Adresse löste nicht mehr auf, Cloudflare führte sie aber weiter als
 * „active", weil das Zertifikat einmal ausgestellt worden war. Abgemeldet am
 * 18.08.2026 nach ausdrücklicher Freigabe des Inhabers.
 */
export const DOMAINS_ABMELDEN = [];

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

/**
 * Benachrichtigung über neue Anfragen.
 *
 * Diese Werte müssen zur **Laufzeit** an der Anwendung hängen, nicht beim
 * Bauen: `src/pages/api/anfrage.ts` liest sie aus `locals.runtime.env`. Eine
 * Actions-Variable erreicht sie nie — die existiert nur, während gebaut wird.
 * `PUBLIC_SITE_URL` ist genau umgekehrt.
 *
 * Absender ist bewusst nicht dieselbe Adresse wie der Empfänger: Absender
 * gleich Empfänger sieht für Spamfilter nach gefälschter Selbstzustellung aus.
 * `formular@` braucht kein Postfach — Resend verlangt nur die verifizierte
 * Domain, und Rückläufer fängt `send.ssleadcraft.de` ab. Geantwortet wird
 * ohnehin nicht dorthin: Der Endpunkt setzt `reply_to` auf die Adresse des
 * Anfragenden.
 */
export const MAIL = {
  LEAD_NOTIFY_EMAIL: 'kontakt@ssleadcraft.de',
  LEAD_FROM_EMAIL: 'formular@ssleadcraft.de',
};

/**
 * Die Umgebungswerte, die am Projekt gesetzt werden.
 *
 * Der Schlüssel kommt aus der Umgebung und wird als `secret_text` abgelegt:
 * Cloudflare speichert ihn dann verschlüsselt und gibt ihn über die API nie
 * wieder heraus — auch diesem Werkzeug nicht. Er wird nirgends ausgegeben.
 *
 * Fehlt er, wird er **nicht** gesetzt und damit auch nicht gelöscht. Ein Lauf
 * ohne Schlüssel darf einen bereits hinterlegten nicht wegräumen; das wäre
 * die unangenehmste Art, den Versand stillzulegen.
 */
export function umgebungsWerte() {
  const werte = {
    LEAD_NOTIFY_EMAIL: { value: MAIL.LEAD_NOTIFY_EMAIL, type: 'plain_text' },
    LEAD_FROM_EMAIL: { value: MAIL.LEAD_FROM_EMAIL, type: 'plain_text' },
  };
  if (process.env.RESEND_API_KEY) {
    werte.RESEND_API_KEY = { value: process.env.RESEND_API_KEY, type: 'secret_text' };
  }
  return werte;
}

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
    // Netzwerkfehler von `fetch` melden nur „fetch failed"; der eigentliche
    // Grund — Namensauflösung, Zeitüberschreitung, abgelehnte Verbindung —
    // steht eine Ebene tiefer in `cause`.
    const ursache = fehler?.cause?.message ? `\n  Ursache: ${fehler.cause.message}` : '';
    console.error(`\nFEHLER  ${fehler?.message ?? fehler}${ursache}\n`);
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

/**
 * Prüft den Token selbst, unabhängig von seinen Berechtigungen.
 *
 * Cloudflare beantwortet beides mit demselben Code 10000 — einen kaputten
 * Token und einen gültigen ohne die nötige Berechtigung. Dieser Endpunkt
 * trennt die Fälle: Er antwortet auf jeden aktiven Token, ganz gleich, was
 * dieser darf. Schlägt er fehl, liegt es am Token-Wert; kommt er durch, liegt
 * es an den Berechtigungen.
 */
export async function tokenPruefen() {
  return await api('/user/tokens/verify');
}

/**
 * Konten, die dieser Token sehen darf. Beste Bemühung: Manche Token dürfen
 * die Liste nicht lesen, ohne dass etwas falsch wäre — dann `null`.
 */
export async function kontenLesen() {
  try {
    return await api('/accounts?per_page=50');
  } catch {
    return null;
  }
}

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
