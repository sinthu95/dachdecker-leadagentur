# S&S Leadcraft

Website der Agentur **S&S Leadcraft** — digitale Kundengewinnung ausschließlich für
Dachdeckerbetriebe in Deutschland.

Astro 5 (statisch) · Tailwind 4 · Cloudflare Workers · 7,6 KB JavaScript.

---

## Status: noch nicht öffentlich

Die Seite ist **bewusst noch nicht veröffentlichungsfähig**. Drei Angaben fehlen, und
solange sie fehlen, verhindert der Code selbst, dass etwas Halbfertiges öffentlich wird:

| Fehlt                       | Auswirkung im Code                                                          |
| --------------------------- | --------------------------------------------------------------------------- |
| Domain                      | `robots.txt` sperrt alles, jede Seite trägt `noindex`, keine Sitemap, keine kanonischen URLs |
| Geschäftliche E-Mail-Adresse | `contactEmail` ist `null`; überall steht der Hinweis „E-Mail folgt", nirgends eine erfundene Adresse |
| Impressumsangaben           | Fehlende Pflichtangaben erscheinen als markierte Lücke; Impressum und Datenschutz bleiben auf `noindex` |

Es sind **keine Platzhalterdaten** eingetragen, die wie echte Angaben aussehen — genau
solche Werte gehen erfahrungsgemäß versehentlich live.

---

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:4321 — inklusive /api/anfrage
npm run build        # Produktionsbau (astro build)
npm run check        # Typprüfung (astro check)
npm run check:build  # beides — die Kontrolle vor jedem Commit
npx wrangler dev     # Produktionsbuild lokal, wie auf Cloudflare
```

`build` enthält bewusst **keine** Typprüfung: `astro check` fordert
`@astrojs/check` bei Bedarf interaktiv nach und darf deshalb nicht im Pfad einer
automatischen Auslieferung liegen. Für die eigene Kontrolle ist
`npm run check:build` gedacht.

### Prüfläufe

```bash
npm run check:pruefungen                                   # alle sechs Läufe nacheinander
node tools/messen.mjs              http://127.0.0.1:8788   # Datenmengen, LCP, CLS
```

Einzeln:

```bash
node tools/pruefen.mjs             # Struktur, Links, SEO, Tippziele
node tools/pruefen-interaktion.mjs # Menü, Formularstrecke, Rundgang, reduced-motion
node tools/pruefen-audit.mjs       # Semantik, ARIA, Überlauf, Bilder — sechs Breiten von 320 bis 1920
node tools/pruefen-tastatur.mjs    # Sprungmarke, Fokusrahmen, Menüfalle, Formular ohne Maus
node tools/pruefen-formular.mjs    # Ablehnung durch den Server, Wiederherstellung der Eingaben
node tools/pruefen-kontrast.mjs    # gemessener Kontrast jedes Textelements gegen seine Fläche
```

Gemessen am 11.08.2026 gegen den Produktionsbuild, mobil, 4× CPU-Drosselung, ~1,6 Mbit/s:

| Seite         | Übertragen | LCP    | CLS |
| ------------- | ---------- | ------ | --- |
| `/`           | 254 KB     | 1,26 s | 0   |
| `/leistungen` | 175 KB     | 0,94 s | 0   |
| `/dachdecker` | 177 KB     | 1,05 s | 0   |
| `/demo`       | 270 KB     | 0,84 s | 0   |
| `/kontakt`    | 152 KB     | 0,95 s | 0   |

JavaScript gesamt: 7,6 KB unkomprimiert, ein einziges Modul. Budget: LCP unter
1,8 s, CLS unter 0,02, JavaScript unter 20 KB.

### Vorschau ohne Server

```bash
npm run build && node tools/vorschau.mjs   # erzeugt vorschau.html
```

Packt alle Seiten, Stile, Schriften, Bilder und das Skript in eine einzelne
HTML-Datei. Navigation, Scroll-Effekte und die Formularstrecke funktionieren;
nur das Absenden führt ohne Server direkt auf `/danke`, ohne etwas zu
verschicken. Praktisch, um den Stand ohne Einrichtung durchzuklicken.

---

## Aufbau

```
src/
  config/site.ts        Alle veränderlichen Stammdaten. Domain und E-Mail nur hier.
  data/inhalte.ts       Texte und Listen, die auf mehreren Seiten vorkommen.
  styles/global.css     Designtokens, Komponenten, Signaturklassen.
  layouts/BaseLayout    SEO, Open Graph, JSON-LD, noindex-Steuerung.
  components/           Abschnitte der Seiten.
  pages/                Seiten; api/anfrage.ts ist die einzige Serverroute.
  scripts/main.ts       Das gesamte clientseitige Verhalten.
tools/                  Aufnahme- und Prüfskripte (nicht Teil des Auslieferungsstands).
```

### Seiten

`/` · `/leistungen` · `/dachdecker` (Werbe-Landingpage, ohne Menü) · `/demo` ·
`/ueber-uns` · `/kontakt` · `/danke` (noindex) · `/impressum` · `/datenschutz` · 404

---

## Benötigte Fotografie

Für dieses Projekt liegt noch keine eigene Fotografie vor. Es wurde **keine erfunden**:
weder Stockmotive noch bildgenerierte Aufnahmen. Stattdessen steht an jeder Bildstelle
ein gestaltetes Bildfeld (`src/components/Bildfeld.astro`) mit Motiv, Ausschnitt und
Seitenverhältnis. Sobald eine Aufnahme vorliegt, ersetzt sie das Feld eins zu eins —
Platz, Format und Anschnitt stehen bereits fest.

| Nr. | Ort | Motiv | Format (Desktop / Mobil) |
| --- | --- | --- | --- |
| B-01 | Startseite, Hero | Moderne Dachlandschaft aus erhöhter Position: Firstlinien gegen offenen Himmel, ruhige Geometrie, kühles Tageslicht | 16:9 / 4:5 |
| B-02 | Startseite, Hero (rechte Spalte, ab 1024 px) | Detail einer Doppelstehfalz-Deckung in Titanzink: Kante, Schattenkante, Materialoberfläche | 3:4 |
| B-03 | Startseite, „Das Problem" | Dachdecker bei der präzisen Arbeit am Falz: Hände, Werkzeug, Materialkante — Konzentration statt Pose | 3:2 / 4:5 |
| B-04 | Startseite, Bildband vor „Prozess" (randlos) | Modernes Wohnhaus in der Totalen: klar geschnittenes Steildach, saubere Traufe, Ortgang und Kehle sichtbar, kein Weitwinkelverzug | 21:9 / 4:5 |
| B-05 | Startseite und `/ueber-uns`, „Spezialisierung" | Schiefer, Zink und Ziegel nebeneinander als Materialprobe im Streiflicht, Oberflächen und Kanten deutlich | 4:5 |
| B-06 | Startseite und `/ueber-uns`, „Der Kopf dahinter“ | Porträt Sinthusan Sinnathurai. **Aufnahme liegt vor** — siehe „Das Gründerporträt“ unten | 4:5 / 6:7 |

### Das Gründerporträt

Die Aufnahme liegt vor und ist vom Abgebildeten freigegeben. Sie wird nicht im
Original ausgeliefert, sondern in zwei bewusst verschiedenen Ausschnitten:

```bash
node tools/portraet.mjs bilder-quelle/portraet-original.jpg
```

Das erzeugt `portraet-hoch-{640,960,1280}.webp` (4:5, ab 1024 px) und
`portraet-mobil-{480,780}.webp` (6:7, darunter) in `public/images/portraet/`.
Der mobile Ausschnitt ist flacher, weil das Bild dort die volle Breite einnimmt:
Ein Hochformat belegte sonst den halben Bildschirm. Gekürzt ist nur unten —
Gesicht und Oberkörper stehen in beiden Fassungen gleich.

Sitzt das Gesicht in der Vorlage anders, verschieben `--fokus-x` und `--fokus-y`
den Ausschnitt; die Vorgaben passen zur vorliegenden Aufnahme. Ändert sich das
mobile Verhältnis, muss `MOBIL_VERHAELTNIS` in `Portraet.astro` mitwandern —
daraus stehen `width` und `height` des Bildes und damit die reservierte Fläche.

Das Original liegt in `bilder-quelle/` — außerhalb von `public/`, damit es nicht
unverkleinert mit ausgeliefert wird, und über `.gitignore` außerhalb des
Repositories. Im Auslieferungsstand stehen nur die zugeschnittenen Fassungen. Solange sie fehlen,
zeigt `Portraet.astro` weiter das gestaltete Bildfeld; es wird also nie ein
leerer Rahmen ausgeliefert.

**Was nicht infrage kommt:** Handwerker mit verschränkten Armen vor dem Firmenwagen,
Daumen-hoch-Motive, Bilddatenbank-Baustellen ohne Bezug, sichtbar generierte Bilder.
Die Aufnahmen entstehen auf echten Baustellen; bis dahin bleiben die Bildfelder stehen
und benennen sichtbar, was fehlt.

Die Bildschirmaufnahmen im Concept Case (`public/images/demo/`) sind davon nicht
betroffen — sie zeigen die real gebaute Demo.

---

## Das Anfrageformular

Ein `<form>` mit drei `<fieldset>`. Ohne JavaScript sind alle Felder sichtbar und
absendbar; mit JavaScript wird daraus eine dreistufige Strecke. Spamschutz über
Honigtopf und Zeitprüfung — **kein Captcha**, weil das Besucherdaten an Dritte
überträgt.

`POST /api/anfrage` verarbeitet in dieser Reihenfolge:

1. **Ablage in Cloudflare KV** (Bindung `LEADS`) — zuerst und immer, unabhängig
   davon, ob danach eine E-Mail hinausgeht. Das Postfach ist eine
   Benachrichtigung, kein Speicher: Ein Spamfilter oder ein versehentliches
   Löschen darf keine Anfrage kosten.
2. **E-Mail** über Resend, wenn `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` und
   `LEAD_FROM_EMAIL` gesetzt sind. Alle drei — fehlt einer, wird nichts versendet.
3. **Worker-Protokoll** nur, wenn beides fehlschlägt. Dann steht die Anfrage
   dort im Klartext, weil das Protokoll der einzige verbliebene Ort ist. Im
   Regelfall enthält das Protokoll ausschließlich Kennung und Schlüssel.

Der Spamschutz verwirft nichts: Honigtopf und Zeitprüfung führen dazu, dass ein
Fall unter `verdacht:` statt `anfrage:` abgelegt und **nicht** versendet wird.
Ein falsch erkannter Mensch kostet damit keine Anfrage. Beide Prüfungen laufen
erst nach der Pflichtfeldprüfung — vorher bekam ein Mensch, der zu schnell
absendete, die Dankeseite statt seiner Fehlermeldung, und die Anfrage war weg.

Astros CSRF-Schutz ist aktiv: POSTs ohne passenden `Origin`-Header werden mit 403
abgewiesen. Das gilt nur für den gebauten Worker — der Entwicklungsserver prüft
den Ursprung nicht. Wer das nachstellen will, braucht `wrangler dev`.

```bash
npm run check:lead     # prüft die ganze Strecke am echten Worker
```

`tools/pruefen-lead.mjs` startet `wrangler dev --local` mit eigener
Konfiguration, legt Anfragen ab, liest sie zurück und weist nach: gültige
Anfrage gespeichert, lange Ausfülldauer unschädlich, Mailausfall ohne
Datenverlust, Spamschutz wirksam, keine Klardaten im Protokoll. Es versendet
keine E-Mail — der hinterlegte Schlüssel ist erfunden, die Zieladresse liegt auf
`.invalid`.

Weist der Server eine Anfrage zurück, kommt der Besucher über eine Umleitung auf einer
frisch geladenen Seite an — die Eingaben wären weg. Deshalb legt das Skript sie vor dem
Absenden im `sessionStorage` ab und stellt sie nur dann wieder her, wenn die Adresse
einen Fehler meldet. Einwilligung und Honigtopf bleiben dabei außen vor: Die
Einwilligung muss aktiv gesetzt werden.

### Herkunft jeder Anfrage

Beim ersten Seitenaufruf werden `utm_*`, `gclid`, `fbclid`, `msclkid`, Referrer und
Landingpage im `sessionStorage` gesichert und beim Absenden als versteckte Felder
mitgeschickt. Sie überleben damit jede Navigation innerhalb der Seite.

---

## Vor dem Launch

1. **Impressumsangaben** in `src/config/site.ts` unter `impressum` eintragen.
   Zwingend sind `rechtsform`, `strasse`, `plzOrt` sowie eine Aussage zur
   Umsatzsteuer — entweder `umsatzsteuerId` oder `kleinunternehmer: true`.
   `register` und `aufsichtsbehoerde` gehen nicht in die Prüfung ein: Beide
   treffen nur auf manche Betriebe zu, und den Livegang an eine erfundene Angabe
   zu knüpfen wäre das Gegenteil dessen, was dieses Projekt tut. Solange die
   Seite nicht öffentlich ist, stehen sie trotzdem als markierte Lücke da.
2. **E-Mail-Adresse** als `contactEmail` eintragen. Sie ist Pflicht: § 5 DDG
   verlangt einen elektronischen Weg zur schnellen Kontaktaufnahme, die
   Telefonnummer allein genügt dafür nicht. Ohne sie bleiben Impressum und
   Datenschutz auf `noindex`.
3. **Domain** als `PUBLIC_SITE_URL` setzen (in `wrangler.jsonc` unter `vars` oder als
   Umgebungsvariable im Build). Damit werden `robots.txt`, Sitemap, kanonische URLs
   und Open Graph automatisch aktiv. Die Sitemap führt nur indexierbare Seiten:
   `/danke` bleibt dauerhaft draußen, Impressum und Datenschutz kommen erst dazu,
   wenn die Pflichtangaben vollständig sind.
4. **Zustellung** einrichten:
   ```bash
   npx wrangler kv namespace create LEADS    # ID in wrangler.jsonc eintragen
   npx wrangler secret put RESEND_API_KEY    # alle drei als Secret, nicht als
   npx wrangler secret put LEAD_NOTIFY_EMAIL # Variable: Der vars-Block ist beim
   npx wrangler secret put LEAD_FROM_EMAIL   # Deploy maßgeblich und überschreibt
   ```                                       # Klartextvariablen aus der Oberfläche.

   Die KV-Bindung ist der wichtigere Teil: Ohne sie gibt es keinen dauerhaften
   Speicher. `LEAD_FROM_EMAIL` muss zu einer bei Resend verifizierten Domain
   gehören, sonst nimmt Resend die Nachricht nicht an.
5. **Datenschutzerklärung rechtlich prüfen** lassen. Der vorhandene Text beschreibt den
   tatsächlichen technischen Stand, ersetzt aber keine Prüfung.
6. Prüfläufe und Messung erneut ausführen, dann `npm run deploy`.

Erst danach Werbekampagnen starten. Sobald Google oder Meta mit Pixel laufen, kommt
eine Einwilligungslösung dazu — die Architektur sieht sie vor, sie ist bewusst nicht
auf Vorrat gebaut.

---

## Grenzen, die im Code verankert sind

Keine erfundenen Referenzen, Bewertungen, Auszeichnungen, Umsatz- oder Leadzahlen.
Kein `aggregateRating` in den strukturierten Daten. Keine Countdown- oder
Verknappungsmechanik. Der Concept Case wird durchgängig als Demonstrationsprojekt mit
frei erfundenem Betrieb gekennzeichnet.

Veröffentlicht wird nur, was gemessen wurde — die Zahlen oben stammen aus
`tools/messen.mjs`.

---

## Verhältnis zur Dachdecker-Demo

Der Concept Case zeigt das separate Projekt **`dachdecker-premium-demo`**. Dieses
Repository wird nicht verändert. Die Bildschirmaufnahmen unter
`public/images/demo/` entstehen aus einer lokal gebauten Kopie:

```bash
# Kopie bauen und ausliefern, dann:
node tools/shot-demo.mjs      http://127.0.0.1:4399/
node tools/shot-stationen.mjs http://127.0.0.1:4399/
```

Die Demo ist gestalterisch bewusst anders angelegt (warm, hell, Kupferpatina, Serife)
als S&S Leadcraft (kühl, dunkel, Pigmentblau, Monospace) — nur so liest sie sich im
Mockup als fremde Marke und nicht als unsere eigene Seite im Bilderrahmen.
