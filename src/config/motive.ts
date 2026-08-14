import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Die Übergangsmotive: lizenzierte Material- und Architekturaufnahmen für die
 * Bildfelder, bis eigene Fotografie produziert ist.
 *
 * Eine Regel trägt diese Liste:
 *   - Jede Aufnahme trägt ihre Quelle sichtbar unter dem Bild. Nichts sieht
 *     nach eigener Referenz aus, was keine ist.
 *
 * Zur Herkunft der aktuellen drei Motive
 * --------------------------------------
 * Hier stand: „Nur Material und Architektur. Keine fremden Menschen bei der
 * Arbeit — das würde »unsere Baustelle« behaupten." Diese Einschränkung ist
 * am 14.08.2026 auf ausdrückliche Anweisung des Inhabers aufgehoben worden,
 * nachdem der Konflikt benannt war.
 *
 * Die drei Aufnahmen sind KI-generiert und zeigen Personen bei Beratung und
 * Dacharbeit. Sie tragen deshalb ausnahmslos den Nachweis „Symbolbild ·
 * KI-generiert" sichtbar unter dem Bild — sichtbar, nicht im Alternativtext
 * versteckt. Wer sie sieht, soll nicht glauben, das sei eine Baustelle von
 * S&S Leadcraft; das Unternehmen deckt keine Dächer, es gewinnt Kunden für
 * Betriebe, die es tun.
 *
 * Der Nachweis ist keine Formalie, sondern der Preis dafür, dass die Bilder
 * überhaupt stehen dürfen. Wird er entfernt, behauptet die Seite etwas, das
 * nicht stimmt.
 *
 * Die Originale liegen in `bilder-quelle/motive/<name>.jpg` — außerhalb von
 * public/ und außerhalb der Versionierung. `tools/motive.mjs` erzeugt daraus
 * die WebP-Fassungen in `public/images/motive/`. Fehlen sie, zeigen die
 * Komponenten weiter das gestaltete Bildfeld: Es gibt keinen Zustand, in dem
 * ein leerer Rahmen ausgeliefert wird.
 *
 * Die Breiten müssen mit `tools/motive.mjs` übereinstimmen.
 */
export interface Motiv {
  /** Dateistamm, z. B. `dachlandschaft` → `motiv-dachlandschaft-960.webp` */
  name: string;
  alt: string;
  /** Sichtbarer Bildnachweis, z. B. „Aufnahme: Unsplash · Chris Weiher" */
  quelle: string;
  /** Seitenverhältnis ab 1024 px, als CSS-Bruch, z. B. '16/9' */
  format: string;
  /** Seitenverhältnis darunter; entfällt, wenn das Feld mobil nicht steht */
  formatMobil?: string;
  breiten: number[];
  breitenMobil?: number[];
  /** sizes-Angabe für die Desktop-Quelle */
  sizes: string;
}

export const motive: readonly Motiv[] = [
  {
    // B-01 — Startseite, große Fläche unter dem Hero
    // Original 1672 × 941. Die Breiten enden deshalb bei 1672: Alles darüber
    // wäre hochgerechnet und damit weicher als das Original, nicht schärfer.
    name: 'beratung',
    alt: 'Handwerker in dunkler Arbeitsjacke im Gespräch mit einer Kundin vor einem modernen Wohnhaus mit dunklem Ziegeldach, ein Tablet in der Hand',
    quelle: 'Symbolbild · KI-generiert',
    format: '16/9',
    formatMobil: '4/5',
    breiten: [960, 1440, 1672],
    breitenMobil: [480, 780],
    sizes: '(min-width: 1680px) 66rem, 66vw',
  },
  {
    // B-03 — Startseite, Bildfläche im Abschnitt „Problem"
    name: 'dacharbeit-flaeche',
    alt: 'Dachdecker mit Auffanggurt kniet auf einer dunklen Ziegeldachfläche und setzt einen Ziegel; im Hintergrund Giebel, Schornstein und offener Himmel',
    quelle: 'Symbolbild · KI-generiert',
    format: '3/2',
    formatMobil: '4/5',
    breiten: [780, 1200, 1672],
    breitenMobil: [480, 780],
    sizes: '(min-width: 1680px) 58rem, 58vw',
  },
  {
    // B-02 — Startseite, schmale Spalte neben B-01 (nur ab 1024 px)
    name: 'material',
    alt: 'Schieferdeckung in Nahaufnahme — dunkle Platten im Wiederholungsmuster, streifendes Licht',
    quelle: 'Aufnahme: Unsplash',
    format: '3/4',
    breiten: [640, 1040],
    sizes: '(min-width: 1680px) 33rem, 33vw',
  },
  {
    // B-04 — Startseite, vollbreites Band vor „Ehrlichkeit"
    // Auch hier endet die Leiter beim Original: 1672 px über die volle
    // Fensterbreite ist auf großen Schirmen sichtbar weniger scharf als die
    // übrigen Flächen. Das ist eine Grenze der Vorlage, kein Einbaufehler —
    // eine höher aufgelöste Fassung würde sie sofort beheben.
    name: 'dacharbeit-detail',
    alt: 'Nahaufnahme: behandschuhte Hände legen einen dunklen Dachziegel in die Lattung, tiefstehendes Abendlicht',
    quelle: 'Symbolbild · KI-generiert',
    format: '21/9',
    formatMobil: '4/5',
    breiten: [1200, 1672],
    breitenMobil: [480, 780],
    sizes: '100vw',
  },
] as const;

export const MOTIV_PFAD = '/images/motive';

/** Zur Bauzeit: liegen die erzeugten Fassungen für dieses Motiv vor? */
export function motivVorhanden(name: string): boolean {
  const m = motive.find((e) => e.name === name);
  if (!m) return false;
  return existsSync(
    join(process.cwd(), 'public', 'images', 'motive', `motiv-${m.name}-${m.breiten[0]}.webp`),
  );
}

export function motivDaten(name: string): Motiv | undefined {
  return motive.find((e) => e.name === name);
}
