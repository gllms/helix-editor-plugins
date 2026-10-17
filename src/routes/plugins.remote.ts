import { prerender } from "$app/server";
import { getRepositorySource, type RepositorySourceId } from "#lib/repositorySources.js";
import { enrichPluginGithub } from "#lib/pluginEnrichers/enrichPluginGithub.js";
import { enrichPluginCodeberg } from "#lib/pluginEnrichers/enrichPluginCodeberg.js";
import loadReadme, { type ReadmeResult } from "#lib/loadReadme.js";
import readPluginFiles from "#lib/readPluginFiles.js";

export interface IAuthor {
  name: string;
  url: string;
}

export interface IPlugin {
  name: string;
  description: string;
  repository: string;
  tags?: string[];
  star_count: number;
  created_at: Date;
  updated_at: Date;
  url: string;
  author: IAuthor;
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

// The dev server reruns `getPlugins` on every request, which would otherwise quickly hit API rate limits
const enrichedPluginsByRepository = new Map<string, Promise<IPlugin>>();

function enrichPlugin(plugin: IPlugin): Promise<IPlugin> {
  let enriched = enrichedPluginsByRepository.get(plugin.repository);
  if (!enriched) {
    enriched = enrichersBySourceId[getRepositorySource(plugin.repository).id](plugin);
    enriched.catch(() => enrichedPluginsByRepository.delete(plugin.repository));
    enrichedPluginsByRepository.set(plugin.repository, enriched);
  }
  return enriched;
}

/**
 * Fetches the list of plugins from the JSON files in /plugins and enriches each with
 * additional information fetched from its repository host.
 */
export const getPlugins = prerender<IPlugin[]>(async () => {
  return await Promise.all(
    readPluginFiles().map(async (plugin) => ({ ...(await enrichPlugin(plugin)), ...plugin })),
  );
});

export const getReadme = prerender(
  // Unvalidated, since without `dynamic: true` it's only called with the `inputs` below
  "unchecked",
  async (name: string): Promise<ReadmeResult> => {
    const plugin = readPluginFiles().find((plugin) => plugin.name === name);
    if (!plugin) return { readme: null, unavailableReason: "no-readme" };

    return (await loadReadme(plugin)).result;
  },
  { inputs: () => readPluginFiles().map((plugin) => plugin.name) },
);
