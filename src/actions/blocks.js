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
 * @module Actions_Blocks
 * @memberOf module:Actions
 */
import invariant from 'invariant';
import { every, filter, uniq, values } from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';
import BlockSchema from '../schemas/Block';
import Block from '../models/Block';
import { loadBlock } from '../middleware/projects';
import * as selectors from '../selectors/blocks';
import * as projectSelectors from '../selectors/projects';
import * as undoActions from '../store/undo/actions';
import { pauseAction, resumeAction } from '../store/pausableStore';

//todo - helper to wrap dispatch()'s in a paused transaction - make sure dispatch still runs when passed as arg
//todo - helper _getBlock() which throws of block doesnt exist

//hack - so this is super weird - jsdoc will work when you have some statements here. This file needs 1!
const spaceFiller = 10; //eslint-disable-line no-unused-vars

/***************************************
 * Metadata things
 ***************************************/

//todo - should not allow if in a project
/**
 * Set the projectId of a block, and optionally all of its contents.
 * While the block is in the project, do not set the projectId to something other than the current project! Save errors etc. will happen.
 * @param {UUID} blockId
 * @param {UUID} projectId
 * @param [shallow=false]
 * @returns block with blockId
 */
export const blockSetProject = (blockId, projectId, shallow = false) => {
  return (dispatch, getState) => {
    const oldBlock = dispatch(selectors.blockGet(blockId));
    const contents = dispatch(selectors.blockGetContentsRecursive(blockId));

    const blocks = [oldBlock, ...values(contents)]
      .map(block => block.setProjectId(projectId));

    dispatch({
      type: ActionTypes.BLOCK_SET_PROJECT,
      blocks,
    });

    return blocks[0];
  };
};

/**
 * Rename a block
 * @function
 * @param {UUID} blockId
 * @param {string} name
 * @returns {Block} Updated Block
 */
export const blockRename = (blockId, name) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    if (oldBlock.metadata.name === name) {
      return oldBlock;
    }

    const block = oldBlock.setName(name);
    dispatch({
      type: ActionTypes.BLOCK_RENAME,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Set block's color
 * @function
 * @param {UUID} blockId
 * @param {string} color Hex color string
 * @returns {Block} Updated Block
 */
export const blockSetColor = (blockId, color) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    if (oldBlock.metadata.color === color) {
      return oldBlock;
    }

    const block = oldBlock.setColor(color);
    dispatch({
      type: ActionTypes.BLOCK_SET_COLOR,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Set block's role
 * @function
 * @param {UUID} blockId
 * @param {string} role Role as defined in {@link module:roles}
 * @returns {Block} Updated Block
 */
export const blockSetRole = (blockId, role) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const oldRole = oldBlock.rules.role;

    if (oldRole === role) {
      return oldBlock;
    }

    const block = oldBlock.setRole(role);
    dispatch({
      type: ActionTypes.BLOCK_SET_ROLE,
      undoable: true,
      oldRole,
      block,
    });
    return block;
  };
};

export const blockSetPalette = (blockId, palette) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    invariant(oldBlock.projectId, 'block must have a projectId (must be in a project)');

    const isToplevel = getState().projects[oldBlock.projectId].components.indexOf(blockId) >= 0;
    invariant(isToplevel, 'set palette of a toplevel block');

    const oldPalette = oldBlock.metadata.palette;

    if (oldPalette === palette) {
      return oldBlock;
    }

    const block = oldBlock.setPalette(palette);
    dispatch({
      type: ActionTypes.BLOCK_SET_PALETTE,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 * Store + Server Interaction
 ***************************************/

/**
 * Retrieves a block, and its options and components if specified
 * @function
 * @param {UUID} blockId
 * @param {UUID} inputProjectId
 * @param {boolean} [withContents=true]
 * @param {boolean} [skipIfContentsEmpty=false]
 * @returns {Promise} Array of Blocks retrieved
 */
export const blockLoad = (blockId, inputProjectId, withContents = true, skipIfContentsEmpty = false) => {
  return (dispatch, getState) => {
    const retrieved = getState().blocks[blockId];
    if (skipIfContentsEmpty === true && retrieved && !retrieved.hasContents()) {
      return Promise.resolve([retrieved]);
    }

    const projectId = inputProjectId || (retrieved ? retrieved.projectId : null);
    invariant(projectId, 'must pass a projectId to blockLoad if block not in store');

    return loadBlock(blockId, projectId, withContents)
      .then(({ components, options }) => {
        const blockMap = Object.assign({}, options, components);
        const blocks = Object.keys(blockMap).map(key => new Block(blockMap[key]));
        dispatch({
          type: ActionTypes.BLOCK_LOAD,
          blocks,
        });
        return blocks;
      });
  };
};

/**
 * Create a new Block
 * @function
 * @param {Object} initialModel
 * @returns {Block}
 */
export const blockCreate = (initialModel = {}) => {
  return (dispatch, getState) => {
    const block = new Block(initialModel);
    dispatch({
      type: ActionTypes.BLOCK_CREATE,
      block,
    });
    return block;
  };
};

/**
 * Add Block Models to the store directly
 * @function
 * @param {...Block|Object} inputBlocks
 * @returns {...Block}
 */
export const blockStash = (...inputBlocks) => {
  return (dispatch, getState) => {
    const blocks = inputBlocks.map(blockObj => new Block(blockObj));
    dispatch({
      type: ActionTypes.BLOCK_STASH,
      blocks,
    });
    return blocks;
  };
};

//this is a backup for performing arbitrary mutations. You probably shouldn't use this.
export const blockMerge = (blockId, toMerge) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.merge(toMerge);
    dispatch({
      type: ActionTypes.BLOCK_MERGE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Clone a block (and its contents - components + list options)
 * Sets projectId to null for all cloned elements. Project ID is set when added back to the project.
 * @function
 * @param blockInput {ID|Object} JSON of block directly, or ID. Accept both since inventory items may not be in the store, so we need to pass the block directly. Prefer to use ID.
 * @param parentObjectInput {Object} information about parent, defaults to generated:
 *  {id: from block input
 *   projectId - same as block being cloned, or block.projectId
  *  version - that of project ID if in the store, or first parent if available and same project id
  * }
 * @returns {Block} clone block (root node if has children)
 */
export const blockClone = (blockInput, parentObjectInput = {}) => {
  return (dispatch, getState) => {
    let oldBlock;
    if (typeof blockInput === 'string') {
      oldBlock = getState().blocks[blockInput];
    } else if (BlockSchema.validate(blockInput)) {
      oldBlock = new Block(blockInput);
    } else {
      throw new Error('invalid input to blockClone', blockInput);
    }

    //get the project ID to use for parent, considering the block may be detached from a project (e.g. inventory block)
    const parentProjectId = oldBlock.projectId || null;
    //will default to null if parentProjectId is undefined
    const parentProjectVersion = dispatch(projectSelectors.projectGetVersion(parentProjectId));

    //partial object about project, block ID handled in block.clone()
    const parentObject = Object.assign({
      projectId: parentProjectId,
      version: parentProjectVersion,
    }, parentObjectInput);

    //overwrite to set the correct projectId
    const overwriteObject = { projectId: null };

    //get all components + list options and clone them
    const contents = values(dispatch(selectors.blockGetContentsRecursive(oldBlock.id)));

    if (contents.length === 0) {
      const block = oldBlock.clone(parentObject, overwriteObject);
      dispatch({
        type: ActionTypes.BLOCK_CLONE,
        block,
      });
      return block;
    }

    const allToClone = [oldBlock, ...contents];
    //all blocks must be from same project, so we can give them the same parent projectId + verion
    const unmappedClones = allToClone.map(block => block.clone(parentObject, overwriteObject));

    //update IDs in components
    const cloneIdMap = allToClone.reduce((acc, next, index) => {
      acc[next.id] = unmappedClones[index].id;
      return acc;
    }, {});

    const clones = unmappedClones.map(clone => {
      if (clone.isConstruct()) {
        const newComponents = clone.components.map(componentId => cloneIdMap[componentId]);
        return clone.mutate('components', newComponents);
      }
      if (clone.isList()) {
        const newOptions = Object.keys(clone.options).reduce((acc, oldOption) => Object.assign(acc, {
          [cloneIdMap[oldOption]]: clone.options[oldOption],
        }), {});
        return clone.mutate('options', newOptions);
      }
      return clone;
    });

    dispatch({
      type: ActionTypes.BLOCK_CLONE,
      blocks: clones,
    });

    //return the clone of root passed in
    const rootId = cloneIdMap[oldBlock.id];
    const root = clones.find(clone => clone.id === rootId);
    return root;
  };
};

/**
 * Freeze a block, so that no further changes can be made to it without cloning it first
 * @function
 * @param {UUID} blockId
 * @param {boolean} [recursive=true] Apply to contents (components + options)
 * @returns {...Block} all blocks frozen
 */
export const blockFreeze = (blockId, recursive = true) => {
  return (dispatch, getState) => {
    const oldBlocks = [getState().blocks[blockId]];
    if (recursive === true) {
      oldBlocks.push(...values(dispatch(selectors.blockGetContentsRecursive(blockId))));
    }

    const blocks = oldBlocks.map(block => block.setFrozen(true));

    dispatch({
      type: ActionTypes.BLOCK_FREEZE,
      undoable: true,
      blocks,
    });

    return blocks;
  };
};

/**
 * Deletes blocks from the store by ID, and removes from constructs containing it
 * @function
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDelete = (...blockIds) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    blockIds.forEach(blockId => {
      //find parent, remove component from parent

      const parent = dispatch(selectors.blockGetParents(blockId)).shift();

      //may not have parent (is construct) or parent was deleted
      if (parent) {
        //todo - remove from options
        dispatch(blockRemoveComponent(parent, blockId)); //eslint-disable-line no-use-before-define
      }

      dispatch({
        type: ActionTypes.BLOCK_DELETE,
        undoable: true,
        blockId,
      });
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return blockIds;
  };
};

/**
 * Remove blocks from constructs / projects, but leave in the store, and removing block from constructs containing it
 * @function
 * @param {...UUID} blockIds
 * @returns {...UUID} IDs removed
 */
export const blockDetach = (...blockIds) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    blockIds.forEach(blockId => {
      //find parent, remove component from parent
      const parent = dispatch(selectors.blockGetParents(blockId)).shift();
      //may not have parent (is construct) or parent was deleted
      if (parent) {
        //todo - remove from options
        dispatch(blockRemoveComponent(parent.id, blockId)); //eslint-disable-line no-use-before-define
      }
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return blockIds;
  };
};

/***************************************
 * Components
 ***************************************/

/**
 * Remove components from a construct
 * @function
 * @param {UUID} constructId
 * @param {...UUID} componentIds
 * @returns {Block} Updated construct
 */
export const blockRemoveComponent = (constructId, ...componentIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[constructId];
    const block = componentIds.reduce((acc, currentId) => {
      return acc.removeComponent(currentId);
    }, oldBlock);

    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_REMOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Add component to a construct.
 * Removes from previous parent if currently part of a construct
 * Note you may use blockAddComponents to add more than one at a time.
 * @function
 * @param {UUID} blockId Construct
 * @param {UUID} componentId Component
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=false] set Project ID. Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponent = (blockId, componentId, index = -1, forceProjectId = true) => {
  return (dispatch, getState) => {
    const oldParent = dispatch(selectors.blockGetParents(componentId)).shift();
    const oldBlock = getState().blocks[blockId];
    const component = getState().blocks[componentId];

    invariant(!component.isTemplate(), 'cannot add a template as a component');

    const componentProjectId = component.projectId;
    const nextParentProjectId = oldBlock.projectId;

    const contents = dispatch(selectors.blockGetContentsRecursive(componentId));
    const contentProjectIds = uniq(values(contents).map(block => block.projectId));

    dispatch(pauseAction());
    dispatch(undoActions.transact());

    //verify projectId match, set if appropriate (forceProjectId is true, or not set in component being added)
    if (componentProjectId !== nextParentProjectId || contentProjectIds.some(compProjId => compProjId !== nextParentProjectId)) {
      invariant(forceProjectId === true && !componentProjectId && contentProjectIds.every(compProjId => !compProjId), 'cannot add component with different projectId! set forceProjectId = true to overwrite.');

      //there may be scenarios where we are adding to a detached block, so lets avoid the error when next parent has no project
      if (nextParentProjectId) {
        dispatch(blockSetProject(componentId, nextParentProjectId, false));
      }
    }

    //remove component from old parent (should clone first to avoid this, this is to handle just moving)
    if (oldParent) {
      dispatch(blockRemoveComponent(oldParent.id, componentId));
    }

    //might have been a top-level construct, just clear top-level fields in case
    if (component.isConstruct()) {
      dispatch(blockStash(component.clearToplevelFields()));
    }

    //now update the parent
    const block = oldBlock.addComponent(componentId, index);
    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_ADD,
      undoable: true,
      block,
    });

    dispatch(undoActions.commit());
    dispatch(resumeAction());

    return block;
  };
};

/**
 * Add multiple components to a construct at once, calling blockAddComponent
 * @function
 * @param {UUID} blockId Construct
 * @param {Array.<UUID>} componentIds Components
 * @param {number} index to insert component
 * @param {boolean} [forceProjectId=true] Set project ID. Use true if the block is not from this project
 * @returns {Block} Updated construct
 */
export const blockAddComponents = (blockId, componentIds, index, forceProjectId = true) => {
  return (dispatch, getState) => {
    dispatch(pauseAction());
    dispatch(undoActions.transact());

    try {
      componentIds.forEach((componentId, subIndex) => {
        dispatch(blockAddComponent(blockId, componentId, index + subIndex, forceProjectId));
      });
      dispatch(undoActions.commit());
    } catch (err) {
      dispatch(undoActions.abort());
      console.error(err); //eslint-disable-line no-console
    }

    dispatch(resumeAction());

    return componentIds;
  };
};

/**
 * Move component within a construct
 * @function
 * @param {UUID} blockId
 * @param {UUID} componentId
 * @param {number} newIndex
 * @returns {Block} Updated construct
 */
export const blockMoveComponent = (blockId, componentId, newIndex) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.moveComponent(componentId, newIndex);
    dispatch({
      type: ActionTypes.BLOCK_COMPONENT_MOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 Options
 ***************************************/

//todo - doc
export const blockMarkTemplate = (blockId, isTemplate = true) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    invariant(dispatch(selectors.blockIsTopLevelConstruct(blockId)), 'construct must be direct child of project');

    const block = oldBlock.setTemplate(isTemplate);
    dispatch({
      type: ActionTypes.BLOCK_SET_TEMPLATE,
      undoable: true,
      isTemplate,
      block,
    });
    return block;
  };
};

//todo - doc
export const blockSetHidden = (blockId, isHidden = true) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    const block = oldBlock.setHidden(isHidden);
    dispatch({
      type: ActionTypes.BLOCK_SET_HIDDEN,
      undoable: true,
      isHidden,
      block,
    });
    return block;
  };
};

//todo - doc
export const blockSetAuthoring = (blockId, isAuthoring = true) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    invariant(oldBlock.isTemplate(), 'can only start authoring a template');
    invariant(dispatch(selectors.blockIsTopLevelConstruct(blockId)), 'construct must be direct child of project');

    const block = oldBlock.setAuthoring(isAuthoring);
    dispatch({
      type: ActionTypes.BLOCK_SET_AUTHORING,
      undoable: true,
      isAuthoring,
      block,
    });
    return block;
  };
};

//todo - doc
export const blockSetListBlock = (blockId, isList = true) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.setListBlock(isList);
    dispatch({
      type: ActionTypes.BLOCK_SET_LIST,
      undoable: true,
      isList,
      block,
    });
    return block;
  };
};

//todo - doc
//for authoring template
export const blockOptionsAdd = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const state = getState();
    const oldBlock = state.blocks[blockId];
    const block = oldBlock.addOptions(...optionIds);
    const options = optionIds.map(optionId => state.blocks[optionId]);
    const targetProjectId = block.projectId;

    //if target block is in a project, make sure that options being added are valid
    if (targetProjectId) {
      //first, check the options themselves
      invariant(every(options, block => !block.projectId || block.projectId === targetProjectId), 'must pass options which have no projectId, or match match that of block with blockId');

      const relevantOptions = filter(options, option => option.projectId !== targetProjectId);
      const optionsWithId = relevantOptions.map(rel => rel.setProjectId(targetProjectId));

      //now, check the contents as well

      const contents = optionIds
        .map(optionId => dispatch(selectors.blockGetContentsRecursive(optionId)))
        .reduce((one, two) => Object.assign(one, two), {});
      const numberContents = Object.keys(contents).length;

      if (numberContents > 1) {
        invariant(every(contents, block => !block.projectId || block.projectId === targetProjectId), 'contents of all options must have no projectId, or match match that of block with blockId');

        //assign blocks without projectId
        const relevantContents = filter(contents, content => content.projectId !== targetProjectId);
        const blocksWithId = relevantContents.map(rel => rel.setProjectId(targetProjectId));

        optionsWithId.push(...blocksWithId);
      }

      dispatch({
        type: ActionTypes.BLOCK_SET_PROJECT,
        blocks: optionsWithId,
      });
    }

    dispatch({
      type: ActionTypes.BLOCK_OPTION_ADD,
      undoable: true,
      block,
    });
    return block;
  };
};

//todo - doc
//for authoring template
export const blockOptionsRemove = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.removeOptions(...optionIds);

    dispatch({
      type: ActionTypes.BLOCK_OPTION_REMOVE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Toggle whether a list option is active
 * @function
 * @param blockId
 * @param optionIds
 * @returns {function(*, *)}
 */
export const blockOptionsToggle = (blockId, ...optionIds) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.toggleOptions(...optionIds);

    dispatch({
      type: ActionTypes.BLOCK_OPTION_TOGGLE,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 * annotations
 ***************************************/

/**
 * Add an annotation to a block
 * @function
 * @param {UUID} blockId
 * @param {Annotation} annotation
 * @returns {Block} Updated Block
 */
export const blockAnnotate = (blockId, annotation) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.annotate(annotation);
    dispatch({
      type: ActionTypes.BLOCK_ANNOTATE,
      undoable: true,
      block,
    });
    return block;
  };
};

/**
 * Remove an annotation
 * @function
 * @param {UUID} blockId
 * @param {Annotation|string} annotation Annotation or its name
 * @returns {Block} Updated Block
 */
export const blockRemoveAnnotation = (blockId, annotation) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];
    const block = oldBlock.removeAnnotation(annotation);
    dispatch({
      type: ActionTypes.BLOCK_REMOVE_ANNOTATION,
      undoable: true,
      block,
    });
    return block;
  };
};

/***************************************
 * Sequence
 ***************************************/

/**
 * Download a Block's sequence
 * @function
 * @param {UUID} blockId Block ID with sequence to retrieve
 * @returns {Promise} Resolves to plain string of sequence
 */
export const blockGetSequence = (blockId) => {
  return (dispatch, getState) => {
    const block = getState().blocks[blockId];
    return block.getSequence();
  };
};

/**
 * Set a block's sequence, updating its source and sequence metadata
 * @function
 * @param {UUID} blockId
 * @param {string} sequence Sequence string
 * @param {boolean} [useStrict] Use strict sequence validation (canonical IUPAC bases)
 * @returns {Promise} resolves to Block when the sequence has been written
 */
export const blockSetSequence = (blockId, sequence, useStrict) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    return oldBlock.setSequence(sequence, useStrict)
      .then(block => {
        dispatch({
          type: ActionTypes.BLOCK_SET_SEQUENCE,
          undoable: true,
          block,
        });
        return block;
      });
  };
};

/**
 * Set trim of a block's sequence, i.e. how many bases at start and end to skip when viewing
 * @function
 * @param {UUID} blockId
 * @param {number} start bases from start to skip
 * @param {number} end bases from end to ignore
 * @returns {Block}
 */
export const blockTrimSequence = (blockId, start = 0, end = 0) => {
  return (dispatch, getState) => {
    const oldBlock = getState().blocks[blockId];

    return oldBlock.setSequenceTrim(start, end)
      .then(block => {
        dispatch({
          type: ActionTypes.BLOCK_SET_TRIM,
          undoable: true,
          block,
        });
        return block;
      });
  };
};
