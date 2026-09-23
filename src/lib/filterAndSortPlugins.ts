import type { IPlugin } from "../routes/plugins.remote";
import { getRepositorySource } from "./repositorySources";

/** How many days it takes for the "recent activity" boost to halve. */
const RECENCY_HALF_LIFE_DAYS = 60;

/** How much a fully-fresh update can multiply the star score by. */
const RECENCY_WEIGHT = 10;

/** Strips everything but a tag's valid characters, so it can be safely used inside a dynamically built RegExp. */
function sanitizeTag(tag: string): string {
  return tag.replace(/[^#a-z0-9-]/g, "");
}

function getMagicScore(plugin: IPlugin): number {
  const { starMultiplier } = getRepositorySource(plugin.repository);
  const adjustedStars = plugin.star_count * starMultiplier;
  const starScore = Math.log1p(adjustedStars);

  const daysSinceUpdate = (Date.now() - plugin.updated_at.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.pow(0.5, daysSinceUpdate / RECENCY_HALF_LIFE_DAYS);

  return starScore * (1 + RECENCY_WEIGHT * recencyFactor);
}

export default function filterAndSortPlugins(
  plugins: IPlugin[],
  searchQuery: string,
  sortBy: keyof IPlugin | "magic",
  sortDirection: "asc" | "desc",
) {
  let result = plugins;

  if (searchQuery.trim() !== "") {
    const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const tagWords = words.filter((word) => word.startsWith("#"));
    const normalWords = words.filter((word) => !word.startsWith("#"));

    result = result.filter((plugin) => {
      if (
        tagWords.length > 0 &&
        !tagWords.every((tag) => plugin.search_text.match(sanitizeTag(tag) + "\\b"))
      ) {
        return false;
      }

      if (normalWords.length === 0) {
        return true;
      }

      return normalWords.some((word) => plugin.search_text.includes(word));
    });
  }

  return result.toSorted((a, b) => {
    if (sortBy === "magic") {
      return (getMagicScore(a) - getMagicScore(b)) * (sortDirection === "asc" ? 1 : -1);
    }

    const aValue = a[sortBy];
    const bValue = b[sortBy];
    let result = 0;

    if (typeof aValue === "string" && typeof bValue === "string") {
      result = aValue.localeCompare(bValue);
    } else if (aValue instanceof Date && bValue instanceof Date) {
      result = aValue.getTime() - bValue.getTime();
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      result = aValue - bValue;
    }

    return result * (sortDirection === "asc" ? 1 : -1);
  });
}
