<script>
  import { onDestroy } from 'svelte';

  let date = new Date();
  const active = true;
  $: time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  
  const interval = setInterval(() => date = new Date(), 1000);

  onDestroy(() => {
    clearInterval(interval);
  })
</script>

<style module="scoped">
  div {
    text-align: right;
    font-size: 1.2rem;
    font-family: monospace;
  }

  .bolder {
    font-weight: 900;
  }

  .bolder:last-child + p:not(:first-child) {
    color: blue;
  }
  :global(.bolder:last-child + p:not(:first-child)) p {
    font-weight: bolder;
  }
   
  .bold {
    font-weight: bold;
  }
  .bold .light {
    font-weight: light;
  }
</style>

<div
  class="bolder"
  class:bold={true}>{time}</div>