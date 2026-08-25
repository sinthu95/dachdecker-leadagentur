# Vorschau Immocheck NRW (Kundenprojekt)

Dieser Ordner existiert **nur auf dem Arbeitszweig
`claude/immocheck-nrw-redesign-tfv0lc`** und gehört nicht zur
Agentur-Website. Er enthält den fertig gebauten, vollständig auf
noindex gesetzten Vorschau-Stand der neuen Immocheck-NRW-Website
(`stand/`) samt Formular-Serverfunktion (`functions/`).

- Quellcode: privates Repository `dachdecker-premium-demo`,
  Ordner `immocheck-nrw/`, gleicher Zweigname.
- Auslieferung: `.github/workflows/immocheck-vorschau.yml` spielt den
  Stand als eigenes Cloudflare-Pages-Projekt **immocheck-nrw-vorschau**
  aus → https://immocheck-nrw-vorschau.pages.dev
- Der Ablauf liegt hier, weil nur dieses Repository die
  Cloudflare-Secrets besitzt. Er fasst weder das Pages-Projekt
  `dachdecker-leadagentur-pages` noch den Worker `ss-leadcraft`,
  Domains, DNS oder den KV-Namensraum `LEADS` an.
- Aktualisieren: im Quellprojekt bauen, `dist/` nach `stand/` kopieren
  (robots.txt und der X-Robots-Tag-Block in `_headers` bleiben auf
  noindex), committen — der Push liefert automatisch aus.

Dieser Ordner wird **nicht nach `main` gemergt**.
