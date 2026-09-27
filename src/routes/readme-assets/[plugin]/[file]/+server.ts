import { error } from "@sveltejs/kit";
import loadReadme from "$lib/loadReadme";
import readPluginFiles from "$lib/readPluginFiles";
import type { RequestHandler } from "./$types";

// +server.ts routes don't inherit the `prerender` option from +layout.ts
export const prerender = true;

export const GET: RequestHandler = async ({ params }) => {
  const plugin = readPluginFiles().find((plugin) => plugin.name === params.plugin);
  const image = plugin && (await loadReadme(plugin)).images.get(params.file);

  if (!image) error(404, "Not found");

  return new Response(image.body, { headers: { "Content-Type": image.type } });
};
