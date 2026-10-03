<script lang="ts">
  import type { IPlugin } from "../routes/plugins.remote";
  import TimeAgo from "#lib/TimeAgo.svelte";

  import IconUserBold from "phosphor-icons-svelte/IconUserBold.svelte";
  import IconStarFill from "phosphor-icons-svelte/IconStarFill.svelte";
  import IconAsteriskBold from "phosphor-icons-svelte/IconAsteriskBold.svelte";
  import IconGitCommitFill from "phosphor-icons-svelte/IconGitCommitFill.svelte";
  import { resolve } from "$app/paths";
  import timeAgo from "./timeAgo";

  interface IPluginCardProps {
    plugin: IPlugin;
    headingLevel?: 2 | 3;
    onTagClick?: (tag: string) => void;
  }

  let { plugin, headingLevel = 2 }: IPluginCardProps = $props();
</script>

<a class="plugin-card" href={resolve(`plugin/${plugin.name}`)}>
  <svelte:element this={`h${headingLevel}`}>{plugin.name}</svelte:element>
  <p>{plugin.description}</p>
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
      <TimeAgo date={plugin.updated_at} />
    </li>
    <li
      class="pill"
      title={`Created:\n${timeAgo(plugin.created_at, true)}\n${plugin.created_at.toLocaleString()}`}
    >
      <IconAsteriskBold />
      <span class="visually-hidden">Created:</span>
      <TimeAgo date={plugin.created_at} />
    </li>
    <li class="pill author-pill">
      <IconUserBold />
      <span class="visually-hidden">Author:</span>
      <span class="author-name">{plugin.author.name}</span>
    </li>
  </ul>
</a>

<style>
  a {
    min-width: 0;

    > :is(h2, h3) {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    > p {
      flex: none;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      height: 2lh;
      overflow: hidden;
    }

    /* One row of pills high, so pills that wrap to a second row are hidden */
    .pill-container {
      height: calc(1lh + 2 * var(--gap-xs));
      overflow: hidden;

      .pill {
        flex-shrink: 0;
        white-space: nowrap;
      }

      .author-pill {
        /* Including padding, since pills use content-box sizing */
        flex: 1 1 calc(4rem - 2 * var(--gap-sm));
        min-width: 0;
        max-width: max-content;

        :global(svg) {
          flex-shrink: 0;
        }

        .author-name {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
</style>
