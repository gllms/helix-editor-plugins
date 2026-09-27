import type { IPlugin } from "../routes/plugins.remote";

const pluginJsonFiles = import.meta.glob<string>("/plugins/*.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

export default function readPluginFiles(): IPlugin[] {
  return Object.entries(pluginJsonFiles).map(([path, content]) => {
    const name =
      path
        .split("/")
        .pop()
        ?.replace(/\.json$/, "") ?? "";
    return { name, ...JSON.parse(content) };
  });
}
