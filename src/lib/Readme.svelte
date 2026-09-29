<script lang="ts">
  import type { IReadme } from "$lib/loadReadme";
  import Collapsible from "$lib/Collapsible.svelte";

  import IconArrowSquareOutBold from "phosphor-icons-svelte/IconArrowSquareOutBold.svelte";

  let { readme, repositoryPath }: { readme: IReadme; repositoryPath: string } = $props();
</script>

<section class="readme" aria-label="README">
  <!-- Keyed so it collapses again when navigating to another plugin -->
  {#key readme.url}
    <Collapsible label="README">
      <div class="readme-content">
        <!-- Sanitized at build time, see src/lib/renderReadme.ts -->
        {@html readme.html}
      </div>
    </Collapsible>
  {/key}

  <p class="attribution">
    <a href={readme.url} target="_blank">
      README from {repositoryPath}
      <IconArrowSquareOutBold />
      <span class="visually-hidden new-tab-hint"></span>
    </a>
    ·
    <a href={readme.license.url} target="_blank">
      {readme.license.name}
      <IconArrowSquareOutBold />
      <span class="visually-hidden new-tab-hint"></span>
    </a>
  </p>
</section>

<style>
  .readme {
    padding: var(--gap-lg) 1.75rem;
    background: var(--surface-2);
    border: 2px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow-wrap: break-word;

    @media (max-width: 576px) {
      padding: var(--gap-md);
    }
  }

  .attribution {
    margin: var(--gap-lg) 0 0;
    padding-top: var(--gap-md);
    border-top: 2px solid var(--border-subtle);
    font-size: 0.875rem;

    a {
      display: inline-flex;
      align-items: center;
      gap: var(--gap-xs);
      opacity: 0.7;
    }
  }

  .readme-content {
    color: var(--grey);
    line-height: 1.5;

    :global {
      > :first-child {
        margin-top: 0;
      }

      > :last-child {
        margin-bottom: 0;
      }

      :is(h2, h3, h4, h5, h6) {
        margin: 1em 0 0.5em;
        color: var(--purple-light);
        font-family: var(--font-display-700);
        font-weight: 700;
        line-height: 1.25;
      }

      h2 {
        font-size: 1.75rem;
      }

      h3 {
        font-size: 1.375rem;
      }

      h4 {
        font-size: 1.125rem;
      }

      :is(h5, h6) {
        font-size: 1rem;
      }

      :is(p, ul, ol, blockquote, pre, table, details, video) {
        margin: 0.75rem 0;
      }

      :is(ul, ol) {
        padding-left: 1.5em;
      }

      li + li,
      li > :is(ul, ol) {
        margin-top: 0.25em;
      }

      .contains-task-list {
        padding-left: 0;
        list-style: none;
      }

      a {
        text-decoration: underline;
      }

      .external-link-icon {
        margin-left: 0.125em;
        vertical-align: -0.125em;
      }

      img {
        max-width: 100%;
        height: auto;
        vertical-align: middle;
        border-radius: var(--radius-sm);
      }

      video {
        display: block;
        max-width: 100%;
        max-height: 40rem;
        border-radius: var(--radius-sm);
      }

      .video-unavailable {
        padding: var(--gap-xl) var(--gap-md);
        border: 2px dashed var(--border-subtle);
        border-radius: var(--radius-sm);
        text-align: center;
      }

      .video-unavailable-icon {
        display: block;
        margin: 0 auto var(--gap-sm);
        color: var(--purple-light);
        font-size: 2rem;
      }

      :is(pre, code, kbd) {
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        background: var(--surface-1);
        border-radius: var(--radius-xs);
      }

      pre {
        padding: var(--gap-sm) var(--gap-md);
        overflow-x: auto;

        code {
          padding: 0;
          background: none;
          font-size: inherit;
        }
      }

      :is(code, kbd) {
        padding: 0.125em 0.375em;
        font-size: 0.9em;
      }

      kbd {
        border-bottom: 2px solid var(--border-subtle);
      }

      blockquote {
        padding-left: var(--gap-md);
        border-left: 0.25rem solid var(--surface-1);
      }

      /* GitHub's alert colors */
      .markdown-alert {
        margin: 0 0 0.75rem;
        padding: var(--gap-xs) var(--gap-md);
        border-left: 0.25rem solid var(--alert-color);

        &.markdown-alert-note {
          --alert-color: #4493f8;
        }

        &.markdown-alert-tip {
          --alert-color: #3fb950;
        }

        &.markdown-alert-important {
          --alert-color: #ab7df8;
        }

        &.markdown-alert-warning {
          --alert-color: #d29922;
        }

        &.markdown-alert-caution {
          --alert-color: #f85149;
        }

        > :last-child {
          margin-bottom: 0;
        }
      }

      .markdown-alert-title {
        display: flex;
        align-items: center;
        gap: var(--gap-sm);
        margin-top: 0;
        margin-bottom: var(--gap-xs);
        color: var(--alert-color);
        font-family: var(--font-display-700);
        font-weight: 700;
      }

      table {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        border-collapse: collapse;
      }

      :is(th, td) {
        padding: var(--gap-xs) var(--gap-sm);
        border: 2px solid var(--border-subtle);
      }

      th {
        color: var(--purple-light);
      }

      hr {
        margin: 1.5em 0;
        border: none;
        border-top: 2px solid var(--border-subtle);
      }

      summary {
        cursor: pointer;
        color: var(--purple-light);
      }

      /* GitHub's class for the visually hidden heading above footnotes */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  }
</style>
