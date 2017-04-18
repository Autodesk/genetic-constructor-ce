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
import Project from '../models/Project';
import Block from '../models/Block';
import Order from '../models/Order';

//NOTE - this cache is not reset when the user changes. That sucks up some memory. So, we reload the page. User should not be able to access though - this is used by middleware functoins etc., but everything in a newly signed-in user's information will have unique IDs and should not collide (until there is collaboration or something along those lines).

/*
 Tracks a map of blocks / projects which have been loaded. Only contains the latest version. Serves as a place to store blocks / projects which do not need to be in the store. Also used for checking (with reference equality) whether rollups have changed.

 Works in concert with the store. Autosave relies on the store, for tracking versions of each instance. Other middlewares rely on the store as well.

 However, as long as the undo stack is erased on location change, the store only needs to contain the blocks / project that is open and being edited.

 NOTE! Instances in these maps should be class instances. Middleware is not responsible for converting into class instances. Actions are in general responsible for this conversion. Since Actions call middleware, which in turn checks this cache, there is no change to the flow of generating class instances. However, reducers will update the instanceMaps with instances of models. So, we coerce all objects to plain objects when doing comparisons. But what's in the Map may be and object or a class instance.
 */

//tracks rolls, so keep blocks at their state when last saved
const rollMap = new Map();

//tracks whether project orders have been loaded
//since projects dont know about which orders they have, only set to true if load all the orders for a project
const projectOrders = new Map();

//map of blocks
const blockMap = new Map();

//map of projects
const projectMap = new Map();

//map of orders
//note - this will not track orders which are not submitted (i.e. temporary ones on the client) due to how this connects with the middleware
const orderMap = new Map();

/* helpers */

//compares two rollups for effective changes
//unforunately, the reducers run after the promise resolutions in these loading / saving functions, so project.version will increment immediately after the roll is set here, but that is ok - we handle that check below in isRollSame.
const isRollDifferent = (oldRollup, newRollup) => {
  //check for one not existing
  if (!oldRollup || !newRollup) return true;

  //check projects same
  if (!Project.compare(oldRollup.project, newRollup.project)) return true;

  if (Object.keys(oldRollup.blocks).length !== Object.keys(newRollup.blocks).length) return true;

  //check all blocks same
  return Object.keys(oldRollup.blocks).some(oldBlockId => {
    const oldBlock = oldRollup.blocks[oldBlockId];
    const analog = newRollup.blocks[oldBlockId];
    return !analog || analog !== oldBlock;
  });
};

/* get */

export const getProject = (projectId) => projectMap.get(projectId);

export const getBlock = (blockId) => blockMap.get(blockId);

export const getOrder = (orderId) => orderMap.get(orderId);

/* recursing */

//returns map of contents if all present, or null otherwise
const getBlockContents = (acc = {}, ...blockIds) => {
  if (acc === null) {
    return null;
  }
  blockIds.forEach(blockId => {
    const block = getBlock(blockId);
    Object.assign(acc, { [block.id]: block });

    if (!block) {
      return null;
    }

    //check components
    if (block.components.length) {
      return getBlockContents(acc, ...block.components);
    }

    //check options for hierarchical options
    const optionsArray = Object.keys(block.options);
    if (optionsArray.length) {
      return getBlockContents(acc, ...optionsArray);
    }
  });
  return acc;
};

const getProjectContents = (projectId) => {
  const project = getProject(projectId);
  return getBlockContents({}, ...project.components);
};

//recursively check blocks' presence + their components / options
export const blockLoaded = (...blockIds) => {
  return blockIds.every(blockId => {
    const block = getBlock(blockId);
    if (!block) {
      return false;
    }

    //check components
    if (block.components.length) {
      return blockLoaded(...block.components);
    }

    //check options
    const optionsArray = Object.keys(block.options);
    if (optionsArray.length) {
      return blockLoaded(...optionsArray);
    }

    //otherwise we're good at the leaf
    return true;
  });
};

//check if whole project is loaded
export const projectLoaded = (projectId) => {
  const project = getProject(projectId);
  if (!project) {
    return false;
  }

  const haveOrders = projectOrders.get(projectId);
  if (!haveOrders) {
    return false;
  }

  return blockLoaded(...project.components);
};

export const orderLoaded = (orderId) => {
  const order = getOrder(orderId);
  return !!order;
};

/* save */

export const saveProject = (...projects) => {
  projects.forEach(project => {
    invariant(project instanceof Project, 'should only save class instances');
    projectMap.set(project.id, project);
  });
};

export const saveBlock = (...blocks) => {
  blocks.forEach(block => {
    invariant(block instanceof Block, 'should only save class instances');
    blockMap.set(block.id, block);
  });
};

export const saveOrder = (...orders) => {
  orders.forEach(order => {
    invariant(order instanceof Order, 'should only save class instances');
    orderMap.set(order.id, order);
  });
};

/* remove */
//likely dont need to do this, unless truly temporary (e.g. search results)

export const removeProject = (...projectIds) => {
  projectIds.forEach(projectId => projectMap.delete(projectId));
};

export const removeBlock = (...blockIds) => {
  blockIds.forEach(blockId => blockMap.delete(blockId));
};

export const removeOrder = (...orderIds) => {
  orderIds.forEach(orderId => orderMap.delete(orderId));
};

/* rollups */

//saved rollups are different than generating the rollup - it has specific objects in it, computing on the fly would return the current versinos of each object and would appear the same even when the prior save used prior states
const getSavedRollup = (projectId) => rollMap.get(projectId);

//should only call after making sure the project has been loaded
export const getRollup = (projectId) => {
  const project = getProject(projectId);
  const blocks = getProjectContents(projectId);
  invariant(blocks, 'project was not fully loaded');

  return {
    project,
    blocks,
  };
};

export const saveRollup = (rollup) => {
  rollMap.set(rollup.project.id, rollup);
  saveProject(rollup.project);
  saveBlock(...Object.keys(rollup.blocks).map(blockId => rollup.blocks[blockId]));
};

export const isRollupNew = (rollup) => {
  return isRollDifferent(getSavedRollup(rollup.project.id), rollup);
};

/* orders */

export const projectOrdersLoaded = (projectId) => projectOrders.get(projectId);

export const saveProjectOrders = (projectId, ...orders) => {
  projectOrders.set(projectId, true);
  saveOrder(...orders);
};

export const getProjectOrders = (projectId) => {
  const relevant = [];
  for (const order of orderMap.values()) {
    if (order.projectId === projectId) {
      relevant.push(order);
    }
  }
  return relevant;
};
