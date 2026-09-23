import type { IPlugin } from "../routes/plugins.remote";

const RELATED_COUNT = Infinity;
const MIN_SHARED_TAGS = 2;

/** Get related plugins based on amount of shared tags */
export default function getRelatedPlugins(plugin: IPlugin, plugins: IPlugin[], count: number = RELATED_COUNT): IPlugin[] {
  const tags = new Set(plugin.tags ?? []);

  return plugins
    .filter((other) => other.name !== plugin.name)
    .map((other) => ({
      plugin: other,
      sharedTagCount: (other.tags ?? []).filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ sharedTagCount }) => sharedTagCount >= MIN_SHARED_TAGS)
    .sort((a, b) => b.sharedTagCount - a.sharedTagCount || b.plugin.star_count - a.plugin.star_count)
    .slice(0, count)
    .map(({ plugin }) => plugin);
}
