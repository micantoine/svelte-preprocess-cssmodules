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

<style>
  div {
    text-align: right;
    font-size: 1.2rem;
    font-family: monospace;
  }
  .bold {
    font-weight: bold;
  }
</style>

<div
  class="$.datetime"
  class:$.bold={true}>{time}</div>