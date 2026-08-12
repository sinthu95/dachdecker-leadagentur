import type { APIRoute } from 'astro';

/** Einzige serverseitig gerenderte Route der Seite. */
export const prerender = false;

/**
 * Nimmt das Qualifizierungsformular entgegen.
 *
 * Reihenfolge der Zustellung — und diese Reihenfolge ist der Kern:
 *   1. Ablage in der KV-Bindung LEADS. Zuerst, immer, unabhängig davon, ob
 *      danach eine E-Mail hinausgeht. Das Postfach ist eine Benachrichtigung,
 *      kein Speicher: Ein Spamfilter oder ein versehentliches Löschen darf
 *      keine Anfrage kosten.
 *   2. E-Mail über Resend, wenn RESEND_API_KEY, LEAD_NOTIFY_EMAIL und
 *      LEAD_FROM_EMAIL gesetzt sind.
 *   3. Schlägt beides fehl, bleibt nur das Worker-Protokoll. Nur an dieser
 *      einen Stelle steht die Anfrage im Klartext im Protokoll — dann ist es
 *      der letzte Ort, an dem sie überhaupt noch existiert.
 *
 * Verdachtsfälle aus dem Spamschutz werden nicht verworfen, sondern unter
 * eigenem Schlüssel abgelegt und nicht versendet. Ein falsch erkannter Mensch
 * kostet damit keine Anfrage mehr, ein Bot bekommt trotzdem keine Rückmeldung.
 */

interface Umgebung {
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  LEADS?: { put(schluessel: string, wert: string): Promise<void> };
}

/**
 * Untergrenze für die Ausfülldauer. Wer elf Felder in weniger als anderthalb
 * Sekunden ausfüllt, ist kein Mensch.
 *
 * Der Wert lag bei 3000 ms und die Prüfung lief vor der Pflichtfeldprüfung.
 * Das kostete echte Anfragen: Nach einer serverseitigen Ablehnung steht der
 * Besucher auf einer frisch geladenen Seite mit wiederhergestellten Eingaben
 * und muss nur noch die Einwilligung setzen. Gemessen 627 ms bis zum zweiten
 * Absenden — die Anfrage landete auf der Dankeseite und im Nichts.
 */
const MINDESTDAUER_MS = 1500;

/**
 * Pflichtangaben. Dieselben, die im Formular ein Sternchen tragen — sonst
 * hielte die Kennzeichnung nur so lange, wie JavaScript läuft.
 */
const PFLICHT = ['betrieb', 'ort', 'kapazitaet', 'name', 'telefon', 'email'] as const;
/** Mehrfachauswahl: mindestens ein Haken. */
const PFLICHT_MEHRFACH = ['leistungen'] as const;

const istEmail = (wert: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(wert);

function saeubern(wert: FormDataEntryValue | null, maxLaenge = 300): string {
  if (typeof wert !== 'string') return '';
  // Steuerzeichen entfernen und Zeilenumbrueche zusammenziehen, damit nichts
  // die Textmail zerlegt oder Kopfzeilen einschleusen kann.
  return wert
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLaenge);
}

/** Wie saeubern, laesst aber Absaetze im Freitextfeld stehen. */
function saeubernMehrzeilig(wert: FormDataEntryValue | null, maxLaenge = 2000): string {
  if (typeof wert !== 'string') return '';
  return wert
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLaenge);
}

function alleWerte(daten: FormData, feld: string, maxLaenge = 120): string[] {
  return daten
    .getAll(feld)
    .map((w) => saeubern(w, maxLaenge))
    .filter(Boolean);
}

function umleiten(pfad: string, status = 303) {
  return new Response(null, { status, headers: { Location: pfad } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = ((locals as Record<string, any>)?.runtime?.env ?? {}) as Umgebung;

  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return umleiten('/kontakt?fehler=format#potenzialanalyse');
  }

  // --- Spamverdacht: erheben, aber noch nicht entscheiden -----------------
  // Beide Prüfungen liefen früher vor der Validierung und beendeten die
  // Anfrage sofort. Damit bekam ein Mensch, der in die Zeitfalle geriet, die
  // Dankeseite statt seiner Fehlermeldung — und seine Anfrage war weg.
  // Jetzt wird der Verdacht nur vermerkt; entschieden wird nach der Prüfung.

  // Honigtopf: für Menschen unsichtbar, für einfache Bots verlockend.
  const honigtopf = Boolean(saeubern(daten.get('firmenzusatz')));

  // Ohne JavaScript bleibt das Feld leer; dann wird die Dauer nicht bewertet.
  const geladen = Number.parseInt(saeubern(daten.get('geladen'), 20), 10);
  const zuSchnell = Number.isFinite(geladen) && Date.now() - geladen < MINDESTDAUER_MS;

  const verdacht = honigtopf || zuSchnell;

  // --- Validierung --------------------------------------------------------
  const feld = {
    betrieb: saeubern(daten.get('betrieb'), 120),
    website: saeubern(daten.get('website'), 200),
    ort: saeubern(daten.get('ort'), 120),
    mitarbeiter: saeubern(daten.get('mitarbeiter'), 40),
    leistungen: alleWerte(daten, 'leistungen'),
    kapazitaet: saeubern(daten.get('kapazitaet'), 60),
    kundenherkunft: saeubern(daten.get('kundenherkunft'), 60),
    werbung: alleWerte(daten, 'werbung'),
    name: saeubern(daten.get('name'), 120),
    telefon: saeubern(daten.get('telefon'), 60),
    email: saeubern(daten.get('email'), 160),
    erreichbar: saeubern(daten.get('erreichbar'), 40),
    nachricht: saeubernMehrzeilig(daten.get('nachricht'), 2000),
    einwilligung: saeubern(daten.get('einwilligung'), 10),
  };

  const fehlend = PFLICHT.filter((f) => !(feld as Record<string, unknown>)[f]);
  const fehlendeAuswahl = PFLICHT_MEHRFACH.filter(
    (f) => ((feld as Record<string, unknown>)[f] as string[]).length === 0,
  );
  if (
    fehlend.length > 0 ||
    fehlendeAuswahl.length > 0 ||
    !istEmail(feld.email) ||
    feld.einwilligung !== 'ja'
  ) {
    // Auch ein Verdachtsfall bekommt hier die Fehlermeldung: Wer eine Angabe
    // vergessen hat, soll sie nachtragen können, statt auf einer Dankeseite zu
    // landen, hinter der nichts passiert. Ein Bot lernt daraus nichts, was er
    // nicht ohnehin durch Ausprobieren erführe.
    return umleiten('/kontakt?fehler=pflichtfelder#potenzialanalyse');
  }

  // --- Herkunft: aus den mitgesendeten versteckten Feldern -----------------
  const herkunft: Record<string, string> = {};
  for (const [schluessel, wert] of daten.entries()) {
    if (schluessel.startsWith('herkunft_')) {
      const w = saeubern(wert, 300);
      if (w) herkunft[schluessel.replace('herkunft_', '')] = w;
    }
  }

  const eingegangen = new Date().toISOString();
  /* Kurzkennung für das Protokoll. Sie steht auch im KV-Schlüssel, damit sich
     eine Protokollzeile einem Datensatz zuordnen lässt, ohne dass im Protokoll
     ein Name, eine Telefonnummer oder eine Adresse auftaucht. */
  const kennung = crypto.randomUUID();
  const schluessel = `${verdacht ? 'verdacht' : 'anfrage'}:${eingegangen}:${kennung}`;

  const anfrage = {
    eingegangen,
    kennung,
    ...(verdacht ? { verdacht: { honigtopf, zuSchnell } } : {}),
    ...feld,
    herkunft,
  };

  const text = [
    `Neue Potenzialanalyse-Anfrage`,
    ``,
    `Betrieb:        ${feld.betrieb}`,
    `Website:        ${feld.website || '—'}`,
    `Standort:       ${feld.ort}`,
    `Mitarbeiter:    ${feld.mitarbeiter || '—'}`,
    ``,
    `Leistungen:     ${feld.leistungen.join(', ') || '—'}`,
    `Kapazität:      ${feld.kapazitaet}`,
    `Kunden heute:   ${feld.kundenherkunft || '—'}`,
    `Werbung:        ${feld.werbung.join(', ') || '—'}`,
    ``,
    `Ansprechpartner:${feld.name}`,
    `Telefon:        ${feld.telefon}`,
    `E-Mail:         ${feld.email}`,
    `Erreichbar:     ${feld.erreichbar || '—'}`,
    ``,
    `Anmerkung:      ${feld.nachricht || '—'}`,
    ``,
    `Herkunft:       ${Object.keys(herkunft).length ? JSON.stringify(herkunft) : 'direkt'}`,
    `Eingegangen:    ${eingegangen}`,
  ].join('\n');

  // --- 1. Ablage: zuerst und unabhängig von der E-Mail --------------------
  let abgelegt = false;
  if (env.LEADS) {
    try {
      await env.LEADS.put(schluessel, JSON.stringify(anfrage));
      abgelegt = true;
    } catch (fehler) {
      // Ohne Klardaten: nur die Kennung und der Grund.
      console.error(`Ablage im KV fehlgeschlagen [${kennung}]`, fehler);
    }
  }

  // --- 2. Benachrichtigung ------------------------------------------------
  // Verdachtsfälle werden abgelegt, aber nicht versendet: Sonst wäre das
  // Postfach das Ziel jedes Bots. Nachsehen lässt sich der Datensatz trotzdem.
  let versendet = false;
  const mailMoeglich = Boolean(
    env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL && env.LEAD_FROM_EMAIL,
  );

  if (mailMoeglich && !verdacht) {
    try {
      const antwort = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.LEAD_FROM_EMAIL,
          to: [env.LEAD_NOTIFY_EMAIL],
          reply_to: feld.email,
          subject: `Potenzialanalyse: ${feld.betrieb} (${feld.ort})`,
          text,
        }),
      });
      versendet = antwort.ok;
      if (!antwort.ok) console.error(`Mailversand fehlgeschlagen [${kennung}] HTTP ${antwort.status}`);
    } catch (fehler) {
      console.error(`Mailversand fehlgeschlagen [${kennung}]`, fehler);
    }
  }

  // --- 3. Protokoll -------------------------------------------------------
  if (abgelegt) {
    // Der Regelfall. Kein Name, keine Nummer, keine Adresse — der Datensatz
    // liegt im KV, das Protokoll sagt nur, dass und unter welchem Schlüssel.
    console.log(
      `Anfrage abgelegt [${kennung}] schluessel=${schluessel} mail=${
        verdacht ? 'unterdrueckt (Verdacht)' : versendet ? 'ok' : mailMoeglich ? 'fehlgeschlagen' : 'nicht eingerichtet'
      }`,
    );
  } else if (versendet) {
    console.warn(`Keine Ablage vorhanden, nur per Mail zugestellt [${kennung}]`);
  } else {
    /* Letzte Stufe. Hier steht die Anfrage im Klartext im Protokoll — nicht aus
       Nachlässigkeit, sondern weil das Protokoll dann der einzige Ort ist, an
       dem sie überhaupt noch existiert. Sobald die KV-Bindung steht, wird
       dieser Zweig nicht mehr erreicht. */
    console.error(
      `Anfrage konnte weder abgelegt noch versendet werden [${kennung}] — ` +
        'Notfallausgabe, damit sie nicht verlorengeht:\n' +
        text,
    );
  }

  return umleiten('/danke');
};

/** Direkte Aufrufe der Adresse führen zurück zum Formular. */
export const GET: APIRoute = () => umleiten('/kontakt#potenzialanalyse', 302);
