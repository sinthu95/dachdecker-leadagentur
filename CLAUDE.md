# Arbeitsregeln für dieses Repository

S&S Leadcraft — Agenturwebsite für digitale Kundengewinnung, ausschließlich für
Dachdeckerbetriebe. Astro 5 statisch, Tailwind 4, Cloudflare Workers.

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
  „Benötigte Fotografie". Keine Stockmotive, keine bildgenerierten Aufnahmen.
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

## Nach jeder Änderung

```bash
npm run check:build
node tools/pruefen.mjs             http://127.0.0.1:4321
node tools/pruefen-interaktion.mjs http://127.0.0.1:4321
```

Beide Prüfläufe müssen ohne Befund durchlaufen.

`npm run build` allein baut nur — ohne Typprüfung, damit die Auslieferung auf
Cloudflare nicht an einer interaktiven Rückfrage hängenbleibt. Vor einem Commit
gilt `check:build`.
