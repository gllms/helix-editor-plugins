<script lang="ts">
  import { getPlugins, getReadme } from "../../plugins.remote";
  import type { PageProps } from "./$types";
  import { resolve } from "$app/paths";
  import TimeAgo from "$lib/TimeAgo.svelte";
  import getSimilarPlugins from "$lib/getSimilarPlugins";
  import PluginCard from "$lib/PluginCard.svelte";
  import Readme from "$lib/Readme.svelte";
  import HomeButton from "$lib/HomeButton.svelte";
  import ExternalLink from "$lib/ExternalLink.svelte";
  import type { ReadmeUnavailableReason } from "$lib/loadReadme";
  import { generatePluginJsonLd } from "$lib/generateJsonLd";
  import { toSearchHash } from "$lib/searchHash";
  import { getRepositoryPath, getRepositorySource } from "$lib/repositorySources";

  import IconHashBold from "phosphor-icons-svelte/IconHashBold.svelte";
  import IconStarFill from "phosphor-icons-svelte/IconStarFill.svelte";
  import IconAsteriskBold from "phosphor-icons-svelte/IconAsteriskBold.svelte";
  import IconGitCommitFill from "phosphor-icons-svelte/IconGitCommitFill.svelte";
  import timeAgo from "$lib/timeAgo";

  let { params }: PageProps = $props();

  const plugins = await getPlugins();

  const plugin = $derived(plugins.find((plugin) => plugin.name === params.plugin));
  const readmeResult = $derived(await getReadme(params.plugin));
  const similarPlugins = $derived(plugin ? getSimilarPlugins(plugin, plugins) : []);

  let pluginsByAuthor = $derived(
    plugin &&
      plugins.filter(
        (p) =>
          p.repository.split("/").shift() === plugin.repository.split("/").shift() &&
          p.name !== plugin.name,
      ),
  );

  const readmeUnavailableMessages: Record<ReadmeUnavailableReason, string> = {
    "no-license":
      "This plugin's README isn't shown here because its repository doesn't have a license.",
    "license-not-allowed":
      "This plugin's README isn't shown here because it's unclear whether its license allows that.",
    "no-readme": "This plugin doesn't have a README.",
    unavailable: "This plugin's README couldn't be shown here.",
  };
</script>

<svelte:head>
  <title
    >{plugin
      ? `${plugin.name}: ${plugin.description}`
      : "Plugin not found - Helix Editor Plugins"}</title
  >
  <meta name="description" content={plugin ? plugin.description : "Plugin not found."} />
  <link rel="canonical" href={`https://helix-editor-plugins.com/plugin/${params.plugin}`} />
  {#if plugin}
    {@html `<script type="application/ld+json">${generatePluginJsonLd(plugin)}</script>`}
  {/if}
</svelte:head>

{#if plugin}
  {const source = $derived(getRepositorySource(plugin.repository))}
  {const repositoryPath = $derived(getRepositoryPath(plugin.repository))}

  <HomeButton />

  <div class="layout">
    <div class="main-column">
      <article class="plugin-card">
        <h1>
          {plugin.name}
        </h1>
        <p>{plugin.description}</p>
        <div class="pill-container-container">
          <ExternalLink class="pill" href={plugin.url} title="Go to the {plugin.name} repository">
            <source.icon />
            <span class="visually-hidden">{source.name} repository:</span>
            {repositoryPath}
          </ExternalLink>
          <ul class="pill-container" role="list">
            <li class="pill">
              <IconStarFill />
              <span class="visually-hidden">Stars:</span>
              {plugin.star_count}
            </li>
            <li
              class="pill"
              title={`Last push:\n${timeAgo(plugin.updated_at, true)}\n${plugin.updated_at.toLocaleString()}`}
            >
              <IconGitCommitFill />
              <span class="visually-hidden">Last push:</span>
              <TimeAgo date={plugin.updated_at} long />
            </li>
            <li
              class="pill"
              title={`Created:\n${timeAgo(plugin.created_at, true)}\n${plugin.created_at.toLocaleString()}`}
            >
              <IconAsteriskBold />
              <span class="visually-hidden">Created:</span>
              <TimeAgo date={plugin.created_at} long />
            </li>
          </ul>
          {#if plugin.tags?.length}
            <ul class="pill-container" role="list">
              {#each plugin.tags.toSorted() as tag (tag)}
                <li>
                  <a href="{resolve('/')}{toSearchHash({ query: '#' + tag })}" class="pill">
                    <IconHashBold />
                    <span class="visually-hidden">Search by tag:</span>
                    {tag}
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </article>

      {#if readmeResult.readme}
        <Readme readme={readmeResult.readme} {repositoryPath} />
      {:else}
        <p class="readme-unavailable">
          {readmeUnavailableMessages[readmeResult.unavailableReason]}
          <ExternalLink href={plugin.url}>
            {readmeResult.unavailableReason === "no-readme" ? "View the repository" : "Read it"} on
            {source.name}
          </ExternalLink>
        </p>
      {/if}
    </div>

    <section class="related">
      {#if similarPlugins.length}
        <h2>Related plugins</h2>
        <ul class="plugin-grid" role="list">
          {#each similarPlugins as related (related.name)}
            <li>
              <PluginCard plugin={related} headingLevel={3} uniformHeight />
            </li>
          {/each}
        </ul>
      {/if}
      {#if pluginsByAuthor?.length}
        <h2>More by {repositoryPath.split("/").shift()}</h2>
        <ul class="plugin-grid" role="list">
          {#each pluginsByAuthor as related (related.name)}
            <li>
              <PluginCard plugin={related} headingLevel={3} uniformHeight />
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
    --layout-gap: var(--gap-lg);
    --layout-columns: 2;
    --card-center: 50%;

    @media (min-width: 85rem) {
      --layout-columns: 3;
    }

    /* Centers the glow on the main column, so keep in sync with .layout below */
    @media (min-width: 60rem) {
      --content-left: calc(max(0px, 50% - var(--max-width-page) / 2) + var(--padding-page));
      --content-width: calc(min(100%, var(--max-width-page)) - 2 * var(--padding-page));
      --content-column-width: calc(
        (var(--content-width) - (var(--layout-columns) - 1) * var(--layout-gap)) /
          var(--layout-columns)
      );
      --main-column-width: calc(
        (var(--layout-columns) - 1) * (var(--content-column-width) + var(--layout-gap)) -
          var(--layout-gap)
      );
      --card-center: calc(var(--content-left) + var(--main-column-width) / 2);
    }

    background: radial-gradient(
        ellipse var(--card-width) 30rem at top 0 left var(--card-center),
        color-mix(var(--purple-dark), var(--purple-light) 15%) 0,
        var(--purple-dark)
      )
      no-repeat var(--purple-dark);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--gap-xl);
    margin-top: 3rem;

    /* The main column floats over all but the last column, so the related plugins, as inline boxes,
       fill the space next to and under it */
    @media (min-width: 60rem) {
      display: block;
      margin-top: 6rem;
      container-type: inline-size; /* Also contains the float */
      --column-width: calc(
        (100cqw - (var(--layout-columns) - 1) * var(--layout-gap)) / var(--layout-columns)
      );
    }
  }

  .main-column {
    display: flex;
    flex-direction: column;
    gap: var(--gap-xl);
    min-width: 0;

    @media (min-width: 60rem) {
      float: left;
      width: calc(
        (var(--layout-columns) - 1) * (var(--column-width) + var(--layout-gap)) - var(--layout-gap)
      );
      margin: 0 var(--layout-gap) var(--layout-gap) 0;
    }
  }

  .plugin-card {
    gap: var(--gap-sm);
    background: color-mix(in srgb, var(--surface-1), var(--surface-2) 75%);

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

    :global(a.pill) {
      &,
      &:visited {
        color: var(--grey);
      }
    }
  }

  .readme-unavailable {
    margin: 0;
    padding: var(--gap-lg) 1.75rem;
    border: 2px dashed var(--border-subtle);
    border-radius: var(--radius-lg);

    @media (max-width: 576px) {
      padding: var(--gap-md);
    }

    :global(a) {
      display: inline-flex;
      align-items: center;
      gap: var(--gap-xs);
    }
  }

  .related {
    h2 {
      margin-bottom: var(--gap-md);
    }

    .plugin-grid {
      margin-bottom: var(--gap-xl);

      @media (min-width: 60rem) {
        display: block;
        /* Hides the whitespace between the inline items */
        font-size: 0;
        /* Room for the last item's margin in a row, plus a pixel against rounding errors */
        margin-right: calc(-1 * var(--layout-gap) - 1px);
        margin-bottom: calc(var(--gap-xl) - var(--layout-gap));

        > li {
          display: inline-flex;
          vertical-align: top;
          width: var(--column-width);
          margin: 0 var(--layout-gap) var(--layout-gap) 0;
          font-size: 1rem;
        }
      }
    }
  }
</style>
