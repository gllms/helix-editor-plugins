<script lang="ts">
  import HelpDialog from "$lib/HelpDialog.svelte";
  import previouslyBlurred, { wasPreviouslyBlurred } from "$lib/previouslyBlurred";
  import "../app.css";

  import IconGithubLogoFill from "phosphor-icons-svelte/IconGithubLogoFill.svelte";
  import IconPlusBold from "phosphor-icons-svelte/IconPlusBold.svelte";
  import IconQuestionFill from "phosphor-icons-svelte/IconQuestionFill.svelte";

  const newPluginJson = encodeURIComponent(
    JSON.stringify(
      {
        description: "A concise description of the plugin",
        repository: "username/repo",
        tags: ["tag1", "tag2"],
      },
      null,
      2,
    ),
  );

  let helpDialogOpen = $state(false);

  function openHelpDialog(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;

    // Allow revealing the other FAB buttons on first tap when the pointer is coarse
    if (window.matchMedia("(pointer: coarse)").matches && wasPreviouslyBlurred(button)) {
      return;
    }

    helpDialogOpen = true;
  }

  let { children } = $props();
</script>

<main>
  {@render children()}
</main>

<footer>
  <p>
    This site is not affiliated with the Helix editor. Plugins are
    community-contributed and not vetted by this site. Use them at your own
    risk.
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
  footer {
    margin-top: var(--gap-lg);
    margin-inline: 2rem;
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
