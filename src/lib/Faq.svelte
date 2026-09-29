<script module lang="ts">
  let openFaq: { collapse: (animate: boolean) => Promise<void> } | undefined;
</script>

<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { on } from "svelte/events";
  import { pushState, replaceState } from "$app/navigation";
  import { page } from "$app/state";
  import { animateHeight, prefersReducedMotion } from "$lib/motion";

  import IconCaretDownBold from "phosphor-icons-svelte/IconCaretDownBold.svelte";

  let { id, question, children }: { id: string; question: string; children: Snippet } = $props();

  let details: HTMLDetailsElement;
  let summary: HTMLElement;
  let expanded = $state(false);
  let animation: Animation | undefined;
  let keepInPlaceFrame = 0;

  const faq = { collapse: (animate: boolean) => setExpanded(false, animate) };

  async function setExpanded(value: boolean, animate = !prefersReducedMotion.current) {
    expanded = value;

    let othersCollapsed: Promise<void> | undefined;
    if (value) {
      if (openFaq !== faq) othersCollapsed = openFaq?.collapse(animate);
      openFaq = faq;
    } else if (openFaq === faq) {
      openFaq = undefined;
    }

    const hash = `#${id}`;
    if (value ? location.hash !== hash : location.hash === hash) {
      replaceState(location.pathname + location.search + (value ? hash : ""), page.state);
    }

    // Measured before cancelling, so toggling halfway continues from the current height
    const fromHeight = details.getBoundingClientRect().height;
    animation?.cancel();
    // Stays open while collapsing, since the answer is hidden as soon as it's closed
    details.open = true;
    const toHeight = value
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().bottom - details.getBoundingClientRect().top;

    if (animate && fromHeight !== toHeight) {
      animation = animateHeight(details, fromHeight, toHeight, [
        { overflow: "hidden" },
        { overflow: "hidden" },
      ]);
      try {
        await animation.finished;
      } catch {
        // Cancelled by toggling it again
        return;
      }
    }

    details.open = value;
    await othersCollapsed;
  }

  function setExpandedInPlace(value: boolean, animate?: boolean) {
    const top = summary.getBoundingClientRect().top;
    let done = false;
    // Also when it fails, since the page can't be scrolled until it's done
    setExpanded(value, animate).finally(() => (done = true));

    // Collapsing the open one moves this one if it was above it
    cancelAnimationFrame(keepInPlaceFrame);
    keepInPlaceFrame = requestAnimationFrame(function keepInPlace() {
      window.scrollBy(0, summary.getBoundingClientRect().top - top);
      if (!done) keepInPlaceFrame = requestAnimationFrame(keepInPlace);
    });
  }

  function toggle(event: MouseEvent) {
    event.preventDefault();
    setExpandedInPlace(!expanded);
  }

  function ontoggle() {
    // Opened by the browser itself, like when find in page finds something in it
    if (details.open && !expanded) setExpanded(true, false);
  }

  onMount(() => {
    function openIfLinkedTo(hash: string, animate?: boolean) {
      if (hash !== `#${id}`) return;
      details.scrollIntoView();
      if (!expanded) setExpandedInPlace(true, animate);
    }

    openIfLinkedTo(location.hash, false);
    const offHashChange = on(window, "hashchange", () => openIfLinkedTo(location.hash));
    // Clicking a link to the hash the URL already has doesn't fire hashchange
    const offClick = on(document, "click", (event) => {
      const link = (event.target as Element).closest("a");
      if (link?.origin !== location.origin || link.pathname !== location.pathname) return;

      if (link.hash !== location.hash) {
        // Otherwise hashchange opens it
        if (!event.defaultPrevented) return;
        // SvelteKit cancels the navigation when it thinks the URL already has this hash, since its
        // URL isn't updated by replaceState
        pushState(location.pathname + location.search + link.hash, page.state);
      }
      openIfLinkedTo(link.hash);
    });
    return () => {
      offHashChange();
      offClick();
      // Its elements are gone, so nothing may use them anymore
      if (openFaq === faq) openFaq = undefined;
      animation?.cancel();
      cancelAnimationFrame(keepInPlaceFrame);
    };
  });
</script>

<details {id} class:expanded bind:this={details} {ontoggle}>
  <summary bind:this={summary} onclick={toggle}>
    <h2>{question}</h2>
    <IconCaretDownBold />
  </summary>
  <div class="answer">
    {@render children()}
  </div>
</details>

<style>
  details {
    /* Otherwise visually hidden text (which is absolutely positioned) escapes the overflow clip
       while animating */
    position: relative;
    border-top: 2px solid var(--border-subtle);
    scroll-margin-top: var(--gap-lg);
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    padding: var(--gap-md) 0;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &:hover {
      filter: brightness(1.25);
    }

    :global(svg) {
      flex-shrink: 0;
      font-size: 1.25rem;

      @media (prefers-reduced-motion: no-preference) {
        transition: rotate var(--transition-base) ease-out;
      }
    }
  }

  .expanded > summary :global(svg) {
    rotate: 180deg;
  }

  h2 {
    margin: 0;
    font-size: 1.375rem;
  }

  .answer {
    padding-bottom: var(--gap-md);

    > :global(:last-child) {
      margin-bottom: 0;
    }
  }
</style>
