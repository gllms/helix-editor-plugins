<script lang="ts">
  import type { IPlugin } from "../routes/plugins.remote";
  import timeAgo from "$lib/timeAgo";
  import { getRepositoryPath, getRepositorySource } from "$lib/repositorySources";

  import IconStarFill from "phosphor-icons-svelte/IconStarFill.svelte";
  import IconAsteriskBold from "phosphor-icons-svelte/IconAsteriskBold.svelte";
  import IconGitCommitFill from "phosphor-icons-svelte/IconGitCommitFill.svelte";
  import { resolve } from "$app/paths";

  interface IPluginCardProps {
    plugin: IPlugin;
    headingLevel?: 2 | 3;
    showCreatedAt?: boolean;
    onTagClick?: (tag: string) => void;
  }

  let { plugin, headingLevel = 2, showCreatedAt = false }: IPluginCardProps = $props();

  const source = $derived(getRepositorySource(plugin.repository));
</script>

<a class="plugin-card" href={resolve(`/plugin/${plugin.name}`)}>
  <svelte:element this={`h${headingLevel}`}>{plugin.name}</svelte:element>
  <p>{plugin.description}</p>
  <ul class="pill-container" role="list">
    <li class="pill">
      <source.icon />
      <span class="visually-hidden">{source.name} repository:</span>
      {getRepositoryPath(plugin.repository)}
    </li>
    <li class="pill">
      <IconStarFill />
      <span class="visually-hidden">Stars:</span>
      {plugin.star_count}
    </li>
    {#if showCreatedAt}
      <li class="pill" title="Created: {plugin.created_at.toLocaleString()}">
        <IconAsteriskBold />
        <span class="visually-hidden">Created:</span>
        <time datetime={plugin.created_at.toISOString()}>{timeAgo(plugin.created_at)}</time>
      </li>
    {/if}
    <li class="pill" title="Last push: {plugin.updated_at.toLocaleString()}">
      <IconGitCommitFill />
      <span class="visually-hidden">Last push:</span>
      <time datetime={plugin.updated_at.toISOString()}>{timeAgo(plugin.updated_at)}</time>
    </li>
  </ul>
</a>
