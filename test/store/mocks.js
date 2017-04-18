import invariant from 'invariant';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import { expect } from 'chai';
import saveLastActionMiddleware from '../../src/store/saveLastActionMiddleware';

const middlewares = [
  thunk,
  saveLastActionMiddleware,
];

console.error('todo - update store mock with freezeing reducer enhancer... or deprecate mock all together?');

//note - not an undoable store
//first two arguments required,
//combineUnderNamespace to create namespaced store automatically
export function simpleStore(initialState, reducer, combineUnderNamespace) {
  const finalReducer = (typeof combineUnderNamespace === 'string') ?
    combineReducers({ [combineUnderNamespace]: reducer }) :
    reducer;
  const finalInitialState = (typeof combineUnderNamespace === 'string') ?
  { [combineUnderNamespace]: initialState } :
    initialState;

  return applyMiddleware(...middlewares)(createStore)(finalReducer, finalInitialState);
}

/*
 * Creates a mock of Redux store with middleware, into which you can pass expected actions, and function to run on the last action. Does not fully emulate the store, as in it does not have reducers and does not actually change the state.
 */
export function mockStore(getState, expectedActions, onLastAction) {
  invariant(Array.isArray(expectedActions), 'expectedActions should be an array of expected actions.');
  invariant(typeof onLastAction === 'undefined' || typeof onLastAction === 'function', 'onLastAction should either be undefined or function.');

  function mockStoreWithoutMiddleware() {
    return {
      getState() {
        return typeof getState === 'function' ?
          getState() :
          getState;
      },

      dispatch(action) {
        const expectedAction = expectedActions.shift();
        expect(action).to.eql(expectedAction);
        if (onLastAction && !expectedActions.length) {
          onLastAction();
        }
        return action;
      },
    };
  }

  const mockStoreWithMiddleware = applyMiddleware(
    ...middlewares
  )(mockStoreWithoutMiddleware);

  return mockStoreWithMiddleware();
}
