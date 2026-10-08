<script lang="ts">
  import { flushSync, type Snippet } from "svelte";
  import { animateHeight, animatePosition, prefersReducedMotion } from "#lib/motion.js";

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
  let toggle = $state<HTMLButtonElement>();
  let animating = $state(false);
  let animation: Animation | undefined;
  let toggleAnimation: ReturnType<typeof animatePosition> | undefined;

  export function collapse() {
    if (expanded) setExpanded(false);
  }

  function setExpanded(value: boolean, button?: HTMLButtonElement) {
    // Measured before cancelling, so toggling halfway continues from the current height
    const fromHeight = collapsible.getBoundingClientRect().height;
    const toggleFrom = toggle?.getBoundingClientRect();
    animation?.cancel();
    toggleAnimation?.cancel();

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

    if (prefersReducedMotion.current) return;

    const toggleTo = toggle?.getBoundingClientRect();

    if (fromHeight !== toHeight) {
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

    if (toggle && toggleFrom && toggleTo) {
      toggleAnimation = animatePosition(toggle, toggleFrom, toggleTo);
    }
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
      bind:this={toggle}
      onclick={(event) => setExpanded(!expanded, event.currentTarget)}
      aria-expanded={expanded}
      aria-controls={collapsibleId}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      title={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      <!-- Both rendered so they can crossfade -->
      <span class="toggle-icon" class:visible={expanded}><IconArrowsInSimpleBold /></span>
      <span class="toggle-icon" class:visible={!expanded}><IconArrowsOutSimpleBold /></span>
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
    display: grid;
    margin: var(--gap-sm) auto 0;
    padding: 0.25rem 0.625rem;
    background: none;
    border: none;
    border-radius: 0.75rem;
    color: var(--purple-light);
    font-size: 1.5rem;
    z-index: 1;
    scroll-margin-bottom: var(--sticky-bottom);
    --sticky-bottom: var(--gap-lg);

    @media (prefers-reduced-motion: no-preference) {
      /* Keeps the transform and filter transitions from app.css, which this replaces */
      transition:
        transform var(--transition-base),
        filter var(--transition-base),
        box-shadow 300ms ease-out,
        background-color 300ms ease-out,
        color 300ms ease-out;
    }

    /* Overrides the hover shadow from app.css */
    &,
    &:hover {
      box-shadow: none;

      @media (pointer: coarse) {
        filter: none;
      }
    }

    &:not(.over-fade) {
      position: sticky;
      margin: var(--gap-md) auto 0;
      bottom: var(--sticky-bottom);
      margin-inline-start: 0;
      background: var(--purple-light);
      color: white;

      &,
      &:hover {
        box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
      }
    }

    /* Outside the collapsible, since its mask would fade the button out too */
    &.over-fade {
      position: absolute;
      bottom: 0;
      /* Centered without translate, which animatePosition uses */
      inset-inline: 0;
      width: fit-content;
      margin: 0 auto;
    }
  }

  .toggle-icon {
    grid-area: 1 / 1;
    display: flex;
    opacity: 0;
    scale: 0.5;

    &.visible {
      opacity: 1;
      scale: 1;
    }

    @media (prefers-reduced-motion: no-preference) {
      transition:
        opacity 300ms ease-out,
        scale 300ms ease-out;
    }
  }
</style>
