import { prerender } from "$app/server";
import { getRepositorySource, type RepositorySourceId } from "$lib/repositorySources";
import { enrichPluginGithub } from "$lib/pluginEnrichers/enrichPluginGithub";
import { enrichPluginCodeberg } from "$lib/pluginEnrichers/enrichPluginCodeberg";
import loadReadme, { type ReadmeResult } from "$lib/loadReadme";
import readPluginFiles from "$lib/readPluginFiles";

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
  return await Promise.all(
    readPluginFiles().map((plugin) =>
      enrichersBySourceId[getRepositorySource(plugin.repository).id](plugin),
    ),
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
