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

interface IGitHubCommit {
  commit: { author: { name: string }; committer: { date: string } };
  author: { type: string } | null;
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

function isBotCommit({ commit, author }: IGitHubCommit): boolean {
  return author?.type === "Bot" || commit.author.name.endsWith("[bot]");
}

async function fetchCommitDates(
  repositoryPath: string,
): Promise<{ last: Date; lastHuman: Date } | null> {
  const response = await fetch(
    `https://api.github.com/repos/${repositoryPath}/commits?per_page=100`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for commits of ${repositoryPath}`);
  }

  const commits = (await response.json()) as IGitHubCommit[];
  const [lastCommit] = commits;
  if (!lastCommit) return null;

  const lastHumanCommit = commits.find((commit) => !isBotCommit(commit)) ?? commits.at(-1)!;
  return {
    last: new Date(lastCommit.commit.committer.date),
    lastHuman: new Date(lastHumanCommit.commit.committer.date),
  };
}

export const enrichPluginGithub: PluginEnricher = async (plugin) => {
  const repositoryPath = getRepositoryPath(plugin.repository);
  const [response, commitDates] = await Promise.all([
    fetch(`https://api.github.com/repos/${repositoryPath}`, { headers }),
    fetchCommitDates(repositoryPath),
  ]);

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${plugin.repository}`);
  }

  const payload = (await response.json()) as IGitHubRepository;
  const pushedAt = payload.pushed_at ? new Date(payload.pushed_at) : new Date(0);
  return {
    ...plugin,
    star_count: typeof payload.stargazers_count === "number" ? payload.stargazers_count : 0,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(0),
    last_commit_at: commitDates?.last ?? pushedAt,
    last_human_commit_at: commitDates?.lastHuman ?? pushedAt,
    url: payload.html_url,
    author: await fetchAuthor(payload.owner.login),
  };
};
