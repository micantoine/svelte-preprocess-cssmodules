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

<style module>
  div {
    text-align: right;
    font-size: 1.2rem;
    font-family: monospace;
  }

  :local(.bolder) {
    font-weight: 900;
  }

  :local(.bolder:last-child) + p:not(:first-child) {
    color: blue;
  }
  @media (min-width: 20rem) {

  }
  :global(.bolder:last-child + p:not(:first-child)) p.bold {
    font-weight: bolder;
  }
   
  .bold {
    font-weight: bold;
  }
  .lighter {
    font-weight: 100;
  }
  .bold.red:last-child div span.light span.light:first-child {
    color: red;
  }
  div.light {
    font: 1em sans-serif;
  }
  p + span > strong { font-weight: 600; }
  :global(div) :local(p > strong) { font-weight: 600; }

  :local(div) *.bold { font-size: 12px;}
</style>
<div
  class=" bolder light { true ? 'lighter red' : ''}"
  class:bold={true}
>{time}</div>