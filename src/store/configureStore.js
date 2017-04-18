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
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
//import createLogger from 'redux-logger';
import { routerMiddleware } from 'react-router-redux';
import { browserHistory } from 'react-router';
import saveLastActionMiddleware from './saveLastActionMiddleware';
import combinedReducerCreator from '../reducers/index';
import pausableStore from './pausableStore';

// note that the store loads the routes, which in turn load components
// Routes are provided to the store. ReduxRouter works with react-router. see routes.js - they are injected as middleware here so they can be provided to components, and route information can be accessed as application state.

//const logger = createLogger();

const middleware = [
  // middleware like thunk (async, promises) should come first in the chain
  thunk,
  //custom middleware for event system + last action
  saveLastActionMiddleware,
  //routing middleware so you can import actions from react-redux-router
  routerMiddleware(browserHistory),
];

let finalCreateStore;

//set by webpack
if (process.env.DEBUG_REDUX) {
  const DevTools = require('../containers/DevTools.js');

  finalCreateStore = compose(
    applyMiddleware(...middleware),
    pausableStore(),
    DevTools.instrument()
  )(createStore);
} else {
  finalCreateStore = compose(
    applyMiddleware(...middleware),
    pausableStore()
  )(createStore);
}

// expose reducer so you can pass in only one reducer for tests
// (probably need to compose the way reducer does, e.g. using combineReducers, so retrieving data from store is correct)
export default function configureStore(initialState, reducer = combinedReducerCreator()) {
  const store = finalCreateStore(reducer, initialState);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducerCreator = require('../reducers');
      const nextRootReducer = nextRootReducerCreator();
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
