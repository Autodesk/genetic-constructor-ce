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
 * @module Selectors_Blocks
 * @memberOf module:Selectors
 */
import invariant from 'invariant';
import BlockSchema from '../schemas/Block';
import { values, flatten, get as pathGet, pickBy } from 'lodash';
import saveCombinations from '../utils/generators/orderConstructs';

const assertBlockExists = (block, blockId) => invariant(block && typeof block.metadata === 'object', 'no block exists for block ID ' + blockId);

/***************************************
 * Parent accessing / store knowledge-requiring
 ***************************************/

const _getBlockFromStore = (blockId, store) => {
  const block = store.blocks[blockId] || null;
  assertBlockExists(block, blockId);
  return block;
};

const _getParentFromStore = (blockId, store, def = null) => {
  const id = Object.keys(store.blocks).find(id => {
    const block = _getBlockFromStore(id, store);
    return block.components.indexOf(blockId) > -1;
  });
  return !!id ? store.blocks[id] : def;
};

//todo - move to object
const _getComponentsShallow = (blockId, store) => {
  const block = _getBlockFromStore(blockId, store);
  return block.components.map(id => _getBlockFromStore(id, store));
};

//todo - move to object
const _getAllComponents = (rootId, store, children = []) => {
  const kids = _getComponentsShallow(rootId, store);
  if (kids.length) {
    children.push(...kids);
    kids.forEach(kid => _getAllComponents(kid.id, store, children));
  }
  return children;
};

//return map, of children IDs to depth
const _getAllComponentsByDepth = (rootId, store, children = {}, depth = 1) => {
  const kids = _getComponentsShallow(rootId, store);
  if (kids.length) {
    kids.forEach(kid => {
      children[kid.id] = depth;
      _getAllComponentsByDepth(kid.id, store, children, depth + 1);
    });
  }
  return children;
};

//returns map
const _getOptionsShallow = (blockId, store) => { //eslint-disable-line no-unused-vars
  const block = _getBlockFromStore(blockId, store);
  return Object.keys(block.options)
    .map(id => _getBlockFromStore(id, store))
    .reduce((acc, block) => Object.assign(acc, { [block.id ]: block }), {});
};

//returns map
const _getAllOptions = (rootId, store, includeUnselected) => {
  const options = _getOptionsShallow(rootId, store);
  const components = _getAllComponents(rootId, store);
  //note - only shallow. does not handle constructs in options
  //for each component (in flat list), create map of options, and assign to accumulator, return accumulator
  return components.reduce((acc, block) => {
    return Object.assign(acc,
      block.getOptions(includeUnselected)
        .map(optionId => _getBlockFromStore(optionId, store))
        .reduce((acc, option) => Object.assign(acc, { [option.id]: option }), {}));
  }, options);
};

const _getAllContents = (rootId, state) => {
  const options = _getAllOptions(rootId, state);
  const components = _getAllComponents(rootId, state).reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
  return Object.assign(options, components);
};

const _filterToLeafNodes = (blocks) => blocks.filter(child => !child.components.length);

const _getParents = (blockId, state) => {
  const parents = [];
  let parent = _getParentFromStore(blockId, state);
  while (parent) {
    parents.push(parent);
    parent = _getParentFromStore(parent.id, state);
  }
  return parents;
};

const _getSiblings = (blockId, state) => {
  const parent = _getParentFromStore(blockId, state, {});
  return (parent.components || []).map(id => _getBlockFromStore(id, state));
};

//ommitting constructId will just return first found list owner
const _getListOwnerFromStore = (optionId, constructId, store) => {
  const contents = !!constructId ? _getAllContents(constructId, store) : store.blocks;
  return Object.keys(contents)
    .map(blockId => contents[blockId])
    .find(block => block.options.hasOwnProperty(optionId));
};

//returns map of { optionId : option }
const _getOptions = (blockId, state, includeUnselected = false) => {
  const block = _getBlockFromStore(blockId, state);
  invariant(block.isList(), 'must pass a list block to get its options');

  return block.getOptions(includeUnselected)
    .reduce((acc, optionId) => Object.assign(acc, {
      [optionId]: _getBlockFromStore(optionId, state),
    }), {});
};

// flattens component hierarchy
// returns flat array of blocks, not touching list blocks
const _flattenConstruct = (blockId, state) => {
  const block = _getBlockFromStore(blockId, state);
  if (!block.isConstruct()) {
    return [block];
  }

  const components = block.components
    .map(compId => _getBlockFromStore(compId, state));

  return flatten(components.map(component => component.isConstruct() ?
    _flattenConstruct(component.id, state) :
    [component]
  ));
};

//e.g. _getWithFieldValue('metadata.name', 'my block', state)
const _getWithFieldValue = (path, value, store) => {
  return pickBy(store.blocks, (block) => pathGet(block, path) === value);
};

/**
 * Retrieves a block by ID
 * @function
 * @param {UUID} blockId
 * @throws if block doesn't exist
 * @returns {Block} Block
 */
export const blockGet = (blockId) => {
  return (dispatch, getState) => {
    return _getBlockFromStore(blockId, getState());
  };
};

/**
 * Retrieves a block by ID
 * @function
 * @param {string} name
 * @returns {Array<Block>} Blocks with matching name (exact), or empty array
 */
export const blockGetBlocksWithName = (name) => {
  return (dispatch, getState) => {
    return _getWithFieldValue('metadata.name', name, getState());
  };
};

/**
 * Check if block is a top-level construct (direct descendant of project)
 * @function
 * @param {UUID} blockId
 * @throws if blockId does not exist
 * @returns {boolean} true if direct descendant
 */
export const blockIsTopLevelConstruct = (blockId) => {
  return (dispatch, getState) => {
    const state = getState();
    const block = _getBlockFromStore(blockId, state);
    const { projectId } = block;

    //not in a project
    if (!projectId) {
      return false;
    }

    //cant rely on project selectors (circular dep)
    const project = state.projects[projectId];

    return !!project && project.components.indexOf(blockId) >= 0;
  };
};

/**
 * Get a block's parent
 * @function
 * @param {UUID} blockId
 * @returns {Block} parent Block, or null
 */
export const blockGetParent = (blockId) => {
  return (dispatch, getState) => {
    return _getParentFromStore(blockId, getState());
  };
};

/**
 * Get all of a block's parents.
 * @function
 * @param {UUID} blockId
 * @throws if blockId does not exist
 * @returns {Array<Block>} Parents, first parent is direct parent, last parent is top-level construct
 */
export const blockGetParents = (blockId) => {
  return (dispatch, getState) => {
    return _getParents(blockId, getState());
  };
};

/**
 * Get Block's top-level construct
 * @function
 * @param {UUID} blockId
 * @returns {Block} Top-level construct, or null if it is detached.
 */
export const blockGetParentRoot = (blockId) => {
  return (dispatch, getState) => {
    const parents = _getParents(blockId, getState());
    return parents.length ? parents.pop() : null;
  };
};

/**
 * Get all components, recursively, of a Block. Does not include options.
 * todo - move to object, not array
 * @function
 * @param {UUID} blockId
 * @returns {Array<Block>} All components.
 */
export const blockGetComponentsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllComponents(blockId, getState());
  };
};

/**
 * Get all components, recursively, of a Block, and returns their depth, relative to the block.
 * @function
 * @param {UUID} blockId
 * @returns {Object.<UUID,number>} All components mapped to depth, { BlockId: depth }
 */
export const blockGetComponentsByDepth = (blockId) => {
  return (dispatch, getState) => {
    return _getAllComponentsByDepth(blockId, getState());
  };
};

/**
 * Get all options, recursively, of a Block
 * @function
 * @param {UUID} blockId
 * @returns {Object.<UUID,Block>} All options by id
 */
export const blockGetOptionsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllOptions(blockId, getState());
  };
};

/**
 * Get all contents (components & options), recursively, of a Block
 * @function
 * @param {UUID} blockId
 * @returns {Object.<UUID,Block>} All contents by id
 */
export const blockGetContentsRecursive = (blockId) => {
  return (dispatch, getState) => {
    return _getAllContents(blockId, getState());
  };
};

/**
 * Get all blocks which are not constructs (i.e., have no components). They are leaves of the tree.
 * //todo - move to object
 * //todo - include list blocks
 * @function
 * @param {UUID} blockId
 * @returns {Object.<UUID,Block>} All components mapped to depth, { BlockId: depth }
 */
export const blockGetLeaves = (blockId) => {
  return (dispatch, getState) => {
    return _filterToLeafNodes(_getAllComponents(blockId, getState()));
  };
};

/**
 * Get all siblings of a Block, including the block itself. I.e. get components of parent
 * @function
 * @param {UUID} blockId
 * @returns {Array<Block>} sibling Blocks, including block itself
 */
export const blockGetSiblings = (blockId) => {
  return (dispatch, getState) => {
    const state = getState();
    return _getSiblings(blockId, state);
  };
};

//this could be optimized...
const _nearestParent = (state, ...blockIds) => {
  if (blockIds.length === 1) {
    return _getBlockFromStore(blockIds[0], state);
  }

  //map block IDs to arrays of parents
  const parentsMap = blockIds.reduce((acc, blockId) => Object.assign(acc, { [blockId]: _getParents(blockId, state) }), {});

  //if any block is detached (doesn't have a parent) and not the current construct ID, return null
  //todo - check if any construct, not the currently focused one
  if (Object.keys(parentsMap).some(blockId => {
    const parents = parentsMap[blockId];
    return parents.length === 0 && state.focus.constructId !== blockId;
  })) {
    return null;
  }

  //figure out the nearest common parent by iterating through all the parent lists
  let lastParents = parentsMap[blockIds[0]];
  for (let index = 1; index < blockIds.length; index++) {
    const nextParents = parentsMap[blockIds[index]];
    const nearestLastParent = lastParents.find(parent => nextParents.some(nextParent => nextParent.id === parent.id));
    const nextOverlapStartIndex = nextParents.findIndex(parent => parent.id === nearestLastParent.id);
    const nextOverlap = nextParents.slice(nextOverlapStartIndex);
    lastParents = nextOverlap;
  }
  return lastParents[0];
};

//this could be optimized...
const _getBoundingBlocks = (state, ...blockIds) => {
  const nearestParent = _nearestParent(state, ...blockIds);

  if (blockIds.length === 1 || nearestParent.components.length < 1) {
    return [nearestParent, nearestParent];
  }

  const components = nearestParent.components.map(blockId => _getBlockFromStore(blockId, state));

  const findComponentWithBlock = (component) => {
    if (blockIds.indexOf(component.id) >= 0) {
      return true;
    }
    const kids = _getAllComponents(component.id, state);
    return kids.some(kid => blockIds.indexOf(kid.id) >= 0);
  };
  const left = components.find(findComponentWithBlock);
  const right = components.reverse().find(findComponentWithBlock);

  return [left, right];
};

/**
 * Get bounds of the current selection, using the lowest common parent,
 * @function
 * @param {...UUID} blockIds
 * @returns {Array<Block>} [ start, end ] bounds, where start === end === parent if only one block selected
 */
export const blockGetBounds = (...blockIds) => {
  return (dispatch, getState) => {
    return _getBoundingBlocks(getState(), ...blockIds);
  };
};

/**
 * Get range of selection
 * @function
 * @param {UUID} blockId
 * @returns {Array<Block>} Components of lowest common parent, trimmed to bounding components
 */
export const blockGetRange = (...blockIds) => {
  return (dispatch, getState) => {
    const state = getState();
    const bounds = _getBoundingBlocks(state, ...blockIds);
    if (!bounds) {
      return null;
    }
    const siblings = _getSiblings(bounds[0].id, state);
    const [boundStart, boundEnd] = bounds.map(boundBlock => siblings.findIndex(sibling => sibling.id === boundBlock.id));
    return siblings.slice(boundStart, boundEnd + 1);
  };
};

/**
 * Get component index
 * @function
 * @param {UUID} blockId
 * @returns {number} index of component, -1 if no parent
 */
export const blockGetIndex = (blockId) => {
  return (dispatch, getState) => {
    const parent = _getParentFromStore(blockId, getState(), {});
    return Array.isArray(parent.components) ? parent.components.indexOf(blockId) : -1;
  };
};

const _checkSingleBlockIsSpec = (block) => {
  invariant(!block.isList() && !block.isConstruct(), 'list blocks + constructs are not specs');
  return block.sequence.length > 0;
};

/**
 * Check if a block is a spec. That is, all of its components and options have a sequence
 * @function
 * @param {UUID} blockId
 * @returns {number} index of component, -1 if no parent
 */
export const blockIsSpec = (blockId) => {
  return (dispatch, getState) => {
    const store = getState();
    const flattened = _flattenConstruct(blockId, store);

    return flattened.every(block => {
      if (block.isList()) {
        //only want selected options
        const options = values(_getOptions(block.id, store, false));
        return options.length > 0 && options.every(selectedBlock => _checkSingleBlockIsSpec(selectedBlock));
      }
      return _checkSingleBlockIsSpec(block);
    });
  };
};

/**
 * Validate a block mocel
 * @function
 * @param {object} model
 * @returns {boolean} whether model is valid
 */
export const blockIsValid = (model) => {
  return (dispatch, getState) => {
    return BlockSchema.validate(model);
  };
};

/**
 * Check if a block has sequence
 * @function
 * @param {UUID} blockId
 * @throws if blockId not in store
 * @returns {boolean} true if has sequence
*/
export const blockHasSequence = blockId => {
  return (dispatch, getState) => {
    const block = _getBlockFromStore(blockId, getState());
    return block.hasSequence();
  };
};

/**
 * Given id of a list block option, get list block containing it
 * @function
 * @param {UUID} optionId
 * @param {UUID} constructId required as list options may exist in multiple places within a project - should be lowest known parent
 * @returns {number} index of component, -1 if no parent
 */
export const blockGetListOwner = (optionId, constructId) => {
  return (dispatch, getState) => {
    return _getListOwnerFromStore(optionId, constructId, getState());
  };
};

/**
 * Check if a block is a list option of a given construct
 * @function
 * @param {UUID} optionId
 * @param {UUID} constructId required as list options may exist in multiple places within a project - should be lowest known parent
 * @param {boolean} [returnParentId=false] if true, returns ID instead of true
 * @returns {boolean} true if has a list owner
 */
export const blockIsListOption = (optionId, constructId, returnParentId = false) => {
  return (dispatch, getState) => {
    const state = getState();
    const block = _getBlockFromStore(optionId, state);

    //basic checks
    if (block.isConstruct() || block.isList()) {
      return false;
    }

    const listOwner = _getListOwnerFromStore(optionId, constructId, state);

    if (!listOwner) {
      return false;
    }

    return !!returnParentId ? listOwner.id : true;
  };
};

/**
 * Get 2D array, maintaing component indices, where each index is an array of blocks (1 if part, N if list block)
 * @function
 * @param {UUID} blockId
 * @param {boolean} [onlyIds=true] return Block ids. False to get blocks.
 * @param {UUID} [includeUnselected=false] include inactive list options
 * @returns {Array<Array<Block>>} Flat list of blocks which either 1) have sequence 2) are list blocks or 3) are sketches. includes hidden blocks.
 * @example
 returns 2D array - based on position - of block combinations (including hidden blocks), e.g.

 given:
 A: { sequence }                                        //single part
 B: { options: {2: true, 3: true, 4: true, 5: false } } //list block with 3 selected options
 C: { options: { 6: true } }                            //list block, one option

 generates
 [
   [A],
   [block2, block3, block4],
   [block6],
 ]
 */
export const blockGetPositionalCombinations = (blockId, onlyIds = true, includeUnselected = false) => {
  return (dispatch, getState) => {
    invariant(dispatch(blockIsSpec(blockId)), 'block must be a spec to get combinations');

    const state = getState();

    //generate 2D array, outer array for positions, inner array with lists of parts
    const combinations = _flattenConstruct(blockId, state)
      .map(block => block.isList() ?
        values(_getOptions(block.id, state, includeUnselected)) :
        [block]
      );

    return (onlyIds === true) ?
      combinations.map(combo => combo.map(part => part.id)) :
      combinations;
  };
};

/**
 * Get number of possible combinations of a given construct
 * @function
 * @param {UUID} blockId
 * @param {boolean} [includeUnselected=false] Unselected list options
 * @returns {number} number combinations
 */
export const blockGetNumberCombinations = (blockId, includeUnselected = false) => {
  return (dispatch, getState) => {
    const positions = dispatch(blockGetPositionalCombinations(blockId, includeUnselected));
    return positions.reduce((acc, position) => acc * position.length, 1);
  };
};

/**
 * Get all combinations of blocks, returning an array of combinations
 * @function
 * @param {UUID} blockId
 * @param {boolean} onlyIds
 * @param {boolean} includeUnselected
 * @returns {Array<Array<Block>>} Array of combinations, where each combination is an array of blocks, or blockIds if onlyIds = true
 * @example
 returns 2D array of all possible constructs, flattened, and with options unfurled, including hidden blocks

 given:
 A: { sequence }                                        //single part
 B: { options: {2: true, 3: true, 4: true, 5: false } } //list block with 3 selected options
 C: { options: { 6: true } }                            //list block, one option

 generates:
 [
   [A, block2, block6],
   [A, block3, block6],
   [A, block4, block6],
 ]
 */
export const blockGetCombinations = (blockId, onlyIds, includeUnselected) => {
  return (dispatch, getState) => {
    const positions = dispatch(blockGetPositionalCombinations(blockId, onlyIds, includeUnselected));

    /*
     //guarantee both accumulator (and positions) array have at least one item to map over
     const last = positions.pop();
     //iterate through positions, essentially generating tree with * N branches for N options at position
     const combos = positions.reduceRight((acc, position) => {
     // for each extant construct, create one variant which adds each part respectively
     // flatten them for return and repeat!
     return flatten(position.map(option => acc.map(partialConstruct => [option].concat(partialConstruct))));
     }, [last]);
     return combos;
     */

    return saveCombinations(positions);
  };
};

/**
 * Flatten a construct to its leaf nodes (non-construct blocks)
 * @function
 * @param {UUID} blockId
 * @returns {Array<Block>} Flat list of blocks which either 1) have sequence 2) are list blocks or 3) are sketches. includes hidden blocks.
 */
export const blockFlattenConstruct = (blockId) => {
  return (dispatch, getState) => {
    return _flattenConstruct(blockId, getState());
  };
};

/**
 * Flatten a construct and list blocks -> array of parts, no list blocks.
 * @function
 * @param {UUID} blockId
 * @returns {Array<Block>} Array of blocks
 */
export const blockFlattenConstructAndLists = (blockId) => {
  return (dispatch, getState) => {
    const state = getState();
    const optionPreferences = state.focus.options;
    const flattened = _flattenConstruct(blockId, state);
    return flattened.map(block => {
      const options = block.getOptions();
      const preference = optionPreferences[block.id];
      return (block.isList() && options.length) ?
        //give the block a color if in a list - technically the block in the store but all immutable so whatever
        //clone it because technically frozen
        state.blocks[preference || options[0]]
          .clone(null)
          .merge({ metadata: { color: block.metadata.color } }) :
        block;
    });
  };
};
