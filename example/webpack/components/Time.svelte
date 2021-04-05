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
  .lighter {
    font-weight: 100;
  }
  .red {
    color: red;
  }
  .light {
    font: 1em sans-serif;
  }
</style>

<div
  class=" bolder light { true ? 'lighter red' : ''}"
  class:bold={true}>{time}</div>