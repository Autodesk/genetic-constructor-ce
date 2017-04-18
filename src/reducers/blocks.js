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
import * as ActionTypes from '../constants/ActionTypes';
import * as instanceMap from '../store/instanceMap';

const initialState = {};

if (process.env.NODE_ENV === 'test') {
  const testBlocks = require('../../test/res/testProject').blocks;
  testBlocks.forEach(block => Object.assign(initialState,
    { [block.id]: block }
  ));
}

export default function blocks(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.BLOCK_CREATE :
  case ActionTypes.BLOCK_MERGE :
  case ActionTypes.BLOCK_RENAME :
  case ActionTypes.BLOCK_SET_COLOR :
  case ActionTypes.BLOCK_SET_PALETTE :
  case ActionTypes.BLOCK_CLONE :
  case ActionTypes.BLOCK_LOAD :
  case ActionTypes.BLOCK_STASH :
  case ActionTypes.BLOCK_FREEZE :
  case ActionTypes.BLOCK_SET_ROLE :
  case ActionTypes.BLOCK_ADD_ROLE :
  case ActionTypes.BLOCK_ANNOTATE :
  case ActionTypes.BLOCK_REMOVE_ANNOTATION :
  case ActionTypes.BLOCK_SET_SEQUENCE :
  case ActionTypes.BLOCK_SET_TRIM :
  case ActionTypes.BLOCK_SET_TEMPLATE :
  case ActionTypes.BLOCK_SET_LIST :
  case ActionTypes.BLOCK_SET_HIDDEN :
  case ActionTypes.BLOCK_SET_AUTHORING :
  case ActionTypes.BLOCK_SET_PROJECT :
  case ActionTypes.BLOCK_OPTION_ADD :
  case ActionTypes.BLOCK_OPTION_REMOVE :
  case ActionTypes.BLOCK_OPTION_TOGGLE :
  case ActionTypes.BLOCK_COMPONENT_ADD :
  case ActionTypes.BLOCK_COMPONENT_MOVE :
  case ActionTypes.BLOCK_COMPONENT_REMOVE :
    //can pass either block {} or blocks [], precedence for blocks array
    const { block, blocks } = action;

    if (Array.isArray(blocks)) {
      instanceMap.saveBlock(...blocks);
      const toMerge = blocks.reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
      return Object.assign({}, state, toMerge);
    }

    instanceMap.saveBlock(block);
    return Object.assign({}, state, { [block.id]: block });

  case ActionTypes.BLOCK_DETACH :
  case ActionTypes.BLOCK_DELETE :
    const { blockId, blockIds } = action;
    const nextState = Object.assign({}, state);

    //don't remove from instanceMap as blocks may be shared across projects

    if (Array.isArray(blockIds)) {
      blockIds.forEach(blockId => { delete nextState[blockId]; });
      return nextState;
    }

    delete nextState[blockId];
    return nextState;

  default :
    return state;
  }
}
