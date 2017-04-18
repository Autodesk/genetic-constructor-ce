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
import invariant from 'invariant';
import { debounce, throttle } from 'lodash';
import { FORCE_SAVE } from './ActionTypes';

export default function autosavingCreator(config) {
  invariant(typeof config.onSave === 'function', 'must pass onSave to autosaving middleware');

  const options = Object.assign({
    time: 20 * 1000, //throttle autosave requests, 20 sec
    wait: 3 * 1000, //debounce wait time, 3 sec
    onSave: (nextState) => { throw new Error('onSave is required'); },
    filter: (action, alreadyDirty, nextState, lastState) => nextState !== lastState, //filter for triggering autosave events
    purgeOn: (action, alreadyDirty, nextState, lastState) => false, //will cancel throttled calls if pass function
    simulateOn: (action, alreadyDirty, nextState, lastState) => false, //simulate that we've saved on these events
    forceOn: (action, alreadyDirty) => false, //force save on certain actions (so not debounced)
    forceSaveActionType: FORCE_SAVE,
  }, config);

  let timeStartOfChanges = 0; //0 means no unsaved changes, otherwise time of start of changes
  let dirty = false;

  const getTimeUnsaved = () => { return timeStartOfChanges > 0 ? +Date.now() - timeStartOfChanges : 0; };
  const isDirty = () => dirty;

  //we've saved, update relevant internal state
  const noteSave = () => {
    timeStartOfChanges = 0;
    dirty = false;
  };

  //fail saved, will be noted in project saving caching (middleware/data.js)
  const noteFailure = () => {};

  const handleSave = (nextState) => {
    Promise.resolve(options.onSave(nextState))
      .then(() => noteSave())
      .catch(() => noteFailure());
  };

  //trigger at start, and end if more were batched
  const throttledSave = throttle(handleSave, options.time, {
    leading: true,
    trailing: true,
  });

  //want to initiate saves debounced
  //not check saves debounced
  const debouncedInitiateSave = debounce(throttledSave, options.wait, {
    leading: false,
    trailing: true,
    maxWait: options.time,
  });

  const checkSave = (action, nextState, lastState) => {
    if (options.filter(action, dirty, nextState, lastState) === true) {
      if (!dirty) {
        timeStartOfChanges = +Date.now();
      }
      dirty = true;
    }
    return dirty;
  };

  const handlePurging = () => {
    timeStartOfChanges = 0;
    throttledSave.cancel();
    debouncedInitiateSave.cancel();
  };

  const handleForceSave = (state) => {
    handlePurging();
    handleSave(state);
  };

  const autosaveReducerEnhancer = reducer => {
    //track for reducer initial state because if the reducer e.g. use default prop of an object, reference will be different between initial state we compute here and when the reducer computes initial state as normal, triggering save on store initialization
    let initialized = false;

    return (state, action) => {
      //intercept action, dont need to run reducer
      if (action.type === options.forceSaveActionType || options.forceOn(action, dirty) === true) {
        handleForceSave(state);
        return state;
      }

      const nextState = reducer(state, action);

      if (options.purgeOn(action, dirty, nextState, state) === true) {
        handlePurging();
      }

      if (options.simulateOn(action, dirty, nextState, state) === true) {
        //todo - need to handle errors for these simulations.... these just look like they worked.. only want to mark !dirty on success
        noteSave();
      }

      //function call so easy to transition to debounced version
      if (checkSave(action, nextState, state) && !!initialized) {
        debouncedInitiateSave(nextState);
      }

      initialized = true;

      return nextState;
    };
  };

  return {
    autosaveReducerEnhancer,
    getTimeUnsaved,
    isDirty,
  };
}
