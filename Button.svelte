<script>
	import {useButton} from '@react-aria/button';
	import {wrap} from './react';
	import {attrs} from './attrs';

	let count = 0;
	let {buttonProps, isPressed} = wrap(() =>
		useButton({
			onPress: () => count++
		})
	);
</script>

<style>
	button {
	  background: #ff3e00;
	  color: white;
	  border: none;
	  padding: 8px 12px;
	  border-radius: 2px;
	}

	.active {
		background: green;
	}
</style>

<button use:attrs={$buttonProps} class:active={$isPressed}>
  Clicked {count} {count === 1 ? 'time' : 'times'}
</button>

