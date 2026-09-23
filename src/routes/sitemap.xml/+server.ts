import { getPluginPageUrl, SITE_URL } from "$lib/generateJsonLd";
import { getPlugins } from "../plugins.remote";
import type { RequestHandler } from "./$types";

// +server.ts routes don't inherit the `prerender` option from +layout.ts
export const prerender = true;

/** Entity-escapes the characters the sitemap protocol requires to be escaped. */
function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export const GET: RequestHandler = async () => {
  const plugins = await getPlugins();

  // The home page lists every plugin, so it's as fresh as the most recently updated one
  const [mostRecentlyUpdated] = plugins.toSorted(
    (a, b) => b.updated_at.getTime() - a.updated_at.getTime(),
  );

  const entries = [
    { loc: `${SITE_URL}/`, lastmod: mostRecentlyUpdated?.updated_at },
    ...plugins.map((plugin) => ({ loc: getPluginPageUrl(plugin), lastmod: plugin.updated_at })),
  ];

  const urls = entries.map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}</url>`,
  );

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
