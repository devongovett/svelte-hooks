<script>
  import { setContext } from 'svelte';
  
  export let key;
  export let value;
  export let store;

  setContext(key, store);
  
  $: store.set(value)
</script>

<slot />