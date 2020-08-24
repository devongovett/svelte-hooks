<script>
  import Button from "./Button.svelte";
  import Select from './Select.svelte';

  let count = 0;
  let onPress = () => {
    count++;
  }

  let options = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'].map(v => ({id: v.toLowerCase(), name: v}));
</script>

<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>

<main class="flex flex-col items-center space-y-4">
	<h1>Svelte + React Aria</h1>
  <Button onPress={onPress}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
  </Button>
  <Select label="Test" options={options} let:item={item}>
    {item.name}
  </Select>
</main>
