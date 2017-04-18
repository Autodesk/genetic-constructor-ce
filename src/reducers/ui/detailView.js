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
import * as ActionTypes from '../../constants/ActionTypes';
import { LOCATION_CHANGE } from 'react-router-redux';

export const initialState = {
  isVisible: false,
  currentExtension: null, //key, not manifest
};

export default function detailView(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.DETAIL_VIEW_TOGGLE_VISIBILITY :
    const { nextState } = action;
    const next = { isVisible: nextState };
    if (!nextState) {
      Object.assign(next, { currentExtension: null });
    }
    return Object.assign({}, state, next);

  case ActionTypes.DETAIL_VIEW_SELECT_EXTENSION :
    const { key } = action;
    if (!key || key === state.currentExtension) {
      return state;
    }
    return Object.assign({}, state, { currentExtension: key });

  case ActionTypes.USER_SET_USER :
  case LOCATION_CHANGE :
    return Object.assign({}, initialState);

  default :
    return state;
  }
}
