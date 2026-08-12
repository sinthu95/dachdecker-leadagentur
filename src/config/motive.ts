import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Die Übergangsmotive: lizenzierte Material- und Architekturaufnahmen für die
 * Bildfelder, bis eigene Fotografie produziert ist.
 *
 * Zwei Regeln tragen diese Liste:
 *   - Nur Material und Architektur. Keine fremden Menschen bei der Arbeit —
 *     das würde „unsere Baustelle" behaupten, und genau das erfindet diese
 *     Seite nicht. B-03 (Hände am Werkstück) bleibt deshalb gestaltetes
 *     Bildfeld, bis ein eigenes Shooting es füllt.
 *   - Jede Aufnahme trägt ihre Quelle sichtbar in der Bemaßungszeile. Nichts
 *     sieht nach eigener Referenz aus, was keine ist.
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
    // B-01 — Startseite, Bildband unter dem Hero
    name: 'dachlandschaft',
    alt: 'Dachlandschaft mit Ziegeldächern und Gauben, von erhöhter Position über die Firstlinien gesehen',
    quelle: 'Aufnahme: Unsplash · Chris Weiher',
    format: '16/9',
    formatMobil: '4/5',
    breiten: [960, 1440, 1920],
    breitenMobil: [480, 780],
    sizes: '(min-width: 1680px) 66rem, 66vw',
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
    name: 'objekt',
    alt: 'Wohnhaus mit klar geschnittenem Steildach in der Gesamtansicht, ruhiger Himmel',
    quelle: 'Aufnahme: Unsplash · Valentin',
    format: '21/9',
    formatMobil: '4/5',
    breiten: [1200, 1920, 2560],
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
