<script>
  import { onDestroy } from 'svelte';

  let className;
  export { className as class };

  let date = new Date();
  const active = true;
  $: time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  
  const interval = setInterval(() => date = new Date(), 1000);

  onDestroy(() => {
    clearInterval(interval);
  })
</script>

<style module="mixed">
  :local(div) {
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

  .btn {
    float:right;
		animation: opacity 4s infinite alternate;
	}

  @media screen {
    .btn {
      color: red;
    }
  }

	@keyframes opacity {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>
<div
  class="btn bolder light { true ? 'lighter red' : ''}"
  class:bold={true}
>{time}</div>