import { error } from "@sveltejs/kit";
import loadReadme from "#lib/loadReadme.js";
import readPluginFiles from "#lib/readPluginFiles.js";
import type { RequestHandler } from "./$types";

// +server.ts routes don't inherit the `prerender` option from +layout.ts
export const prerender = true;

export const GET: RequestHandler = async ({ params }) => {
  const plugin = readPluginFiles().find((plugin) => plugin.name === params.plugin);
  const asset = plugin && (await loadReadme(plugin)).assets.get(params.file);

  if (!asset) error(404, "Not found");

  return new Response(asset.body, { headers: { "Content-Type": asset.type } });
};
