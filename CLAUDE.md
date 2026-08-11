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

- **Farben** nur über die Tokens in `global.css`: `schiefer`, `blei`, `linie`, `zink`,
  `kalk`, `schnur`, `rotstift`, `gruen`. Keine Literalwerte in Komponenten.
- **Der Akzent** (`schnur`, Kreidepigmentblau) bekommt höchstens drei Prozent der
  Fläche: Haarlinien, Kapitelnummern, ein hervorgehobenes Wort je Bildschirm.
  **Nie als Buttonfläche**, nie als Verlauf.
- **Ein Winkel:** 38°, die Regeldachneigung eines Ziegeldachs. Alle Diagonalen und
  Konstruktionslinien folgen ihm.
- **Keine Karten, kein Eckenradius.** Gruppierung entsteht durch Linien und Abstand.
- **Zwei Schriften mit getrennten Rollen:** Instrument Sans für Text und Überschriften,
  IBM Plex Mono für alles, was mit Messen und Beschriften zu tun hat (Kapitelnummern,
  Formularlabels, Bemaßung).
- **Helle Abschnitte** (`.hell`) sind Zäsuren und bleiben die Ausnahme: derzeit
  „Was wir nicht versprechen" und der Gründerabschnitt.

## Bewegung

Ein Prinzip: **ziehen, freilegen, setzen** (`.zieh`, `.zeilen`, `.steig`). Eine einzige
Kurve, `--ease-schnur`. Nur `transform` und `opacity`. Keine Animationsbibliothek.

Der gepinnte Scroll-Moment läuft **genau einmal je Seite** — im Concept Case, und nur
dort, wo die Stationen nicht ohnehin ausführlich folgen (`zeigeRundgang`).

`prefers-reduced-motion` ist ein gleichwertiger zweiter Zustand, kein Notbehelf: alle
Inhalte sofort sichtbar, kein Informationsverlust.

## Mobil

Kein zusammengestauchter Desktop. Hero, Navigation, Concept Case, Formular und CTA
haben eigene Kompositionen. Tippziele mindestens 24 px hoch (`.tipp`); Links im
Fließtext sind davon ausgenommen.

## Technik

- Jede neue Seite bekommt Titel, Beschreibung (max. 160 Zeichen), genau eine `h1` und
  Überschriftenebenen ohne Sprünge.
- Bilder immer mit `width`, `height` und `alt`; alles unterhalb der Falte `loading="lazy"`.
- Keine Drittanbieter-Ressourcen zur Laufzeit: keine Schriften-CDN, kein Captcha,
  keine Karten-Einbettung, keine Analyseskripte ohne Einwilligung.
- Budget: JavaScript unter 20 KB, LCP unter 1,8 s mobil, CLS unter 0,02.

## Nach jeder Änderung

```bash
npm run build
node tools/pruefen.mjs             http://127.0.0.1:4321
node tools/pruefen-interaktion.mjs http://127.0.0.1:4321
```

Beide Prüfläufe müssen ohne Befund durchlaufen.
