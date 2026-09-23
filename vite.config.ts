import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const base = process.argv.includes("dev") ? "" : process.env.BASE_PATH;

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        experimental: {
          async: true,
        },
      },
      adapter: adapter(),
      paths: {
        // @ts-ignore
        base,
      },
      experimental: {
        remoteFunctions: true,
      },
      inlineStyleThreshold: Infinity,
      prerender: {
        handleMissingId: ({ path, id, message }) => {
          // Hash links to the home page like /#q=%23tag hold a search query (see src/lib/searchHash.ts), not an element id
          if (path === `${base ?? ""}/` && id.startsWith("q=")) return;
          throw new Error(message);
        },
      },
    }),
  ],
});
