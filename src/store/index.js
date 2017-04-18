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

/**
 * `window.constructor.store`
 *
 * The Store is the hub of all data in Genetic Constructor. It is a large object, treated as immutable, and only modified using actions. All components register a subscription to the store, and check whether they should update, generally using reference equality checks (since the store is immutable) or sometimes the action type.
 *
 * Actions are triggered by components / programmatically, dispatched to the store, and handled by reducers. Reducers actually modify the store (technically, perform the mutation and return a new instance). Then, subscribed listeners are passed the store, and check if the sections they care about have changed, and update as necessary.
 *
 * The store is organized into various sections, which have corresponding actions + selectors. It is probably most useful to inspect the structure of the store by calling {@link Store.getState}.
 *
 * All actions are enumerated in {@link ActionTypes}
 *
 * The store uses Redux {@link https://github.com/reactjs/redux}
 * @module store
 * @memberOf module:constructor
 * @gc Store
 */

import configureStore from './configureStore';
import { getLastAction as lastAction } from './saveLastActionMiddleware';

/* If we were just using redux, without the redux-react and redux-router packages, you would just dispatch events etc. directly from the store. So, we're exporting it separately so it can be used that way e.g. for playing around. However, using those packages, you should use:

 redux-react
    <Provider>
    connect()
 redux-router
    <ReduxRouter>
    reactReduxRouter
    routerStateReducer()
*/

const store = configureStore();

//within the app you should use redux's connect(). This is in the event you need direct access, e.g. third-party extensions
const { dispatch, subscribe, getState, pause, resume, isPaused } = store;
export { lastAction, dispatch, subscribe, getState, pause, resume, isPaused };

/**
 * Dispatch an action to the store
 * @name dispatch
 * @function
 * @param {Object} payload An object describing the mutation. Must include a `type` field.
 * @example
 * //anti-pattern - recommend you always use actions
 * //create a block without using an action by dispatching automatically
 * const type = constructor.constants.actionTypes.BLOCK_CREATE;
 * const block = constructor.store.dispatch({type});
 */

/**
 * Register a subscription with the store.
 *
 * This will run every time the store changes, so it should be fast. Register only once if possible, and use a switch to react according to the action type, and use reference equality checks to the section you are interested in to see quickly if it has changed.
 * @name subscribe
 * @function
 * @param {function} subscriber Function to subscribe to the store, It will be passed the store and lastAction type.
 * @param {boolean} callOnSubscribe Call the function on subscription
 * @returns {function} function to call to unsubscribe
 * @example
 * var unsubscribe = constructor.store.subscribe(function (store, lastAction) { ... });
 */

/**
 * Get the current application state.
 * @name getState
 * @function
 * @returns {Object} Current state
 * @example
 * const state = constructor.store.getState();
 */
export default store;
