import {writable, get} from 'svelte/store';
import {setContext, afterUpdate} from 'svelte';
import ContextProvider from './context/Provider.svelte';
import ContextConsumer from './context/Consumer.svelte';

let currentStore;
let i = 0;
let effects = [];
let layoutEffects = [];

export function wrap(fn) {
  let store = writable([]);
  let stores;

  let _effects = effects;
  let _layoutEffects = layoutEffects;

  afterUpdate(() => {
    _layoutEffects.forEach((fn) => fn());

    requestAnimationFrame(() => {
      _effects.forEach((fn) => fn());
    });
  });

  store.subscribe(function () {
    currentStore = store;
    i = 0;
    effects = [];
    layoutEffects = [];

    let res = fn();

    if (Array.isArray(res)) {
      if (stores === undefined) {
        stores = [];
      }  
      for (const key of res) {
        if (stores[key] === undefined) {
          stores[key] = writable(res[key]);
        } else {
          stores[key].set(res[key]);
        }
      }
    } else {
      if (stores === undefined) {
        stores = {};
      } 
      for (let key in res) {
        if (!(key in stores)) {
          stores[key] = writable(res[key]);
        } else {
          stores[key].set(res[key]);
        }
      }
    }

    _effects = effects;
    _layoutEffects = layoutEffects;

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

  if (store.length <= index) {
    if (typeof initialValue === 'function') {
      initialValue = initialValue();
    }
    store[index] = initialValue;
  }

  let setValue = v => {
    let nextState = v;
    if (typeof nextState === 'function') {
      nextState = nextState(store[index]);
    }
    store[index] = nextState;
    s.set(store);
  };

  return [store[index], setValue];
}

export function useReducer(reducer, initialArg, init) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let s = currentStore;
  let store = get(currentStore);
  let index = i++;

  if (store.length <= index) {
    let initialValue = initialArg;
    if (typeof init === 'function') {
      initialValue = init(initialArg);
    }
    store[index] = initialValue;
  }

  let dispatch = action => {
    let nextState = reducer(store[index], action);
    store[index] = nextState;
    s.set(store);
  };

  return [store[index], dispatch];
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

export function useContext(context) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let s = currentStore;
  let store = get(currentStore);
  let index = i++;

  if (store[index] === undefined) {
    let initial = true;
    context.__store.subscribe(value => {
      store[index] = value;
      if (initial) {
        initial = false;
      } else {
        s.set(store);
      }
    });
  }

  return store[index];
}

export function useCallback(cb, deps) {
  return useMemo(() => cb, deps);
}

export function createContext(initialValue) {
  let store = writable(initialValue);
  const key = Symbol();

  class Provider extends ContextProvider {
    constructor(options) {
      super({
        ...options,
        props: {
          ...options.props,
          key,
          store,
          value: initialValue,
        },
      });
    }
  }

  class Consumer extends ContextConsumer {
    constructor(options) {
      super({
        ...options,
        props: {
          ...options.props,
          key,
        },
      });
    }
  }

  return {
    __store: store,
    Provider,
    Consumer,
  };
}

export function forwardRef() {

}

export default {
  createContext,
  forwardRef
};
