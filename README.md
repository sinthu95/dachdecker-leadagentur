# S&S Leadcraft

Website der Agentur **S&S Leadcraft** — digitale Kundengewinnung ausschließlich für
Dachdeckerbetriebe in Deutschland.

Astro 5 (statisch) · Tailwind 4 · Cloudflare Pages · 7,6 KB JavaScript.

---

## Status: live

Die Seite läuft unter **`https://www.ssleadcraft.de`** und ist öffentlich indexierbar.
Ausgeliefert wird über Cloudflare **Pages** (Projekt `dachdecker-leadagentur-pages`),
Anfragen landen im KV-Namensraum `LEADS` und werden anschließend per E-Mail gemeldet.

| | |
| --- | --- |
| Produktionsadresse | `https://www.ssleadcraft.de` |
| Auslieferung | Cloudflare Pages, Direktupload aus GitHub Actions |
| Produktionszweig | `main` |
| Anfragen | KV-Namensraum `LEADS`, danach E-Mail über Resend |

Der Mechanismus, der vorher den Livegang verhindert hat, ist damit nicht abgeschaltet,
sondern erfüllt: Ohne `PUBLIC_SITE_URL` baut die Seite weiterhin mit `noindex` und ohne
Sitemap, ohne vollständige Impressumsangaben bleiben Impressum und Datenschutz auf
`noindex`, und `contactEmail` ist nach wie vor die einzige Quelle für die Adresse. Es
sind **keine Platzhalterdaten** eingetragen, die wie echte Angaben aussehen.

Den vollständigen Produktionsstand — Bindungen, Secret-Namen, DNS, geprüfte Punkte,
offene Punkte — führt `CLAUDE.md` ab „Current Production Status". Diese Datei
beschreibt, wie das Projekt gebaut ist; jene, was davon gerade im Netz steht.

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
npm run check:pruefungen                                   # alle sieben Läufe nacheinander
node tools/messen.mjs              http://127.0.0.1:8788   # Datenmengen, LCP, CLS
```

Einzeln:

```bash
node tools/pruefen.mjs             # Struktur, Links, SEO, Tippziele
node tools/pruefen-interaktion.mjs # Menü, Formularstrecke, Rundgang, reduced-motion
node tools/pruefen-audit.mjs       # Semantik, ARIA, Überlauf, Bilder — sechs Breiten von 320 bis 1920
node tools/pruefen-enthuellung.mjs # ob Bildmasken und Zeilen tatsächlich aufgehen
node tools/pruefen-tastatur.mjs    # Sprungmarke, Fokusrahmen, Menüfalle, Formular ohne Maus
node tools/pruefen-formular.mjs    # Ablehnung durch den Server, Wiederherstellung der Eingaben
node tools/pruefen-kontrast.mjs    # gemessener Kontrast jedes Textelements gegen seine Fläche
```

`pruefen-enthuellung.mjs` steht bewusst getrennt: Die übrigen Läufe setzen `.sichtbar`
selbst, damit sie den Inhalt sehen — ein stehengebliebener Aufbau fiele ihnen deshalb
nie auf.

Gemessen am 17.08.2026 gegen den Produktionsbuild, mobil, 4× CPU-Drosselung, ~1,6 Mbit/s:

| Seite         | Übertragen | LCP    | CLS |
| ------------- | ---------- | ------ | --- |
| `/`           | 249 KB     | 1,28 s | 0   |
| `/leistungen` | 175 KB     | 0,87 s | 0   |
| `/dachdecker` | 177 KB     | 0,89 s | 0   |
| `/demo`       | 271 KB     | 0,87 s | 0   |
| `/kontakt`    | 152 KB     | 0,77 s | 0   |

Die Motive auf `/` tauchen in dieser Tabelle nicht auf: Sie stehen unterhalb der Falte
und laden `lazy`, zählen also nicht zum ersten Bildschirm. Genau deshalb blieb die
Startseite beim Einbau der Bilder gleich schwer.

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

Eigene Fotografie liegt bis auf das Gründerporträt nicht vor. Wo eine Aufnahme fehlt,
steht ein gestaltetes Bildfeld (`src/components/Bildfeld.astro`) mit Motiv, Ausschnitt
und Seitenverhältnis. Sobald eine Aufnahme vorliegt, ersetzt sie das Feld eins zu eins
— Platz, Format und Anschnitt stehen bereits fest.

**Stand der Bildstellen** (Registratur: `src/config/motive.ts`):

| Nr. | Motiv | Stand |
| --- | --- | --- |
| B-01 | `beratung` | KI-generiert, ausgeliefert, mit sichtbarem Nachweis |
| B-02 | `material` | registriert als Unsplash-Aufnahme, Dateien fehlen → Bildfeld |
| B-03 | `dacharbeit-flaeche` | KI-generiert, ausgeliefert, mit sichtbarem Nachweis |
| B-04 | `dacharbeit-detail` | KI-generiert, ausgeliefert, mit sichtbarem Nachweis |
| B-05 | Materialprobe | Bildfeld |
| B-06 | Gründerporträt | eigene Aufnahme, ausgeliefert |

Hier stand vorher: „keine bildgenerierten Aufnahmen, keine Stock-Menschen bei der
Arbeit". Diese Einschränkung ist am **14.08.2026 auf ausdrückliche Anweisung des
Inhabers aufgehoben** worden, nachdem der Konflikt benannt war. Die drei
KI-generierten Motive zeigen Personen bei Beratung und Dacharbeit.

Der Preis dafür steht unter jedem dieser Bilder: **„Symbolbild · KI-generiert"** —
sichtbar, nicht im Alternativtext versteckt (`Motiv.astro`, Eigenschaft `nachweis`).
Wird der Nachweis entfernt, behauptet die Seite etwas, das nicht stimmt. Ob darüber
hinaus eine Kennzeichnung nach Art. 50 KI-VO bzw. § 5 UWG nötig ist, gehört zur
ausstehenden rechtlichen Prüfung (siehe `CLAUDE.md`, offene Punkte).

So kommt eine weitere Aufnahme auf die Seite:

1. Original beschaffen. Für B-02 ist eine lizenzierte Aufnahme vorgesehen:
   [Schieferdeckung im Wiederholungsmuster](https://unsplash.com/photos/dark-slate-roof-tiles-in-a-repeating-pattern-AX_KnhLSM3w)
   — Lizenz auf der Seite prüfen (Unsplash-Lizenz, nicht Unsplash+) und den
   Fotografennamen mit `quelle` in `src/config/motive.ts` abgleichen.
2. Ablegen als `bilder-quelle/motive/<name>.jpg` — `<name>` ist das Feld `name`
   aus der Registratur, also `material`, `beratung`, `dacharbeit-flaeche` oder
   `dacharbeit-detail`. Das Verzeichnis liegt außerhalb der Versionierung.
3. `node tools/motive.mjs` erzeugt die WebP-Fassungen; der nächste Build nimmt
   sie automatisch auf. Fehlen sie, zeigt die Seite weiter das Bildfeld — es
   wird nie ein leerer Rahmen ausgeliefert.

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
Daumen-hoch-Motive, Bilddatenbank-Baustellen ohne Bezug — und jede Aufnahme, die als
eigene Baustelle gelesen werden kann, ohne eine zu sein. Die Übergangsmotive sind
davon nur deshalb ausgenommen, weil sie ihre Herkunft unter dem Bild nennen. Ohne
diesen Nachweis fallen sie unter dieselbe Grenze.

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

## Auslieferung: Worker und Pages

Ausgeliefert wird über **Pages**. Der Worker-Weg besteht als Konfiguration weiter,
wird aber von keinem Ablauf mehr beliefert — entschieden ist noch nicht, ob er
abgebaut wird.

| | Pages — der laufende Weg | Worker — besteht, unbeliefert |
|---|---|---|
| Name | `dachdecker-leadagentur-pages` | `ss-leadcraft` |
| Konfiguration | am Projekt bei Cloudflare, siehe unten | `wrangler.jsonc` |
| Befehl | `npm run pages:ausliefern` | `npm run deploy` |
| Adresse | `www.ssleadcraft.de`, `*.pages.dev` | keine eigene Domain |

Beide liefern denselben Buildstand und schreiben in **denselben** KV-Namensraum
`LEADS`. Das ist Absicht: Anfragen sollen an einer Stelle liegen, gleich über
welchen Weg sie hereinkamen.

> `npm run deploy` zielt auf den Worker, nicht auf die laufende Seite. Wer die
> Produktion aktualisieren will, nimmt den Pages-Weg — im Regelfall durch einen
> Push auf `main`.

### Was Astro von sich aus für Pages erzeugt

Am Anwendungscode war nichts zu ändern. Der Cloudflare-Adapter legt beim Bauen
bereits beides an, was Pages auswertet:

- `dist/_worker.js/` — der Serverteil im „advanced mode". Pages führt ihn aus
  und liefert ihn nie als Datei aus.
- `dist/_routes.json` — der Wegeplan. `include` listet `/api/*`, `exclude` jede
  statische Seite.

Damit entfällt der gesamte `assets`-Block aus `wrangler.jsonc`: `_routes.json`
ist bei Pages die Entsprechung zu `run_worker_first`, das Zusammenführen des
Schrägstrichs am Ende ist Standardverhalten, und `dist/404.html` nimmt Pages
selbst als Fehlerseite.

### Warum die Pages-Konfiguration in keiner Datei steht

Der naheliegende Weg wäre eine zweite Wrangler-Datei neben `wrangler.jsonc`.
Wrangler lehnt das ab:

```
✘ Pages does not support custom paths for the Wrangler configuration file
```

Es bliebe nur, `pages_build_output_dir` in `wrangler.jsonc` einzutragen — dann
hielte Wrangler die Datei für ein Pages-Projekt und `wrangler deploy` für den
bestehenden Worker wäre kaputt. Das ist ausgeschlossen.

Deshalb trägt nicht die Auslieferung, sondern **das Projekt** die Bindungen,
gesetzt über die REST-API in `deployment_configs`. `wrangler pages deploy`
meldet dabei, dass es `wrangler.jsonc` gefunden hat und übergeht — genau das
soll es tun. Was das Projekt ausmacht, steht in `tools/pages-konfig.mjs`, und
nur dort.

Produktion und Vorschau erben bei Pages nichts voneinander. Beide bekommen
denselben Satz Bindungen; sonst liefe eine Vorschauauslieferung ohne `LEADS`
und schriebe ins Leere.

### Die drei Befehle

Vorausgesetzt sind `CLOUDFLARE_API_TOKEN` (Berechtigungen: *Cloudflare Pages →
Bearbeiten* und *Workers KV Storage → Bearbeiten*) und `CLOUDFLARE_ACCOUNT_ID`
in der Umgebung.

```bash
npm run pages:einrichten   # Projekt anlegen, LEADS anbinden — wiederholbar
npm run pages:ausliefern   # bauen und als Vorschau hochladen, nennt die Adresse
npm run pruefen:pages      # die ausgelieferte Adresse prüfen
```

`tools/pruefen-pages.mjs` prüft an der echten Adresse im Netz: jede Seite
erreichbar, gestaltete Fehlerseite, HSTS gesetzt, Serverteil nicht öffentlich,
`/api/anfrage` vom Serverteil beantwortet statt von der Asset-Schicht, gültige
Anfrage im KV vollständig lesbar, abgelehnte Anfrage nicht abgelegt. Die
Erwartung an die Indexierung dreht sich mit `PUBLIC_SITE_URL`: ohne Domain
`noindex`, mit Domain kanonische Adresse und erreichbare Sitemap. Der
Prüfdatensatz wird danach wieder gelöscht — `LEADS` ist der echte
Anfragenspeicher, kein Spielplatz.

### Auslieferung über GitHub Actions

Zwei Abläufe, beide unter `.github/workflows/`:

| Datei | Auslöser | Was passiert |
|---|---|---|
| `pages-testlauf.yml` | Push auf `main` oder den Arbeitszweig, zusätzlich von Hand | einrichten → ausliefern → die eben entstandene Adresse prüfen |
| `pages-abnahme.yml` | nur von Hand | **nichts ausliefern**; die Adresse prüfen, die gerade im Netz steht |

Die Abnahme ist der Weg für einen Produktionscheck ohne neue Ausspielung. Sie
baut nur den Vergleichsstand, prüft dann Zertifikat, Aufruf über HTTPS,
Umleitung von HTTP und das Verhalten der Wurzeldomain — und lässt anschließend
denselben Prüflauf gegen die eigene Domain laufen.

Der Grund für Actions ist der Token: Er braucht einen Ort, an dem er
verschlüsselt liegt und nach dem Speichern nicht mehr lesbar ist. Ein Feld für
Umgebungsvariablen ist das nicht — ein Actions-Secret schon, und GitHub
maskiert den Wert zusätzlich in jeder Ausgabe.

Drei Secrets unter **Settings → Secrets and variables → Actions**:

| Name | Inhalt |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token mit *Cloudflare Pages → Bearbeiten* und *Workers KV Storage → Bearbeiten* |
| `CLOUDFLARE_ACCOUNT_ID` | Konto-ID |
| `RESEND_API_KEY` | Zugang zu Resend; wird von `pages-einrichten.mjs` an das Pages-Projekt gehängt |

Hier stehen **nur Namen**. Werte gehören in keine Datei dieses Repositorys, in
kein Protokoll und in keine Prüfausgabe.

Die Konto-ID ist kein Zugangsschlüssel, liegt hier aber trotzdem als Secret:
Dieses Repository ist öffentlich, die Ablaufprotokolle also für jeden
einsehbar, und die ID taucht in jedem API-Pfad auf, den eine Fehlermeldung
nennt. Als Secret wird sie dort automatisch geschwärzt.

Fehlt eines der Secrets, endet der Lauf im ersten Schritt mit einem Hinweis,
statt mitten in der Auslieferung.

**Welcher Zweig wohin liefert.** Der Zweigname entscheidet, nicht eine
Einstellung:

| Zweig | Ziel | Adresse |
|---|---|---|
| `main` | Produktion — hier hängt die eigene Domain | `www.ssleadcraft.de`, dazu `dachdecker-leadagentur-pages.pages.dev` |
| jeder andere | Vorschau, Produktion bleibt unberührt | eigene Adresse je Zweig |

Ein Push auf `main` spielt also die Produktion aus. Das ist kein Nebeneffekt,
sondern der vorgesehene Weg — aber es ist gut zu wissen, bevor man ihn geht.

**Die Domain steht als Variable, nicht als Secret**: `PUBLIC_SITE_URL` unter
*Settings → Secrets and variables → Actions → **Variables***. Sie wird beim
Bauen gelesen, nicht zur Laufzeit — bei Direktupload wird im Ablauf gebaut,
nicht bei Cloudflare, deshalb gehört der Wert dorthin und nicht in die
Cloudflare-Oberfläche.

Solange sie fehlt, baut die Seite mit `noindex` und ohne Sitemap. Der Prüflauf
dreht seine Erwartung mit: ohne Domain besteht er auf `noindex`, mit Domain auf
kanonischer Adresse und erreichbarer Sitemap. Eine Prüfung, die nach dem Setzen
der Domain reihenweise Fehler meldet, würde abgeschaltet statt gelesen.

### Die eigene Domain

Die Seite läuft unter **`www.ssleadcraft.de`** — einer Subdomain, nicht dem
Apex. Das ist eine Entscheidung mit Grund:

Eine Apex-Domain kann nicht per CNAME auf ein Pages-Projekt zeigen; sie
verlangt den Wechsel der Nameserver zu Cloudflare. Bei `ssleadcraft.de` liegen
aber die Resend-Einträge für den Mailversand — DKIM auf `resend._domainkey`,
SPF auf `send`. Die müssten bei einem Wechsel vollständig mitgenommen werden,
und ein übersehener DKIM-Selektor fällt erst auf, wenn Benachrichtigungen im
Spam landen. Eine Subdomain braucht davon nichts.

Zwei Dinge gehören zusammen:

| Wo | Was |
|---|---|
| STRATO | `CNAME www → dachdecker-leadagentur-pages.pages.dev.` |
| Cloudflare | Domain am Projekt, gesetzt von `pages-einrichten.mjs` aus `DOMAINS` |

Der Eintrag am Projekt ist kein DNS-Eingriff: Cloudflare merkt sich den Namen
und prüft selbst, ob der CNAME darauf zeigt. Fehlt er, bleibt die Domain auf
`pending` — ohne dass etwas kaputtgeht.

Beides steht seit dem 17.08.2026. Die Domain ist am Projekt aktiv, das
Zertifikat kommt von Google Trust Services und erneuert sich selbst;
`http://www.ssleadcraft.de/` wird mit 301 auf HTTPS umgeleitet. Zusätzlich
setzt `public/_headers` HSTS für ein Jahr — bewusst **ohne** `preload`: Das
trüge die Domain in eine in Browsern ausgelieferte Liste ein, und wieder
herauszukommen dauert Monate.

`ssleadcraft.de` ohne `www` zeigt weiter auf STRATO und liefert **kein HTTPS
aus** — der Aufruf scheitert am Zertifikat. Für Anzeigen ist das folgenlos,
dort steht die vollständige Zieladresse; es trifft, wer die kurze Form
eintippt. Wer den Apex ebenfalls auf die Seite führen will, richtet bei STRATO
eine Domainweiterleitung auf `https://www.ssleadcraft.de` ein. Über Cloudflare
ginge es nur mit einem Wechsel der Nameserver — und damit über die
Resend-Einträge.

### Benachrichtigung über neue Anfragen

Der Endpunkt liest `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` und `LEAD_FROM_EMAIL`
aus `locals.runtime.env` — also zur **Laufzeit**. Eine Actions-Variable
erreicht ihn deshalb nie; sie existiert nur, während gebaut wird.
`PUBLIC_SITE_URL` ist genau umgekehrt. Die drei Werte hängen als Bindungen am
Pages-Projekt, gesetzt von `pages-einrichten.mjs`.

| Wert | Herkunft | Ablage bei Cloudflare |
|---|---|---|
| `LEAD_NOTIFY_EMAIL` | fest in `MAIL` | `plain_text` |
| `LEAD_FROM_EMAIL` | fest in `MAIL` | `plain_text` |
| `RESEND_API_KEY` | Actions-**Secret** | `secret_text` |

`secret_text` heißt: Cloudflare speichert verschlüsselt und gibt den Wert über
die API nie wieder heraus — auch den eigenen Werkzeugen nicht. Kein Werkzeug
gibt ihn aus, GitHub schwärzt ihn zusätzlich in jeder Ablaufausgabe.

**Fehlt der Schlüssel, wird er nicht gesetzt — und nicht gelöscht.** Ein Lauf
ohne Schlüssel darf einen hinterlegten nicht wegräumen; das wäre die
unangenehmste Art, den Versand stillzulegen. Aus demselben Grund führt die
Einrichtung `deployment_configs` zusammen, statt sie zu ersetzen, und liest
danach nach, was tatsächlich dort steht.

**Absender ist nicht der Empfänger.** `formular@ssleadcraft.de` sendet,
`kontakt@ssleadcraft.de` empfängt. Absender gleich Empfänger sieht für
Spamfilter nach gefälschter Selbstzustellung aus; `reply_to` steht ohnehin auf
der Adresse des Anfragenden, geantwortet wird also direkt dorthin.
`formular@` braucht kein Postfach — Resend verlangt nur die verifizierte
Domain, Rückläufer fängt `send.ssleadcraft.de` ab.

**Der Prüflauf versendet nichts.** Er füllt absichtlich den Honigtopf aus; die
Anfrage wird als Verdachtsfall abgelegt und nicht versendet. Sonst bekäme der
echte Posteingang bei jeder Auslieferung etwas, das wie ein Lead aussieht.
Den Versandweg prüft man eigens:

```bash
PRUEFUNG_VERSAND=1 npm run pruefen:pages
```

### Was dabei ausdrücklich nicht passiert

- Der Worker `ss-leadcraft` und `wrangler.jsonc` werden nicht angefasst.
- **Kein DNS-Eingriff.** Der CNAME bei STRATO wird von Hand gesetzt; die
  Werkzeuge haben dort keinen Zugang und sollen ihn nicht haben. Am Cloudflare-
  Projekt steht nur der Name der Domain.
- Keine Git-Anbindung zwischen Cloudflare und GitHub. Das Projekt wird per
  Direktupload beliefert; Cloudflare baut nichts und beobachtet keinen Zweig.
  `production_branch` ist innerhalb von Cloudflare eine reine Beschriftung —
  ein Push nach `main` löst dort von sich aus nichts aus. Die Auslieferung
  stößt der GitHub-Ablauf an.
- Der Namensraum `LEADS` wird referenziert, nicht angelegt und nicht geleert.
- Eine **aktive** Domain wird nie automatisch entfernt, auch wenn sie nicht in
  `DOMAINS` steht — sie wird nur gemeldet. Ein Werkzeug, das eine laufende
  Adresse stilllegt, weil eine Liste sie nicht kennt, wäre gefährlich.

Solange `PUBLIC_SITE_URL` nicht gesetzt ist, baut die Seite mit `noindex`. Für
eine `*.pages.dev`-Vorschauadresse ist genau das richtig: Sie soll nicht mit
der echten Domain um dieselben Suchbegriffe konkurrieren.

---

## Livegang: erledigt und offen

Erledigt und am 17.08.2026 gegen `https://www.ssleadcraft.de` nachgeprüft:

1. **Impressumsangaben** stehen in `src/config/site.ts` unter `impressum` —
   `rechtsform`, `strasse`, `plzOrt` und die Aussage zur Umsatzsteuer
   (`kleinunternehmer: true`). `register` und `aufsichtsbehoerde` gehen nicht in
   die Prüfung ein: Beide treffen nur auf manche Betriebe zu, und den Livegang an
   eine erfundene Angabe zu knüpfen wäre das Gegenteil dessen, was dieses Projekt
   tut.
2. **E-Mail-Adresse** steht als `contactEmail`. Sie ist Pflicht — § 5 DDG verlangt
   einen elektronischen Weg zur schnellen Kontaktaufnahme, die Telefonnummer allein
   genügt dafür nicht.
3. **Domain** steht als `PUBLIC_SITE_URL` in den Actions-**Variablen**, nicht in
   `wrangler.jsonc`: Bei Direktupload wird im Ablauf gebaut, nicht bei Cloudflare.
   Damit sind `robots.txt`, Sitemap, kanonische Adressen und Open Graph aktiv. Die
   Sitemap führt nur indexierbare Seiten; `/danke` bleibt dauerhaft draußen.
4. **Zustellung** steht: `LEADS` am Pages-Projekt gebunden, die drei Mailwerte in
   Produktion und Vorschau hinterlegt, Versand am 17.08.2026 nachgewiesen.
   `LEAD_FROM_EMAIL` gehört zu einer bei Resend verifizierten Domain — sonst nimmt
   Resend die Nachricht nicht an.

Offen, und der einzige Punkt, der vor einem Werbestart als kritisch einzustufen ist:

5. **Datenschutzerklärung rechtlich prüfen lassen**, einschließlich der Frage, ob
   die KI-generierten Motive eine Kennzeichnung nach Art. 50 KI-VO bzw. § 5 UWG
   brauchen. Der vorhandene Text beschreibt den tatsächlichen technischen Stand,
   ersetzt aber keine Prüfung.

Sobald Google oder Meta mit Pixel laufen, kommt eine Einwilligungslösung dazu — die
Architektur sieht sie vor, sie ist bewusst nicht auf Vorrat gebaut. Die
Datenschutzerklärung kündigt sie bereits an und muss vorher ergänzt werden.

Die weiteren offenen Punkte — Wurzeldomain ohne HTTPS, Entscheidung über den
Worker-Weg — stehen in `CLAUDE.md` unter „Bekannte offene Punkte".

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
