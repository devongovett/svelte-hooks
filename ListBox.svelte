<script>
  import {useListBox} from '@react-aria/listbox';
  import {createHooks, useRef} from './react';
  import {mergeProps} from '@react-aria/utils';
  import {useOverlay, useDismissButton} from '@react-aria/overlays';
  import {useFocusScope} from '@react-aria/focus';
  import Option from './Option.svelte';
  import {attrs} from './attrs';

  export let state;
  export let domProps;

  let overlayProps, listBoxProps, dismissButtonProps, ref, overlayRef;
  let update = createHooks();

  $: update(() => {
    ref = useRef();
    ({listBoxProps} = useListBox(
      {
        ...domProps,
        autoFocus: state.focusStrategy || true,
        disallowEmptySelection: true
      },
      state,
      ref
    ));

    overlayRef = useRef();
    ({overlayProps} = useOverlay(
      {
        onClose: () => state.close(),
        shouldCloseOnBlur: true,
        isOpen: state.isOpen,
        isDismissable: true
      },
      overlayRef
    ));

    useFocusScope(overlayRef, {restoreFocus: true});
    ({dismissButtonProps} = useDismissButton({onDismiss: state.close}));
  });
</script>

<template>
  <div
    use:attrs={overlayProps}
    class="absolute mt-1 w-full rounded-md bg-white shadow-lg z-50"
    bind:this={overlayRef.current}>
    <button use:attrs={dismissButtonProps} />
    <ul
      bind:this={ref.current}
      use:attrs={mergeProps(listBoxProps, domProps)}
      class="max-h-56 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5">
      {#each [...state.collection] as item}
        <Option item={item} state={state}>
          <slot item={item.value} />
        </Option>
      {/each}
    </ul>
    <button use:attrs={dismissButtonProps} />
  </div>
</template>
