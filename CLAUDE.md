# Arbeitsregeln für dieses Repository

S&S Leadcraft — Agenturwebsite für digitale Kundengewinnung, ausschließlich für
Dachdeckerbetriebe. Astro 5 statisch, Tailwind 4, Cloudflare Pages.

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
  Die regionale Exklusivität ist eine Regel, kein Druckmittel.
- **Keine erfundenen Stammdaten.** Domain, E-Mail und Impressumsangaben stehen
  ausschließlich in `src/config/site.ts`. Fehlende Werte bleiben `null` und erscheinen
  über `<Luecke>` sichtbar — niemals als echt aussehender Platzhalter.
- **`dachdecker-premium-demo` wird nicht verändert.** Aufnahmen entstehen aus einer
  lokal gebauten Kopie.

## Sprache

Durchgehend Deutsch, auch in Bezeichnern, Kommentaren und Commit-Nachrichten.
Ansprache per Sie. Der Leser ist Inhaber eines Handwerksbetriebs: konkret, ohne
Agenturvokabular, ohne Anglizismen, wo es ein deutsches Wort gibt.

Ein Wortlaut bleibt über die ganze Seite identisch, insbesondere der Haupt-CTA
**„Potenzialanalyse anfragen"** (`cta.primaer`). Keine Synonyme.

## Gestaltung

Die Richtung heißt **Architectural Performance**: Architekturbüro und Schweizer
Redaktion, nicht Software-Startup.

- **Papier dominiert.** Grundfläche ist `papier`, abgesetzt durch `kalkstein` (`.stein`)
  und `beton` (Bildfelder). Dunkle Abschnitte (`.dunkel`, `anthrazit`) sind gesetzte
  Kontraste — derzeit Concept Case, Prozess und Abschluss-CTA — keine Grundstimmung.
- **Farben** nur über die Tokens in `global.css`: `papier`, `kalkstein`, `beton`,
  `kies`, `graphit`, `schiefer`, `anthrazit`, `tinte`, `linie`, `linie-stark`,
  `linie-dunkel`, `signal`, `zinnober`, `moos`. Keine Literalwerte in Komponenten.
- **`signal`** ist ein gedecktes Tiefblau und rein funktional: Hinweisfelder, Fokus.
  **Nie als Buttonfläche, nie als Verlauf, nie zum Hervorheben von Schlagwörtern.**
  Betonung entsteht durch Größe, Zeilenumbruch und Weißraum — nicht durch Farbe.
- **Ein Winkel:** 38°, die Regeldachneigung eines Ziegeldachs. Alle Diagonalen und
  Konstruktionslinien folgen ihm (`Linie.astro`: `dach`, `achse`, `raster`, `rahmen`,
  `zusammenfuehrung`).
- **Keine Karten, kein Eckenradius.** Gruppierung entsteht durch harte Linien,
  Spaltenraster und Abstand.
- **Drei Schriften mit getrennten Rollen:** `SSL Grotesk` für Überschriften und Text,
  `SSL Serife` für Vorspann und Zitate (`.vorspann`, `.zitat`), `SSL Mono` für alles
  Vermessende — Nummern, Formularlabels, Bemaßung, technische Beschriftung (`.marke`,
  `.vermessung`, `.zahlen`). Schriften liegen selbst gehostet in `public/fonts`,
  erzeugt mit `tools/schriften.mjs`.
- **Fotografie wird nicht erfunden.** Fehlende Aufnahmen stehen als `<Bildfeld>` mit
  Motiv, Ausschnitt und Format. Die vollständige Liste steht im README unter
  „Benötigte Fotografie". Keine bildgenerierten Aufnahmen. Lizenzierte
  Material- und Architekturaufnahmen sind als dokumentierter Übergang erlaubt
  (Registratur in `src/config/motive.ts`, Quelle sichtbar in der Bemaßung) —
  **keine Stock-Menschen bei der Arbeit**: Fremde Hände als „unsere Baustelle"
  auszugeben wäre genau die Erfindung, die diese Seite nicht macht. B-03 bleibt
  Bildfeld, bis ein eigenes Shooting es füllt.
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

Der gepinnte Scroll-Moment läuft **genau einmal je Seite** — im Concept Case, und nur
dort, wo die Stationen nicht ohnehin ausführlich folgen (`zeigeRundgang`).

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

Nicht mehr zutreffend, aber an einzelnen Stellen noch so beschrieben: der
README-Abschnitt „Status: noch nicht öffentlich" und die Kommentare „OFFEN 1/2"
in `wrangler.jsonc`. Beide beziehen sich auf den Worker-Weg und den Zustand vor
dem Livegang — siehe „Offene Punkte".

## Projektstruktur und wichtige Dateien

```
src/config/site.ts        Alle Stammdaten: Domain, E-Mail, Impressum, CTA-Wortlaut.
                          Einzige Quelle. `impressumVollstaendig` entscheidet über
                          noindex auf Impressum und Datenschutz.
src/config/motive.ts      Registratur der Übergangsmotive samt sichtbarem Nachweis.
src/data/inhalte.ts       Textbausteine der Seiten.
src/pages/api/anfrage.ts  Einzige serverseitig gerenderte Route (`prerender = false`).
src/pages/*.astro         Neun Seiten plus 404 und robots.txt.
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

Weiteres:

- Pflichtfelder werden **serverseitig** geprüft; bei Ablehnung geht es mit
  wiederhergestellten Eingaben und Fehlermeldung zurück zum Formular (303).
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

## Bekannte DNS- und Domain-Konfiguration

Die Nameserver liegen **bei STRATO**, nicht bei Cloudflare. Das ist eine
Entscheidung, keine Übergangslösung (Begründung unten).

| Name | Stand |
| --- | --- |
| `www.ssleadcraft.de` | CNAME bei STRATO → `dachdecker-leadagentur-pages.pages.dev.` · am Projekt **aktiv** · Zertifikat von Google Trust Services, erneuert sich selbst |
| `ssleadcraft.de` (ohne www) | zeigt weiter auf STRATO · **kein HTTPS**, der Aufruf scheitert am Zertifikat |
| `app.ssleadcraft.de` | CNAME entfernt, löst nicht mehr auf · am Pages-Projekt **noch als aktiv geführt** (Stand 17.08.2026) |
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
2. **`ssleadcraft.de` ohne `www` liefert nicht aus.** Für Anzeigen folgenlos —
   dort steht die vollständige Zieladresse. Es trifft, wer die kurze Form
   eintippt. Behebung ist eine STRATO-Änderung und braucht eine Entscheidung.
3. **`app.ssleadcraft.de` steht noch am Pages-Projekt.** Wirkungslos, da kein
   DNS-Eintrag mehr darauf zeigt; erscheint aber in der Adressliste jeder
   Ausspielung.
4. **README und `wrangler.jsonc` sind an Stellen veraltet.** Der Abschnitt
   „Status: noch nicht öffentlich" und die Kommentare „OFFEN 1/2" beschreiben den
   Zustand vor dem Livegang bzw. den Worker-Weg. Inhaltlich falsch für Pages.
5. **Zwei Auslieferungswege stehen weiter nebeneinander.** Es ist nicht
   entschieden, ob der Worker `ss-leadcraft` bleibt oder abgebaut wird.
6. **Keine Conversion-Messung.** Vor Kampagnen mit Messung braucht es einen
   Einwilligungsdialog und eine Ergänzung der Datenschutzerklärung — beides ist
   dort bereits angekündigt.

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

# Next Steps

In dieser Reihenfolge sinnvoll — nichts davon ist begonnen:

1. **Datenschutzerklärung rechtlich prüfen lassen**, einschließlich der
   Kennzeichnungsfrage zu den KI-Bildern. Vor dem Werbestart.
2. **Entscheiden, was `ssleadcraft.de` ohne `www` tun soll** — Weiterleitung bei
   STRATO einrichten oder die kurze Form nirgends verwenden.
3. **`app.ssleadcraft.de` am Pages-Projekt entfernen**, sobald bestätigt.
4. **README und `wrangler.jsonc` an den Livestand angleichen**, damit keine zwei
   Wahrheiten nebeneinander stehen.
5. **Über den Worker-Weg entscheiden.** Bleibt Pages, kann der Worker samt
   Konfiguration abgebaut werden — das nimmt eine ganze Fehlerquelle heraus.
6. **Vor Kampagnen mit Conversion-Messung**: Einwilligungsdialog bauen und die
   Datenschutzerklärung vorher ergänzen.

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
