/**
 * Einzige Quelle für alle veränderlichen Stammdaten.
 *
 * Domain und E-Mail-Adresse existieren noch nicht. Sie werden hier — und nur
 * hier — nachgetragen. Es gibt bewusst keine erfundenen Platzhalterwerte, die
 * wie echte Daten aussehen: `contactEmail` ist `null`, und jede Stelle, die
 * sonst eine Adresse zeigen würde, weicht sichtbar auf Telefon und Formular aus.
 */

/** Wird zur Bauzeit aus der Umgebung gelesen. Ohne Domain: `null`. */
const envUrl = (
  typeof process !== 'undefined' ? process.env?.PUBLIC_SITE_URL : undefined
)?.replace(/\/$/, '');

export const siteUrl: string | null = envUrl && envUrl.length > 0 ? envUrl : null;

/**
 * Solange keine Domain gesetzt ist, darf die Seite nicht in den Index geraten.
 * Steuert `robots`-Meta, robots.txt und das Auslassen kanonischer URLs.
 */
export const istVeroeffentlicht = siteUrl !== null;

/**
 * Reservierte Ersatzbasis nach RFC 2606: `.invalid` kann per Definition nie eine
 * echte Domain sein. Damit erzeugt ein Build ohne Domain keine URL, die
 * versehentlich irgendwo hinzeigt.
 */
export const bauBasis = siteUrl ?? 'https://ss-leadcraft.invalid';

/**
 * Die E-Mail-Adresse. Steht vor dem Objekt, weil `emailHinweis` sie braucht:
 * Solange sie fehlte, stand überall ein Ersatztext; jetzt steht überall die
 * Adresse. Ein zweiter Ort, an dem „E-Mail folgt" hängenbliebe, wäre genau
 * die Art von Widerspruch, die auf einer Seite auffällt.
 */
const email: string | null = 'kontakt@ssleadcraft.de';

export const site = {
  name: 'S&S Leadcraft',
  /**
   * Der interne Name des Systems. Er wird im Fließtext als Name verwendet
   * („Intern heißt er …", „… im Detail") und muss deshalb ein Name bleiben,
   * keine Kategorie. Bewusst „Anfrage", nicht „Auftrag": Gewonnen werden
   * qualifizierte Anfragen — den Auftrag schließt der Betrieb selbst ab.
   */
  angebot: 'Anfragesystem',
  angebotEnglisch: 'Lead Generation System',
  /**
   * Die Wortmarken-Zeile: die Kurzform, die neben dem Namen steht.
   * Der eigentliche Hauptclaim ist die Titelzeile des Heros — „Nachfrage
   * entsteht nicht zufällig." Sie steht dort und nur dort, weil sie eine
   * Setzung ist und kein Textbaustein.
   */
  claim: 'Websites, Werbung und Automatisierung als ein System',
  /**
   * Der Satz unter dem Claim. Er stand wortgleich an drei Stellen — im Hero,
   * in der Fußzeile und in der Beschreibung der Startseite. Drei Kopien eines
   * Satzes gehen auseinander, sobald einer davon angefasst wird; jetzt steht
   * er hier. Die Beschreibung der Startseite bleibt bewusst eine eigene
   * Fassung: Sie muss unter 160 Zeichen passen und nennt die Kanäle beim
   * Namen, weil sie in einem Suchergebnis steht und nicht auf der Seite.
   */
  erklaerung:
    'Websites, Werbung und Automatisierung als ein System — für Unternehmen, die planbar qualifizierte Anfragen gewinnen wollen.',
  gruender: 'Sinthusan Sinnathurai',
  ort: 'Sprockhövel',
  land: 'Deutschland',
  gebiet: 'Deutschlandweit',

  telefon: '+491788162328',
  telefonAnzeige: '+49 178 8162328',

  contactEmail: email,
  /**
   * Steht dort, wo im Fließtext auf den E-Mail-Weg verwiesen wird. Ohne
   * Adresse war das ein Ersatztext; mit Adresse nennt er sie.
   */
  emailHinweis: email
    ? `E-Mail: ${email}`
    : 'E-Mail-Adresse folgt. Bis dahin: Formular oder Telefon.',

  /** Fiktives Demonstrationsprojekt, kein Kunde. */
  demoUrl: 'https://dachdecker-premium-demo.sinthu-sinnathurai.workers.dev/',

  erreichbarkeit: 'Mo–Fr 08:00–18:00 Uhr',
  antwortzeit: 'Wir melden uns innerhalb eines Werktags.',
} as const;

/** Einheitlicher Wortlaut. Nie durch Synonyme ersetzen. */
export const cta = {
  primaer: 'Potenzialanalyse anfragen',
  sekundaer: 'Beispielprojekt ansehen',
  mikro:
    'Kostenfrei · ca. 40 Minuten · kein Verkaufsgespräch. Wir sagen Ihnen auch, wenn wir nicht passen.',
} as const;

/**
 * Angaben für das Impressum. `null` heißt: liegt noch nicht vor. Die
 * Impressumsseite macht jede Lücke sichtbar, statt sie zu erfinden.
 */
export const impressum = {
  anbieter: site.gruender,
  rechtsform: 'Einzelunternehmen' as string | null,
  strasse: 'Heidestraße 36' as string | null,
  plzOrt: '45549 Sprockhövel' as string | null,
  /**
   * ZU BESTÄTIGEN — Stand 14.09.2026.
   *
   * Die steuerliche Erfassung des Unternehmens ist noch nicht abgeschlossen.
   * Ob die Kleinunternehmerregelung nach § 19 UStG gilt, ist damit nicht
   * endgültig entschieden. Der Wert steht hier unverändert weiter, und zwar
   * bewusst:
   *
   * `impressumVollstaendig` verlangt eine Aussage zur Umsatzsteuer — entweder
   * eine USt-IdNr. oder diesen Hinweis. Wird das Feld auf `null` gesetzt, gilt
   * das Impressum als unvollständig, und Impressum wie Datenschutz fallen auf
   * der laufenden Seite automatisch auf `noindex`, zusätzlich erscheint der
   * Unvollständigkeitshinweis. Ein Impressum ohne jede Umsatzsteuerangabe wäre
   * also nicht der vorsichtigere, sondern der schlechtere Zustand.
   *
   * Sobald der Bescheid vorliegt: Wert hier bestätigen oder durch die
   * USt-IdNr. ersetzen und diesen Kommentar entfernen. Die Entscheidung
   * trifft der Inhaber mit seiner steuerlichen Beratung, nicht dieses
   * Repository.
   */
  umsatzsteuerId: null as string | null,
  kleinunternehmer: true as boolean | null,
  /** Nur bei Eintragung. Sonst als kurze Feststellung eintragen. */
  register: 'Nicht im Handelsregister eingetragen' as string | null,
  /** Nur bei zulassungspflichtiger Tätigkeit. */
  aufsichtsbehoerde: null as string | null,
} as const;

/**
 * Was § 5 DDG in jedem Fall verlangt: Name, Rechtsform, ladungsfähige
 * Anschrift und ein elektronischer Weg zur schnellen Kontaktaufnahme.
 */
const IMPRESSUM_PFLICHT = ['rechtsform', 'strasse', 'plzOrt'] as const;

/**
 * Zur Umsatzsteuer muss eine Aussage getroffen sein — entweder eine
 * USt-IdNr. oder der Hinweis auf die Kleinunternehmerregelung. Beides zu
 * verlangen wäre widersprüchlich: Wer Kleinunternehmer ist, hat keine.
 */
export const umsatzsteuerGeklaert =
  impressum.umsatzsteuerId !== null || impressum.kleinunternehmer !== null;

/**
 * Registereintrag und Aufsichtsbehörde gehen bewusst nicht in die Prüfung
 * ein: Ein nicht eingetragenes Einzelunternehmen hat keinen Registereintrag,
 * und eine Aufsichtsbehörde gibt es nur bei zulassungspflichtiger Tätigkeit.
 * Sie hier zu verlangen hieße, den Livegang an eine erfundene Angabe zu
 * knüpfen — genau das soll nicht passieren.
 */
export const impressumVollstaendig =
  IMPRESSUM_PFLICHT.every((feld) => impressum[feld] !== null) &&
  umsatzsteuerGeklaert &&
  site.contactEmail !== null;
