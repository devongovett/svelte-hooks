<script>
	import {useButton} from '@react-aria/button';
	import {useFocusRing} from '@react-aria/focus';
	import {mergeProps} from '@react-aria/utils';
	import {createHooks} from './react';
	import {attrs} from './attrs';

	export let onPress;

	let buttonProps, isPressed, focusProps, isFocusVisible;
	let update = createHooks();

	$: update(() => {
		({buttonProps, isPressed} = useButton({onPress}));
		({focusProps, isFocusVisible} = useFocusRing());
	});
</script>

<button
	use:attrs={mergeProps(buttonProps, focusProps)}
	class="text-white font-bold py-2 px-4 rounded cursor-default focus:outline-none transition ease-in-out duration-150"
	class:bg-blue-700={isPressed}
	class:bg-blue-500={!isPressed}
	class:shadow-outline={isFocusVisible}>
  <slot />
</button>

