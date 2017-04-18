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
import * as ActionTypes from '../constants/ActionTypes';
import { setExtensionConfig } from '../extensions/clientRegistry';
import loadAllExtensions from '../extensions/loadExtensions';

const flashedUser = global.flashedUser || {};
const initialState = {
  userid: flashedUser.userid || null,
  email: flashedUser.email || null,
  firstName: flashedUser.firstName || null,
  lastName: flashedUser.lastName || null,
  config: flashedUser.config || {},
};

setExtensionConfig(initialState.config.extensions);

export default function user(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.USER_SET_USER:
    const { user, updateConfig = false} = action;
    invariant(typeof user === 'object', 'user must be object (can be empty)');
    const {
      userid = null,
      email = null,
      firstName = null,
      lastName = null,
      config = {},
    } = user;

    const nextState = Object.assign({}, state, {
      userid,
      email,
      firstName,
      lastName,
      config,
    });

    //update config in clientRegistry here (before all listeners are called - components, user promises, etc.)
    if (updateConfig) {
      setExtensionConfig(nextState.config.extensions);

      //update all listeners by re-fetching extension list + register again
      loadAllExtensions(true, true);
    }

    return nextState;

  default :
    return state;
  }
}
