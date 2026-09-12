import { API_TOKEN_GITHUB } from "$env/static/private";
import { getRepositoryPath } from "$lib/repositorySources";
import type { PluginEnricher } from "../../routes/plugins.remote";

export interface IGitHubRepository {
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  html_url: string;
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${API_TOKEN_GITHUB}`
};

export const enrichPluginGithub: PluginEnricher = async (plugin) => {
  const response = await fetch(`https://api.github.com/repos/${getRepositoryPath(plugin.repository)}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${plugin.repository}`);
  }

  const payload = await response.json() as IGitHubRepository;
  return {
    ...plugin,
    star_count: typeof payload.stargazers_count === "number" ? payload.stargazers_count : 0,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(0),
    updated_at: payload.pushed_at ? new Date(payload.pushed_at) : new Date(0),
    url: payload.html_url,
  };
};
