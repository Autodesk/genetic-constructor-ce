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
 * @module Actions_Focus
 * @memberOf module:Actions
 */
import * as ActionTypes from '../constants/ActionTypes';
import * as BlockSelector from '../selectors/blocks';
import invariant from 'invariant';
import safeValidate from '../schemas/fields/safeValidate';
import { id as idValidatorCreator } from '../schemas/fields/validators';
import Block from '../models/Block';
import Project from '../models/Project';
import { symbolMap } from '../inventory/roles';

const idValidator = (id) => safeValidate(idValidatorCreator(), true, id);

/**
 * Focus a construct by ID, updating block selection if a new construct
 * @function
 * @param {UUID} inputConstructId
 * @returns {UUID} Construct ID
 */
export const focusConstruct = (inputConstructId) => {
  return (dispatch, getState) => {
    //null is valid to unselect all constructs
    const constructId = idValidator(inputConstructId) ? inputConstructId : null;

    //prune blocks if outside current construct
    const currentBlocks = getState().focus.blockIds;
    if (constructId && currentBlocks.length) {
      const children = dispatch(BlockSelector.blockGetComponentsRecursive(constructId));
      const blockIds = currentBlocks.filter(blockId => {
        return children.some(block => block.id === blockId);
      });
      dispatch({
        type: ActionTypes.FOCUS_BLOCKS,
        blockIds,
      });
    }

    dispatch({
      type: ActionTypes.FOCUS_CONSTRUCT,
      constructId,
    });
    return constructId;
  };
};

//todo - ensure all blocks are from the same construct
/**
 * Focus blocks (from a single construct) , updating construct if necessary
 * @function
 * @param {Array.<UUID>} blockIds
 * @returns {Array.<UUID>} focused block IDs
 */
export const focusBlocks = (blockIds) => {
  return (dispatch, getState) => {
    invariant(Array.isArray(blockIds), 'must pass array to focus blocks');
    invariant(blockIds.every(block => idValidator(block)), 'must pass array of block IDs');
    const focusedConstructId = getState().focus.constructId;

    //todo - ensure none of the blocks are actually constructs, instead of just the current one (and dipatch an action)
    if (blockIds.some(blockId => blockId === focusedConstructId)) {
      //focus a construct instead
      return getState().focus.blockIds;
    }

    if (blockIds.length) {
      const firstBlockId = blockIds[0];
      const construct = dispatch(BlockSelector.blockGetParentRoot(firstBlockId));
      // null => no parent => construct (or detached)... undefined could be soething else
      //const constructId = !!construct ? construct.id : (construct !== null ? firstBlockId : undefined);
      const constructId = construct ? construct.id : null;
      if (constructId !== focusedConstructId || constructId === firstBlockId) {
        dispatch({
          type: ActionTypes.FOCUS_CONSTRUCT,
          constructId,
        });
      }
    }

    dispatch({
      type: ActionTypes.FOCUS_BLOCKS,
      blockIds,
    });
    return blockIds;
  };
};

/**
 * Add blocks to focus
 * @function
 * @param {Array.<UUID>} blocksIdsToAdd
 * @returns {Array.<UUID>} all block IDs focused
 */
export const focusBlocksAdd = (blocksIdsToAdd) => {
  return (dispatch, getState) => {
    invariant(Array.isArray(blocksIdsToAdd), 'must pass array to focus blocks');
    invariant(blocksIdsToAdd.every(block => idValidator(block)), 'must pass array of block IDs');

    const base = getState().focus.blockIds;
    const blockIds = [...new Set([...base, ...blocksIdsToAdd])];

    return dispatch(focusBlocks(blockIds));
  };
};

/**
 * Toggle focus of blocks
 * @function
 * @param {Array.<UUID>} blockToToggle
 * @returns {Array.<UUID>} all block IDs focused
 */
export const focusBlocksToggle = (blocksToToggle) => {
  return (dispatch, getState) => {
    invariant(Array.isArray(blocksToToggle), 'must pass array to focus blocks');

    const currentBlockIds = getState().focus.blockIds;
    const blockSet = new Set(currentBlockIds);

    blocksToToggle.forEach(block => {
      if (blockSet.has(block)) {
        blockSet.delete(block);
      } else {
        blockSet.add(block);
      }
    });
    const blockIds = [...blockSet];

    return dispatch(focusBlocks(blockIds));
  };
};

/**
 * Force focus of blocks, passing in Block Models rather than IDs (blocks may not be in the store)
 * @function
 * @param {Array.<Block>} blocks
 * @returns {Array.<Block>} force-focused blocks
 */
export const focusForceBlocks = (blocks) => {
  return (dispatch, getState) => {
    invariant(blocks.every(block => Block.validate(block, false)), 'each block must pass validation to focus it');

    dispatch({
      type: ActionTypes.FOCUS_FORCE_BLOCKS,
      blocks,
    });
    return blocks;
  };
};

/**
 * Force focusing of project, passing in Project Models rahter than IDs (may not be in store)
 * @function
 * @param {Project} project
 * @returns {Project}
 */
export const focusForceProject = (project) => {
  return (dispatch, getState) => {
    invariant(Project.validate(project, false), 'must pass a valid project');

    dispatch({
      type: ActionTypes.FOCUS_FORCE_PROJECT,
      project,
    });
    return project;
  };
};

/**
 * Specify which level of focus has priority
 * @function
 * @param level One of `project`, `construct`, `block`, `option`, or `role`
 * @returns {string} focused level
 */
export const focusPrioritize = (level = 'project') => {
  return (dispatch, getState) => {
    invariant(['project', 'construct', 'block', 'option', 'role'].indexOf(level) >= 0, 'must pass a valid type to give priority to');

    dispatch({
      type: ActionTypes.FOCUS_PRIORITIZE,
      level,
    });
    return level;
  };
};

/**
 * Focus a role
 * @function
 * @param {string} roleId
 * @returns {string} roleId
 */
export const focusRole = (roleId) => {
  return (dispatch, getState) => {
    invariant(symbolMap[roleId], 'must pass a valid Role ID');

    dispatch({
      type: ActionTypes.FOCUS_ROLE,
      roleId,
    });
    return roleId;
  };
};

/**
 * Specify which list option is selected for a list Block
 * @function
 * @param {UUID} blockId List block ID
 * @param {UUID} optionId
 * @returns {Object} Map of selected options
 */
export const focusBlockOption = (blockId, optionId) => {
  return (dispatch, getState) => {
    invariant(idValidator(blockId) && idValidator(optionId), 'must pass valid block ID and optionId');

    const oldOptions = getState().focus.options;
    const options = Object.assign({}, oldOptions, { [blockId]: optionId });

    dispatch({
      type: ActionTypes.FOCUS_BLOCK_OPTION,
      options,
    });
    return options;
  };
};
