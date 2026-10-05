import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { IPlugin } from "../routes/plugins.remote";

const PLUGINS_DIR = "plugins";

// Not `import.meta.glob`: SvelteKit treats any module named `remote.*` as a remote functions file,
// which breaks importing a plugin file like remote.hx.json
export default function readPluginFiles(): IPlugin[] {
  return readdirSync(PLUGINS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const content = readFileSync(path.join(PLUGINS_DIR, file), "utf8");
      return { name: file.replace(/\.json$/, ""), ...JSON.parse(content) };
    });
}
