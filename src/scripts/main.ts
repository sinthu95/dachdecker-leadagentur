/**
 * Das einzige Skript der Seite. Bewusst ohne Animationsbibliothek:
 * alles läuft über CSS-Transitions, die hier nur ein- und ausgeschaltet werden.
 *
 * Inhalt: Scroll-Enthüllung · Kopfzeilenzustand · mobiles Menü ·
 * UTM-Erfassung · Formularstrecke · Concept-Case-Rundgang · Ereignisse.
 */

const sanft = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
   1 · Enthüllung beim Scrollen
   --------------------------------------------------------------------------- */
function enthuellen() {
  const ziele = document.querySelectorAll<HTMLElement>(
    '.steig, .zeilen, .zieh, .zieh-y, .zeichne, .bildmaske',
  );
  if (!ziele.length) return;

  if (!sanft || !('IntersectionObserver' in window)) {
    ziele.forEach((el) => el.classList.add('sichtbar'));
    return;
  }

  // Pfadlängen für das Zeichnen der Konstruktionslinien setzen. Kreise und
  // Rechtecke gehören dazu — der Lageplan im Gebietsschema besteht daraus.
  //
  // Achtung: Unsere Linien tragen `vector-effect="non-scaling-stroke"`, damit
  // sie in jeder Größe Haarlinien bleiben. Damit rechnet der Browser das
  // Strichmuster aber in Bildschirmpixeln, während getTotalLength() in
  // Koordinaten des viewBox misst. Ohne Umrechnung bleibt jede Linie auf dem
  // Anteil stehen, den der Maßstab gerade ausmacht. Der Faktor kommt aus dem
  // SVG selbst; ein kleiner Aufschlag deckt spätere Größenänderungen ab.
  document
    .querySelectorAll<SVGGeometryElement>(
      'path.zeichne, line.zeichne, circle.zeichne, rect.zeichne, polyline.zeichne',
    )
    .forEach((el) => {
      if (typeof el.getTotalLength !== 'function') return;
      const svg = el.ownerSVGElement;
      const kasten = svg?.getBoundingClientRect();
      const sicht = svg?.viewBox.baseVal;
      const massstab =
        kasten && sicht && sicht.width > 0 && kasten.width > 0 ? kasten.width / sicht.width : 1;
      const laenge = el.getTotalLength() * massstab * 1.02;
      el.style.setProperty('--laenge', String(Math.ceil(laenge)));
    });

  const beobachter = new IntersectionObserver(
    (eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('sichtbar');
        beobachter.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );

  ziele.forEach((el) => beobachter.observe(el));
}

/* ---------------------------------------------------------------------------
   1b · Sehr langsamer Versatz: Bildflächen laufen minimal gegen den Scroll.
   Bewegte Hintergründe gibt es nicht — nur der Bildinhalt versetzt sich
   um wenige Pixel, damit große Flächen nicht wie aufgeklebt wirken.
   --------------------------------------------------------------------------- */
function versatz() {
  const ziele = Array.from(document.querySelectorAll<HTMLElement>('.versatz'));
  if (!ziele.length || !sanft) return;

  let angefordert = false;

  const zeichnen = () => {
    angefordert = false;
    const hoehe = window.innerHeight;
    ziele.forEach((el) => {
      const kasten = el.getBoundingClientRect();
      if (kasten.bottom < -200 || kasten.top > hoehe + 200) return;
      // −1 … +1, gemessen an der Bildmitte gegenüber der Bildschirmmitte
      const lage = (kasten.top + kasten.height / 2 - hoehe / 2) / (hoehe / 2 + kasten.height / 2);
      const staerke = Number.parseFloat(el.dataset.versatz ?? '') || 22;
      el.style.transform = `translate3d(0, ${(lage * staerke).toFixed(2)}px, 0)`;
    });
  };

  const beiScroll = () => {
    if (angefordert) return;
    angefordert = true;
    requestAnimationFrame(zeichnen);
  };

  window.addEventListener('scroll', beiScroll, { passive: true });
  window.addEventListener('resize', beiScroll, { passive: true });
  zeichnen();
}

/* ---------------------------------------------------------------------------
   2 · Kopfzeile: ohne Trennlinie über der Titelseite, mit Linie ab dem Scrollen
   --------------------------------------------------------------------------- */
function kopfzeile() {
  const kopf = document.querySelector<HTMLElement>('[data-header]');
  if (!kopf) return;

  // Beide Zustände müssen sich ausschließen: border-transparent und
  // border-linie sind gleich spezifisch, sonst entscheidet die Reihenfolge
  // im Stylesheet statt der Zustand.
  const fest = ['border-linie', 'bg-papier/92', 'backdrop-blur-sm'];
  const offen = ['border-transparent', 'bg-papier'];
  const pruefen = () => {
    const gescrollt = window.scrollY > 24;
    fest.forEach((k) => kopf.classList.toggle(k, gescrollt));
    offen.forEach((k) => kopf.classList.toggle(k, !gescrollt));
  };

  pruefen();
  window.addEventListener('scroll', pruefen, { passive: true });
}

/* ---------------------------------------------------------------------------
   3 · Mobiles Menü — echter Dialog mit Fokusfang durch den Browser
   --------------------------------------------------------------------------- */
function menue() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-menue]');
  const auf = document.querySelector<HTMLButtonElement>('[data-menue-auf]');
  const zu = document.querySelector<HTMLButtonElement>('[data-menue-zu]');
  if (!dialog || !auf) return;

  const oeffnen = () => {
    dialog.showModal();
    auf.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  };
  const schliessen = () => {
    dialog.close();
  };

  auf.addEventListener('click', oeffnen);
  zu?.addEventListener('click', schliessen);
  dialog.addEventListener('close', () => {
    auf.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  });
  // Navigation im Menü schließt es
  dialog.querySelectorAll('a').forEach((a) => a.addEventListener('click', schliessen));
}

/* ---------------------------------------------------------------------------
   4 · Herkunft der Anfrage festhalten
   Die Parameter werden beim ersten Aufruf gesichert und überleben damit jede
   Navigation innerhalb der Seite. Sie sind die technische Grundlage für das
   Versprechen „Sie sehen bei jeder Anfrage, woher sie kommt".
   --------------------------------------------------------------------------- */
const HERKUNFT_SCHLUESSEL = 'ssl_herkunft';

type Herkunft = Record<string, string>;

function herkunftSichern(): Herkunft {
  let gespeichert: Herkunft = {};
  try {
    gespeichert = JSON.parse(sessionStorage.getItem(HERKUNFT_SCHLUESSEL) || '{}');
  } catch {
    gespeichert = {};
  }

  // Nur beim ersten Aufruf schreiben: der erste Kontakt ist die Quelle.
  if (Object.keys(gespeichert).length > 0) return gespeichert;

  const p = new URLSearchParams(window.location.search);
  const felder = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'fbclid',
    'msclkid',
  ];

  const neu: Herkunft = {};
  felder.forEach((f) => {
    const wert = p.get(f);
    if (wert) neu[f] = wert.slice(0, 200);
  });

  neu.landingpage = window.location.pathname;
  if (document.referrer && !document.referrer.includes(window.location.host)) {
    neu.referrer = document.referrer.slice(0, 300);
  }

  try {
    sessionStorage.setItem(HERKUNFT_SCHLUESSEL, JSON.stringify(neu));
  } catch {
    /* privater Modus: dann eben nur für diese Seite */
  }
  return neu;
}

function herkunftInFormular(herkunft: Herkunft) {
  document.querySelectorAll<HTMLElement>('[data-herkunft-felder]').forEach((behaelter) => {
    Object.entries(herkunft).forEach(([name, wert]) => {
      const feld = document.createElement('input');
      feld.type = 'hidden';
      feld.name = `herkunft_${name}`;
      feld.value = wert;
      behaelter.appendChild(feld);
    });
  });
}

/* ---------------------------------------------------------------------------
   5 · Ereignisse
   Es werden keine Mess-IDs erfunden. Die Ereignisse landen im dataLayer und
   können später ohne Codeänderung an Google oder Meta angebunden werden.
   --------------------------------------------------------------------------- */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function ereignis(name: string, daten: Record<string, unknown> = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...daten });
}

function ereignisse() {
  document.querySelectorAll<HTMLElement>('[data-ereignis]').forEach((el) => {
    el.addEventListener('click', () => ereignis(el.dataset.ereignis as string));
  });
}

/* ---------------------------------------------------------------------------
   6 · Formularstrecke
   Ohne JavaScript sind alle drei Abschnitte sichtbar und absendbar. Mit
   JavaScript wird daraus eine geführte Strecke — kein Inhalt geht verloren.
   --------------------------------------------------------------------------- */
function formular() {
  const form = document.querySelector<HTMLFormElement>('[data-anfrage]');
  if (!form) return;

  const schritte = Array.from(form.querySelectorAll<HTMLFieldSetElement>('[data-schritt]'));
  const zaehler = form.querySelector<HTMLElement>('[data-schritt-zaehler]');
  const balken = form.querySelector<HTMLElement>('[data-schritt-balken]');
  const zurueck = form.querySelector<HTMLButtonElement>('[data-zurueck]');
  const weiter = form.querySelector<HTMLButtonElement>('[data-weiter]');
  const senden = form.querySelector<HTMLButtonElement>('[data-senden]');
  if (schritte.length < 2 || !weiter || !senden) return;

  let aktiv = 0;
  let begonnen = false;

  const zeichnen = () => {
    schritte.forEach((s, i) => {
      s.hidden = i !== aktiv;
    });
    if (zaehler) zaehler.textContent = `Schritt ${String(aktiv + 1).padStart(2, '0')} / ${String(schritte.length).padStart(2, '0')}`;
    if (balken) balken.style.transform = `scaleX(${(aktiv + 1) / schritte.length})`;
    if (zurueck) zurueck.hidden = aktiv === 0;
    weiter.hidden = aktiv === schritte.length - 1;
    senden.hidden = aktiv !== schritte.length - 1;
  };

  /** Nur die Felder des sichtbaren Schrittes prüfen. */
  const schrittGueltig = () => {
    // Erst die Auswahlgruppen: dafür gibt es eine eigene sichtbare Meldung.
    // Die native Sprechblase des Browsers kann an einem flächig überlagerten
    // Bedienelement nicht sinnvoll ankern, deshalb übernehmen wir das selbst.
    const gruppen = schritte[aktiv].querySelectorAll<HTMLElement>('[data-pflichtgruppe]');
    for (const gruppe of gruppen) {
      const gewaehlt = gruppe.querySelectorAll<HTMLInputElement>('input:checked').length;
      const hinweis = gruppe.querySelector<HTMLElement>('[data-gruppenfehler]');
      if (gewaehlt === 0) {
        if (hinweis) hinweis.textContent = 'Bitte wählen Sie mindestens eine Angabe.';
        (gruppe.querySelector('input') as HTMLInputElement | null)?.focus();
        return false;
      }
      if (hinweis) hinweis.textContent = '';
    }

    // Danach die übrigen Felder über die eingebaute Prüfung.
    const felder = Array.from(
      schritte[aktiv].querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >('input, select, textarea'),
    );
    for (const feld of felder) {
      if (!feld.checkValidity()) {
        feld.reportValidity();
        return false;
      }
    }
    return true;
  };

  weiter.addEventListener('click', () => {
    if (!schrittGueltig()) return;
    aktiv = Math.min(aktiv + 1, schritte.length - 1);
    zeichnen();
    form.querySelector<HTMLElement>('[data-schritt]:not([hidden]) input, [data-schritt]:not([hidden]) select')?.focus();
    schritte[aktiv].scrollIntoView({ block: 'nearest', behavior: sanft ? 'smooth' : 'auto' });
  });

  zurueck?.addEventListener('click', () => {
    aktiv = Math.max(aktiv - 1, 0);
    zeichnen();
  });

  form.addEventListener('input', (e) => {
    const gruppe = (e.target as HTMLElement | null)?.closest?.('[data-pflichtgruppe]');
    if (gruppe) {
      const hinweis = gruppe.querySelector<HTMLElement>('[data-gruppenfehler]');
      if (hinweis && gruppe.querySelector('input:checked')) hinweis.textContent = '';
    }
    if (begonnen) return;
    begonnen = true;
    ereignis('lead_start');
  });

  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      // Zum ersten fehlerhaften Schritt zurückspringen, statt still zu scheitern
      const index = schritte.findIndex((s) => !s.checkValidity());
      if (index >= 0 && index !== aktiv) {
        e.preventDefault();
        aktiv = index;
        zeichnen();
        schritte[aktiv].querySelector<HTMLElement>(':invalid')?.focus();
        return;
      }
    }
    ereignis('lead_submit');
    senden.disabled = true;
    senden.textContent = 'Wird gesendet …';
  });

  zeichnen();
}

/* ---------------------------------------------------------------------------
   7 · Concept Case — der einzige gepinnte Scroll-Moment der Seite
   Das Bild im Browserrahmen läuft mit dem Scrollen nach oben, die Anmerkungen
   wechseln passend dazu. Auf Telefonen und bei Bewegungsreduktion greift
   stattdessen die gestapelte Fassung, die im Markup ohnehin vorhanden ist.
   --------------------------------------------------------------------------- */
function conceptCase() {
  const buehne = document.querySelector<HTMLElement>('[data-case]');
  if (!buehne) return;

  const bild = buehne.querySelector<HTMLElement>('[data-case-bild]');
  const rahmen = buehne.querySelector<HTMLElement>('[data-case-rahmen]');
  const notizen = Array.from(buehne.querySelectorAll<HTMLElement>('[data-case-notiz]'));
  const fortschritt = buehne.querySelector<HTMLElement>('[data-case-fortschritt]');
  if (!bild || !rahmen || !notizen.length) return;

  const aktivierbar = () => sanft && window.matchMedia('(min-width: 1024px)').matches;

  let angefordert = false;
  let vollstaendigGemeldet = false;

  const zeichnen = () => {
    angefordert = false;
    if (!aktivierbar()) {
      bild.style.transform = '';
      return;
    }

    const kasten = buehne.getBoundingClientRect();
    const weg = kasten.height - window.innerHeight;
    if (weg <= 0) return;

    const p = Math.min(Math.max(-kasten.top / weg, 0), 1);

    const ueberhang = bild.scrollHeight - rahmen.clientHeight;
    if (ueberhang > 0) bild.style.transform = `translate3d(0,${-(ueberhang * p)}px,0)`;
    if (fortschritt) fortschritt.style.transform = `scaleX(${p})`;

    // Die aktive Anmerkung folgt der tatsächlichen Position des Abschnitts im
    // Bild, nicht gleichmäßigen Abschnitten: die Projektstrecke der Demo ist
    // um ein Vielfaches länger als die übrigen Abschnitte.
    const anteil = bild.scrollHeight > 0 ? (ueberhang * p) / bild.scrollHeight : 0;
    let index = 0;
    notizen.forEach((n, i) => {
      const pos = Number.parseFloat(n.dataset.pos ?? '');
      if (Number.isFinite(pos) && anteil >= pos - 0.02) index = i;
    });

    notizen.forEach((n, i) => {
      const an = i === index;
      n.classList.toggle('opacity-100', an);
      n.classList.toggle('opacity-25', !an);
      n.classList.toggle('text-papier', an);
      n.classList.toggle('text-graphit-hell', !an);
    });

    if (p > 0.92 && !vollstaendigGemeldet) {
      vollstaendigGemeldet = true;
      ereignis('scroll_case');
    }
  };

  const beiScroll = () => {
    if (angefordert) return;
    angefordert = true;
    requestAnimationFrame(zeichnen);
  };

  window.addEventListener('scroll', beiScroll, { passive: true });
  window.addEventListener('resize', beiScroll, { passive: true });
  zeichnen();
}

/* ---------------------------------------------------------------------------
   8 · Mobile Leiste ausblenden, sobald das Formular selbst sichtbar ist
   --------------------------------------------------------------------------- */
function mobilLeiste() {
  const leiste = document.querySelector<HTMLElement>('[data-mobil-cta]');
  const formular = document.querySelector<HTMLElement>('[data-anfrage]');
  if (!leiste || !formular || !('IntersectionObserver' in window)) return;

  const beobachter = new IntersectionObserver(
    ([e]) => leiste.classList.toggle('translate-y-full', e.isIntersecting),
    { threshold: 0.05 },
  );
  beobachter.observe(formular);
}

/* ------------------------------------------------------------------------- */
function start() {
  enthuellen();
  versatz();
  kopfzeile();
  menue();
  ereignisse();
  formular();
  conceptCase();
  mobilLeiste();
  herkunftInFormular(herkunftSichern());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

export {};
