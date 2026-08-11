import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { bauBasis, istVeroeffentlicht } from './src/config/site';

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
  integrations: istVeroeffentlicht ? [sitemap()] : [],
  // Astro liefert eine eigene Vite-Kopie mit; die Plugin-Typen der beiden
  // Installationen sind nominal verschieden, zur Laufzeit aber identisch.
  vite: { plugins: [tailwind() as never] },
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
