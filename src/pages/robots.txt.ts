import type { APIRoute } from 'astro';
import { istVeroeffentlicht, siteUrl } from '../config/site';

/**
 * Solange keine Domain gesetzt ist, wird die gesamte Seite für Suchmaschinen
 * gesperrt. Das ist die technische Absicherung dafür, dass nichts vorzeitig
 * öffentlich auffindbar wird.
 */
export const GET: APIRoute = () => {
  const zeilen = istVeroeffentlicht
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /danke',
        '',
        `Sitemap: ${siteUrl}/sitemap-index.xml`,
        '',
      ]
    : [
        '# Vorabversion ohne Domain — vollständig gesperrt.',
        '# Wird automatisch freigegeben, sobald PUBLIC_SITE_URL gesetzt ist.',
        'User-agent: *',
        'Disallow: /',
        '',
      ];

  return new Response(zeilen.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
