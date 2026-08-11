/**
 * Reduziert die ausgelieferten Schriften auf den tatsächlich benötigten
 * Zeichensatz (Deutsch inklusive Umlaute, Anführungszeichen, technische
 * Zeichen). Eine vollständige Latin-Datei enthält Hunderte Glyphen, die auf
 * dieser Seite nie vorkommen — bei drei Schriftfamilien wäre das ein
 * Vielfaches des Ladebudgets.
 *
 * Voraussetzung: python3 mit fonttools und brotli.
 *
 *   node tools/schriften.mjs <quellordner>
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const quelle = process.argv[2];
if (!quelle) {
  console.error('Aufruf: node tools/schriften.mjs <quellordner-mit-woff2>');
  process.exit(1);
}
const ziel = new URL('../public/fonts/', import.meta.url).pathname;
mkdirSync(ziel, { recursive: true });

/** Zeichen, die auf der Seite vorkommen können. */
const ZEICHEN = [
  // Basis-Latein
  ' !"#$%&\'()*+,-./0123456789:;<=>?@',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`',
  'abcdefghijklmnopqrstuvwxyz{|}~',
  // Deutsch
  'ÄÖÜäöüß',
  // Weitere Akzente, die in Eigennamen auftreten können
  'ÀÁÂÃÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕØÙÚÛÝàáâãåæçèéêëìíîïñòóôõøùúûýÿ',
  // Typografie
  '„“”‚‘’«»‹›–—…·•€£§©®™°±×÷≈≠≤≥',
  // Technische Marken der Gestaltung
  '↗→←↑↓⌐¬◇◆□■△▲†‡№',
].join('');

const einzeln = [...new Set([...ZEICHEN])].join('');

const kb = (p) => (statSync(p).size / 1024).toFixed(1).padStart(6);

console.log('Datei                    vorher    nachher');
console.log('─'.repeat(48));

/**
 * Achsen, die vor dem Reduzieren festgesetzt werden. Eine variable Schrift mit
 * Optical-Size-Achse schleppt Variationsdaten für alle Grade mit; die Serife
 * wird hier aber nur in einem engen Größenbereich verwendet.
 */
const ACHSEN = {
  'serif.woff2': ['opsz=24', 'wght=400'],
  'serif-it.woff2': ['opsz=24', 'wght=400'],
};

// Zwischendateien der Instanzierung überspringen
for (const datei of readdirSync(quelle).filter((d) => d.endsWith('.woff2') && !d.startsWith('fix-'))) {
  const ein = join(quelle, datei);
  const aus = join(ziel, datei);
  const vorher = kb(ein);

  let quellDatei = ein;
  if (ACHSEN[datei]) {
    quellDatei = join(quelle, `fix-${datei}`);
    execFileSync(
      'python3',
      ['-m', 'fontTools.varLib.instancer', ein, ...ACHSEN[datei], '-o', quellDatei],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
  }

  execFileSync(
    'python3',
    [
      '-m',
      'fontTools.subset',
      quellDatei,
      `--text=${einzeln}`,
      '--flavor=woff2',
      `--output-file=${aus}`,
      '--layout-features=kern,liga,calt,tnum,frac,ccmp,locl',
      '--no-hinting',
      '--desubroutinize',
      '--drop-tables+=DSIG',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );

  console.log(`${datei.padEnd(24)} ${vorher} → ${kb(aus)} KB`);
}

const summe = readdirSync(ziel)
  .filter((d) => d.endsWith('.woff2'))
  .reduce((s, d) => s + statSync(join(ziel, d)).size, 0);
console.log('─'.repeat(48));
console.log(`Ausgeliefert insgesamt: ${(summe / 1024).toFixed(1)} KB`);
