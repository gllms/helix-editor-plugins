import { API_TOKEN_CODEBERG } from "$env/static/private";
import { detectLicense } from "$lib/licenses";
import type { IReadmeFetcher } from "$lib/loadReadme";

interface ICodebergFile {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  html_url: string;
  download_url: string;
}

const headers = {
  Accept: "application/json",
  Authorization: `token ${API_TOKEN_CODEBERG}`,
};

async function fetchCodeberg(url: string) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Codeberg returned ${response.status} for ${url}`);
  }

  return response;
}

async function findRootFile(repositoryPath: string, pattern: RegExp) {
  const response = await fetchCodeberg(
    `https://codeberg.org/api/v1/repos/${repositoryPath}/contents`,
  );
  const files = (await response.json()) as ICodebergFile[];
  return files.find((file) => file.type === "file" && pattern.test(file.name));
}

export const readmeFetcherCodeberg: IReadmeFetcher = {
  async fetchLicense(repositoryPath) {
    const file = await findRootFile(repositoryPath, /^(licen[cs]e|copying|unlicense)([-.]|$)/i);
    if (!file) return null;

    const text = await (await fetchCodeberg(file.download_url)).text();
    return { spdxId: detectLicense(text), url: file.html_url };
  },

  async fetchReadme(repositoryPath) {
    const file = await findRootFile(repositoryPath, /^readme(\.(md|markdown))?$/i);
    if (!file) return null;

    return {
      markdown: await (await fetchCodeberg(file.download_url)).text(),
      path: file.path,
      rawUrl: file.download_url,
      htmlUrl: file.html_url,
    };
  },
};
