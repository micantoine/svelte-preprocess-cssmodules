<script>
  let { children } = $props();
</script>

<div class="body">
  {@render children?.()}  
</div>

<style module="mixed">
  .body {
    padding: 1rem;
    flex: 1 0 0;
    min-height: 0;
    max-height: 100%;
    overflow: scroll;
    -webkit-overflow-scrolling: touch;
  }
</style>