/**
 * Misst den tatsächlichen Kontrast jedes Textelements gegen die Fläche,
 * auf der es liegt — nicht gegen die Tokenliste, sondern gegen das, was
 * der Browser wirklich zeichnet.
 */
import puppeteer from 'puppeteer-core';

const basis = process.argv[2] ?? 'http://127.0.0.1:4321';
const SEITEN = ['/', '/leistungen', '/dachdecker', '/demo', '/ueber-uns', '/kontakt', '/danke', '/impressum', '/datenschutz'];

const browser = await puppeteer.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const alle = new Map();

for (const pfad of SEITEN) {
  await page.goto(new URL(pfad, basis).href, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await new Promise((f) => {
      let y = 0;
      const s = () => { y += innerHeight; scrollTo(0, y); if (y < document.body.scrollHeight) setTimeout(s, 20); else setTimeout(f, 200); };
      s();
    });
    document.querySelectorAll('.steig,.zeilen,.zieh,.zieh-y,.zeichne,.bildmaske').forEach((e) => e.classList.add('sichtbar'));
  });

  const funde = await page.evaluate(() => {
    const zuRGB = (s) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const t = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { r: t[0], g: t[1], b: t[2], a: t.length > 3 ? t[3] : 1 };
    };
    const mischen = (v, h) => ({
      r: v.r * v.a + h.r * (1 - v.a),
      g: v.g * v.a + h.g * (1 - v.a),
      b: v.b * v.a + h.b * (1 - v.a),
      a: 1,
    });
    const leuchtdichte = ({ r, g, b }) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const verhaeltnis = (a, b) => {
      const [x, y] = [leuchtdichte(a), leuchtdichte(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    /**
     * Die erste undurchsichtige Fläche über den Vorfahren hinweg.
     * Liegt unterwegs ein Bild oder ein Verlauf, ist der Untergrund nicht
     * berechenbar — dann meldet die Prüfung das, statt eine Zahl zu erfinden.
     */
    const hintergrund = (el) => {
      let k = el;
      let farbe = { r: 255, g: 255, b: 255, a: 1 };
      const stapel = [];
      let unberechenbar = false;
      while (k && k !== document.documentElement.parentNode) {
        const s = getComputedStyle(k);
        if (s.backgroundImage && s.backgroundImage !== 'none') unberechenbar = true;
        const bg = zuRGB(s.backgroundColor);
        if (bg && bg.a > 0) { stapel.unshift(bg); if (bg.a === 1) break; }
        k = k.parentElement;
      }
      for (const s of stapel) farbe = mischen(s, farbe);
      return { ...farbe, unberechenbar };
    };

    const ergebnis = [];
    document.querySelectorAll('body *').forEach((el) => {
      // Nur Elemente mit eigenem Text, die auch gezeichnet werden.
      const eigenerText = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .trim();
      if (!eigenerText) return;
      if (!el.getClientRects().length) return;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || Number(s.opacity) < 0.15) return;
      const vg = zuRGB(s.color);
      if (!vg) return;
      const hg = hintergrund(el);
      if (hg.unberechenbar) {
        ergebnis.push({
          unberechenbar: true,
          px: Math.round(parseFloat(s.fontSize)),
          farbe: s.color,
          flaeche: 'Bild oder Verlauf',
          klasse: (el.className || '').toString().split(/\s+/).slice(0, 3).join(' '),
          text: eigenerText.slice(0, 46),
        });
        return;
      }
      const v = verhaeltnis(mischen(vg, hg), hg);
      const px = parseFloat(s.fontSize);
      const fett = Number(s.fontWeight) >= 700;
      const gross = px >= 24 || (px >= 18.66 && fett);
      const soll = gross ? 3 : 4.5;
      if (v < soll) {
        ergebnis.push({
          v: Math.round(v * 100) / 100,
          soll,
          px: Math.round(px),
          farbe: s.color,
          flaeche: `rgb(${Math.round(hg.r)}, ${Math.round(hg.g)}, ${Math.round(hg.b)})`,
          klasse: (el.className || '').toString().split(/\s+/).slice(0, 3).join(' '),
          text: eigenerText.slice(0, 46),
        });
      }
    });
    return ergebnis;
  });

  for (const f of funde) {
    const schluessel = `${f.farbe}|${f.flaeche}|${f.px}|${f.klasse}`;
    if (!alle.has(schluessel)) alle.set(schluessel, { ...f, seiten: new Set() });
    alle.get(schluessel).seiten.add(pfad);
  }
}
await browser.close();

const alleFunde = [...alle.values()];
const messbar = alleFunde.filter((f) => !f.unberechenbar).sort((a, b) => a.v - b.v);
const manuell = alleFunde.filter((f) => f.unberechenbar);

for (const f of messbar) {
  console.log(
    `${String(f.v).padStart(5)} : ${f.soll}  ${String(f.px).padStart(3)}px  ${f.farbe.padEnd(22)} auf ${f.flaeche.padEnd(20)} ${f.klasse.padEnd(30)} „${f.text}"  [${[...f.seiten].join(' ')}]`,
  );
}
if (manuell.length) {
  console.log('\nNicht automatisch messbar — Text über Bild oder Verlauf, bitte ansehen:');
  for (const f of manuell) {
    console.log(
      `  ${String(f.px).padStart(3)}px  ${f.farbe.padEnd(22)} ${f.klasse.padEnd(30)} „${f.text}"  [${[...f.seiten].join(' ')}]`,
    );
  }
}
console.log(`\n${messbar.length} Kontrastbefunde, ${manuell.length} manuell zu prüfen`);
process.exit(messbar.length ? 1 : 0);
