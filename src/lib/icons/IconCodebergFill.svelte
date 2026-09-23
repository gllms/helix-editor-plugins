<!-- Adapted from https://github.com/babakfp/phosphor-icons-svelte -->

<script lang="ts">
  import { type ClassValue } from "svelte/elements";
  const p: { class?: ClassValue } = $props();
</script>

<svg
  {...p}
  data-phosphor-icon="codeberg"
  aria-hidden="true"
  width="1em"
  height="1em"
  pointer-events="none"
  display="inline-block"
  xmlns="http://www.w3.org/2000/svg"
  fill="currentColor"
  viewBox="0 0 256 256"
>
  <path
    d="M 128 35.5625 A 92.444443 92.444466 0 0 0 35.5625 128 92.444443 92.444466 0 0 0 41.703125 161.15625 L 128 49.6875 214.26562 161.21875 A 92.444443 92.444466 0 0 0 220.4375 128 92.444443 92.444466 0 0 0 128 35.5625 Z"
    style="stroke:currentColor;stroke-width:24;stroke-linejoin:round"
  />
  <path
    d="M 214.26562 161.21875 128 49.6875 l -8.90625 18.125 39.54687 147.40625 a 92.444443 92.444466 0 0 0 55.625 -54 z"
    style="fill:none;stroke:currentColor;stroke-width:24;stroke-linejoin:round"
  />
</svg>
