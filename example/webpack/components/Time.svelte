<script>
  import { onDestroy } from 'svelte';
  import style from '../app.module.css';
  import { success } from '../app2.module.css';

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

  .bolder {
    font-weight: 900;
  }

  .bolder:last-child + p:not(:first-child) {
    color: blue;
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
</style>
<div
  class={style.errorMessage}
  class:style.error={true}
>test</div>
<div
  class=" bolder light { true ? 'lighter red' : ''}"
  class:bold={true}
  class:success={true}
>{time}</div>