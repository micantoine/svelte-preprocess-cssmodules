<script>
  import { onDestroy } from 'svelte'

  let date = new Date()
  $: time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  
  const interval = setInterval(() => date = new Date(), 1000)

  onDestroy(() => {
    clearInterval(interval)
  })
</script>

<style>
  .datetime {
    color: gray;
  }
  div {
    text-align: right;
    font-size: 1.2rem;
    font-family: monospace;
  }
</style>

<div class="$style.datetime">{time}</div>