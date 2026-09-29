<script lang="ts">
  import { flushSync, type Snippet } from "svelte";
  import { animateHeight, prefersReducedMotion } from "$lib/motion";

  import IconArrowsOutSimpleBold from "phosphor-icons-svelte/IconArrowsOutSimpleBold.svelte";
  import IconArrowsInSimpleBold from "phosphor-icons-svelte/IconArrowsInSimpleBold.svelte";

  let {
    label,
    collapsedHeight = "10rem",
    fadeHeight = "6rem",
    children,
  }: {
    label: string;
    collapsedHeight?: string;
    fadeHeight?: string;
    children: Snippet;
  } = $props();

  const collapsibleId = $props.id();

  let expanded = $state(false);

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

  export function collapse() {
    if (expanded) setExpanded(false);
  }

  function setExpanded(value: boolean, button?: HTMLButtonElement) {
    // Measured before cancelling, so toggling halfway continues from the current height
    const fromHeight = collapsible.getBoundingClientRect().height;
    animation?.cancel();

    // Measured without .animating, which lifts the max-height
    flushSync(() => {
      expanded = value;
      animating = false;
    });
    const toHeight = collapsible.getBoundingClientRect().height;

    if (button && !expanded) {
      const { top, bottom } = button.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight) button.scrollIntoView({ block: "end" });
    }

    if (prefersReducedMotion.current || fromHeight === toHeight) return;

    // Animated in JS, since max-height can't be transitioned to none
    flushSync(() => (animating = true));
    const fadeHeights = [fadeHeight, "0px"];
    if (!expanded) fadeHeights.reverse();
    animation = animateHeight(collapsible, fromHeight, toHeight, [
      { "--fade-height": fadeHeights[0] },
      { "--fade-height": fadeHeights[1] },
    ]);
    animation.finished.then(
      () => (animating = false),
      () => {},
    );
  }
</script>

<div class="collapsible-container">
  <div
    id={collapsibleId}
    class="collapsible"
    class:collapsed={!expanded}
    class:overflowing
    class:animating
    style:--collapsed-height={collapsedHeight}
    style:--fade-height={fadeHeight}
    bind:this={collapsible}
    {@attach measureOverflow}
    onfocusin={(event) => {
      // Not when focused by a click, which would expand it when clicking something inside
      if (overflowing && (event.target as Element).matches(":focus-visible")) expanded = true;
    }}
  >
    <div>
      {@render children()}
    </div>
  </div>

  {#if expanded || overflowing}
    <button
      class="collapsible-toggle"
      class:over-fade={!expanded}
      onclick={(event) => setExpanded(!expanded, event.currentTarget)}
      aria-expanded={expanded}
      aria-controls={collapsibleId}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      title={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      {#if expanded}
        <IconArrowsInSimpleBold />
      {:else}
        <IconArrowsOutSimpleBold />
      {/if}
    </button>
  {/if}
</div>

<style>
  .collapsible-container {
    position: relative;
  }

  /* Registered so it can be animated. Its initial value can't be in rem, so it's set inline. */
  @property --fade-height {
    syntax: "<length>";
    inherits: false;
    initial-value: 0px;
  }

  .collapsible {
    /* Otherwise visually hidden text (which is absolutely positioned) escapes the overflow clip and
       extends the page below the collapsed content */
    position: relative;

    &.collapsed:not(.animating) {
      max-height: var(--collapsed-height);
      overflow: hidden;
    }

    &.collapsed.overflowing:not(.animating) {
      mask-image: linear-gradient(
        to bottom,
        black calc(var(--collapsed-height) - var(--fade-height)),
        rgb(0 0 0 / 25%) calc(var(--collapsed-height) - var(--fade-height) / 2),
        transparent var(--collapsed-height)
      );
    }

    &.animating {
      overflow: hidden;
      mask-image: linear-gradient(
        to bottom,
        black calc(100% - var(--fade-height)),
        rgb(0 0 0 / 25%) calc(100% - var(--fade-height) / 2),
        transparent
      );
    }
  }

  .collapsible-toggle {
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
      background: var(--purple-light);
      color: white;
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
</style>
