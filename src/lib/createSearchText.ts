import type { IPlugin } from "../routes/plugins.remote";
import tagSynonyms from "../../tagSynonyms.json";

export default function createSearchText(plugin: IPlugin) {
  let tagsAndSynonyms: string[] = [];

  if (plugin.tags) {
    tagsAndSynonyms = plugin.tags.flatMap((tag) => {
      const synonyms = (tagSynonyms as string[][]).find((arr) =>
        arr.includes(tag),
      );

      return synonyms ?? [tag];
    });
  }

  return (
    plugin.name +
    " " +
    plugin.description +
    " " +
    plugin.repository +
    " " +
    (tagsAndSynonyms.map((t) => "#" + t).join(" ") || "")
  ).toLowerCase();
}