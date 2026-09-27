<script lang="ts">
  import timeAgo from "$lib/timeAgo";

  let { date, long = false }: { date: Date; long?: boolean } = $props();
</script>

<time datetime={date.toISOString()}>
  <span aria-hidden="true">{timeAgo(date, long)}</span>
  <span class="visually-hidden">
    {timeAgo(date, true)}
  </span>
</time>
