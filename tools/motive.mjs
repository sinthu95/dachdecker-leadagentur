/**
 * Erzeugt aus den Originalen der Übergangsmotive die WebP-Fassungen, die die
 * Seite ausliefert.
 *
 *   node tools/motive.mjs
 *
 * Erwartet die Originale unter `bilder-quelle/motive/<name>.jpg` (oder .png,
 * .webp). Die Liste der Motive, Formate und Breiten muss mit
 * `src/config/motive.ts` übereinstimmen — dort steht auch, warum es diese
 * Motive sind und welche Regeln für sie gelten.
 *
 * Der Zuschnitt ist inhaltsgewichtet (sharp `attention`): Er sucht die
 * kontrastreichste Region statt stumpf die Mitte.
 *
 * Für den mobilen Ausschnitt lässt sich das je Motiv über `fokusMobil`
 * übersteuern. Der Grund ist gemessen, nicht theoretisch: Aus 16/9 nach 4/5
 * fällt gut die Hälfte der Breite weg, und `attention` wählte bei den
 * Personenaufnahmen die kontrastreiche Dachfläche — dem Handwerker wurde das
 * Gesicht abgeschnitten, der Dachdecker fiel ganz aus dem Bild.
 *
 * Das ist kein Widerspruch zur Regel, dass Werkzeug und Registratur nicht
 * auseinanderlaufen dürfen: `fokusMobil` beschreibt allein, wie zugeschnitten
 * wird. In `src/config/motive.ts` steht davon nichts, weil das Markup es
 * nicht kennen muss.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const QUELLE = 'bilder-quelle/motive';
const ZIEL = 'public/images/motive';

/** Muss mit src/config/motive.ts übereinstimmen. */
const MOTIVE = [
  // fokusMobil: 'centre' — bei allen drei steht das Motiv mittig, während
  // `attention` an die kontrastreiche Dachfläche am Rand lief.
  { name: 'beratung', format: 16 / 9, formatMobil: 4 / 5, breiten: [960, 1440, 1672], breitenMobil: [480, 780], fokusMobil: 'centre' },
  { name: 'dacharbeit-flaeche', format: 3 / 2, formatMobil: 4 / 5, breiten: [780, 1200, 1672], breitenMobil: [480, 780], fokusMobil: 'centre' },
  { name: 'material', format: 3 / 4, breiten: [640, 1040] },
  { name: 'dacharbeit-detail', format: 21 / 9, formatMobil: 4 / 5, breiten: [1200, 1672], breitenMobil: [480, 780], fokusMobil: 'centre' },
];

const ENDUNGEN = ['jpg', 'jpeg', 'png', 'webp'];

function original(name) {
  for (const e of ENDUNGEN) {
    const pfad = join(QUELLE, `${name}.${e}`);
    if (existsSync(pfad)) return pfad;
  }
  return null;
}

mkdirSync(ZIEL, { recursive: true });

let erzeugt = 0;
let fehlend = 0;

for (const m of MOTIVE) {
  const quelle = original(m.name);
  if (!quelle) {
    console.log(`—  ${m.name}: kein Original unter ${QUELLE}/${m.name}.{${ENDUNGEN.join(',')}}`);
    fehlend += 1;
    continue;
  }
  const fassungen = [
    { verhaeltnis: m.format, breiten: m.breiten, zusatz: '', fokus: sharp.strategy.attention },
    ...(m.formatMobil
      ? [{
          verhaeltnis: m.formatMobil,
          breiten: m.breitenMobil,
          zusatz: '-mobil',
          fokus: m.fokusMobil ?? sharp.strategy.attention,
        }]
      : []),
  ];
  for (const f of fassungen) {
    for (const breite of f.breiten) {
      const hoehe = Math.round(breite / f.verhaeltnis);
      const datei = join(ZIEL, `motiv-${m.name}${f.zusatz}-${breite}.webp`);
      await sharp(quelle, { failOn: 'none' })
        .resize(breite, hoehe, { fit: 'cover', position: f.fokus })
        .sharpen({ sigma: 0.5 })
        .webp({ quality: 80, effort: 6 })
        .toFile(datei);
      console.log(`→  ${datei}  ${breite}×${hoehe}`);
      erzeugt += 1;
    }
  }
}

console.log(
  `\n${erzeugt} Fassungen erzeugt, ${fehlend} Motive ohne Original.` +
    (fehlend ? ' Die Seite zeigt dort weiter das gestaltete Bildfeld.' : ''),
);
