import type { Component } from "svelte";
import type { ClassValue } from "svelte/elements";
import IconCodebergFill from "./icons/IconCodebergFill.svelte";
import IconGithubLogoFill from "phosphor-icons-svelte/IconGithubLogoFill.svelte";

/**
 * Extend this union when adding a new repository source — the compiler will then require a
 * matching entry in {@link repositorySources} below and a matching enricher in plugins.remote.ts.
 */
export type RepositorySourceId = "codeberg" | "github";

export interface IRepositorySource {
  id: RepositorySourceId;
  name: string;
  /**
   * Prefix used in a plugin's `repository` field (e.g. `"codeberg:"`). Omitted for the
   * default source, which is assumed when no other source's prefix matches.
   */
  prefix?: string;
  icon: Component<{ class?: ClassValue }>;
  /**
   * Multiplier applied to this source's star counts when computing the "Magic" sort score,
   * to compensate for the source being more or less popular than the default source.
   */
  starMultiplier: number;
}

/** Registry of repository hosts plugins can be sourced from — one entry per {@link RepositorySourceId}. */
export const repositorySources: IRepositorySource[] = [
  {
    id: "codeberg",
    name: "Codeberg",
    prefix: "codeberg:",
    icon: IconCodebergFill,
    // Codeberg is much smaller than GitHub, so its stars are worth more per star.
    // Placeholder value with no data behind it — revisit once there are enough
    // Codeberg plugins to compare against.
    starMultiplier: 1.5,
  },
  { id: "github", name: "GitHub", icon: IconGithubLogoFill, starMultiplier: 1 },
];

const defaultSource: IRepositorySource = (() => {
  const source = repositorySources.find((source) => !source.prefix);
  if (!source) {
    throw new Error("repositorySources must include exactly one source without a prefix to act as the default.");
  }
  return source;
})();

export function getRepositorySource(repository: string): IRepositorySource {
  return repositorySources.find((source) => source.prefix && repository.startsWith(source.prefix)) ?? defaultSource;
}

/** Strips the source prefix (if any) from a plugin's `repository` field. */
export function getRepositoryPath(repository: string): string {
  const source = getRepositorySource(repository);
  return source.prefix ? repository.slice(source.prefix.length) : repository;
}
