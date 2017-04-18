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
 * @module Selectors_Focus
 * @memberOf module:Selectors
 */

import * as BlockSelector from './blocks';

const _getCurrentProjectId = () => {
  const match = /^\/project\/(.*?)\??$/gi.exec(window.location.pathname);
  return match ? match[1] : null;
};

//todo - this should not be exposed as part of 3rd party API... exported so inspector can share
export const _getFocused = (state, defaultToConstruct = true, defaultProjectId = null) => {
  const { level, forceProject, forceBlocks, constructId, blockIds, roleId, options } = state.focus;
  const projectId = _getCurrentProjectId();

  if (level === 'role') {
    return {
      type: 'role',
      readOnly: true,
      focused: roleId,
    };
  }

  //focus doesnt update on undo, just the blocks... so need to filter / make sure defined
  const project = forceProject || state.projects[defaultProjectId || projectId];
  const construct = state.blocks[constructId];
  const blocks = !!forceBlocks.length ?
    forceBlocks :
    blockIds.map(blockId => state.blocks[blockId]).filter(block => !!block);
  const option = blockIds.length === 1 ? state.blocks[options[blockIds[0]]] : null;

  let focused;
  let readOnly = false;
  let type = level;

  if (level === 'project' || (!construct && !blocks.length)) {
    focused = project;
    readOnly = !!forceProject || !!project.rules.frozen;
    type = 'project'; //override in case here because construct / blocks unspecified
  } else if (level === 'construct' && construct || (defaultToConstruct === true && construct && !blocks.length)) {
    focused = [construct];
    readOnly = construct.isFrozen();
  } else if (level === 'option' && option) {
    focused = [option];
    readOnly = true;
  } else {
    focused = blocks;
    readOnly = !!forceBlocks.length || focused.some(instance => instance.isFrozen());
  }

  return {
    type,
    readOnly,
    focused,
  };
};

/**
 * Get pieces of app in focus. May be project, top-level construct, block, option, or role
 * @function
 * @param {boolean} [defaultToConstruct=true]
 * @param {*} [defaultProjectId=null] Default if current project is not defined
 * @returns {Object} returns {type: string, readOnly: boolean, focused: *}
 * Where type is project, construct, block, option, or role
 * readOnly is if forced, or block is frozen
 * focused may be a project, block
 */
export const focusGetFocused = (defaultToConstruct = true, defaultProjectId = null) => {
  return (dispatch, getState) => {
    const state = getState();
    return _getFocused(state, defaultToConstruct, defaultProjectId);
  };
};

/**
 * Get currently selected project
 * @function
 * @returns {Project} null if no project id is active
 */
export const focusGetProject = () => {
  return (dispatch, getState) => {
    const { forceProject } = getState().focus;
    if (forceProject) {
      return forceProject;
    }
    const projectId = _getCurrentProjectId();
    return !!projectId ? getState().projects[projectId] : null;
  };
};

/**
 * Currently selected top-level construct
 * @function
 * @returns {Block}
 */
export const focusGetConstruct = () => {
  return (dispatch, getState) => {
    const state = getState();
    return state.blocks[state.focus.constructId];
  };
};

/**
 * Get currently selected blocks
 * @function
 * @param {boolean} [defaultToConstruct=true]
 * @returns {Array<Block>}
 */
export const focusGetBlocks = (defaultToConstruct = true) => {
  return (dispatch, getState) => {
    const state = getState();
    const { forceBlocks, blockIds, constructId } = state.focus;
    if (forceBlocks.length) {
      return forceBlocks;
    }
    if (!blockIds.length && defaultToConstruct === true) {
      return [state.blocks[constructId]];
    }
    return blockIds.map(blockId => state.blocks[blockId]);
  };
};

/**
 * Get range of currently selected blocks
 * @function
 * @returns {Array<Block>} Array of currently selected blocks, construct if no blocks selected, or empty if neither selected
 */
export const focusGetBlockRange = () => {
  return (dispatch, getState) => {
    const focusedBlocks = dispatch(focusGetBlocks(false));
    const focusedConstruct = dispatch(focusGetConstruct());

    if (!focusedBlocks.length) {
      if (focusedConstruct) {
        return [focusedConstruct];
      }
      return [];
    }

    //dispatch just in case other construct is in focus for some reason... also assumes that all focused blocks are within the same construct
    const focusedIds = focusedBlocks.map(block => block.id);
    return dispatch(BlockSelector.blockGetRange(...focusedIds));
  };
};

/**
 * Check if the detail view is relevant, i.e. there are blocks / construct selected
 * @function
 * @returns {boolean} true if relevant
 */
export const focusDetailsExist = () => {
  return (dispatch, getState) => {
    const state = getState();
    const { forceBlocks, blockIds, constructId } = state.focus;
    const construct = state.blocks[constructId];
    return !!forceBlocks.length || !!blockIds.length || (construct && !!construct.components.length);
  };
};
