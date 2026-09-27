<script lang="ts">
  import { flushSync } from "svelte";
  import type { IReadme } from "$lib/loadReadme";
  import { prefersReducedMotion } from "$lib/motion";

  import IconArrowSquareOutBold from "phosphor-icons-svelte/IconArrowSquareOutBold.svelte";
  import IconArrowsOutSimpleBold from "phosphor-icons-svelte/IconArrowsOutSimpleBold.svelte";
  import IconArrowsInSimpleBold from "phosphor-icons-svelte/IconArrowsInSimpleBold.svelte";

  let { readme, repositoryPath }: { readme: IReadme; repositoryPath: string } = $props();

  const collapsibleId = $props.id();

  // Collapses again when navigating to another plugin
  let expanded = $derived.by(() => {
    void readme.url;
    return false;
  });

  // Assumed until measured, so the page is prerendered collapsed and doesn't shift when it loads
  let overflowing = $state(true);

  function measureOverflow(collapsible: HTMLDivElement) {
    const observer = new ResizeObserver(() => {
      // Only measurable while collapsed
      if (!expanded) overflowing = collapsible.scrollHeight > collapsible.clientHeight;
    });
    observer.observe(collapsible);
    observer.observe(collapsible.firstElementChild!);
    return () => observer.disconnect();
  }

  let collapsible: HTMLDivElement;
  let animating = $state(false);
  let animation: Animation | undefined;

  function toggle(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    // Measured before cancelling, so toggling halfway continues from the current height
    const fromHeight = collapsible.getBoundingClientRect().height;
    animation?.cancel();

    // Measured without .animating, which lifts the max-height
    flushSync(() => {
      expanded = !expanded;
      animating = false;
    });
    const toHeight = collapsible.getBoundingClientRect().height;

    if (!expanded) {
      const { top, bottom } = button.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight) button.scrollIntoView({ block: "end" });
    }

    if (prefersReducedMotion.current || fromHeight === toHeight) return;

    // Animated in JS, since max-height can't be transitioned to none
    flushSync(() => (animating = true));
    const fadeHeights = ["6rem", "0px"];
    if (!expanded) fadeHeights.reverse();
    animation = collapsible.animate(
      [
        { height: `${fromHeight}px`, "--fade-height": fadeHeights[0] },
        { height: `${toHeight}px`, "--fade-height": fadeHeights[1] },
      ],
      { duration: 300, easing: "ease-out" },
    );
    animation.finished.then(
      () => (animating = false),
      () => {},
    );
  }
</script>

<section class="readme" aria-label="README">
  <div class="readme-body">
    <div
      id={collapsibleId}
      class="readme-collapsible"
      class:collapsed={!expanded}
      class:overflowing
      class:animating
      bind:this={collapsible}
      {@attach measureOverflow}
      onfocusin={() => {
        if (overflowing) expanded = true;
      }}
    >
      <div class="readme-content">
        <!-- Sanitized at build time, see src/lib/renderReadme.ts -->
        {@html readme.html}
      </div>
    </div>

    {#if expanded || overflowing}
      <button
        class="readme-toggle"
        class:over-fade={!expanded}
        onclick={toggle}
        aria-expanded={expanded}
        aria-controls={collapsibleId}
        aria-label={expanded ? "Collapse README" : "Expand README"}
        title={expanded ? "Collapse README" : "Expand README"}
      >
        {#if expanded}
          <IconArrowsInSimpleBold />
        {:else}
          <IconArrowsOutSimpleBold />
        {/if}
      </button>
    {/if}
  </div>

  <p class="attribution">
    <a href={readme.url} target="_blank">
      README from {repositoryPath}
      <IconArrowSquareOutBold />
      <span class="visually-hidden">(opens in a new tab)</span>
    </a>
    ·
    <a href={readme.license.url} target="_blank">
      {readme.license.name}
      <IconArrowSquareOutBold />
      <span class="visually-hidden">(opens in a new tab)</span>
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

  .readme-body {
    position: relative;
  }

  /* Registered so it can be animated. Its initial value can't be in rem, so it's set below. */
  @property --fade-height {
    syntax: "<length>";
    inherits: false;
    initial-value: 0px;
  }

  .readme-collapsible {
    --collapsed-height: 10rem;
    --fade-height: 6rem;
    /* Otherwise visually hidden text (which is absolutely positioned) escapes the overflow clip and
       extends the page below the collapsed README */
    position: relative;

    &.collapsed:not(.animating) {
      max-height: var(--collapsed-height);
      overflow: hidden;
    }

    &.collapsed.overflowing:not(.animating) {
      mask-image: linear-gradient(
        to bottom,
        black calc(var(--collapsed-height) - var(--fade-height)),
        transparent var(--collapsed-height)
      );
    }

    &.animating {
      overflow: hidden;
      mask-image: linear-gradient(to bottom, black calc(100% - var(--fade-height)), transparent);
    }
  }

  .readme-toggle {
    display: flex;
    margin: var(--gap-sm) auto 0;
    padding: 0.25rem 0.625rem;
    background: none;
    border: none;
    color: var(--purple-light);
    font-size: 1.5rem;
    scroll-margin-bottom: var(--sticky-bottom);
    --sticky-bottom: var(--gap-lg);

    /* Overrides the hover shadow from app.css */
    &,
    &:hover {
      box-shadow: none;
    }

    &:not(.over-fade) {
      position: sticky;
      margin: var(--gap-md) auto 0;
      bottom: var(--sticky-bottom);
      z-index: 1;
      margin-inline-start: 0;
      background: var(--surface-1);
      border-radius: 0.75rem;

      &,
      &:hover {
        box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
      }
    }

    /* Outside the collapsible, since its mask would fade the button out too */
    &.over-fade {
      position: absolute;
      bottom: 0;
      left: 50%;
      translate: -50% 0;
      margin: 0;
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

      :is(p, ul, ol, blockquote, pre, table, details) {
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
