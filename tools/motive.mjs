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
 * kontrastreichste Region statt stumpf die Mitte. Sitzt ein Zuschnitt
 * trotzdem falsch, das Original beschneiden und erneut laufen lassen —
 * hier gibt es bewusst keine Fokus-Schalter je Motiv, damit Werkzeug und
 * Registratur nicht auseinanderlaufen.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const QUELLE = 'bilder-quelle/motive';
const ZIEL = 'public/images/motive';

/** Muss mit src/config/motive.ts übereinstimmen. */
const MOTIVE = [
  { name: 'beratung', format: 16 / 9, formatMobil: 4 / 5, breiten: [960, 1440, 1672], breitenMobil: [480, 780] },
  { name: 'dacharbeit-flaeche', format: 3 / 2, formatMobil: 4 / 5, breiten: [780, 1200, 1672], breitenMobil: [480, 780] },
  { name: 'material', format: 3 / 4, breiten: [640, 1040] },
  { name: 'dacharbeit-detail', format: 21 / 9, formatMobil: 4 / 5, breiten: [1200, 1672], breitenMobil: [480, 780] },
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
    { verhaeltnis: m.format, breiten: m.breiten, zusatz: '' },
    ...(m.formatMobil ? [{ verhaeltnis: m.formatMobil, breiten: m.breitenMobil, zusatz: '-mobil' }] : []),
  ];
  for (const f of fassungen) {
    for (const breite of f.breiten) {
      const hoehe = Math.round(breite / f.verhaeltnis);
      const datei = join(ZIEL, `motiv-${m.name}${f.zusatz}-${breite}.webp`);
      await sharp(quelle, { failOn: 'none' })
        .resize(breite, hoehe, { fit: 'cover', position: sharp.strategy.attention })
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
