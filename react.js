import {writable, get} from 'svelte/store';
import {afterUpdate} from 'svelte';

let currentStore;
let i = 0;
let effects = [];
let layoutEffects = [];

export function wrap(fn) {
  let store = writable([]);
  let stores = {};
  
  let _effects = effects;
  let _layoutEffects = layoutEffects;

  afterUpdate(() => {
    _effects.forEach(fn => fn());
  });

  store.subscribe(function () {
    currentStore = store;
    i = 0;
    effects = [];
    layoutEffects = [];

    let res = fn();
    for (let key in res) {
      if (!(key in stores)) {
        stores[key] = writable(res[key]);
      } else {
        stores[key].set(res[key]);
      }
    }

    _effects = effects;
    _layoutEffects = layoutEffects;
    requestAnimationFrame(() => {
      _layoutEffects.forEach(fn => fn());
    });

    currentStore = null;
    i = 0;
  });

  currentStore = null;

  return stores;
}

export function useState(initialValue) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let s = currentStore;
  let store = get(currentStore);
  let index = i++;

  if (store[index] === undefined) {
    store[index] = initialValue;
  }

  let setValue = v => {
    store[index] = v;
    s.set(store);
  };

  return [store[index], setValue];
}

export function useMemo(fn, deps) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let store = get(currentStore);
  let index = i++;

  if (store[index] === undefined) {
    let val = fn();
    store[index] = [val, deps];
    return val;
  } else {
    let [prev, prevDeps] = store[index];
    if (!shallowEqualArrays(prevDeps, deps)) {
      let val = fn();
      store[index] = [val, deps];
      return val;
    } else {
      return prev;
    }
  }
}

function shallowEqualArrays(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((v, i) => b[i] === v);
}

function _useEffectWithQueue(fn, deps, queue) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }
  
  let store = get(currentStore);
  let index = i++;
  
  if (store[index] === undefined) {
    queue.push(() => {
      store[index][0] = fn();
    });
    store[index] = [null, deps];
  } else {
    let [prevFn, prevDeps] = store[index];
    if (!shallowEqualArrays(prevDeps, deps)) {
      if (prevFn) queue.push(prevFn);
      queue.push(() => {
        store[index][0] = fn();
      });
      store[index] = [null, deps];
    }
  }
}

export function useEffect(fn, deps) {
  _useEffectWithQueue(fn, deps, effects);
}

export function useLayoutEffect(fn, deps) {
  _useEffectWithQueue(fn, deps, layoutEffects);
}

export function useRef(value) {
  return {
    current: value
  }
}

export function useContext() {

}

export function useCallback(cb, deps) {
  return useMemo(() => cb, deps);
}

export function createContext() {
  return {};
}

export function forwardRef() {

}

export default {
  createContext,
  forwardRef
};
