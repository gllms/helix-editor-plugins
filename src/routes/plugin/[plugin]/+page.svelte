<script lang="ts">
  import { getPlugins } from "../../plugins.remote";
  import type { PageProps } from "./$types";
  import { resolve } from "$app/paths";
  import timeAgo from "$lib/timeAgo";
  import getSimilarPlugins from "$lib/getSimilarPlugins";
  import PluginCard from "$lib/PluginCard.svelte";
  import { generatePluginJsonLd } from "$lib/generateJsonLd";
  import {
    getRepositoryPath,
    getRepositorySource,
  } from "$lib/repositorySources";

  import IconHouseBold from "phosphor-icons-svelte/IconHouseBold.svelte";
  import IconArrowSquareOutBold from "phosphor-icons-svelte/IconArrowSquareOutBold.svelte";
  import IconHashBold from "phosphor-icons-svelte/IconHashBold.svelte";
  import IconStarFill from "phosphor-icons-svelte/IconStarFill.svelte";
  import IconAsteriskBold from "phosphor-icons-svelte/IconAsteriskBold.svelte";
  import IconGitCommitFill from "phosphor-icons-svelte/IconGitCommitFill.svelte";

  let { params }: PageProps = $props();

  const plugins = await getPlugins();

  const plugin = $derived(
    plugins.find((plugin) => plugin.name === params.plugin),
  );
  const similarPlugins = $derived(
    plugin ? getSimilarPlugins(plugin, plugins) : [],
  );

  let pluginsByAuthor = $derived(
    plugin && plugins.filter((p) => p.repository.split('/').shift() === plugin.repository.split('/').shift() && p.name !== plugin.name)
  );
</script>

<svelte:head>
  <title>{plugin ? `${plugin.name} - Helix Editor Plugins` : "Plugin not found - Helix Editor Plugins"}</title>
  <meta name="description" content={plugin ? plugin.description : "Plugin not found."} />
  <link rel="canonical" href={`https://helix-editor-plugins.com/plugin/${params.plugin}`} />
  {#if plugin}
    {@html `<script type="application/ld+json">${generatePluginJsonLd(plugin)}</script>`}
  {/if}
</svelte:head>

{#if plugin}
  {const source = getRepositorySource(plugin.repository)}

  <a href={resolve("/")} class="home-button" title="Go to home page" aria-label="Go to home page">
    <IconHouseBold />
  </a>

  <div class="layout">
    <div>
      <article class="plugin-card">
        <h1>
          {plugin.name}
        </h1>
        <p>{plugin.description}</p>
        <div class="pill-container-container">
          <a
            class="pill"
            href={plugin.url}
            target="_blank"
            title="Go to the {plugin.name} repository">
            <source.icon />
            {getRepositoryPath(plugin.repository)}
            <IconArrowSquareOutBold />
          </a>
          <div class="pill-container">
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
          </div>
          {#if plugin.tags?.length}
            <div class="pill-container">
              {#each plugin.tags.toSorted() as tag (tag)}
                <a href="{resolve("/")}#{encodeURIComponent("#" + tag)}" class="pill">
                  <IconHashBold />
                  {tag}
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </article>
    </div>

    <section class="related">
      {#if plugin.related?.length}
        <h2>Related plugins</h2>
        <ul class="plugin-grid">
          {#each plugin.related as related (related)}
            {const relatedPlugin = plugins.find((p) => p.name === related)}
            {#if relatedPlugin}
              <li>
                <PluginCard plugin={relatedPlugin} headingLevel={3} />
              </li>
            {/if}
          {/each}
        </ul>
      {/if}
      {#if similarPlugins.length}
        <h2>Related plugins</h2>
        <ul class="plugin-grid">
          {#each similarPlugins as related (related.name)}
            <li>
              <PluginCard plugin={related} headingLevel={3} />
            </li>
          {/each}
        </ul>
      {/if}
      {#if pluginsByAuthor?.length}
        <h2>More by {plugin.repository.split('/').shift()}</h2>
        <ul class="plugin-grid">
          {#each pluginsByAuthor as related (related.name)}
            <li>
              <PluginCard plugin={related} headingLevel={3} />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
{:else}
  <p>Plugin not found.</p>
{/if}

<style>
  :global(body):has(.plugin-card) {
    --card-center: 50%;

    @media (min-width: 60rem) {
      --card-center: calc(max(0px, 50% - var(--max-width-page) / 2) + var(--padding-page) + var(--card-width) / 2);
    }

    background: radial-gradient(ellipse var(--card-width) 30rem at top 0 left var(--card-center), color-mix(var(--purple-dark), var(--purple-light) 15%) 0, var(--purple-dark));
  }

  .home-button {
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    border: none;
    width: 3rem;
    aspect-ratio: 1 / 1;
    font-size: 1.25rem;
    background: var(--surface-2);
    color: var(--grey);
  }


  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4rem;
    align-items: stretch;
    margin-top: 6rem;

    @media (min-width: 60rem) {
      grid-template-columns: minmax(0, var(--card-width)) 1fr;
    }
  }

  .plugin-card {
    gap: var(--gap-sm);
    background: color-mix(in srgb, var(--surface-1), var(--surface-2) 75%);

    @media (min-width: 60rem) {
      position: sticky;
      top: var(--gap-lg);
    }

    h1 {
      display: flex;
      align-items: center;
      gap: var(--gap-md);
      font-size: 2rem;
    }

    .pill-container-container {
      display: flex;
      flex-direction: column;
      gap: var(--gap-md);
    }

    a.pill {
      &,
      &:visited {
        color: var(--grey);
      }
    }
  }

  .related {
    min-width: 0;

    h2 {
      margin-bottom: var(--gap-md);
    }

    .plugin-grid {
      margin-bottom: var(--gap-xl);
    }
  }
</style>
