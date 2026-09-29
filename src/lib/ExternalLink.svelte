<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import ExternalLinkIcon from "$lib/ExternalLinkIcon.svelte";

  let { children, ...attributes }: HTMLAnchorAttributes = $props();
</script>

<a {...attributes} target="_blank">{@render children?.()}<ExternalLinkIcon /></a>
