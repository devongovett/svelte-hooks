import {writable, get} from 'svelte/store';
import {beforeUpdate} from 'svelte';

let currentStore;
let i = 0;
let effects = [];

export function wrap(fn) {
  let store = writable([]);
  currentStore = store;
  i = 0;
  effects = [];

  let res = fn();

  let stores = {};
  for (let key in res) {
    stores[key] = writable(res[key]);
  }

  effects.forEach(fn => fn());

  store.subscribe(function () {
    currentStore = store;
    i = 0;
    effects = [];

    let res = fn();
    for (let key in res) {
      stores[key].set(res[key]);
    }

    effects.forEach(fn => fn());

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

export function useEffect(fn, deps) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let store = get(currentStore);
  let index = i++;

  if (store[index] === undefined) {
    effects.push(fn);
    store[index] = deps;
  } else {
    let prevDeps = store[index];
    if (!shallowEqualArrays(prevDeps, deps)) {
      effects.push(fn);
      store[index] = deps;
    }
  }
}

export function useLayoutEffect(fn, deps) {
  useEffect(fn, deps)
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
