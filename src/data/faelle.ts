/**
 * Echte Fallstudien.
 *
 * Die Liste ist leer, und das ist kein Zwischenstand, sondern der korrekte
 * Zustand: Es gibt noch kein abgeschlossenes Kundenprojekt, dessen Ergebnisse
 * veröffentlicht werden dürften. Diese Datei bereitet nur das Gefäß vor.
 *
 * Warum ein Gefäß und nicht einfach Text auf einer Seite
 * ------------------------------------------------------
 * Fallstudien sind die Stelle, an der eine Agenturwebsite am leichtesten
 * unwahr wird — eine Zahl ohne Messung, ein Kunde ohne Freigabe, ein Foto ohne
 * Erlaubnis. Auf einer Seite, die frei geschrieben wird, fällt das niemandem
 * auf. Hier fällt es auf: `pruefeFall` lässt einen Fall nicht durch, dem eine
 * Freigabe oder eine Quelle fehlt, und bricht den Bau ab. Das ist der einzige
 * Zeitpunkt, zu dem so ein Fehler noch nichts gekostet hat.
 *
 * Was ausdrücklich nicht hierher gehört
 * -------------------------------------
 *   - **Das Beispielprojekt („Musterdach GmbH", `/demo`).** Es ist eine in
 *     Eigenregie gebaute Concept Study mit einem frei erfundenen Betrieb. Es
 *     als Fall zu führen hieße, ein Demonstrationsprojekt als Kundenprojekt
 *     auszugeben — genau die Behauptung, die diese Datei verhindern soll.
 *   - **Laufende Projekte.** Ein Projekt ohne Abschluss hat kein Ergebnis,
 *     über das sich etwas sagen ließe. Es darf als `status: 'laufend'`
 *     eingetragen werden, aber `veroeffentlichen` bleibt dann `false`.
 *   - **Zahlen ohne Messung.** Eine Kennzahl trägt hier zwingend ihren
 *     Zeitraum und ihre Quelle. Wer beides nicht nennen kann, hat keine
 *     Kennzahl, sondern einen Eindruck.
 *
 * So kommt ein Fall später auf die Seite
 * --------------------------------------
 *   1. Eintrag hier anlegen, `veroeffentlichen: false`.
 *   2. Ausgangslage, Leistungen und Ergebnis in eigenen Worten füllen.
 *   3. Kennzahlen nur, wenn sie gemessen sind — mit Zeitraum und Quelle.
 *   4. Schriftliche Freigabe des Kunden einholen, `kundenfreigabe: true` und
 *      `freigabedatum` setzen. Bildmaterial gesondert freigeben lassen.
 *   5. Erst dann `veroeffentlichen: true`. Fehlt etwas, bricht der Bau ab und
 *      sagt, was fehlt.
 */

/** Eine gemessene Zahl. Ohne Zeitraum und Quelle gibt es sie hier nicht. */
export interface Kennzahl {
  /** Was gemessen wurde, z. B. „Qualifizierte Anfragen je Monat". */
  name: string;
  /** Der Wert als Text — Einheit inbegriffen, damit nichts nachträglich
      interpretiert werden muss („38", „38 %", „von 4 auf 11"). */
  wert: string;
  /** Messzeitraum, z. B. „03/2027 – 08/2027". */
  zeitraum: string;
  /** Woher die Zahl stammt, z. B. „Google Ads Konto des Kunden, Export vom
      01.09.2027" oder „Auswertung der Anfragen im KV-Namensraum". Eine
      Herkunft, die sich nicht nachschlagen lässt, ist keine. */
  quelle: string;
}

export interface Fall {
  /** Name des Kunden, wie er genannt werden darf. */
  kunde: string;
  /** Projektname, falls er vom Kundennamen abweicht. Sonst leer. */
  projekt: string;
  /** Adressteil, z. B. `fallstudie-musterbetrieb`. Kleinbuchstaben und
      Bindestriche — er wird Teil einer Adresse und ändert sich danach nie. */
  slug: string;
  /**
   * Branche des Kunden. Wenn es dazu eine Branchenseite gibt, derselbe Name
   * wie in `branchen.ts` (Feld `name`) — dann lässt sich der Fall später dort
   * zeigen. Eine Branche ohne Seite ist zulässig: Der Fall entsteht aus der
   * Arbeit, die Seite kommt danach.
   */
  branche: string;
  status: 'laufend' | 'abgeschlossen' | 'beendet';
  /** Projektzeitraum, z. B. „01/2027 – 06/2027". */
  zeitraum: string;
  /** Wo der Betrieb stand, als das Projekt begann. Ohne Herabsetzung. */
  ausgangslage: string;
  /** Was tatsächlich umgesetzt wurde. Namen wie in `leistungen` aus
      `inhalte.ts`, damit Fall und Leistungsseite dieselbe Sprache sprechen. */
  leistungen: readonly string[];
  /** Das Ergebnis in Worten. Was hier steht, muss auch ohne die Kennzahlen
      tragen — und darf ihnen nicht widersprechen. */
  ergebnis: string;
  /** Gemessene Zahlen. Leer lassen, wenn nichts belastbar gemessen wurde;
      ein Fall ohne Zahlen ist zulässig, eine Zahl ohne Messung nicht. */
  kennzahlen: readonly Kennzahl[];
  /** Liegt die schriftliche Freigabe des Kunden zur Veröffentlichung vor? */
  kundenfreigabe: boolean;
  /** Datum dieser Freigabe im Format TT.MM.JJJJ. */
  freigabedatum: string;
  /** Darf Bildmaterial des Kunden gezeigt werden? Gesondert, weil eine
      Textfreigabe keine Bildfreigabe ist. */
  bildfreigabe: boolean;
  /** Der letzte Schalter. Er allein reicht nicht — siehe `pruefeFall`. */
  veroeffentlichen: boolean;
}

/**
 * Noch keine echte Fallstudie. Bleibt leer, bis ein abgeschlossenes
 * Kundenprojekt mit schriftlicher Freigabe vorliegt.
 *
 * Die leere Liste blockiert nichts: `veroeffentlichteFaelle()` gibt ein leeres
 * Feld zurück, und jede Seite, die Fälle zeigt, zeigt dann eben keine.
 */
export const faelle: readonly Fall[] = [];

/**
 * Prüft einen Fall, der veröffentlicht werden soll, und wirft mit Klartext,
 * wenn eine Voraussetzung fehlt.
 *
 * Bewusst ein Abbruch und keine stille Filterung: Wer `veroeffentlichen: true`
 * setzt, hat eine Absicht. Den Fall dann wortlos wegzulassen, hieße, ihn
 * verschwinden zu lassen, ohne dass jemand merkt, warum — und beim nächsten
 * Versuch passiert dasselbe.
 */
export function pruefeFall(fall: Fall): void {
  if (!fall.veroeffentlichen) return;

  const fehlt: string[] = [];
  if (!fall.kunde) fehlt.push('kunde');
  if (!fall.slug || !/^[a-z0-9-]+$/.test(fall.slug)) fehlt.push('slug (nur a–z, 0–9, Bindestrich)');
  if (!fall.branche) fehlt.push('branche');
  if (fall.status === 'laufend')
    fehlt.push('status — ein laufendes Projekt hat noch kein Ergebnis');
  if (!fall.zeitraum) fehlt.push('zeitraum');
  if (!fall.ergebnis) fehlt.push('ergebnis');
  if (!fall.kundenfreigabe) fehlt.push('kundenfreigabe');
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(fall.freigabedatum))
    fehlt.push('freigabedatum (TT.MM.JJJJ)');

  // Keine Zahl ohne Messung — die Regel aus CLAUDE.md, hier durchgesetzt.
  fall.kennzahlen.forEach((k, i) => {
    if (!k.name || !k.wert) fehlt.push(`kennzahlen[${i}]: name und wert`);
    if (!k.zeitraum) fehlt.push(`kennzahlen[${i}].zeitraum`);
    if (!k.quelle) fehlt.push(`kennzahlen[${i}].quelle`);
  });

  if (fehlt.length > 0) {
    throw new Error(
      `Fallstudie „${fall.kunde || fall.slug || '(ohne Namen)'}" steht auf ` +
        `veroeffentlichen: true, aber es fehlt: ${fehlt.join(', ')}. ` +
        'Entweder nachtragen oder veroeffentlichen auf false setzen — ' +
        'siehe Kopf von src/data/faelle.ts.',
    );
  }
}

/**
 * Die Fälle, die gezeigt werden dürfen. Jede Seite, die Fallstudien anzeigt,
 * holt sie ausschließlich hierüber — nie direkt aus `faelle`.
 */
export function veroeffentlichteFaelle(): readonly Fall[] {
  faelle.forEach(pruefeFall);
  return faelle.filter((f) => f.veroeffentlichen);
}

/** Darf zu diesem Fall Bildmaterial des Kunden gezeigt werden? */
export function darfBilderZeigen(fall: Fall): boolean {
  return fall.veroeffentlichen && fall.bildfreigabe;
}
