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

export const site = {
  name: 'S&S Leadcraft',
  angebot: 'Dachdecker-Auftragssystem',
  angebotEnglisch: 'Dachdecker Growth System',
  claim: 'Digitale Kundengewinnung für Dachdeckerbetriebe',
  gruender: 'Sinthusan Sinnathurai',
  ort: 'Sprockhövel',
  land: 'Deutschland',
  gebiet: 'Deutschlandweit',

  telefon: '+491788162328',
  telefonAnzeige: '+49 178 8162328',

  /** Noch nicht vorhanden. Nicht erfinden — siehe Dateikopf. */
  contactEmail: null as string | null,
  /** Text, der überall dort steht, wo sonst die E-Mail-Adresse stünde. */
  emailHinweis: 'E-Mail-Adresse folgt. Bis dahin: Formular oder Telefon.',

  /** Fiktives Demonstrationsprojekt, kein Kunde. */
  demoUrl: 'https://dachdecker-premium-demo.sinthu-sinnathurai.workers.dev/',

  erreichbarkeit: 'Mo–Fr 08:00–18:00 Uhr',
  antwortzeit: 'Wir melden uns innerhalb eines Werktags.',
} as const;

/** Einheitlicher Wortlaut. Nie durch Synonyme ersetzen. */
export const cta = {
  primaer: 'Potenzialanalyse anfragen',
  sekundaer: 'Concept Case ansehen',
  mikro:
    'Kostenfrei · ca. 40 Minuten · kein Verkaufsgespräch. Wir sagen Ihnen auch, wenn wir nicht passen.',
} as const;

/**
 * Angaben für das Impressum. `null` heißt: liegt noch nicht vor. Die
 * Impressumsseite macht jede Lücke sichtbar, statt sie zu erfinden.
 */
export const impressum = {
  anbieter: site.gruender,
  rechtsform: null as string | null,
  strasse: null as string | null,
  plzOrt: null as string | null,
  umsatzsteuerId: null as string | null,
  kleinunternehmer: null as boolean | null,
  /** Nur bei Eintragung. Sonst als kurze Feststellung eintragen. */
  register: null as string | null,
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
