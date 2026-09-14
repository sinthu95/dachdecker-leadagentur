# Arbeitsregeln für dieses Repository

S&S Leadcraft — Agenturwebsite für digitale Kundengewinnung. Branchenoffene
Hauptmarke mit spezialisierten Branchenseiten darunter, deren erste
`/dachdecker` ist. Astro 5 statisch, Tailwind 4, Cloudflare Pages.

Der erste Teil dieser Datei sind die Regeln, nach denen gearbeitet wird. Ab
**„Current Production Status"** steht, was tatsächlich im Netz läuft — Domain,
Auslieferung, Anfragestrecke, geprüfte Punkte, offene Punkte. Wer neu in dieses
Projekt kommt, liest beides.

## Harte Grenzen

Diese Punkte sind keine Stilfragen. Sie nicht einhalten heißt, die Positionierung der
Marke zu zerstören:

- **Nichts erfinden.** Keine Referenzen, Kundenlogos, Bewertungen, Auszeichnungen,
  Fallstudien, Umsatz- oder Leadzahlen. Kein `aggregateRating`, kein `review`.
- **Keine Zahl ohne Messung.** Leistungsangaben stammen aus `tools/messen.mjs` und
  werden mit Datum genannt.
- **Keine Verknappungsmechanik.** Kein Countdown, kein „nur noch 2 Plätze".
- **Keine pauschale Gebietsexklusivität.** Exklusivität wird einzeln vereinbart.
  Weder die Hauptseite noch eine Branchenseite sagt sie allgemein zu — kein
  „ein Betrieb je Gebiet", auch nicht als Überschrift, Beschreibung oder
  Bildunterschrift. Was vereinbart ist, gilt; was nicht vereinbart ist, wird
  nicht behauptet.
- **Keine Branche ohne Seite.** `src/data/branchen.ts` führt nur Branchen, für
  die eine Seite gebaut ist. Keine geplanten, angekündigten oder „in
  Vorbereitung" stehenden Gewerke.
- **Keine Fallstudie ohne Freigabe.** Echte Kundenprojekte stehen ausschließlich
  in `src/data/faelle.ts` und werden nur sichtbar, wenn schriftliche
  Kundenfreigabe, Freigabedatum, Zeitraum und — bei jeder Kennzahl — Messzeitraum
  und Quelle vorliegen. `pruefeFall` bricht den Bau ab, wenn etwas davon fehlt.
  Das Beispielprojekt („Musterdach GmbH") ist **keine** Fallstudie und wird nie
  dorthin überführt.
- **Keine erfundenen Stammdaten.** Domain, E-Mail und Impressumsangaben stehen
  ausschließlich in `src/config/site.ts`. Fehlende Werte bleiben `null` und erscheinen
  über `<Luecke>` sichtbar — niemals als echt aussehender Platzhalter.
- **`dachdecker-premium-demo` wird nicht verändert.** Aufnahmen entstehen aus einer
  lokal gebauten Kopie.

## Sprache

Durchgehend Deutsch, auch in Bezeichnern, Kommentaren und Commit-Nachrichten.
Ansprache per Sie. Der Leser ist Inhaber eines mittelständischen Betriebs —
auf `/dachdecker` eines Handwerksbetriebs: konkret, ohne Agenturvokabular, ohne
Anglizismen, wo es ein deutsches Wort gibt. Eingeführte Produkt- und
Branchenbegriffe (Google Ads, Meta Ads, Landingpage) bleiben.

Ein Wortlaut bleibt über die ganze Seite identisch, insbesondere der Haupt-CTA
**„Potenzialanalyse anfragen"** (`cta.primaer`). Keine Synonyme.

## Gestaltung

Die Richtung heißt **Architectural Performance**: Architekturbüro und Schweizer
Redaktion, nicht Software-Startup.

- **Papier dominiert.** Grundfläche ist `papier`, abgesetzt durch `kalkstein` (`.stein`)
  und `beton` (Bildfelder). Dunkle Abschnitte (`.dunkel`, `anthrazit`) sind gesetzte
  Kontraste — derzeit Beispielprojekt, Prozess und Abschluss-CTA — keine Grundstimmung.
- **Farben** nur über die Tokens in `global.css`: `papier`, `kalkstein`, `beton`,
  `kies`, `graphit`, `schiefer`, `anthrazit`, `tinte`, `linie`, `linie-stark`,
  `linie-dunkel`, `signal`, `zinnober`, `moos`. Keine Literalwerte in Komponenten.
- **`signal`** ist ein gedecktes Tiefblau und rein funktional: Hinweisfelder, Fokus.
  **Nie als Buttonfläche, nie als Verlauf, nie zum Hervorheben von Schlagwörtern.**
  Betonung entsteht durch Größe, Zeilenumbruch und Weißraum — nicht durch Farbe.
- **Ein Winkel:** 38°. Alle Diagonalen und Konstruktionslinien folgen ihm
  (`Linie.astro`: `dach`, `achse`, `raster`, `rahmen`, `zusammenfuehrung`). Der
  Winkel stammt aus der Regeldachneigung eines Ziegeldachs — **hergeleitet
  werden darf er nur dort, wo das stimmt**, also auf `/dachdecker`
  (`branchen.ts`, Feld `winkel`). Auf der branchenoffenen Hauptseite trägt er
  als Maß, nicht als Erzählung: „Ein Winkel, ein Raster, eine Kurve." Die
  Geometrie selbst bleibt überall dieselbe — sie wird nicht neu gestaltet.
- **Keine Karten, kein Eckenradius.** Gruppierung entsteht durch harte Linien,
  Spaltenraster und Abstand.
- **Drei Schriften mit getrennten Rollen:** `SSL Grotesk` für Überschriften und Text,
  `SSL Serife` für Vorspann und Zitate (`.vorspann`, `.zitat`), `SSL Mono` für alles
  Vermessende — Nummern, Formularlabels, Bemaßung, technische Beschriftung (`.marke`,
  `.vermessung`, `.zahlen`). Schriften liegen selbst gehostet in `public/fonts`,
  erzeugt mit `tools/schriften.mjs`.
- **Fotografie wird nicht erfunden.** Fehlende Aufnahmen stehen als `<Bildfeld>` mit
  Motiv, Ausschnitt und Format. Die vollständige Liste steht im README unter
  „Benötigte Fotografie". Übergangsmotive sind erlaubt — lizenzierte Aufnahmen
  ebenso wie die drei KI-generierten, die seit dem 14.08.2026 auf ausdrückliche
  Anweisung des Inhabers stehen. Bedingung ist in jedem Fall dieselbe:
  **Registratur in `src/config/motive.ts` und die Quelle sichtbar unter dem
  Bild** (`Motiv.astro`, Eigenschaft `nachweis`) — bei den KI-Bildern
  „Symbolbild · KI-generiert". Der Nachweis ist der Preis dafür, dass diese
  Bilder stehen dürfen: Ohne ihn behauptet die Seite eine eigene Baustelle, die
  es nicht gibt. Ein Motiv ohne sichtbaren Nachweis kommt nicht auf die Seite.
- **Schemata erklären, sie behaupten nicht.** `SchemaAnfrageweg` und `SchemaGebiet`
  zeigen den Ablauf als Konstruktionszeichnung — keine nachgebauten Bildschirmfotos
  eines Werbekontos, keine Volumina, keine Rankings. Wo Beispielwerte nötig sind
  (Radien, Suchbegriffe), tragen sie die Marke `Schema` und den Zusatz, dass es
  Beispiele sind. Anzeigentext, den es nicht gibt, steht als Haarlinie.

## Bewegung

Ein Prinzip: **konstruieren, freilegen, setzen**. Zeilen fahren hinter einer harten
Kante hervor (`.zeilen`), Flächen werden aufgezogen (`.bildmaske`), Linien bauen sich
auf (`.zieh`, `.zieh-y`, `.zeichne`), Text setzt sich (`.steig`), Bildflächen laufen
minimal gegen den Scroll (`.versatz`, Stärke über `data-versatz`). Eine einzige Kurve,
`--ease-linie`. Nur `transform`, `opacity` und `clip-path`. Keine Animationsbibliothek.

Kein Glühen, keine fliegenden Karten, keine bewegten Hintergründe, keine Cursor-Effekte.

Der gepinnte Scroll-Moment läuft **genau einmal je Seite** — im Beispielprojekt, und
nur dort, wo die Stationen nicht ohnehin ausführlich folgen (`zeigeRundgang`).

`prefers-reduced-motion` ist ein gleichwertiger zweiter Zustand, kein Notbehelf: alle
Inhalte sofort sichtbar, kein Informationsverlust.

## Mobil

Kein zusammengestauchter Desktop. Hero, Navigation, Concept Case, Formular und CTA
haben eigene Kompositionen; Bildfelder bekommen über `formatMobil` einen eigenen
Ausschnitt. Der Haupt-CTA steht auf dem Telefon im ersten Bildschirm. Tippziele
mindestens 24 px hoch (`.tipp`); Links im Fließtext sind davon ausgenommen.

## Technik

- Jede neue Seite bekommt Titel, Beschreibung (max. 160 Zeichen), genau eine `h1` und
  Überschriftenebenen ohne Sprünge.
- Bilder immer mit `width`, `height` und `alt`; alles unterhalb der Falte `loading="lazy"`.
- Keine Drittanbieter-Ressourcen zur Laufzeit: keine Schriften-CDN, kein Captcha,
  keine Karten-Einbettung, keine Analyseskripte ohne Einwilligung.
- Budget: JavaScript unter 20 KB, LCP unter 1,8 s mobil, CLS unter 0,02.

## Auslieferung

Zwei Wege stehen nebeneinander, solange nicht entschieden ist, welcher bleibt.
Ausführlich im README unter „Auslieferung: Worker und Pages".

- **`wrangler.jsonc` gehört dem Worker `ss-leadcraft`.** Dort darf kein
  `pages_build_output_dir` hinein — damit hielte Wrangler die Datei für ein
  Pages-Projekt und `npm run deploy` wäre kaputt.
- **Pages hat keine Konfigurationsdatei.** Wrangler verweigert eigene
  Konfigurationspfade für Pages (`-c` wird abgelehnt). Die Bindungen hängen
  deshalb am Projekt bei Cloudflare, gesetzt über die REST-API. Was das Projekt
  ausmacht, steht ausschließlich in `tools/pages-konfig.mjs`.
- **Ein KV-Namensraum für beide Wege.** `LEADS` wird referenziert, nie neu
  angelegt: Anfragen liegen an einer Stelle, gleich über welchen Weg sie kamen.
  Prüfdatensätze werden nach dem Prüflauf wieder gelöscht.
- **Produktion und Vorschau erben bei Pages nichts voneinander.** Bindungen
  immer in beiden Umgebungen setzen, sonst schreibt eine Vorschau ins Leere.

## Nach jeder Änderung

```bash
npm run check:build
npm run check:pruefungen
```

Alle sieben Prüfläufe müssen ohne Befund durchlaufen. Sie brauchen einen laufenden
Entwicklungsserver auf `127.0.0.1:4321`.

- `pruefen.mjs` — Struktur, interne Ziele, Titel- und Beschreibungslängen
- `pruefen-interaktion.mjs` — Menü, Formularstrecke, Rundgang, Bewegungsreduktion
- `pruefen-audit.mjs` — Semantik, ARIA, waagerechter Überlauf, Bilder, Tippziele
  und Wege zur Anfrage; sechs Breiten von 320 bis 1920 px
- `pruefen-enthuellung.mjs` — ob die Bildmasken und Zeilen tatsächlich aufgehen.
  Die übrigen Werkzeuge setzen `.sichtbar` selbst und würden einen Stillstand
  nie bemerken
- `pruefen-tastatur.mjs` — Sprungmarke, Fokusrahmen, Fokusfalle im Menü
- `pruefen-formular.mjs` — serverseitige Ablehnung und Wiederherstellung der Eingaben
- `pruefen-kontrast.mjs` — gemessener Kontrast gegen die tatsächliche Fläche

`npm run build` allein baut nur — ohne Typprüfung, damit die Auslieferung auf
Cloudflare nicht an einer interaktiven Rückfrage hängenbleibt. Vor einem Commit
gilt `check:build`.

---

# Current Production Status

**Stand: 17.08.2026** · Alles Folgende ist gemessen, nicht angenommen.

Die Seite ist **live und öffentlich indexierbar**:

| | |
| --- | --- |
| Produktionsadresse | `https://www.ssleadcraft.de` |
| Auslieferung | Cloudflare **Pages**, Projekt `dachdecker-leadagentur-pages` |
| Produktionszweig | `main` (im Repository; Cloudflare selbst baut nichts) |
| Letzter geprüfter Stand | `4e07a7c` |
| Anfragen | KV-Namensraum `LEADS`, danach E-Mail über Resend |
| Benachrichtigung an | `kontakt@ssleadcraft.de` |

Zuletzt vollständig geprüft am 17.08.2026 gegen die echte Domain, mit echtem
Mailversand: **0 Befunde**.

README und `wrangler.jsonc` sind am 17.08.2026 auf diesen Stand nachgezogen
worden. Wo dort noch der Zustand vor dem Livegang beschrieben stand — „Status:
noch nicht öffentlich", „OFFEN 1/2" —, steht jetzt der Livestand.

**Achtung, das Repository ist der Produktion voraus.** Der branchenoffene Umbau
(Phasen 1 bis 3, Stand 14.09.2026) liegt auf dem Zweig
`claude/positionierung-branchenoffen` und ist **nicht ausgespielt**. Unter
`www.ssleadcraft.de` steht weiter der Stand von `main`: Dachdecker-Positionierung,
kein `/branchen`, Menüpunkt „Für Dachdecker". Örtlich sind alle sieben Prüfläufe
und `check:build` auf dem Zweigstand ohne Befund durchgelaufen; im Netz geprüft
ist er nicht. Ausgespielt wird erst nach Freigabe durch den Inhaber — ein Push
auf `main` löst die Produktionsauslieferung aus.

## Projektstruktur und wichtige Dateien

```
src/config/site.ts        Alle Stammdaten: Domain, E-Mail, Impressum, CTA-Wortlaut.
                          Einzige Quelle. `impressumVollstaendig` entscheidet über
                          noindex auf Impressum und Datenschutz.
src/config/motive.ts      Registratur der Übergangsmotive samt sichtbarem Nachweis.
src/data/inhalte.ts       Textbausteine der Seiten, branchenoffen.
src/data/branchen.ts      Die Branchen mit eigener Seite. Nur das, was je
                          Branche wirklich anders ist. Keine geplanten Gewerke.
src/data/faelle.ts        Gefäß für echte Fallstudien. Derzeit leer — es gibt
                          kein freigegebenes Kundenprojekt. `pruefeFall`
                          erzwingt Freigabe, Zeitraum und Quelle je Kennzahl.
src/pages/api/anfrage.ts  Einzige serverseitig gerenderte Route (`prerender = false`).
src/pages/*.astro         Zehn Seiten plus 404 und robots.txt.
                          `/branchen` ist die Übersicht, `/dachdecker` die
                          erste Branchenseite (und weiter Werbe-Landingpage).
astro.config.ts           output static, trailingSlash never, build.format 'file'.
wrangler.jsonc            Gehört ausschließlich dem Worker `ss-leadcraft`.
public/_headers           HSTS. Wird von Pages ausgewertet, nicht ausgeliefert.
public/.assetsignore      Hält `_worker.js` aus der Asset-Auslieferung heraus.

tools/pages-konfig.mjs    Was das Pages-Projekt ausmacht. Einzige Quelle.
tools/pages-einrichten.mjs   Projekt anlegen, Bindungen und Domains nachziehen.
tools/pages-ausliefern.mjs   Bauen und ausspielen.
tools/pruefen-pages.mjs      Prüft eine ausgelieferte Adresse im Netz.
tools/pruefen-*.mjs          Die sieben örtlichen Prüfläufe (siehe oben).

.github/workflows/pages-testlauf.yml   Einrichten, ausliefern, prüfen.
.github/workflows/pages-abnahme.yml    Nur prüfen — liefert nichts aus.
```

## Produktionsdomain und Auslieferungsstruktur

- **`www.ssleadcraft.de`** ist die Produktionsadresse. Sie hängt an der
  Produktionsauslieferung des Pages-Projekts.
- Ausgeliefert wird per **Direktupload** (`wrangler pages deploy`). Es gibt
  **keine** Git-Anbindung zwischen Cloudflare und GitHub: Cloudflare baut nicht,
  beobachtet keinen Zweig und löst bei einem Push nichts aus.
- Ob eine Auslieferung Produktion oder Vorschau ist, entscheidet allein der
  Zweigname (`GITHUB_REF_NAME`) gegen `PRODUKTIONSZWEIG = 'main'`. Ein Push auf
  den Arbeitszweig erzeugt eine Vorschau unter eigener Adresse und lässt die
  Domain unberührt.
- Der Worker **`ss-leadcraft`** besteht unverändert weiter. Er wird von keinem
  Ablauf mehr beliefert, trägt keine eigene Domain und ist nicht der Weg, über
  den die Seite ausgeliefert wird. `npm run deploy` zielt auf ihn — nicht
  versehentlich aufrufen.

## Cloudflare-Pages-Konfiguration

Es gibt **keine Konfigurationsdatei für Pages.** Wrangler lehnt eigene
Konfigurationspfade für Pages ab (`-c`), und `pages_build_output_dir` in
`wrangler.jsonc` würde den Worker-Weg zerstören. Die Bindungen hängen deshalb am
Projekt bei Cloudflare, gesetzt über die REST-API durch `pages-einrichten.mjs`.
Was das Projekt ausmacht, steht ausschließlich in `tools/pages-konfig.mjs`.

Am Projekt hängen — **in Produktion und Vorschau gleichermaßen**, weil bei Pages
nichts vererbt wird:

| Art | Name | Inhalt |
| --- | --- | --- |
| KV-Bindung | `LEADS` | bestehender Namensraum, ID in `pages-konfig.mjs` |
| Variable | `LEAD_NOTIFY_EMAIL` | `kontakt@ssleadcraft.de` |
| Variable | `LEAD_FROM_EMAIL` | `formular@ssleadcraft.de` |
| Secret | `RESEND_API_KEY` | verschlüsselt, Wert nirgends im Repository |

`pages-einrichten.mjs` ist wiederholbar und **entfernt nichts**: Cloudflare führt
`deployment_configs` beim PATCH zusammen, gelöscht wird nur, was ausdrücklich auf
`null` gesetzt wird — das passiert nirgends. Fehlt `RESEND_API_KEY` in der
Umgebung, wird er nicht gesetzt und auch nicht abgeräumt. Nach jedem Lauf liest
das Werkzeug den Stand zurück und weist ihn nach, statt dem Rückgabewert zu
glauben.

Eigene Domains stehen in `DOMAINS`. Eine dort nicht genannte Domain wird entfernt
— **außer sie ist aktiv**; eine aktive Domain wird nur gemeldet, nie angetastet.

Die eine Ausnahme ist `DOMAINS_ABMELDEN`: Dort steht ein Name, den ein Mensch
ausdrücklich zur Abmeldung freigegeben hat — der Weg für den Fall, dass
Cloudflare eine Domain noch als „active" führt, obwohl längst kein DNS-Eintrag
mehr darauf zeigt. Die Liste ist ein Auftrag und wird nach getaner Arbeit wieder
geleert; sie steht normalerweise leer. Nach jedem Lauf wird der Stand der
Domains zurückgelesen und nachgewiesen, statt dem Rückgabewert zu glauben.

## GitHub- und Auslieferungsablauf

Zwei Abläufe, beide in `.github/workflows/`:

**`pages-testlauf.yml`** — Push auf `main` (Produktion) oder auf den Arbeitszweig
(Vorschau), zusätzlich von Hand. Reihenfolge: Zugangsdaten prüfen → `npm ci` →
`pages:einrichten` → `pages:ausliefern` → `pruefen:pages` gegen die eben
entstandene Adresse. Der Schalter `versand` löst einen echten Mailversand aus;
ohne ihn füllt der Prüflauf den Honigtopf aus und es geht nichts hinaus.

**`pages-abnahme.yml`** — nur von Hand. Liefert **nichts** aus und richtet nichts
ein. Baut nur den Vergleichsstand und prüft dann die Adresse, die gerade im Netz
steht: Zertifikat, HTTPS, Umleitung von HTTP, Verhalten der Wurzeldomain, dann
der volle Prüflauf. Das ist der Weg für einen Produktionscheck ohne neue
Ausspielung.

Benötigte Namen — **nur Namen, niemals Werte**:

| Ort | Name | Zweck |
| --- | --- | --- |
| Actions **Secret** | `CLOUDFLARE_API_TOKEN` | Pages (Bearbeiten) + Workers KV Storage (Bearbeiten) |
| Actions **Secret** | `CLOUDFLARE_ACCOUNT_ID` | keine Zugangsdaten, aber als Secret geschwärzt — das Repository ist öffentlich, die Protokolle also auch |
| Actions **Secret** | `RESEND_API_KEY` | wird von `pages-einrichten.mjs` als `secret_text` an das Projekt gehängt |
| Actions **Variable** | `PUBLIC_SITE_URL` | `https://www.ssleadcraft.de` — wird **beim Bauen** gelesen; steuert kanonische Adressen, Sitemap und das Ausbleiben von `noindex` |

`PUBLIC_SITE_URL` gehört zur Bauzeit, die drei `LEAD_*`/`RESEND_*`-Werte zur
Laufzeit. Wer das vertauscht, bekommt keinen Fehler, sondern Stille.

## Formular- und Leadstrecke

`POST /api/anfrage` (`src/pages/api/anfrage.ts`), die einzige serverseitig
gerenderte Route. Reihenfolge, und sie ist der Kern:

1. **Ablage im KV-Namensraum `LEADS`** — zuerst, immer, unabhängig vom Mailversand.
   Das Postfach ist eine Benachrichtigung, kein Speicher.
2. **E-Mail über Resend**, wenn alle drei Werte gesetzt sind.
3. Schlägt beides fehl, bleibt das Worker-Protokoll — die einzige Stelle, an der
   eine Anfrage im Klartext protokolliert wird, und nur dann.

**Das Formular läuft zweigleisig** (seit 14.09.2026). Eine Komponente,
`Anfrage.astro`, zwei Konfigurationen — und sie stellen nicht dieselbe Frage:

| | `/` und `/kontakt` | `/dachdecker` |
| --- | --- | --- |
| Frage | „Woran sollen wir zuerst arbeiten?" | „Welche Leistungen möchten Sie stärker verkaufen?" |
| Auswahl | unsere acht Positionen plus „Noch nicht sicher" (`formularWerte.leistungenAllgemein`, abgeleitet aus `leistungen`) | die Leistungen des Gewerks (`branchen.ts`, Feld `leistungen`) |
| Branche | Freitextfeld `branche` | entfällt — sie steht fest und wird serverseitig ergänzt |

Beide Gleise senden dasselbe Feld `leistungen`; welche Frage beantwortet wurde,
steht im Datensatz unter `herkunft.seite`. Ein zweiter Feldname hätte eine
zweite Pflichtprüfung im Endpunkt bedeutet — für dieselbe Sache.

**`herkunft_seite`** trägt die Seite, auf der das Formular stand. Sie wird
**beim Bauen** ins Markup geschrieben, nicht per JavaScript: So geht sie auch
ohne Skript mit. Der Server glaubt ihr nicht, sondern prüft sie gegen
`FORMULARSEITEN` (`/`, `/kontakt`, `/dachdecker`) und ersetzt alles andere
durch `/kontakt`. Das ist keine Förmlichkeit: Aus dem Wert entsteht das Ziel
der Fehlerumleitung, ein durchgereichter Wert wäre eine offene Weiterleitung.
Mehr hängt nicht daran — keine Prüfung, keine Berechtigung, keine
Zustellentscheidung.

Weiteres:

- Pflichtfelder werden **serverseitig** geprüft; bei Ablehnung geht es mit
  wiederhergestellten Eingaben und Fehlermeldung **auf die Seite zurück, von
  der die Anfrage kam** (303). Vorher ging jede Ablehnung nach `/kontakt` —
  seit die Seiten verschiedene Leistungslisten zeigen, wären die
  wiederhergestellten Haken dort ins Leere gelaufen.
- Der Fehlerhinweis gehört seit Phase 4 zum Formular (`Anfrage.astro`), nicht
  zu `/kontakt`: Jede Seite mit Formular braucht ihn.
- Spamschutz ohne Drittanbieter: unsichtbares Zusatzfeld plus Mindestdauer von
  1500 ms. Ein Verdachtsfall wird **nicht verworfen**, sondern unter dem
  Schlüsselpräfix `verdacht:` abgelegt und nicht versendet; der Regelfall liegt
  unter `anfrage:`.
- Schlüsselform: `anfrage:<ISO-Zeitpunkt>:<UUID>`. Das Protokoll nennt nur
  Kennung und Schlüssel — keinen Namen, keine Nummer, keine Adresse.
- Erfolg endet auf `/danke`. Diese Seite steht dauerhaft nicht in der Sitemap:
  sie ist das Ziel der späteren Conversion-Messung.
- Die Herkunft (Kampagnenparameter, verweisende Seite, Einstiegsseite) wird
  mitgeschrieben und ist in der Datenschutzerklärung benannt.

## E-Mail-Versand über Resend

- Absender `formular@ssleadcraft.de`, Empfänger `kontakt@ssleadcraft.de`,
  `reply_to` ist die Adresse des Anfragenden.
- Absender und Empfänger sind **bewusst verschieden**: gleiche Adresse auf beiden
  Seiten sieht für Spamfilter nach gefälschter Selbstzustellung aus.
  `formular@` braucht kein Postfach, nur die verifizierte Domain.
- Der Zugang liegt als `RESEND_API_KEY` an zwei Stellen: als Actions-Secret und —
  von dort gesetzt — als `secret_text` am Pages-Projekt. **Der Wert steht nicht im
  Repository, nicht in dieser Datei und in keinem Protokoll.** Cloudflare gibt
  `secret_text` ohne Inhalt zurück; die Werkzeuge melden nur „verschlüsselt
  hinterlegt".
- Versand nachgewiesen am 17.08.2026: Resend meldete „Delivered".
- Der **Wortlaut der Benachrichtigung** nennt Herkunftsseite, Branche, die
  Auswahl (beschriftet nach Gleis), Kontaktdaten und die Herkunft in Worten.
  Klickkennungen (gclid, fbclid, msclkid) stehen dort **nicht im Wortlaut**,
  sondern als „Bezahlt über: Google Ads" — der vollständige Wert liegt im
  KV-Datensatz und ist dort auswertbar. Vom Verweis steht nur der Host.
  Geprüft wird der Wortlaut in `tools/pruefen-lead.mjs`.

## Gemessener Leistungsstand

Am 14.09.2026 mit `tools/messen.mjs` am gebauten Worker gemessen — mobil,
390 px, vierfache CPU-Drosselung, rund 1,6 Mbit/s:

| Seite | Summe | LCP | CLS |
| --- | --- | --- | --- |
| `/` | 310,1 KB | **1,57 s** | 0,0000 |
| `/leistungen` | 177,5 KB | 0,79 s | 0,0000 |
| `/branchen` | 153,4 KB | 0,84 s | 0,0000 |
| `/dachdecker` | 201,0 KB | 0,85 s | 0,0000 |
| `/demo` | 272,1 KB | 0,83 s | 0,0000 |
| `/kontakt` | 153,7 KB | 0,79 s | 0,0000 |

JavaScript: 7,8 KB unkomprimiert, 3,0 KB gzip — Budget 20 KB. Alle drei
Budgets eingehalten; `/` liegt mit 1,57 s am dichtesten an seiner Grenze
(1,8 s). Nachgemessen am 14.09.2026, nachdem das vollbreite Foto durch das
Konstruktionsband ersetzt wurde: vorher 1,68 s.

## Gesamtvorschau

```bash
npm run build && node tools/vorschau.mjs
```

Erzeugt `vorschau.html` — alle elf Seiten, Stile, Schriften, Bilder und das
Skript in einer einzigen Datei, ohne Server durchklickbar. Die Datei steht in
`.gitignore` und wird nicht versioniert.

Zwei Fehler steckten darin, seit auf Pages umgestellt wurde, und fielen erst
in Phase 5 auf, weil die Vorschau dazwischen nicht gebraucht wurde: Die
Seitenliste suchte noch `seite/index.html` statt der flachen Dateien aus
`build.format: 'file'`, und die Bildersetzung griff nur in Anführungszeichen —
in einem `srcset` stehen die Pfade unquotiert nebeneinander, also blieben alle
Bildflächen leer. Beides behoben; das Werkzeug bricht jetzt ab, wenn eine
gebaute Seite in der Liste fehlt oder umgekehrt.

## Speicherung im Browser

Zwei Schlüssel im `sessionStorage`, sonst nichts. Keine Cookies, kein
`localStorage`, keine IndexedDB.

| Schlüssel | Inhalt | Geschrieben | Gelöscht |
| --- | --- | --- | --- |
| `ssl_herkunft` | Kampagnenparameter, Klickkennungen, Verweis, Einstiegsseite — beim **ersten** Aufruf erhoben | jeder erste Seitenaufruf einer Sitzung | beim Schließen des Tabs |
| `ssl:anfrage-entwurf` | die Formulareingaben ohne Honigtopf, Zeitmarke und Einwilligung | unmittelbar vor jedem Absenden | beim Wiederherstellen nach einer Ablehnung, sonst auf `/danke` |

Beide verlassen den Browser nur, wenn das Formular abgeschickt wird. Der
Entwurf wurde bis Phase 4 nach einer **erfolgreichen** Anfrage nicht
aufgeräumt und blieb mit Name, Telefonnummer und E-Mail-Adresse bis zum
Schließen des Tabs liegen; `entwurfAufraeumen()` in `main.ts` räumt ihn jetzt
auf `/danke` weg.

Beschrieben ist das in der Datenschutzerklärung unter „Speicherung in Ihrem
Browser". Ob beide Speicherungen als „unbedingt erforderlich" nach § 25 TDDG
gelten, ist eine **rechtliche** Frage und gehört in die ausstehende Prüfung —
im Text steht deshalb der technische Sachverhalt und keine Rechtsgrundlage.

## Bekannte DNS- und Domain-Konfiguration

Die Nameserver liegen **bei STRATO**, nicht bei Cloudflare. Das ist eine
Entscheidung, keine Übergangslösung (Begründung unten).

| Name | Stand |
| --- | --- |
| `www.ssleadcraft.de` | CNAME bei STRATO → `dachdecker-leadagentur-pages.pages.dev.` · am Projekt **aktiv** · Zertifikat von Google Trust Services, erneuert sich selbst |
| `ssleadcraft.de` (ohne www) | zeigt auf STRATO · **Weiterleitung mit 301 auf `https://www.ssleadcraft.de/`**, über http und https · Zertifikat bei STRATO, aktiviert am 18.08.2026 |
| `app.ssleadcraft.de` | CNAME entfernt, löst nicht mehr auf · am Pages-Projekt **abgemeldet** am 18.08.2026 |
| `resend._domainkey`, `send` | DKIM und SPF für den Mailversand — **nicht anfassen** |

## Bereits durchgeführte Prüfungen

Örtlich, vor jedem Commit: `npm run check:build` und die sieben Prüfläufe aus
`npm run check:pruefungen` (Struktur, Interaktion, Audit über sechs Breiten,
Enthüllung, Tastatur, Formular, Kontrast) — zuletzt ohne Befund.

Im Netz, am 17.08.2026 gegen `https://www.ssleadcraft.de`, Ergebnis **0 Befunde**:

- Zertifikat gültig, `https://www.ssleadcraft.de/` → 200,
  `http://…` → 301 auf HTTPS.
- HSTS: `max-age=31536000; includeSubDomains`.
- Alle neun Seiten plus `robots.txt` → 200, unbekannte Adresse → gestaltete 404.
- Kein `noindex`, kanonische Adresse zeigt auf die Domain, Sitemap erreichbar,
  interne Verweise treffen ohne Umleitung.
- Serverteil (`/_worker.js`, `/_worker.js/index.js`) von außen nicht abrufbar.
- Formular: gültige Anfrage → 303 `/danke`; fehlende Einwilligung → zurück mit
  Fehlermeldung **und ohne Ablage**.
- Ablage im KV vollständig lesbar, Schlüssel und Kennung passend, Prüfdatensatz
  anschließend wieder gelöscht.
- Echter Mailversand ausgelöst und im Postfach bestätigt.

Früher gefunden und behoben (damit es nicht erneut eingebaut wird): `loading="eager"`
auf einem Bild unterhalb der Falte, ein Layoutsprung durch falsch reserviertes
Seitenverhältnis, unbrauchbare Mobil-Ausschnitte, zwei vertauschte Bilddateien,
ein Widerspruch in der Datenschutzerklärung.

## Bewusst getroffene technische Entscheidungen

- **`build.format: 'file'`** — Pages leitet sonst `/kontakt` mit 308 auf
  `/kontakt/` um, und alle internen Verweise stehen wegen
  `trailingSlash: 'never'` ohne Schrägstrich. Gemessen kostete das auf acht von
  neun Seiten je Klick eine zusätzliche Rundreise.
- **Subdomain statt Apex** — ein Apex kann nicht per CNAME zeigen, er verlangt
  den Wechsel der Nameserver zu Cloudflare. Auf `ssleadcraft.de` liegen die
  Resend-Einträge; ein dabei übersehener DKIM-Selektor fällt erst auf, wenn
  Benachrichtigungen im Spam landen.
- **Bindungen am Projekt statt in einer Datei** — Wrangler lässt für Pages keine
  eigene Konfigurationsdatei zu, und die Alternative hätte den Worker-Weg zerstört.
- **Ein KV-Namensraum für beide Wege** — Anfragen liegen an einer Stelle, gleich
  worüber sie hereinkamen.
- **Prüflauf füllt standardmäßig den Honigtopf aus** — sonst ginge bei jeder
  Auslieferung eine Mail hinaus, die wie ein echter Lead aussieht. Wer eine
  Prüfung baut, die den Betrieb stört, bekommt sie abgeschaltet.
- **HSTS ohne `preload`** — die Liste wird in Browsern ausgeliefert, und wieder
  herauszukommen dauert Monate.
- **Keine aktive Domain wird automatisch entfernt** — ein Werkzeug, das eine
  laufende Adresse stilllegt, weil eine Liste sie nicht kennt, wäre gefährlich.
- **Die drei Motive sind KI-generiert und tragen sichtbar „Symbolbild ·
  KI-generiert"** unter dem Bild. Der Nachweis ist keine Formalie: ohne ihn
  behauptet die Seite etwas, das nicht stimmt.
- **Keine Drittanbieter zur Laufzeit** — keine Schriften-CDN, kein Captcha, keine
  Karte, keine Analyse ohne Einwilligung. Die Datenschutzerklärung beschreibt
  genau diesen Zustand.

## Bekannte offene Punkte

1. **Datenschutzerklärung ist rechtlich nicht geprüft.** Dazu gehört die Frage,
   ob die KI-generierten Bilder eine Kennzeichnung nach Art. 50 KI-VO bzw.
   § 5 UWG brauchen. Der einzige Punkt, der vor einem Werbestart als kritisch
   einzustufen ist.
2. **Zwei Auslieferungswege stehen weiter nebeneinander.** Es ist nicht
   entschieden, ob der Worker `ss-leadcraft` bleibt oder abgebaut wird.
3. **Keine Conversion-Messung.** Vor Kampagnen mit Messung braucht es einen
   Einwilligungsdialog und eine Ergänzung der Datenschutzerklärung — beides ist
   dort bereits angekündigt.
4. **Die Angabe „Kleinunternehmer nach § 19 UStG" ist NICHT bestätigt.**
   Stand 14.09.2026: Die steuerliche Erfassung läuft noch, die Angabe steht
   sichtbar im Impressum und ist in `src/config/site.ts` als zu bestätigen
   markiert. Technischer Zusammenhang, der die Sache festhält:
   `impressumVollstaendig` verlangt zwingend eine Aussage zur Umsatzsteuer —
   USt-IdNr. **oder** Kleinunternehmerhinweis. Das Feld auf `null` zu setzen
   macht das Impressum unvollständig; Impressum und Datenschutz fallen dann
   auf `noindex` und der Unvollständigkeitshinweis erscheint. Ein Impressum
   ganz ohne Umsatzsteuerangabe ist also nicht der vorsichtigere Zustand.
   Sobald der Bescheid vorliegt: Wert bestätigen oder durch die USt-IdNr.
   ersetzen. Die Entscheidung trifft der Inhaber mit seiner steuerlichen
   Beratung.
5. **Die Positionierung wird branchenoffen umgebaut** (Entscheidung vom
   14.09.2026). Umgesetzt: Phase 1 — Stammdaten, Claim, Hero, Orientierung,
   Navigation, Fußzeile. Phase 2 — Problem, Neue Realität, Leistungen (acht,
   davon sechs auf der Startseite), Spezialisierung, Gründerbereich, Passung,
   Anfrageweg-Beispiele. Phase 3 (14.09.2026) — `src/data/branchen.ts`,
   Übersicht `/branchen`, Menüpunkt „Branchen", `/dachdecker` an die Struktur
   angeschlossen, Beispielprojekt der Branche zugeordnet, Bildmotive
   entschieden, `/demo` und `/ueber-uns` nachgezogen, Vorschaubild neu erzeugt.
   Phase 4 (14.09.2026) — Formular zweigleisig, Freitextfeld `branche`,
   geprüftes `herkunft_seite` samt Rückkehr auf die Ausgangsseite, lesbare
   Herkunft in der Benachrichtigung, Datenschutzerklärung auf den technischen
   Stand gebracht. Phase 5 (14.09.2026) — `src/data/faelle.ts` angelegt (leer),
   Bild- und Textabnahme, Gesamtvorschau, SEO- und Leistungsmessung, Bericht.
   **Der Umbau ist damit abgeschlossen und wartet auf die Freigabe zum Merge.**
6. **Gebietsexklusivität wird nicht mehr pauschal zugesichert.** Auf der
   Hauptseite stand „Ein Betrieb je Einzugsgebiet" an vier Stellen —
   Orientierung, Gebietsschema, Passung, Fragen. In Phase 3 kamen vier weitere
   Fundstellen dazu, die vorher übersehen worden waren: die Überschrift „Ein
   Gebiet. Genau ein Betrieb." in `SchemaGebiet.astro`, der erste Grundsatz auf
   `/ueber-uns`, die Beschreibung von `/dachdecker` und die Fußzeile des
   Vorschaubilds (`tools/og-bild.mjs`). Alles entfernt: Exklusivität wird
   einzeln vereinbart. Was vereinbart ist, gilt; was nicht vereinbart ist, wird
   nicht behauptet. Auch auf Branchenseiten dürfen keine weitergehenden
   Zusicherungen entstehen.
7. **Erledigt am 14.09.2026 (Phase 4).** Das Anfrageformular stellte auf
   `/kontakt` und der Startseite nur Dacharbeiten zur Auswahl. Es läuft jetzt
   zweigleisig — siehe „Formular- und Leadstrecke".
8. **Die Löschfrist aus der Datenschutzerklärung wird von Hand eingehalten.**
   § 07 sagt zu, Anfragedaten spätestens sechs Monate nach dem letzten Kontakt
   zu löschen. Der KV-Namensraum `LEADS` hat **keine** Ablaufzeit, und es gibt
   keinen Ablauf, der alte Schlüssel entfernt. Die Zusage ist damit eine über
   das eigene Handeln, nicht eine über die Technik. Wer sie technisch
   absichern will: `expirationTtl` beim Ablegen setzen — das wäre allerdings
   eine Änderung an der Anfragestrecke und gehört vorher entschieden.
9. **Die Bildstrecke der Startseite ist noch nicht branchenoffen.**
   Sichtprüfung am 14.09.2026 an der gebauten Seite, nicht an den
   Registratureinträgen — die letzte Einstufung in Phase 3 war aus den
   Beschreibungen gemacht und dabei zu milde ausgefallen.

   | Nr. | Motiv | Stand | Einstufung |
   | --- | --- | --- | --- |
   | B-01 | `beratung` | Aufnahme steht auf `/` und `/dachdecker` | **B — grenzwertig.** Handwerker mit Tablet und Kundin vor einem Haus mit dunklem Ziegeldach. Trägt „Handwerk und Bau", nicht „Unternehmen allgemein". |
   | B-02 | `material` | **Bildfeld** — Dateien fehlen | offen. Vorgesehen ist eine Schieferdeckung; die wäre ebenfalls Dachmaterial. Bei der Beschaffung besser branchenoffen wählen und `motive.ts` anpassen. |
   | B-03n | — | **Bildfeld**, seit Phase 3 | offen, Motiv steht fest (README). |
   | B-04 | `dacharbeit-detail` | **ersetzt am 14.09.2026**, auf keiner Seite mehr eingesetzt | war **C**. Die Aufnahme zeigt keine Nahaufnahme von Händen, wie die Registratur nahelegt, sondern einen Dachdecker in voller Montur auf einer Ziegelfläche mit Giebel, Schornstein und Himmel. Als größtes Bild der Startseite sagte sie „Dachdeckeragentur". An ihrer Stelle steht das Konstruktionsband (`Bildband.astro`): Schraffur im Regelwinkel 38° und eine Bemaßungsfigur, die den Winkel abträgt — kein `<Bildfeld>` mit „Aufnahme folgt". |
   | B-05 | Materialprobe | **Bildfeld** | offen, war immer eines. |
   | B-06 | Porträt | eigene Aufnahme | A. |

   Damit stehen auf `/` eine Aufnahme (B-01), drei Bildfelder, das Porträt und
   das Konstruktionsband. Offen bleiben B-01 (grenzwertig, bleibt vorerst) und
   die drei fehlenden Aufnahmen.

## Nicht ohne ausdrückliche Freigabe verändern

- **DNS bei STRATO** — jeder Eintrag, insbesondere `resend._domainkey` und `send`.
  Der Mailversand hängt daran.
- **Eigene Domains am Cloudflare-Projekt** und der KV-Namensraum `LEADS` samt
  Inhalt. Prüfdatensätze werden gelöscht, echte Anfragen niemals.
- **Der Worker `ss-leadcraft`** und `wrangler.jsonc`. Kein
  `pages_build_output_dir` in dieser Datei.
- **`main`** — ein Push dorthin spielt Produktion aus.
- **Secrets** — Namen dürfen dokumentiert werden, Werte nie. Nicht ins
  Repository, nicht in Protokolle, nicht in Prüfausgaben. Kontrollen von GitHub
  oder Cloudflare werden nicht umgangen.
- **`dachdecker-premium-demo`** — wird nicht verändert.
- **Der sichtbare Nachweis unter den KI-Motiven** und der Wortlaut
  „Potenzialanalyse anfragen" (`cta.primaer`).
- **Stammdaten in `src/config/site.ts`** — Impressum, E-Mail, Domain. Nichts
  erfinden, Fehlendes bleibt `null`.
- **Die Adresse `/dachdecker`** — keine Umleitung, kein neuer Pfad, keine
  geänderte kanonische Adresse. Was an Sichtbarkeit auf dieser Seite liegt,
  bleibt darauf liegen.
- **Die Anfragestrecke** — `src/pages/api/anfrage.ts`, die Bindung `LEADS` und
  der Versandweg über Resend. Sie läuft nachgewiesen; sie wird nicht nebenbei
  angefasst.

# Next Steps

In dieser Reihenfolge sinnvoll — nichts davon ist begonnen:

1. **Datenschutzerklärung rechtlich prüfen lassen**, einschließlich der
   Kennzeichnungsfrage zu den KI-Bildern und der Einordnung der beiden
   `sessionStorage`-Schlüssel nach § 25 TDDG. Vor dem Werbestart.
2. **Branchenoffene Aufnahme für B-03n** beschaffen (Motiv im README). Solange
   sie fehlt, steht auf `/` an dieser Stelle ein Bildfeld.
3. **Über den Worker-Weg entscheiden.** Bleibt Pages, kann der Worker samt
   Konfiguration abgebaut werden — das nimmt eine ganze Fehlerquelle heraus.
4. **Vor Kampagnen mit Conversion-Messung**: Einwilligungsdialog bauen und die
   Datenschutzerklärung vorher ergänzen.
5. **Phase 5: `src/data/faelle.ts`** als Gefäß für echte Fallstudien, mit
   Pflichtfeldern Zeitraum, Quelle und Freigabe. Leer bleiben, solange es
   keinen freigegebenen Fall gibt.

# Diese Datei pflegen

Nach jeder wesentlichen Änderung wird der Teil ab „Current Production Status"
nachgezogen — im selben Commit wie die Änderung, nicht später. Wesentlich ist:
Domain, DNS, Cloudflare-Projekt, Bindungen, Secret-**Namen**, Abläufe in
`.github/workflows/`, die Anfragestrecke, der Versandweg, ein neuer oder
erledigter offener Punkt.

Zwei Regeln dabei: **Datum und gemessenen Stand nennen**, statt „aktuell" zu
schreiben — und **nichts eintragen, was nicht nachgesehen wurde**. Eine
Dokumentation, der man nicht trauen kann, ist schlechter als keine, weil die
nächste Sitzung auf ihr aufbaut.
