<script lang="ts">
  import { getPlugins } from "./plugins.remote";
  import { onMount, untrack } from "svelte";
  import { on } from "svelte/events";
  import { MediaQuery } from "svelte/reactivity";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { flip } from "svelte/animate";
  import { scale } from "svelte/transition";
  import { motionAnimation, motionTransition } from "#lib/motion.js";
  import createSearchText from "#lib/createSearchText.js";
  import filterAndSortPlugins from "#lib/filterAndSortPlugins.js";
  import generateJsonLd from "#lib/generateJsonLd.js";
  import {
    defaultSortDirection,
    fromSearchHash,
    sortOptions,
    toSearchHash,
    type SortBy,
    type SortDirection,
  } from "#lib/searchHash.js";

  import IconSortAscendingBold from "phosphor-icons-svelte/IconSortAscendingBold.svelte";
  import IconSortDescendingBold from "phosphor-icons-svelte/IconSortDescendingBold.svelte";
  import IconHashBold from "phosphor-icons-svelte/IconHashBold.svelte";
  import Collapsible from "#lib/Collapsible.svelte";
  import PluginCard from "#lib/PluginCard.svelte";

  const plugins = await getPlugins();

  for (const plugin of plugins) {
    plugin.search_text = createSearchText(plugin);
  }

  let searchQuery = $state<string>("");
  let sortBy = $state<SortBy>("magic");
  let sortDirection = $state<SortDirection>("desc");
  let tagsCollapsible = $state<ReturnType<typeof Collapsible>>();

  const sidebarLayout = new MediaQuery("min-width: 60rem");

  const tagCounts: Record<string, number> = {};

  for (const plugin of plugins) {
    for (const tag of plugin?.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  let sortedPlugins = $derived(filterAndSortPlugins(plugins, searchQuery, sortBy, sortDirection));

  let jsonLd = $derived(generateJsonLd(sortedPlugins));

  function searchForTag(tag: string) {
    searchQuery = "#" + tag;
    if (!sidebarLayout.current) tagsCollapsible?.collapse();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function trackViewportTop(filters: HTMLElement) {
    if (!sidebarLayout.current) return;

    const update = () =>
      filters.style.setProperty("--viewport-top", `${filters.getBoundingClientRect().top}px`);
    update();
    document.fonts.ready.then(update);
    const offScroll = on(window, "scroll", update, { passive: true });
    const offResize = on(window, "resize", update);
    return () => {
      offScroll();
      offResize();
    };
  }

  function readHash() {
    ({ query: searchQuery, sortBy, sortDirection } = fromSearchHash(location.hash));
  }

  onMount(readHash);

  $effect(() => {
    const hash = toSearchHash({ query: searchQuery, sortBy, sortDirection });
    // Hash navigations update page.url and page.state before hashchange fires, so rerunning on
    // those would overwrite the new hash with the old search
    untrack(() => {
      if (location.hash === hash) return;
      goto(location.pathname + location.search + hash, {
        shallow: true,
        replace: true,
        state: page.state,
      });
    });
  });

  function changeSortBy(value: SortBy) {
    sortBy = value;
    sortDirection = defaultSortDirection(value);
  }
</script>

<svelte:window onhashchange={readHash} />

<svelte:head>
  <title>Helix Editor Plugins</title>
  <meta name="description" content="Browse Helix Steel plugins in a user friendly way." />
  <link rel="canonical" href="https://helix-editor-plugins.com/" />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<h1>
  <button onclick={() => (searchQuery = "")} title="Clear search" aria-label="Clear search"
    >Helix Editor Plugins</button
  >
</h1>

<div class="layout">
  <aside class="filters" {@attach trackViewportTop}>
    <div class="search-container">
      <input type="search" placeholder="Search..." bind:value={searchQuery} />
      <div class="sort-controls">
        <select bind:value={() => sortBy, changeSortBy} title="Sort by">
          {#each Object.entries(sortOptions) as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
        </select>
        <button
          onclick={() => (sortDirection = sortDirection === "asc" ? "desc" : "asc")}
          style:--rotate={sortDirection === "asc" ? "360deg" : ""}
          aria-label={`Toggle sort direction (currently ${sortDirection === "asc" ? "ascending" : "descending"})`}
        >
          {#if sortDirection === "asc"}
            <IconSortAscendingBold />
          {:else}
            <IconSortDescendingBold />
          {/if}
        </button>
      </div>
    </div>

    {#if Object.keys(tagCounts).length > 0}
      <div class="tags">
        <Collapsible
          label="tags"
          collapsedHeight="8.75rem"
          fadeHeight="3rem"
          bind:this={tagsCollapsible}
        >
          <ul class="pill-container" role="list">
            {#each Object.entries(tagCounts).sort((a, b) => b[1] - a[1]) as [tag, count]}
              <li>
                <button class="pill" onclick={() => searchForTag(tag)}>
                  <IconHashBold />
                  <span class="visually-hidden">Search by tag:</span>
                  <span>
                    {tag}
                  </span>
                  <span class="pill-count">
                    {count}
                  </span>
                  <span class="visually-hidden">{count === 1 ? "plugin" : "plugins"}</span>
                </button>
              </li>
            {/each}
          </ul>
        </Collapsible>
      </div>
    {/if}
  </aside>

  <div class="content">
    {#if sortedPlugins.length === 0}
      <p class="empty-state">
        {#if searchQuery}
          No plugins found for “{searchQuery}”.
        {:else}
          No plugins found.
        {/if}
      </p>
    {:else}
      <ul class="plugin-grid" role="list">
        {#each sortedPlugins as plugin (plugin.name)}
          <li
            in:motionTransition={{ fn: scale, start: 0.9 }}
            out:motionTransition={{ fn: scale, duration: 200, start: 0.9 }}
            animate:motionAnimation={{ fn: flip, duration: 400 }}
          >
            <PluginCard {plugin} onTagClick={searchForTag} />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

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
      grid-template-columns: 21rem 1fr;
    }
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--gap-lg);

    @media (min-width: 60rem) {
      position: sticky;
      top: var(--gap-lg);
      /* Not above the sticky top, or it would grow when the end of the page pushes it up */
      max-height: calc(100vh - max(var(--gap-lg), var(--viewport-top, var(--gap-lg))));
    }
  }

  .tags {
    @media (min-width: 60rem) {
      overflow: hidden auto;
      scrollbar-width: thin;
      scrollbar-gutter: stable;
      /* Room for focus rings and shadows, which the scroll container would clip */
      margin: calc(-1 * var(--gap-xs)) calc(-1 * var(--gap-xs)) 0 calc(-1 * var(--gap-xl));
      padding: var(--gap-xs) var(--gap-xs) var(--gap-xs) var(--gap-xl);

      /* Room below the collapse button. Not padding, since sticky offsets are within that. */
      &::after {
        content: "";
        display: block;
        height: 2.5rem;
      }
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

  .content {
    min-width: 0;
  }

  .empty-state {
    text-align: center;
    padding: var(--gap-lg) 0;
  }
</style>
