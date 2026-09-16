<script lang="ts">
  import { getPlugins, type IPlugin } from "./plugins.remote";
  import timeAgo from "$lib/timeAgo";
  import { flip } from "svelte/animate";
  import { scale } from "svelte/transition";
  import { motionAnimation, motionTransition } from "$lib/motion";
  import createSearchText from "$lib/createSearchText";
  import filterAndSortPlugins from "$lib/filterAndSortPlugins";
  import generateJsonLd from "$lib/generateJsonLd";
  import { getRepositoryPath, getRepositorySource } from "$lib/repositorySources";

  import IconSortAscendingBold from "phosphor-icons-svelte/IconSortAscendingBold.svelte";
  import IconSortDescendingBold from "phosphor-icons-svelte/IconSortDescendingBold.svelte";
  import IconHashBold from "phosphor-icons-svelte/IconHashBold.svelte";
  import IconDotsThreeBold from "phosphor-icons-svelte/IconDotsThreeBold.svelte";
  import IconCaretLeftBold from "phosphor-icons-svelte/IconCaretLeftBold.svelte";
  import IconGithubLogoFill from "phosphor-icons-svelte/IconGithubLogoFill.svelte";
  import IconStarFill from "phosphor-icons-svelte/IconStarFill.svelte";
  import IconAsteriskBold from "phosphor-icons-svelte/IconAsteriskBold.svelte";
  import IconGitCommitFill from "phosphor-icons-svelte/IconGitCommitFill.svelte";
  import IconPlusBold from "phosphor-icons-svelte/IconPlusBold.svelte";
  import IconQuestionFill from "phosphor-icons-svelte/IconQuestionFill.svelte";
  import previouslyBlurred from "$lib/previouslyBlurred";
  import HelpDialog from "$lib/HelpDialog.svelte";

  const plugins = await getPlugins();

  for (const plugin of plugins) {
    plugin.search_text = createSearchText(plugin);
  }

  let searchQuery = $state<string>("");
  let sortBy = $state<keyof IPlugin | "magic">("magic");
  let sortDirection = $state<"asc" | "desc">("desc");
  let tagsCollapsed = $state<boolean>(true);
  const COLLAPSED_TAG_COUNT = 10;

  const tagCounts: Record<string, number> = {};

  for (const plugin of plugins) {
    for (const tag of plugin?.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  let sortedPlugins = $derived(
    filterAndSortPlugins(plugins, searchQuery, sortBy, sortDirection),
  );

  const newPluginJson = encodeURIComponent(
    `
{
  description: "A concise description of the plugin",
  repository: "username/repo",
  tags: ["tag1", "tag2"]
}
  `.trim(),
  );

  let jsonLd = $derived(generateJsonLd(sortedPlugins));

  let helpDialogOpen = $state(false);

  function openHelpDialog(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;

    if (
      window.matchMedia("(pointer: coarse)").matches &&
      button.dataset.previouslyBlurred === true.toString()
    ) {
      return;
    }

    helpDialogOpen = true;
  }

  $effect.pre(() => {
    if (sortBy === "name") sortDirection = "asc";
    else sortDirection = "desc";
  });
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<h1>
  <button
    onclick={() => (searchQuery = "")}
    title="Clear search"
    aria-label="Clear search">
    Helix Editor Plugins
  </button>
</h1>

<div class="layout">
  <aside class="filters">
    <div class="search-container">
      <input type="search" placeholder="Search..." bind:value={searchQuery} />
      <div class="sort-controls">
        <select bind:value={sortBy} title="Sort by">
          <option value="magic">Magic</option>
          <option value="star_count">Stars</option>
          <option value="updated_at">Last updated</option>
          <option value="created_at">Created</option>
          <option value="name">Name</option>
        </select>
        <button
          onclick={() => (sortDirection = sortDirection === "asc" ? "desc" : "asc")}
          style:--rotate={sortDirection === "asc" ? "360deg" : ""}
          aria-label={`Toggle sort direction (currently ${sortDirection === "asc" ? "ascending" : "descending"})`}>
          {#if sortDirection === "asc"}
            <IconSortAscendingBold />
          {:else}
            <IconSortDescendingBold />
          {/if}
        </button>
      </div>
    </div>

    {#if Object.keys(tagCounts).length > 0}
      <div class="tags-container">
        {#each Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, tagsCollapsed ? COLLAPSED_TAG_COUNT : undefined) as [tag, count]}
          <button
            class="pill"
            onclick={() => (searchQuery = "#" + tag)}
            aria-label={`Search by tag: ${tag}`}>
            <IconHashBold />
            <span>
              {tag}
            </span>
            <span class="pill-count">
              {count}
            </span>
          </button>
        {/each}
        {#if Object.keys(tagCounts).length > COLLAPSED_TAG_COUNT}
          <button
            class="pill pill-colored"
            onclick={() => (tagsCollapsed = !tagsCollapsed)}
            aria-label={tagsCollapsed ? "Show all tags" : "Collapse tags"}>
            {#if tagsCollapsed}
              <IconDotsThreeBold />
            {:else}
              <IconCaretLeftBold />
            {/if}
          </button>
        {/if}
      </div>
    {/if}
  </aside>

  <div class="content">
    {#if sortedPlugins.length === 0}
      <p class="empty-state">
        {#if searchQuery}
          No plugins found for &ldquo;{searchQuery}&rdquo;.
        {:else}
          No plugins found.
        {/if}
      </p>
    {:else}
      <ul>
        {#each sortedPlugins as plugin (plugin.name)}
          {@const source = getRepositorySource(plugin.repository)}
          <li
            in:motionTransition={{ fn: scale, start: 0.9 }}
            out:motionTransition={{ fn: scale, duration: 200, start: 0.9 }}
            animate:motionAnimation={{ fn: flip, duration: 400 }}>
            <a href={plugin.url} target="_blank">
              <h2>{plugin.name}</h2>
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
                <span
                  class="pill"
                  title="Created: {plugin.created_at.toLocaleString()}">
                  <IconAsteriskBold />
                  {timeAgo(plugin.created_at)}
                </span>
                <span
                  class="pill"
                  title="Last push: {plugin.updated_at.toLocaleString()}">
                  <IconGitCommitFill />
                  {timeAgo(plugin.updated_at)}
                </span>
                {#if plugin.tags?.length}
                  {#each plugin.tags.toSorted() as tag (tag)}
                    <button
                      class="pill"
                      onclick={(e) => {
                        e.preventDefault();
                        searchQuery = "#" + tag;
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-label={`Search by tag: ${tag}`}>
                      <IconHashBold />
                      {tag}
                    </button>
                  {/each}
                {/if}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<footer>
  <p>
    This site is not affiliated with the Helix editor. Plugins are
    community-contributed and not vetted by this site. Use them at your own risk.
  </p>
</footer>

<div class="fab-container">
  <button
    class="fab"
    onclick={openHelpDialog}
    title="Help"
    aria-haspopup="dialog"
    {@attach previouslyBlurred}>
    <IconQuestionFill />
  </button>
  <a
    class="fab fab-small"
    href="https://github.com/gllms/helix-editor-plugins"
    target="_blank"
    title="Go to helix-editor-plugins GitHub repository">
    <IconGithubLogoFill />
  </a>
  <a
    class="fab fab-small"
    href="https://github.com/gllms/helix-editor-plugins/new/main/plugins?filename=plugin-name.json&value={newPluginJson}"
    target="_blank"
    title="Add new plugin to GitHub repository">
    <IconPlusBold />
  </a>
</div>

<HelpDialog bind:open={helpDialogOpen} />

<style>
  h1 button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-lg);
    align-items: start;

    @media (min-width: 60rem) {
      grid-template-columns: 18rem 1fr;
    }
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--gap-lg);

    @media (min-width: 60rem) {
      position: sticky;
      top: var(--gap-lg);
    }
  }

  .search-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--gap-sm);
    font-family: var(--font-display-700);
    font-weight: 700;

    :where(input, select, button) {
      background: var(--surface-1);
      border: none;
      color: var(--grey);
      padding: var(--gap-sm) 0.75rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      font-size: inherit;
      font-family: var(--font-display-700);
      font-weight: 700;
    }

    input {
      flex: 1 1 12rem;
      min-width: 8rem;
      max-width: 32rem;
      margin-right: auto;
      border: 2px solid var(--border-subtle);
    }

    input:placeholder-shown:not(:focus) {
      flex-basis: 12rem;
    }

    .sort-controls {
      display: flex;
      flex-shrink: 0;
      gap: var(--gap-sm);
    }

    button {
      padding: 0.75rem;
      display: grid;
      place-items: center;

      @media (prefers-reduced-motion: no-preference) {
        transition: transform var(--transition-fast) ease-out;
      }
    }

    @media (min-width: 60rem) {
      justify-content: stretch;

      input,
      input:placeholder-shown:not(:focus) {
        flex-basis: 100%;
        max-width: none;
        margin-right: 0;
      }

      .sort-controls {
        width: 100%;
      }

      select {
        flex: 1;
      }
    }
  }

  .tags-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  .content {
    min-width: 0;
  }

  .empty-state {
    text-align: center;
    padding: var(--gap-lg) 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(25rem, 100%), 1fr));
    gap: var(--gap-md);

    li {
      > a {
        display: flex;
        flex-direction: column;
        background: var(--surface-2);
        border: 2px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        padding: var(--gap-lg) 1.75rem;
        box-shadow: var(--shadow-md);
        height: 100%;
        transform: translateY(0) scale(1);

        @media (prefers-reduced-motion: no-preference) {
          transition:
            transform var(--transition-base) ease-out,
            box-shadow var(--transition-base) ease-out;
        }
      }

      @media (prefers-reduced-motion: no-preference) {
        > a:hover {
          transform: translateY(-0.25rem) scale(1.01);
          box-shadow: var(--shadow-lg);
        }
      }

      > a > p {
        flex: 1; /* Make sure the tags in the cards are at the bottom of the card */
      }
    }
  }

  .pill-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-sm);
  }

  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-xs);
    background: var(--surface-1);
    border-radius: var(--radius-sm);
    padding: var(--gap-xs) var(--gap-sm);
    color: var(--grey);
    border: none;
    font-size: inherit;
    /* font-family: inherit; */
    font-family: var(--font-display-500);
    font-weight: 500;
    height: 1lh;
    box-sizing: content-box;

    :global(svg) {
      color: var(--purple-light);
    }

    &.pill-colored {
      background: var(--purple-light);
      color: var(--purple-dark);

      :global(svg) {
        color: var(--purple-dark);
      }
    }

    .pill-count {
      --size: 1.25em;
      min-width: var(--size);
      padding-inline: .125em;
      background: var(--purple-light);
      border-radius: 0.3rem;
      color: var(--purple-dark);
      font-size: 0.75em;
      font-family: var(--font-display-900);
      font-weight: 900;

      &::selection {
        background: var(--purple-dark);
        color: var(--purple-light);
      }
    }
  }

  footer {
    margin-top: var(--gap-lg);
    padding-top: var(--gap-lg);
    border-top: 2px solid var(--border-subtle);
    text-align: center;

    p {
      margin: 0 0 var(--gap-xs);
      font-size: 0.875rem;
      opacity: 0.7;
    }
  }

  .fab-container {
    --gap: var(--gap-md);
    --transition-delay: var(--transition-base);

    position: fixed;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: var(--gap);
    pointer-events: none;

    &:hover,
    &:focus-within {
      --transition-delay: 0s;
    }

    .fab {
      background: var(--purple-light);
      color: white;
      border: none;
      border-radius: 40%;
      width: 3.5rem;
      height: 3.5rem;
      padding: 0;
      display: grid;
      place-items: center;
      box-shadow: var(--shadow-sm);
      font-size: 1.5rem;
      pointer-events: auto;
      translate: 0 0;
      scale: 1;

      @media (prefers-reduced-motion: no-preference) {
        transition:
          box-shadow var(--transition-fast) var(--transition-delay) ease-out,
          translate var(--transition-fast) var(--transition-delay) ease-out,
          scale var(--transition-fast) ease-out;

        &:hover,
        &:focus {
          box-shadow: var(--shadow-xl);
          scale: 1.1;
        }
      }

      &:not(.fab-small) {
        font-size: 2rem;
      }
    }

    .fab-small {
      width: 2.5rem;
      height: 2.5rem;
      z-index: -1;

      @media (prefers-reduced-motion: no-preference) {
        translate: 0 calc(var(--stack, 1) * 100% + var(--stack, 1) * var(--gap));
      }

      & + .fab-small {
        --stack: 2;
      }
    }

    &:hover .fab-small,
    &:focus-within .fab-small {
      translate: 0 0;
    }
  }
</style>
