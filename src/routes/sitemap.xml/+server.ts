import { getPluginPageUrl, SITE_URL } from "#lib/generateJsonLd.js";
import getLastCommitDates from "#lib/getLastCommitDates.js";
import { getPlugins } from "../plugins.remote";
import type { RequestHandler } from "./$types";

// +server.ts routes don't inherit the `prerender` option from +layout.ts
export const prerender = true;

/** Entity-escapes the characters the sitemap protocol requires to be escaped. */
function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function latest(...dates: (Date | undefined)[]) {
  const times = dates.filter((date) => date !== undefined).map((date) => date.getTime());
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}

export const GET: RequestHandler = async () => {
  const plugins = await getPlugins();
  const commitDates = getLastCommitDates("plugins");
  const helpPage = "src/routes/help/+page.svelte";

  const pluginEntries = plugins.map((plugin) => ({
    loc: getPluginPageUrl(plugin),
    lastmod: latest(plugin.updated_at, commitDates.get(`plugins/${plugin.name}.json`)),
  }));

  const entries = [
    // The home page lists every plugin, so it changes when one does, or when one is removed
    {
      loc: `${SITE_URL}/`,
      lastmod: latest(...pluginEntries.map(({ lastmod }) => lastmod), ...commitDates.values()),
    },
    { loc: `${SITE_URL}/help`, lastmod: getLastCommitDates(helpPage).get(helpPage) },
    ...pluginEntries,
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
