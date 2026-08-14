import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { bauBasis, istVeroeffentlicht, impressumVollstaendig } from './src/config/site';

/**
 * Was auf `noindex` steht, gehört nicht in die Sitemap: Eine eingereichte
 * Adresse, die das Indexieren verbietet, ist ein Widerspruch und wird in der
 * Search Console als Fehler gemeldet.
 *
 * `/danke` bleibt dauerhaft draußen — es ist das Ziel der Conversion-Messung.
 * Impressum und Datenschutz kommen erst dazu, wenn die Pflichtangaben
 * vollständig sind; bis dahin tragen auch sie `noindex`.
 */
const nichtInSitemap = (adresse: string) => {
  const pfad = new URL(adresse).pathname.replace(/\/$/, '');
  if (pfad === '/danke') return false;
  if (!impressumVollstaendig && (pfad === '/impressum' || pfad === '/datenschutz')) return false;
  return true;
};

if (!istVeroeffentlicht) {
  console.warn(
    '\n[S&S Leadcraft] PUBLIC_SITE_URL ist nicht gesetzt.\n' +
      '  → Build läuft im Vorab-Modus: noindex auf allen Seiten, keine Sitemap,\n' +
      '    keine kanonischen URLs. Das ist beabsichtigt, solange keine Domain existiert.\n',
  );
}

export default defineConfig({
  site: bauBasis,
  adapter: cloudflare({ imageService: 'compile' }),
  // Alle Seiten sind statisch; nur /api/anfrage rendert serverseitig
  // (siehe `export const prerender = false` in src/pages/api/anfrage.ts).
  output: 'static',
  // Interne Verweise sind durchgaengig ohne Schrägstrich am Ende.
  trailingSlash: 'never',
  integrations: istVeroeffentlicht ? [sitemap({ filter: nichtInSitemap })] : [],
  // Astro liefert eine eigene Vite-Kopie mit; die Plugin-Typen der beiden
  // Installationen sind nominal verschieden, zur Laufzeit aber identisch.
  vite: { plugins: [tailwind() as never] },
  /**
   * `format: 'file'` erzeugt `kontakt.html` statt `kontakt/index.html`.
   *
   * Das ist keine Geschmacksfrage, sondern die einzige Stelle, an der sich
   * die kanonische Adressform bei Cloudflare Pages steuern lässt. Pages
   * kennt `html_handling` des Workers nicht und entscheidet nach der
   * Dateiablage: Aus `kontakt/index.html` folgt `/kontakt/` als kanonische
   * Form, und `/kontakt` wird mit 308 dorthin umgeleitet. Da alle internen
   * Verweise wegen `trailingSlash: 'never'` ohne Schrägstrich stehen, kostete
   * das jeden internen Klick eine zusätzliche Rundreise — gemessen am
   * Testlauf vom 14.08.2026 auf acht von neun Seiten.
   *
   * Mit `file` liegt `kontakt.html` flach, Pages liefert `/kontakt` direkt
   * aus und leitet `/kontakt/` dorthin um. Beide Auslieferungswege sind damit
   * einheitlich ohne Schrägstrich: Der Worker kommt über
   * `html_handling: "drop-trailing-slash"` zum selben Ergebnis, das er auch
   * vorher schon lieferte — die ausgelieferten Adressen ändern sich für ihn
   * nicht, nur die Namen der Dateien darunter.
   */
  build: { format: 'file', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
