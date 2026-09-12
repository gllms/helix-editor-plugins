import { API_TOKEN_CODEBERG } from "$env/static/private";
import { getRepositoryPath } from "$lib/repositorySources";
import type { PluginEnricher } from "../../routes/plugins.remote";

interface ICodebergRepository {
  stars_count: number;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export const enrichPluginCodeberg: PluginEnricher = async (plugin) => {
  const headers = {
    Accept: "application/json",
    Authorization: `token ${API_TOKEN_CODEBERG}`
  };

  const response = await fetch(`https://codeberg.org/api/v1/repos/${getRepositoryPath(plugin.repository)}`, { headers });

  if (!response.ok) {
    throw new Error(`Codeberg API returned ${response.status} for ${plugin.repository}`);
  }

  const payload = await response.json() as ICodebergRepository;
  return {
    ...plugin,
    star_count: typeof payload.stars_count === "number" ? payload.stars_count : 0,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(0),
    updated_at: payload.updated_at ? new Date(payload.updated_at) : new Date(0),
    url: payload.html_url,
  };
};
