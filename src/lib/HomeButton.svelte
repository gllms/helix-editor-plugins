<script lang="ts">
  import { resolve } from "$app/paths";

  import IconHouseBold from "phosphor-icons-svelte/IconHouseBold.svelte";
</script>

<a href={resolve("/")} class="home-button" title="Go to home page" aria-label="Go to home page">
  <IconHouseBold />
</a>

<style>
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
</style>
