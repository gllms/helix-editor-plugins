import type { IPlugin } from "../routes/plugins.remote";

const RELATED_COUNT = Infinity;
const MIN_SHARED_TAGS = 2;
/** Plugins sharing fewer than `MIN_SHARED_TAGS` tags still count as related if they share a tag that at most this fraction of all plugins have */
const RARE_TAG_MAX_FRACTION = 0.08;

/** Get related plugins based on shared tags. Rarer tags are worth more than more common tags. */
export default function getRelatedPlugins(
  plugin: IPlugin,
  plugins: IPlugin[],
  count: number = RELATED_COUNT,
): IPlugin[] {
  const tags = new Set(plugin.tags ?? []);
  const tagCounts = new Map<string, number>();
  const rareTagMaxPlugins = plugins.length * RARE_TAG_MAX_FRACTION;

  for (const other of plugins) {
    for (const tag of other.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return plugins
    .filter((other) => other.name !== plugin.name)
    .map((other) => {
      const sharedTags = (other.tags ?? []).filter((tag) => tags.has(tag));

      return {
        plugin: other,
        sharedTagCount: sharedTags.length,
        sharesRareTag: sharedTags.some((tag) => tagCounts.get(tag)! <= rareTagMaxPlugins),
        score: sharedTags.reduce((score, tag) => score + 1 / tagCounts.get(tag)!, 0),
      };
    })
    .filter(
      ({ sharedTagCount, sharesRareTag }) => sharedTagCount >= MIN_SHARED_TAGS || sharesRareTag,
    )
    .sort((a, b) => b.score - a.score || b.plugin.star_count - a.plugin.star_count)
    .slice(0, count)
    .map(({ plugin }) => plugin);
}
