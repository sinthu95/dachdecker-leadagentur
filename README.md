# S&S Leadcraft

Website der Agentur **S&S Leadcraft** — digitale Kundengewinnung ausschließlich für
Dachdeckerbetriebe in Deutschland.

Astro 5 (statisch) · Tailwind 4 · Cloudflare Workers · unter 6 KB JavaScript.

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
npm run dev        # http://localhost:4321 — inklusive /api/anfrage
npm run build      # astro check && astro build
npx wrangler dev   # Produktionsbuild lokal, wie auf Cloudflare
```

### Prüfläufe

```bash
node tools/pruefen.mjs             http://127.0.0.1:4321   # Struktur, Links, SEO, Tippziele
node tools/pruefen-interaktion.mjs http://127.0.0.1:4321   # Menü, Formular, Rundgang, reduced-motion
node tools/messen.mjs              http://127.0.0.1:8788   # Datenmengen, LCP, CLS
```

Gemessen am 11.08.2026 gegen den Produktionsbuild, mobil, 4× CPU-Drosselung, ~1,6 Mbit/s:

| Seite         | Übertragen | LCP    | CLS |
| ------------- | ---------- | ------ | --- |
| `/`           | 181 KB     | 0,95 s | 0   |
| `/leistungen` | 145 KB     | 0,73 s | 0   |
| `/dachdecker` | 156 KB     | 0,87 s | 0   |
| `/demo`       | 315 KB     | 0,71 s | 0   |
| `/kontakt`    | 134 KB     | 0,83 s | 0   |

JavaScript gesamt: 5,9 KB unkomprimiert, ein einziges Modul.

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

## Das Anfrageformular

Ein `<form>` mit drei `<fieldset>`. Ohne JavaScript sind alle Felder sichtbar und
absendbar; mit JavaScript wird daraus eine dreistufige Strecke. Spamschutz über
Honigtopf und Zeitprüfung — **kein Captcha**, weil das Besucherdaten an Dritte
überträgt.

`POST /api/anfrage` stellt in dieser Reihenfolge zu:

1. **E-Mail**, wenn `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` und `LEAD_FROM_EMAIL` gesetzt sind
2. **Cloudflare KV**, wenn die Bindung `LEADS` existiert
3. **Worker-Protokoll** als letzte Auffangstufe

Damit geht keine Anfrage verloren, auch bevor ein Postfach existiert. Astros
CSRF-Schutz ist aktiv: POSTs ohne passenden `Origin`-Header werden mit 403 abgewiesen.

### Herkunft jeder Anfrage

Beim ersten Seitenaufruf werden `utm_*`, `gclid`, `fbclid`, `msclkid`, Referrer und
Landingpage im `sessionStorage` gesichert und beim Absenden als versteckte Felder
mitgeschickt. Sie überleben damit jede Navigation innerhalb der Seite.

---

## Vor dem Launch

1. **Impressumsangaben** in `src/config/site.ts` unter `impressum` eintragen
   (Rechtsform, Anschrift, USt-IdNr. oder Kleinunternehmerhinweis, ggf. Register).
   Sobald alle Felder gesetzt sind, verschwinden die Lückenmarkierungen und die
   Rechtstexte werden indexierbar.
2. **E-Mail-Adresse** als `contactEmail` eintragen.
3. **Domain** als `PUBLIC_SITE_URL` setzen (in `wrangler.jsonc` unter `vars` oder als
   Umgebungsvariable im Build). Damit werden `robots.txt`, Sitemap, kanonische URLs
   und Open Graph automatisch aktiv.
4. **Zustellung** einrichten:
   ```bash
   wrangler kv namespace create LEADS      # ID in wrangler.jsonc eintragen
   wrangler secret put RESEND_API_KEY
   ```
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
