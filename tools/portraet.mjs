/**
 * Erzeugt aus einer Originalaufnahme das Gründerporträt in den Fassungen, die
 * die Seite ausliefert — zwei bewusst verschiedene Ausschnitte statt eines
 * skalierten Bildes.
 *
 *   node tools/portraet.mjs bilder-quelle/portraet-original.jpg [--fokus-x 0.45] [--fokus-y 0.28]
 *
 * `fokus-x` und `fokus-y` sind die relative Lage des Gesichts im Original
 * (0 = links/oben, 1 = rechts/unten). Der Ausschnitt wird um diesen Punkt
 * gelegt, sodass das Gesicht im oberen Drittel sitzt — die Stelle, an der das
 * Auge bei einem Porträt zuerst hinsieht.
 *
 * Zwei Ausschnitte:
 *   hoch  4:5  ab 1024 px — steht neben dem Text, Kopf bis Brust
 *   mobil 3:4  darunter   — enger geschnitten, weil die Fläche schmaler ist
 *
 * Beides als WebP in mehreren Breiten. Der Hintergrund tritt durch den
 * Ausschnitt zurück; retuschiert wird nichts.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [, , quelle, ...rest] = process.argv;
if (!quelle || !existsSync(quelle)) {
  console.error(
    'Original fehlt.\n' +
      '  node tools/portraet.mjs bilder-quelle/portraet-original.jpg\n' +
      'Das Original liegt außerhalb von public/ — sonst wanderte es unverkleinert\n' +
      'in den Auslieferungsstand — und außerhalb der Versionierung.',
  );
  process.exit(1);
}

const flagge = (name, standard) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? Number.parseFloat(rest[i + 1]) : standard;
};
/* Vorgabewerte für die vorliegende Aufnahme: Der Kopf sitzt links der Mitte
   im oberen Drittel. Bei einer anderen Aufnahme über die Schalter anpassen. */
/* Der Blick geht nach links aus dem Bild. Deshalb liegt der Ausschnitt etwas
   rechts vom Gesicht: Vor dem Blick bleibt mehr Raum als hinter dem Kopf. */
const fokusX = flagge('fokus-x', 0.45);
const fokusY = flagge('fokus-y', 0.28);

const ZIEL = 'public/images/portraet';
mkdirSync(ZIEL, { recursive: true });

const bild = sharp(quelle, { failOn: 'none' });
const { width: qb, height: qh } = await bild.metadata();
if (!qb || !qh) {
  console.error('Bildmaße nicht lesbar.');
  process.exit(1);
}
console.log(`Original: ${qb}×${qh}`);

/**
 * Legt einen Ausschnitt im gewünschten Verhältnis um den Fokuspunkt.
 * `kopffreiheit` bestimmt, wie weit über dem Gesicht noch Bild stehen bleibt:
 * ein Porträt, dessen Kopf mittig sitzt, wirkt wie ein Ausweisfoto.
 */
function ausschnitt(verhaeltnis, fuellung, kopffreiheit) {
  // Größtmöglicher Kasten im Zielverhältnis, dann auf `fuellung` verkleinert.
  let h = Math.min(qh, qb / verhaeltnis) * fuellung;
  let b = h * verhaeltnis;
  if (b > qb) {
    b = qb;
    h = b / verhaeltnis;
  }
  const mitteX = fokusX * qb;
  const obenSoll = fokusY * qh - h * kopffreiheit;
  const links = Math.round(Math.min(Math.max(mitteX - b / 2, 0), qb - b));
  const oben = Math.round(Math.min(Math.max(obenSoll, 0), qh - h));
  return { left: links, top: oben, width: Math.round(b), height: Math.round(h) };
}

const FASSUNGEN = [
  {
    name: 'hoch',
    verhaeltnis: 4 / 5,
    /* Nicht der größtmögliche Ausschnitt: Bei voller Höhe steht die Person
       klein in einem Saal. Enger heran, bis Kopf bis Hüfte die Fläche tragen. */
    fuellung: 0.78,
    kopffreiheit: 0.19,
    breiten: [640, 960, 1280],
  },
  {
    name: 'mobil',
    /* 6:7 statt 3:4 — rund 12 % flacher. Breite, linke Kante und Oberkante des
       Ausschnitts bleiben dabei unverändert: Gekürzt wird ausschließlich unten,
       Gesicht und Oberkörper stehen also genauso im Bild wie zuvor. Füllung und
       Kopffreiheit sind entsprechend nachgerechnet. */
    verhaeltnis: 6 / 7,
    fuellung: 0.717,
    kopffreiheit: 0.206,
    breiten: [480, 780],
  },
];

const masse = {};
for (const f of FASSUNGEN) {
  const kasten = ausschnitt(f.verhaeltnis, f.fuellung, f.kopffreiheit);
  console.log(
    `${f.name.padEnd(6)} Ausschnitt ${kasten.width}×${kasten.height} ab ${kasten.left},${kasten.top}`,
  );
  for (const breite of f.breiten) {
    const hoehe = Math.round(breite / f.verhaeltnis);
    const datei = join(ZIEL, `portraet-${f.name}-${breite}.webp`);
    await sharp(quelle, { failOn: 'none' })
      .extract(kasten)
      .resize(breite, hoehe, { fit: 'cover' })
      // Etwas Nachschärfen, weil das Verkleinern weich macht.
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 82, effort: 6 })
      .toFile(datei);
    console.log(`  → ${datei}  ${breite}×${hoehe}`);
  }
  masse[f.name] = { breite: f.breiten[0], hoehe: Math.round(f.breiten[0] / f.verhaeltnis) };
}

console.log('\nFertig. Die Komponente findet die Dateien beim nächsten Bau selbst.');
