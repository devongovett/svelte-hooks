<script>
  import {useSelectState} from '@react-stately/select';
  import {useSelect, useHiddenSelect} from '@react-aria/select';
  import {useButton} from '@react-aria/button';
  import {Item} from "@react-stately/collections";
  import {useFocusRing} from "@react-aria/focus";
  import {mergeProps} from "@react-aria/utils";
  import {createHooks, useRef} from './react';
  import {attrs} from './attrs';
  import ListBox from './ListBox.svelte';

  export let label = '';
  export let options = [];

  let state, labelProps, buttonProps, valueProps, menuProps, focusProps, hiddenSelectProps, inputProps, selectProps, isFocusVisible, ref;
  let update = createHooks();

  $: update(() => {
    state = useSelectState({
      label,
      // HACK: create fake JSX elements. Ideally we'd pass a pre-built collection in here instead.
      items: options,
      children: (v) => ({type: Item, key: v.id, props: {children: v.name}})
    });

    ref = useRef();
    let triggerProps;
    ({labelProps, triggerProps, valueProps, menuProps} = useSelect(
      {label},
      state,
      ref
    ));

    ({buttonProps} = useButton(triggerProps, ref));
    buttonProps.onKeyDownCapture = triggerProps.onKeyDownCapture; // TODO: fix this

    ({focusProps, isFocusVisible} = useFocusRing());
    ({containerProps: hiddenSelectProps, inputProps, selectProps} = useHiddenSelect({label}, state, ref));
  });
</script>

<div class="space-y-1 w-48 relative">
  <div
    use:attrs={labelProps}
    class="block text-sm leading-5 font-medium text-gray-700">
    {label}
  </div>
  <div use:attrs={hiddenSelectProps}>
    <input use:attrs={inputProps} />
    <label>
      {label}
      <select use:attrs={selectProps}>
        {#each [...state.collection.getKeys()] as key}
          <option value="key">
            {state.collection.getItem(key).textValue}
          </option>
        {/each}
      </select>
    </label>
  </div>
  <button
    use:attrs={mergeProps(focusProps, buttonProps)}
    class="cursor-default relative w-full rounded-md border pl-3 pr-10 py-2 text-left focus:outline-none transition ease-in-out duration-150 border-gray-400 bg-white"
    class:shadow-outline={isFocusVisible}
    class-border-blue-400={isFocusVisible}
    bind:this={ref.current}>
    <span
      use:attrs={valueProps}
      class="flex items-center space-x-3"
      class:text-gray-500={!state.selectedItem}
      class:text-gray-800={state.selectedItem}>
      {state.selectedItem ? state.selectedItem.rendered : 'Select an option'}
    </span>
    <span
      aria-hidden="true"
      class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg
        class="h-5 w-5 text-gray-500"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor">
        <path
          d="M7 7l3-3 3 3m0 6l-3 3-3-3"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </button>
  {#if state.isOpen}
    <ListBox state={state} domProps={menuProps} let:item={item}>
      <slot item={item} />
    </ListBox>
  {/if}
</div>
