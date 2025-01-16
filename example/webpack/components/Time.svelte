<script>
  let { class: className, ...props} = $props();

  let date = $state(new Date());
  let time = $derived(`${date.getHours()}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`);

  function twoDigits(str) {
    return str.toLocaleString('en', { minimumIntegerDigits: 2 });
  }
  
  $effect(() => {
    const interval = setInterval(() => {
			date = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
  });
</script>

<div
  class="time bolder light { true ? 'lighter red' : ''} {className}"
  class:bold={true}
  {...props}
>{time}</div>

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

  .time {
    float:right;
		animation: opacity 4s infinite alternate;
	}

	@keyframes opacity {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@keyframes opacity2 {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>