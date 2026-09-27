import { API_TOKEN_GITHUB } from "$env/static/private";
import type { IReadmeFetcher } from "$lib/loadReadme";

interface IGitHubFile {
  path: string;
  content: string;
  html_url: string;
  download_url: string;
}

interface IGitHubLicenseFile extends IGitHubFile {
  license: { spdx_id: string } | null;
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${API_TOKEN_GITHUB}`,
};

async function fetchGithub<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

export const readmeFetcherGithub: IReadmeFetcher = {
  async fetchLicense(repositoryPath) {
    const payload = await fetchGithub<IGitHubLicenseFile>(
      `https://api.github.com/repos/${repositoryPath}/license`,
    );
    if (!payload) return null;

    // GitHub reports license files it doesn't recognize as NOASSERTION
    const spdxId = payload.license?.spdx_id;
    return { spdxId: spdxId && spdxId !== "NOASSERTION" ? spdxId : null, url: payload.html_url };
  },

  async fetchReadme(repositoryPath) {
    const payload = await fetchGithub<IGitHubFile>(
      `https://api.github.com/repos/${repositoryPath}/readme`,
    );
    if (!payload) return null;

    return {
      markdown: Buffer.from(payload.content, "base64").toString("utf8"),
      path: payload.path,
      rawUrl: payload.download_url,
      htmlUrl: payload.html_url,
    };
  },
};
