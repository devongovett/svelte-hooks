<script>
  import { getContext } from 'svelte';

  export let key;
  let value = getContext(key);
</script>

<slot value={$value} />