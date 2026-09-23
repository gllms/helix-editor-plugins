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

  let {
    plugin,
    headingLevel = 2,
    showCreatedAt = false,
  }: IPluginCardProps = $props();

  const source = $derived(getRepositorySource(plugin.repository));
</script>

<a class="plugin-card" href="{resolve(`/plugin/${plugin.name}`)}">
  <svelte:element this={`h${headingLevel}`}>{plugin.name}</svelte:element>
  <p>{plugin.description}</p>
  <div class="pill-container">
    <span class="pill">
      <source.icon />
      {getRepositoryPath(plugin.repository)}
    </span>
    <span class="pill">
      <IconStarFill />
      {plugin.star_count}
    </span>
    {#if showCreatedAt}
      <span class="pill" title="Created: {plugin.created_at.toLocaleString()}">
        <IconAsteriskBold />
        {timeAgo(plugin.created_at)}
      </span>
    {/if}
    <span class="pill" title="Last push: {plugin.updated_at.toLocaleString()}">
      <IconGitCommitFill />
      {timeAgo(plugin.updated_at)}
    </span>
  </div>
</a>
