/**
 * Zentrale Inhalte. Bewusst als Daten statt als Text im Markup, damit
 * Formulierungen an einer Stelle geändert werden können und die Abschnitte
 * über alle Seiten hinweg identisch bleiben.
 *
 * Redaktionsregel: keine Zahl ohne Messung, keine Kundenbehauptung ohne
 * Kunden, keine Zeitdruckmechanik.
 */

export const navigation = [
  { href: '/leistungen', label: 'Das System' },
  { href: '/demo', label: 'Concept Case' },
  { href: '/dachdecker', label: 'Für Dachdecker' },
  { href: '/ueber-uns', label: 'Über uns' },
  { href: '/kontakt', label: 'Kontakt' },
] as const;

/** Drei Fakten direkt unter dem Hero — Bestätigung „ich bin hier richtig". */
export const orientierung = [
  { k: 'Fokus', v: 'Ausschließlich Dachdeckerbetriebe' },
  { k: 'Gebiet', v: 'Deutschlandweit' },
  { k: 'Grundsatz', v: 'Ein Betrieb je Einzugsgebiet' },
] as const;

/** Die drei Stufen des Angebots. Nach außen ein System, kein Katalog. */
export const stufen = [
  {
    nr: '01',
    name: 'Aufmaß',
    zeit: 'einmalig · ca. 2 Wochen',
    satz: 'Wir messen, bevor wir bauen.',
    text: 'Bevor eine einzige Zeile Text entsteht, klären wir, welche Aufträge in Ihrem Einzugsgebiet digital überhaupt zu holen sind — und welche nicht.',
    punkte: [
      'Markt- und Wettbewerbsanalyse im Einzugsgebiet',
      'Analyse der bestehenden Website und Sichtbarkeit',
      'Auswahl der Leistungen mit der besten Marge',
      'Positionierung und Botschaft',
      'Definition der Wunschanfrage',
    ],
    ergebnis: 'Klarheit, welche Aufträge digital zu holen sind.',
  },
  {
    nr: '02',
    name: 'Aufbau',
    zeit: 'einmalig · ca. 3–5 Wochen',
    satz: 'Das Anfragesystem entsteht.',
    text: 'Ein Auftritt, der Anfragen aufnehmen kann, statt nur zu existieren. Jedes Bauteil hat eine Aufgabe und ist einzeln überprüfbar.',
    punkte: [
      'Premium-Website oder Conversion-Landingpage',
      'Anfragestrecke mit Qualifizierungsformular',
      'Tracking und Conversion-Messung',
      'Google Business Profile',
      'Lokale SEO-Grundlagen',
      'Erste Anzeigenmotive',
    ],
    ergebnis: 'Ein Auftritt, der Anfragen aufnimmt.',
  },
  {
    nr: '03',
    name: 'Auslastung',
    zeit: 'laufend',
    satz: 'Nachfrage erzeugen, messen, nachsteuern.',
    text: 'Ein Zufluss, der sich hoch- und runterregeln lässt — passend zu dem, was Ihre Kolonnen tatsächlich schaffen.',
    punkte: [
      'Google Ads für aktive Suchanfragen',
      'Meta Ads regional, später Retargeting',
      'Creative-Produktion: Hooks, Bilder, Kurzvideos',
      'Landingpage-Varianten je Leistung',
      'Monatliche Auswertung und Rückkopplung zur Anfragequalität',
      'Optional Content und Social Media',
      'Optional Recruiting über digitale Kampagnen',
    ],
    ergebnis: 'Ein Zufluss, der sich regeln lässt.',
  },
] as const;

/** Der Ablauf, den das System erzeugt. Wird als gezeichnete Kette dargestellt. */
export const kette = [
  { k: 'Aufmerksamkeit', v: 'Suche und regionale Anzeigen' },
  { k: 'Landingpage', v: 'Ein Ziel je Seite' },
  { k: 'Vertrauen', v: 'Arbeit sichtbar machen' },
  { k: 'Qualifizierung', v: 'Passt der Auftrag?' },
  { k: 'Anfrage', v: 'Exklusiv, an Sie' },
  { k: 'Messung', v: 'Herkunft jeder Anfrage' },
  { k: 'Optimierung', v: 'Budget dorthin, wo es wirkt' },
] as const;

/** Was der Betrieb kennt — und was wir dagegensetzen. */
export const wettbewerb = [
  {
    was: 'Portale',
    zusatz: 'Aroundhome und ähnliche',
    denkt: 'Der Lead wird an vier Betriebe verkauft. Ich bin nur noch der Billigste im Vergleich.',
    antwort:
      'Eigene Anfragen statt geteilter Leads. Die Anfrage kommt über Ihre Seite, zu Ihnen, exklusiv.',
  },
  {
    was: 'Der lokale Webdesigner',
    zusatz: null,
    denkt: 'Sieht schön aus. Passiert nur nichts.',
    antwort:
      'Eine Website ist bei uns kein Produkt, sondern ein Bauteil. Ohne Nachfrage und Messung liefern wir sie nicht.',
  },
  {
    was: 'Die Full-Service-Agentur',
    zusatz: null,
    denkt: 'Die reden über Reichweite und schicken mir Diagramme, die ich nicht brauche.',
    antwort: 'Wir berichten in Anfragen und Auftragsarten, nicht in Impressionen.',
  },
  {
    was: 'Nichts tun',
    zusatz: 'der häufigste Wettbewerber',
    denkt: 'Läuft doch über Empfehlung.',
    antwort:
      'Empfehlung ist gut — aber nicht steuerbar. Wer sie nicht ergänzt, überlässt die Auslastung dem Zufall.',
  },
] as const;

/** Der Prozess über die Zeit. Betont, wie wenig der Betrieb selbst tun muss. */
export const prozess = [
  {
    nr: '01',
    name: 'Potenzialanalyse',
    zeit: 'ca. 40 Minuten',
    text: 'Wir sehen uns Ihr Einzugsgebiet, Ihre Leistungen und Ihren jetzigen Auftritt an und sagen offen, ob und wo Potenzial liegt.',
    ihrAufwand: '40 Minuten Gespräch',
  },
  {
    nr: '02',
    name: 'Aufmaß',
    zeit: 'ca. 2 Wochen',
    text: 'Wettbewerb, Suchverhalten und Margen im Detail. Am Ende steht, welche Leistungen wir nach vorn stellen.',
    ihrAufwand: 'ein Termin, Zugänge, Fotos',
  },
  {
    nr: '03',
    name: 'Aufbau',
    zeit: 'ca. 3–5 Wochen',
    text: 'Website beziehungsweise Landingpage, Anfragestrecke, Tracking, Google Business Profile und die ersten Anzeigenmotive.',
    ihrAufwand: 'eine Freigaberunde',
  },
  {
    nr: '04',
    name: 'Start',
    zeit: 'ein Tag',
    text: 'Kampagnen gehen live, Messung läuft mit. Ab jetzt ist jede Anfrage einer Quelle zuordenbar.',
    ihrAufwand: 'Anfragen annehmen',
  },
  {
    nr: '05',
    name: 'Optimierung',
    zeit: 'laufend',
    text: 'Wir werten monatlich aus, verschieben Budget dorthin, wo es wirkt, und fragen Sie nach der Qualität der Anfragen. Ihre Rückmeldung steuert das System.',
    ihrAufwand: 'kurze Rückmeldung je Anfrage',
  },
] as const;

export const passung = {
  ja: [
    'Freie Kapazität in den nächsten drei Monaten',
    'Schwerpunkt auf größeren privaten Aufträgen',
    'Inhaber entscheidet selbst und will wachsen',
    'Bereit, Fotos vom eigenen Betrieb beizusteuern',
    'Versteht Werbebudget als Investition, nicht als Kostenposten',
  ],
  nein: [
    'Zwölf Monate ausgebucht, keine Kapazität',
    'Fast ausschließlich öffentliche Ausschreibungen und Generalunternehmer',
    'Sucht den günstigsten Anbieter',
    'Möchte „nur ein paar Posts"',
    'Ein-Personen-Betrieb ohne Wachstumsabsicht',
  ],
} as const;

/** Auswahlmöglichkeiten im Qualifizierungsformular. */
export const formularWerte = {
  mitarbeiter: ['1–4', '5–9', '10–19', '20 oder mehr'],
  leistungen: [
    'Dachsanierung',
    'Neueindeckung',
    'Flachdach',
    'Energetische Sanierung und Dämmung',
    'Gauben und Dachfenster',
    'PV-Montage oder Vorbereitung',
    'Sonstiges',
  ],
  kapazitaet: [
    'Derzeit keine',
    '1 bis 3 zusätzliche Aufträge',
    '4 bis 10 zusätzliche Aufträge',
    'Mehr als 10',
  ],
  herkunft: [
    'Empfehlung',
    'Google-Suche',
    'Portale wie Aroundhome',
    'Social Media',
    'Stammkunden',
    'Gemischt',
  ],
  werbung: ['Google Ads', 'Meta Ads', 'Portale', 'Noch keine Werbung'],
  erreichbar: ['Vormittags', 'Mittags', 'Nach 16 Uhr', 'Egal'],
} as const;

/**
 * Stationen des geführten Rundgangs durch die Demo.
 * Die Bilder entstehen mit tools/shot-demo.mjs und tools/shot-stationen.mjs
 * aus einer lokal gebauten Kopie — das Demo-Repository wird nie verändert.
 */
export const demoStationen = [
  {
    nr: '01',
    titel: 'Hero',
    kurz: 'In fünf Sekunden: wer, was, welches Gebiet.',
    text: 'Betrieb, Leistungsspektrum und Einzugsgebiet stehen im ersten Bildschirm. Kein Slider, keine Bildergalerie, keine Begrüßungsfloskel — ein Hausbesitzer entscheidet in Sekunden, ob er hier richtig ist.',
    bild: '/images/demo/station-01-hero.webp',
  },
  {
    nr: '02',
    titel: 'Leistungsindex',
    kurz: 'Gebaut für Suchen wie „Flachdach abdichten".',
    text: 'Jede Leistung bekommt eine eigene Seite statt eines Absatzes auf einer Sammelseite. Das ist die Voraussetzung dafür, dass eine konkrete Suchanfrage überhaupt auf einer passenden Seite landen kann.',
    bild: '/images/demo/station-02-leistungen.webp',
  },
  {
    nr: '03',
    titel: 'Materialität',
    kurz: 'Detailaufnahmen statt Menschen mit verschränkten Armen.',
    text: 'Für einen Handwerksbetrieb ist die Nahaufnahme einer sauberen Falzkante das bessere Verkaufsargument als ein Gruppenfoto vor dem Firmenwagen. Qualität zeigt man, statt sie zu behaupten.',
    bild: '/images/demo/station-03-material.webp',
  },
  {
    nr: '04',
    titel: 'Projekte statt Referenzlogos',
    kurz: 'Arbeiten, die man ansehen kann.',
    text: 'Ausgeführte Arbeiten mit Ort, Jahr und Aufgabenstellung. Das ist überprüfbar und beantwortet die eigentliche Frage des Interessenten: Hat der Betrieb so etwas schon einmal gemacht?',
    bild: '/images/demo/station-04-projekte.webp',
  },
  {
    nr: '05',
    titel: 'Vertrauen ohne Erfindungen',
    kurz: 'Beispielinhalte sind als solche gekennzeichnet.',
    text: 'Weil die Demo einen erfundenen Betrieb zeigt, sind auch die Stimmen darin ausdrücklich als Beispielinhalt markiert — sichtbar auf der Seite selbst. Dieselbe Regel gilt in jedem echten Projekt: kein Sternebanner, keine ausgedachte Auszeichnung.',
    bild: '/images/demo/station-05-vertrauen.webp',
  },
  {
    nr: '06',
    titel: 'Anfragestrecke',
    kurz: 'Ein Ziel je Seite, Telefonnummer immer sichtbar.',
    text: 'Die Anfrage ist nie mehr als einen Bildschirm entfernt, das Formular fragt nur, was für den Rückruf nötig ist, und die Nummer steht daneben — weil ein Teil der Kundschaft lieber anruft, als zu tippen.',
    bild: '/images/demo/station-06-anfrage.webp',
  },
] as const;

/** Häufige Fragen. Nur echte Fragen, damit die FAQ-Auszeichnung zulässig ist. */
export const fragen = [
  {
    frage: 'Was kostet das?',
    antwort:
      'Der Aufbau wird einmalig abgerechnet, die laufende Betreuung monatlich. Das Werbebudget zahlen Sie direkt an Google und Meta über Ihre eigenen Konten — wir fassen es nicht an und verdienen nicht daran mit. Die Höhe hängt vom Umfang ab, der sich aus dem Aufmaß ergibt. Deshalb nennen wir hier keine Zahl, die für Ihren Betrieb ohnehin nicht stimmen würde.',
  },
  {
    frage: 'Wie viele Anfragen bekomme ich?',
    antwort:
      'Das können wir nicht seriös versprechen, und wir tun es deshalb auch nicht. Wer Ihnen ohne Kenntnis Ihres Einzugsgebiets, Ihrer Preise und Ihrer Kapazität eine Zahl garantiert, verkauft Ihnen eine Zahl und keine Kunden. Was wir zusagen: Sie sehen bei jeder Anfrage, woher sie kommt.',
  },
  {
    frage: 'Wem gehören Website, Werbekonten und Daten?',
    antwort:
      'Ihnen. Domain, Website, Google- und Meta-Konten sowie das Tracking laufen auf Ihren Namen. Wenn wir uns trennen, bleibt das System bei Ihnen — ohne dass Sie etwas herauskaufen müssen.',
  },
  {
    frage: 'Arbeiten Sie auch mit meinem Wettbewerber im Ort?',
    antwort:
      'Nein. Wir arbeiten mit einem Dachdeckerbetrieb je Einzugsgebiet. Sonst würden wir Sie gegen einen anderen Kunden antreten lassen und beide Budgets gegeneinander verheizen.',
  },
  {
    frage: 'Wie viel Zeit kostet mich das?',
    antwort:
      'In der Aufbauphase ein Termin, Zugänge und eine Freigaberunde. Danach die kurze Rückmeldung, ob die Anfragen passten — das ist keine Höflichkeit, sondern die wichtigste Steuerungsgröße im laufenden Betrieb.',
  },
  {
    frage: 'Warum nur Dachdecker?',
    antwort:
      'Weil wir eine Branche sehr genau verstehen wollen statt viele oberflächlich. Wer die Unterschiede zwischen einer Flachdachabdichtung und einer energetischen Sanierung kennt, schreibt bessere Anzeigen, wählt bessere Suchbegriffe und erkennt eine schlechte Anfrage, bevor Sie Zeit damit verlieren.',
  },
] as const;
