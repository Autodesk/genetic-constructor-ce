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
import { routerReducer as router, LOCATION_CHANGE } from 'react-router-redux';
import { USER_SET_USER } from '../constants/ActionTypes';
import { combineReducers } from 'redux';
import { undoReducer, undoReducerEnhancerCreator } from '../store/undo/reducerEnhancer';
import { autosaveReducerEnhancer } from '../store/autosave/autosaveInstance';
import freezeReducerEnhancer from '../store/freezeReducerEnhancer';

//all the reducers

import blocks from './blocks';
import projects from './projects';
import inventory from './inventory';
import inspector from './inspector';
import ui from './ui';
import focus from './focus';
import orders from './orders';
import user from './user';
import clipboard from './clipboard';

//undo

const purgingEvents = [LOCATION_CHANGE, USER_SET_USER];

//export a function, so we can create multiple configurations (e.g. undoEnhancer is backed by a singleton which supports coordination across reducers)

export const createRootReducer = () => {
  const undoReducerEnhancer = undoReducerEnhancerCreator({
    purgeOn: (action) => purgingEvents.some(type => type === action.type),
  });

  return freezeReducerEnhancer(combineReducers({
    blocks: autosaveReducerEnhancer(undoReducerEnhancer(blocks, 'blocks')),
    projects: autosaveReducerEnhancer(undoReducerEnhancer(projects, 'projects')),
    router,
    inventory,
    inspector,
    ui,
    clipboard,
    focus,
    user,
    orders,
    undo: undoReducer,
  }));
};

export default createRootReducer;
