import { API_TOKEN_GITHUB } from "$app/env/private";
import { getRepositoryPath } from "#lib/repositorySources.js";
import type { IAuthor, PluginEnricher } from "../../routes/plugins.remote";

export interface IGitHubRepository {
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  html_url: string;
  owner: { login: string };
}

interface IGitHubUser {
  login: string;
  name: string | null;
  html_url: string;
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${API_TOKEN_GITHUB}`,
};

// Many plugins share an owner, so each owner is only fetched once
const authorsByLogin = new Map<string, Promise<IAuthor>>();

function fetchAuthor(login: string): Promise<IAuthor> {
  let author = authorsByLogin.get(login);
  if (!author) {
    author = (async () => {
      const response = await fetch(`https://api.github.com/users/${login}`, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status} for user ${login}`);
      }
      const user = (await response.json()) as IGitHubUser;
      return { name: user.name || user.login, url: user.html_url };
    })();
    authorsByLogin.set(login, author);
  }
  return author;
}

export const enrichPluginGithub: PluginEnricher = async (plugin) => {
  const response = await fetch(
    `https://api.github.com/repos/${getRepositoryPath(plugin.repository)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${plugin.repository}`);
  }

  const payload = (await response.json()) as IGitHubRepository;
  return {
    ...plugin,
    star_count: typeof payload.stargazers_count === "number" ? payload.stargazers_count : 0,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(0),
    updated_at: payload.pushed_at ? new Date(payload.pushed_at) : new Date(0),
    url: payload.html_url,
    author: await fetchAuthor(payload.owner.login),
  };
};
