/**
 * Serverseitige Annahme der Anfragen — Cloudflare Pages Function.
 *
 * Reihenfolge, und sie ist der Kern:
 *  1. Ablage im KV-Namensraum LEADS (falls gebunden) — zuerst, immer.
 *     Das Postfach ist eine Benachrichtigung, kein Speicher.
 *  2. E-Mail über Resend, wenn LEAD_NOTIFY_EMAIL, LEAD_FROM_EMAIL und
 *     RESEND_API_KEY gesetzt sind.
 *
 * Spamschutz ohne Drittanbieter: unsichtbares Zusatzfeld (firma_seite)
 * plus Mindestdauer von 1500 ms. Ein Verdachtsfall wird nicht verworfen,
 * sondern unter dem Schlüsselpräfix `verdacht:` abgelegt und nicht
 * versendet.
 *
 * Diese Funktion läuft nur bei Auslieferung über Cloudflare Pages
 * (Verzeichnis functions/). Bindungen und Variablen hängen am
 * Pages-Projekt — nichts davon steht im Repository.
 */

interface KVNamespace {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Umgebung {
  LEADS?: KVNamespace;
  LEAD_NOTIFY_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  RESEND_API_KEY?: string;
}

interface FunktionsKontext {
  request: Request;
  env: Umgebung;
}

const BEKANNTE_LEISTUNGEN = new Set([
  'wohnflaechenberechnung',
  'grundrisszeichnung',
  'schnittzeichnungen-ansichten',
  'objektbesichtigung',
  'marktwertermittlung',
  'energieausweis',
  'makler-verwaltung',
  'anderes',
]);

const MINDESTDAUER_MS = 1500;

function textFeld(daten: FormData, name: string, maxLaenge = 500): string {
  const wert = daten.get(name);
  if (typeof wert !== 'string') return '';
  return wert.trim().slice(0, maxLaenge);
}

export async function onRequestPost(kontext: FunktionsKontext): Promise<Response> {
  const { request, env } = kontext;
  const perFetch = request.headers.get('X-Anfrage') === 'fetch';

  let daten: FormData;
  try {
    daten = await request.formData();
  } catch {
    return antwortFehler(perFetch, 'Die Anfrage konnte nicht gelesen werden.');
  }

  const name = textFeld(daten, 'name', 200);
  const email = textFeld(daten, 'email', 200);
  const telefon = textFeld(daten, 'telefon', 60);
  const leistung = textFeld(daten, 'leistung', 60);
  const ort = textFeld(daten, 'ort', 120);
  const nachricht = textFeld(daten, 'nachricht', 4000);
  const rueckruf = textFeld(daten, 'rueckruf', 4) === 'ja';
  const datenschutz = textFeld(daten, 'datenschutz', 4) === 'ja';

  // Pflichtfelder serverseitig — der Browser ist nur die erste Stufe
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || ort.length < 3 || !BEKANNTE_LEISTUNGEN.has(leistung)) {
    return antwortFehler(perFetch, 'Bitte füllen Sie Name, E-Mail, Ort und die gewünschte Leistung vollständig aus.');
  }
  if (!datenschutz) {
    return antwortFehler(perFetch, 'Ohne Einwilligung in die Datenverarbeitung können wir die Anfrage nicht annehmen.');
  }

  // Spamverdacht: Honigtopf ausgefüllt oder unmenschlich schnell abgesendet
  const honigtopf = textFeld(daten, 'firma_seite', 200);
  const dauer = Number.parseInt(textFeld(daten, 'beginn', 20), 10);
  const verdacht = honigtopf.length > 0 || (Number.isFinite(dauer) && dauer >= 0 && dauer < MINDESTDAUER_MS);

  const kennung = crypto.randomUUID();
  const zeitpunkt = new Date().toISOString();
  const schluessel = `${verdacht ? 'verdacht' : 'anfrage'}:${zeitpunkt}:${kennung}`;

  const datensatz = {
    kennung,
    zeitpunkt,
    name,
    email,
    telefon: telefon || null,
    leistung,
    ort,
    nachricht: nachricht || null,
    rueckruf,
    herkunft: {
      verweis: request.headers.get('Referer') ?? null,
      agent: request.headers.get('User-Agent') ?? null,
    },
  };

  // 1. Ablage — zuerst, unabhängig vom Mailversand
  let abgelegt = false;
  if (env.LEADS) {
    try {
      await env.LEADS.put(schluessel, JSON.stringify(datensatz));
      abgelegt = true;
    } catch {
      abgelegt = false;
    }
  }

  // 2. Benachrichtigung — nur im Regelfall, nie beim Verdachtsfall
  let versendet = false;
  if (!verdacht && env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL && env.LEAD_FROM_EMAIL) {
    try {
      const mail = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Immocheck NRW Website <${env.LEAD_FROM_EMAIL}>`,
          to: [env.LEAD_NOTIFY_EMAIL],
          reply_to: email,
          subject: `Neue Anfrage: ${leistung} — ${ort}`,
          text: [
            `Neue Anfrage über immocheck-nrw.de (${zeitpunkt})`,
            '',
            `Name:      ${name}`,
            `E-Mail:    ${email}`,
            `Telefon:   ${telefon || '—'}`,
            `Leistung:  ${leistung}`,
            `Objektort: ${ort}`,
            `Rückruf:   ${rueckruf ? 'ja' : 'nein'}`,
            '',
            'Nachricht:',
            nachricht || '—',
            '',
            `Ablage: ${schluessel}`,
          ].join('\n'),
        }),
      });
      versendet = mail.ok;
    } catch {
      versendet = false;
    }
  }

  // Protokoll nennt nur Kennung und Zustand — keine personenbezogenen Daten
  console.log(`anfrage ${kennung} abgelegt=${abgelegt} versendet=${versendet} verdacht=${verdacht}`);

  if (perFetch) {
    return Response.json({ ok: true });
  }
  // Ohne JavaScript: klassische Weiterleitung auf die Danke-Seite
  return new Response(null, { status: 303, headers: { Location: '/danke' } });
}

function antwortFehler(perFetch: boolean, meldung: string): Response {
  if (perFetch) {
    return Response.json({ ok: false, meldung }, { status: 400 });
  }
  return new Response(null, { status: 303, headers: { Location: '/kontakt?fehler=1' } });
}
