import { prerender } from "$app/server";
import { getRepositorySource, type RepositorySourceId } from "$lib/repositorySources";
import { enrichPluginGithub } from "$lib/pluginEnrichers/enrichPluginGithub";
import { enrichPluginCodeberg } from "$lib/pluginEnrichers/enrichPluginCodeberg";

export interface IPlugin {
  name: string;
  description: string;
  repository: string;
  tags?: string[];
  star_count: number;
  created_at: Date;
  updated_at: Date;
  url: string;
  search_text: string;
}

export type PluginEnricher = (plugin: IPlugin) => Promise<IPlugin>;

/**
 * One enricher per {@link RepositorySourceId}. Typed as a `Record` so adding a new source to
 * `repositorySources` without registering its enricher here is a compile error.
 */
const enrichersBySourceId: Record<RepositorySourceId, PluginEnricher> = {
  codeberg: enrichPluginCodeberg,
  github: enrichPluginGithub,
};

/**
 * Fetches the list of plugins from the JSON files in /plugins and enriches each with
 * additional information fetched from its repository host.
 */
export const getPlugins = prerender<IPlugin[]>(async () => {
  const pluginJsonFiles = import.meta.glob("/plugins/*.json", {
    eager: true,
    query: "?raw",
    import: "default",
  });
  const plugins: IPlugin[] = Object.entries(pluginJsonFiles).map(([path, content]) => {
    const name = path.split("/").pop()?.replace(/\.json$/, "") ?? "";
    return { name, ...JSON.parse(content) };
  });

  return await Promise.all(
    plugins.map((plugin) => enrichersBySourceId[getRepositorySource(plugin.repository).id](plugin))
  );
});
