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
import * as ActionTypes from './ActionTypes';
import SectionManager from './SectionManager';
import UndoManager from './UndoManager';

//future - support for reducerEnhancing the whole store. Key parts will be weird?

//fixme - creating manager singleton here for undoReducer vs. dedicated manager in enhancerCreator creates a disparity. enhcancer creator should create on which is shared, and update what is exported
const manager = new UndoManager();

//hack - curently required to be last reducer (to run after enhancers have run to update undoManager, relying on key order in combineReducers)
//note that if you pass manager into enhancerCreator, this will not work
export const undoReducer = (state = {}, action) => {
  const { past, future, time } = manager.getUndoState();

  if (state.past === past && state.future === future) {
    return state;
  }

  return {
    past,
    future,
    time,
  };
};

//passing in manager is for testing, but you may not want to use the singleton... but the reducer will not work if you pass it in (WIP)
//each creator creates a new manager, so we dont have a singleton. Tests may create multiple stores, we dont want their actions affecting each other.
export const undoReducerEnhancerCreator = (config, undoManager = new UndoManager()) => {
  const params = Object.assign({
    initTypes: ['@@redux/INIT', '@@INIT'],
    purgeOn: () => false,
    filter: () => false,
  }, config);

  return (reducer, key = reducer.name) => {
    //todo - why is a key required?
    invariant(key, 'key is required, key in e.g. combineReducers');
    const initialState = reducer(undefined, {});

    //create a manager for this section of the store, register()
    const sectionManager = new SectionManager(initialState, params);
    undoManager.register(key, sectionManager);

    return (state = initialState, action) => {
      switch (action.type) {
      case ActionTypes.UNDO :
        undoManager.undo(action);
        break;
      case ActionTypes.REDO :
        undoManager.redo(action);
        break;
      case ActionTypes.JUMP :
        const { number } = action;
        undoManager.jump(number, action);
        break;

      case ActionTypes.TRANSACT :
        undoManager.transact(action);
        break;
      case ActionTypes.COMMIT :
        undoManager.commit(action);
        break;
      case ActionTypes.ABORT :
        undoManager.abort(action);
        break;
      default:
        //no impact on undo manager, compute as normal
      }

      const undoActionCalled = Object.keys(ActionTypes).map(key => ActionTypes[key]).indexOf(action.type) >= 0;

      // if undomanager was called, then dont want to just return the state (will pass === check), want to retrieve state from the reducer.
      // We don't need to calculate the next state because the action is not relevant
      if (undoActionCalled) {
        return sectionManager.getCurrentState();
      }

      const nextState = reducer(state, action);

      //on redux init types, reset the history
      if (params.initTypes.some(type => type === action.type)) {
        //this is very hard to trace otherwise
        if (process.env.NODE_ENV !== 'production' && (undoManager.past.length > 0 || undoManager.future.length > 0)) {
          console.log('store init event (undo reducer enhancer resetting, had history which is now purged)'); //eslint-disable-line no-console
        }
        undoManager.purge();
        undoManager.patch(key, nextState, action);
        return sectionManager.getCurrentState();
      }

      //if marked to purge, lets clear the history
      if (!!action.undoPurge || params.purgeOn(action, nextState, state)) {
        undoManager.purge(action);
      }

      //if nothing has changed, dont bother hitting UndoManager
      if (nextState === state) {
        return state;
      }

      //if we make it this far, then this reducer has been affected and we can assume the action is specific to this section of reducers
      if (!!action.undoable || params.filter(action, nextState, state)) {
        //shouldnt have undoPurge and undoable on same action
        undoManager.insert(key, nextState, action);
      } else {
        //if not tracked as undoable, update present state
        undoManager.patch(key, nextState, action);
      }

      //should be consistent with the return if undoActionCalled
      return sectionManager.getCurrentState();
    };
  };
};

export const makeUndoable = (action) => Object.assign(action, { undoable: true });
export const makePurging = (action) => Object.assign(action, { undoPurge: true });

export default undoReducerEnhancerCreator;
