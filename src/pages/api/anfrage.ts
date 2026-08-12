import type { APIRoute } from 'astro';

/** Einzige serverseitig gerenderte Route der Seite. */
export const prerender = false;

/**
 * Nimmt das Qualifizierungsformular entgegen.
 *
 * Zustellung ist bewusst mehrstufig abgesichert, weil Domain und Postfach noch
 * fehlen: Ein Formular, das nichts zustellt, wäre schlimmer als keines.
 *   1. Wenn RESEND_API_KEY und LEAD_NOTIFY_EMAIL gesetzt sind → E-Mail.
 *   2. Sonst, wenn die KV-Bindung LEADS existiert → dort ablegen.
 *   3. Sonst → in das Worker-Protokoll schreiben.
 * Die Anfrage geht in keinem Fall verloren, und der Nutzer bekommt immer die
 * Telefonnummer als zweiten Weg genannt.
 */

interface Umgebung {
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  LEADS?: { put(schluessel: string, wert: string): Promise<void> };
}

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

  // --- Spamschutz ohne Captcha -------------------------------------------
  // Honigtopf: für Menschen unsichtbar, für einfache Bots verlockend.
  if (saeubern(daten.get('firmenzusatz'))) {
    // Bots bekommen dieselbe Antwort wie Menschen — kein Hinweis auf die Falle.
    return umleiten('/danke');
  }
  // Zeitfalle: unter drei Sekunden hat niemand elf Felder ausgefüllt.
  // Ohne JavaScript ist das Feld leer; dann wird die Prüfung übersprungen.
  const geladen = Number.parseInt(saeubern(daten.get('geladen'), 20), 10);
  if (Number.isFinite(geladen) && Date.now() - geladen < 3000) {
    return umleiten('/danke');
  }

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

  const anfrage = {
    eingegangen: new Date().toISOString(),
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
    `Eingegangen:    ${anfrage.eingegangen}`,
  ].join('\n');

  // --- Zustellung ---------------------------------------------------------
  let zugestellt = false;

  if (env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL && env.LEAD_FROM_EMAIL) {
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
      zugestellt = antwort.ok;
      if (!antwort.ok) console.error('Mailversand fehlgeschlagen', antwort.status);
    } catch (fehler) {
      console.error('Mailversand fehlgeschlagen', fehler);
    }
  }

  if (!zugestellt && env.LEADS) {
    try {
      await env.LEADS.put(
        `anfrage:${anfrage.eingegangen}:${crypto.randomUUID()}`,
        JSON.stringify(anfrage),
      );
      zugestellt = true;
    } catch (fehler) {
      console.error('Ablage im KV fehlgeschlagen', fehler);
    }
  }

  if (!zugestellt) {
    // Letzte Stufe: mindestens im Protokoll sichtbar, damit nichts still verschwindet.
    console.warn('Anfrage ohne konfigurierte Zustellung:\n' + text);
  }

  return umleiten('/danke');
};

/** Direkte Aufrufe der Adresse führen zurück zum Formular. */
export const GET: APIRoute = () => umleiten('/kontakt#potenzialanalyse', 302);
