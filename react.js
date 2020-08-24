import {writable, get} from 'svelte/store';
import {setContext, afterUpdate, onDestroy, beforeUpdate} from 'svelte';
import ContextProvider from './context/Provider.svelte';
import ContextConsumer from './context/Consumer.svelte';

let currentStore;
let i = 0;
let effects = [];
let layoutEffects = [];

export function createHooks() {
  let store = writable([]);
  let _effects = [];
  let _layoutEffects = [];

  afterUpdate(() => {
    _layoutEffects.forEach((fn) => fn());
    _layoutEffects = [];

    requestAnimationFrame(() => {
      _effects.forEach((fn) => fn());
      _effects = [];
    });
  });

  let isUpdating = false;
  let fn;
  let update = () => {
    if (isUpdating || !fn) {
      return;
    }

    currentStore = store;
    i = 0;
    effects = _effects;
    layoutEffects = _layoutEffects;
    isUpdating = true;

    fn();

    currentStore = null;
    isUpdating = false;
    i = 0;
  };

  store.subscribe(update);

  return (f) => {
    fn = f;
    update();
  };
}

export function useState(initialValue) {
  return useReducer((cur, next) => {
    if (typeof next === 'function') {
      next = next(cur);
    }

    return next;
  }, initialValue);
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

    let dispatch = action => {
      let prev = store[index][0];
      let nextState = reducer(prev, action);
      if (nextState === prev) {
        return;
      }

      store[index] = [nextState, dispatch];
      s.set(store);
    };

    store[index] = [initialValue, dispatch];
  }

  return store[index];
}

export function useMemo(fn, deps) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let store = get(currentStore);
  let index = i++;

  if (store.length <= index) {
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

  if (store.length <= index) {
    queue.push(() => {
      let res = fn();
      if (typeof res === 'function') {
        store[index][0] = res;
      }
    });
    store[index] = [null, deps];

    onDestroy(() => {
      if (store[index][0]) {
        store[index][0]();
      }
    });
  } else {
    let [prevFn, prevDeps] = store[index];
    if (!prevDeps || !deps || !shallowEqualArrays(prevDeps, deps)) {
      if (prevFn) queue.push(prevFn);
      queue.push(() => {
        let res = fn();
        if (typeof res === 'function') {
          store[index][0] = res;
        }
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

export function useRef(initialValue) {
  let [v] = useState({current: initialValue});
  return v;
}

export function useContext(context) {
  if (!currentStore) {
    throw new Error('Hook called not in a component');
  }

  let s = currentStore;
  let store = get(currentStore);
  let index = i++;

  if (store.length <= index) {
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
  forwardRef,
  isValidElement(v) { return !!v;},
  Children: {
    forEach(children, fn) {
      children.forEach(fn);
    }
  }
};
