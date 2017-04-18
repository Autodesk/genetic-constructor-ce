/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
/* store enhancer which lets you pause subscriptions from being called back
 e.g. if you want to update the store with several actions, but not update components */

export const PAUSE_ACTION = 'PAUSABLE_PAUSE';
export const RESUME_ACTION = 'PAUSABLE_RESUME';

export const pauseAction = () => ({ type: PAUSE_ACTION });
export const resumeAction = (preventDispatch, reset) => ({ type: RESUME_ACTION, preventDispatch, reset });

export const ON_RESUME_ACTION = 'PAUSABLE_ON_RESUME';

const patchSubscribe = (options = {}, reducer, createStore, initialState, ...storeArgs) => {
  const params = Object.assign({
    timeout: 1000,
  }, options);

  let store; //define this later

  let paused = 0;
  let timeoutId = null;

  const isPaused = () => paused > 0;

  const resume = (preventDispatch = false, reset = false) => {
    const wasPaused = isPaused();
    paused = reset === true ?
      0 :
      Math.max(0, paused - 1);

    if (wasPaused && !isPaused() && !preventDispatch) {
      store.dispatch({ type: ON_RESUME_ACTION });
    }

    if (!isPaused() && !!timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    return isPaused();
  };

  const pause = () => {
    paused += 1;

    if (!!timeoutId) {
      timeoutId = window.setTimeout(() => resume(false, true), params.timeout);
    }

    return isPaused();
  };

  const makePausableReducer = (options, reducer) => {
    return (state, action, ...args) => {
      switch (action.type) {
      case PAUSE_ACTION :
        pause();
        return state;

      case RESUME_ACTION :
        const { preventDispatch = false, reset } = action;
        const wasPaused = isPaused();

        //reducer can't dispatch an action, so don't dispatch using resume(), and just run the reducer instead when appropriate
        const stillPaused = resume(true, reset);

        if (stillPaused || (!wasPaused && !isPaused()) || preventDispatch === true) {
          return state;
        }
        return reducer(state, action, ...args);

      default :
        return reducer(state, action, ...args);
      }
    };
  };

  const pausableReducer = makePausableReducer(options, reducer);
  store = createStore(pausableReducer, initialState, ...storeArgs);

  return {
    ...store,
    subscribe(listener) {
      function pausableListener(...args) {
        if (!isPaused()) {
          listener(...args);
        }
      }

      return store.subscribe(pausableListener);
    },
    isPaused,
    pause,
    resume,
  };
};

export default function pausableStore(options) {
  return createStore => (reducer, initialState, ...storeArgs) => {
    return patchSubscribe(options, reducer, createStore, initialState, ...storeArgs);
  };
}
