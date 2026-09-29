import { getAllowedLicenseName } from "$lib/licenses";
import { readmeFetcherCodeberg } from "$lib/readmeFetchers/readmeFetcherCodeberg";
import { readmeFetcherGithub } from "$lib/readmeFetchers/readmeFetcherGithub";
import renderReadme, { type IReadmeAsset } from "$lib/renderReadme";
import {
  getRepositoryPath,
  getRepositorySource,
  type RepositorySourceId,
} from "$lib/repositorySources";
import warn from "$lib/warn";
import type { IPlugin } from "../routes/plugins.remote";

export interface ILicenseFile {
  spdxId: string | null;
  url: string;
}

export interface IReadmeFile {
  markdown: string;
  path: string;
  rawUrl: string;
  htmlUrl: string;
  videoUrls?: Map<string, string>;
}

export interface IReadmeFetcher {
  fetchLicense: (repositoryPath: string) => Promise<ILicenseFile | null>;
  fetchReadme: (repositoryPath: string) => Promise<IReadmeFile | null>;
}

export interface IReadme {
  html: string;
  url: string;
  license: { name: string; url: string };
}

export type ReadmeUnavailableReason =
  "no-license" | "license-not-allowed" | "no-readme" | "unavailable";

export type ReadmeResult =
  { readme: IReadme } | { readme: null; unavailableReason: ReadmeUnavailableReason };

interface ILoadedReadme {
  result: ReadmeResult;
  assets: Map<string, IReadmeAsset>;
}

const readmeFetchersBySourceId: Record<RepositorySourceId, IReadmeFetcher> = {
  codeberg: readmeFetcherCodeberg,
  github: readmeFetcherGithub,
};

const cache = new Map<string, Promise<ILoadedReadme>>();

export default function loadReadme(
  plugin: Pick<IPlugin, "name" | "repository">,
): Promise<ILoadedReadme> {
  let readme = cache.get(plugin.name);
  if (!readme) {
    readme = fetchAndRenderReadme(plugin);
    cache.set(plugin.name, readme);
  }
  return readme;
}

function unavailable(unavailableReason: ReadmeUnavailableReason): ILoadedReadme {
  return { result: { readme: null, unavailableReason }, assets: new Map() };
}

async function fetchAndRenderReadme(
  plugin: Pick<IPlugin, "name" | "repository">,
): Promise<ILoadedReadme> {
  const repositoryPath = getRepositoryPath(plugin.repository);
  const fetcher = readmeFetchersBySourceId[getRepositorySource(plugin.repository).id];
  const warningTitle = "README not shown";

  try {
    const license = await fetcher.fetchLicense(repositoryPath);
    if (!license) {
      warn(warningTitle, `${repositoryPath} doesn't have a license.`);
      return unavailable("no-license");
    }
    if (!license.spdxId) {
      warn(warningTitle, `The license of ${repositoryPath} wasn't recognized: ${license.url}`);
      return unavailable("license-not-allowed");
    }
    const licenseName = getAllowedLicenseName(license.spdxId);
    if (!licenseName) {
      warn(
        warningTitle,
        `${repositoryPath} is licensed under ${license.spdxId}, which isn't in the allowed licenses in src/lib/licenses.ts.`,
      );
      return unavailable("license-not-allowed");
    }

    const readmeFile = await fetcher.fetchReadme(repositoryPath);
    if (!readmeFile) return unavailable("no-readme");
    if (!/\.(md|markdown)$/i.test(readmeFile.path)) {
      warn(warningTitle, `The README of ${repositoryPath} isn't markdown: ${readmeFile.htmlUrl}`);
      return unavailable("unavailable");
    }

    const { html, assets } = await renderReadme(readmeFile, {
      pluginName: plugin.name,
      // Relative to /plugin/[plugin], the page READMEs are shown on
      getAssetUrl: (fileName) => `../readme-assets/${encodeURIComponent(plugin.name)}/${fileName}`,
    });

    return {
      result: {
        readme: { html, url: readmeFile.htmlUrl, license: { name: licenseName, url: license.url } },
      },
      assets,
    };
  } catch (error) {
    warn(
      warningTitle,
      `Couldn't load the README of ${repositoryPath}: ${error instanceof Error ? error.message : error}`,
    );
    return unavailable("unavailable");
  }
}
