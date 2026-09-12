import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
        experimental: {
          async: true,
        },
      },
      adapter: adapter(),
      paths: {
        // @ts-ignore
        base: process.argv.includes("dev") ? "" : process.env.BASE_PATH,
      },
      experimental: {
        remoteFunctions: true,
      },
      inlineStyleThreshold: Infinity,
    }),
  ],
});
