import { API_TOKEN_CODEBERG } from "$app/env/private";
import { getRepositoryPath } from "#lib/repositorySources.js";
import type { PluginEnricher } from "../../routes/plugins.remote";

interface ICodebergRepository {
  stars_count: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  owner: { login: string; full_name: string; html_url: string };
}

interface ICodebergCommit {
  commit: { author: { name: string }; committer: { date: string } };
  author: { login: string } | null;
}

const headers = {
  Accept: "application/json",
  Authorization: `token ${API_TOKEN_CODEBERG}`,
};

// Forgejo has no bot account type, so bots are recognized by names like "renovate-bot" or "dependabot[bot]"
const BOT_NAME = /\bbot\b|\[bot\]$/i;

function isBotCommit({ commit, author }: ICodebergCommit): boolean {
  return BOT_NAME.test(author?.login ?? "") || BOT_NAME.test(commit.author.name);
}

async function fetchCommitDates(
  repositoryPath: string,
): Promise<{ last: Date; lastHuman: Date } | null> {
  const response = await fetch(
    `https://codeberg.org/api/v1/repos/${repositoryPath}/commits?limit=50&stat=false&verification=false&files=false`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`Codeberg API returned ${response.status} for commits of ${repositoryPath}`);
  }

  const commits = (await response.json()) as ICodebergCommit[];
  const [lastCommit] = commits;
  if (!lastCommit) return null;

  const lastHumanCommit = commits.find((commit) => !isBotCommit(commit)) ?? commits.at(-1)!;
  return {
    last: new Date(lastCommit.commit.committer.date),
    lastHuman: new Date(lastHumanCommit.commit.committer.date),
  };
}

export const enrichPluginCodeberg: PluginEnricher = async (plugin) => {
  const repositoryPath = getRepositoryPath(plugin.repository);
  const [response, commitDates] = await Promise.all([
    fetch(`https://codeberg.org/api/v1/repos/${repositoryPath}`, { headers }),
    fetchCommitDates(repositoryPath),
  ]);

  if (!response.ok) {
    throw new Error(`Codeberg API returned ${response.status} for ${plugin.repository}`);
  }

  const payload = (await response.json()) as ICodebergRepository;
  const repositoryUpdatedAt = payload.updated_at ? new Date(payload.updated_at) : new Date(0);
  return {
    ...plugin,
    star_count: typeof payload.stars_count === "number" ? payload.stars_count : 0,
    created_at: payload.created_at ? new Date(payload.created_at) : new Date(0),
    last_commit_at: commitDates?.last ?? repositoryUpdatedAt,
    last_human_commit_at: commitDates?.lastHuman ?? repositoryUpdatedAt,
    url: payload.html_url,
    author: {
      name: payload.owner.full_name || payload.owner.login,
      url: payload.owner.html_url,
    },
  };
};
