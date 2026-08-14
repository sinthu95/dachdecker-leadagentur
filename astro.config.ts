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
  /* `format: 'file'` erzeugt leistungen.html statt leistungen/index.html.
     Das ist die Form, die Cloudflare Pages zu trailingSlash: 'never' passend
     ausliefert: /leistungen antwortet direkt mit 200, /leistungen/ wird auf
     die Adresse ohne Schrägstrich umgeleitet.

     Mit Verzeichnisform war es umgekehrt — Pages leitete /leistungen per 308
     auf /leistungen/ um. Das kostete bei jedem internen Klick eine zusätzliche
     Rundreise und stellte die kanonischen URLs, die Sitemap und die
     tatsächlich ausgelieferte Adresse gegeneinander. Auf Workers fiel das
     nicht auf, weil dort html_handling diese Arbeit übernahm; diese
     Einstellung gibt es bei Pages nicht. */
  build: { inlineStylesheets: 'auto', format: 'file' },
  devToolbar: { enabled: false },
});
