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
 * @module Selectors_Projects
 * @memberOf module:Selectors
 */
import invariant from 'invariant';
import * as blockSelectors from './blocks';
import * as projectFilesApi from '../middleware/projectFiles';
import Rollup from '../models/Rollup';

const _getCurrentProjectId = () => {
  const match = /^\/project\/(.*?)\??$/gi.exec(window.location.pathname);
  return match ? match[1] : null;
};

const _getProjectFromStore = (projectId, store) => {
  if (!projectId) {
    return null;
  }
  return store.projects[projectId];
};

/**
 * Get a project by ID
 * @function
 * @param {UUID} projectId
 * @returns {Project}
 */
export const projectGet = (projectId) => {
  return (dispatch, getState) => {
    return _getProjectFromStore(projectId, getState());
  };
};

/**
 * Get current project ID, from the URL
 * @function
 * @param {UUID} projectId
 * @returns {UUID} current project ID
 */
export const projectGetCurrentId = () => {
  return (dispatch, getState) => {
    return _getCurrentProjectId();
  };
};

/**
 * Get current project version
 * @function
 * @param {UUID} projectId
 * @returns {number} latest project version
 */
export const projectGetVersion = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    return !!project ? project.version : null;
  };
};

/**
 * Get all components of a project (does not include list block options, just list blocks). See projectListAllBlocks()
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {UUID} current project ID
 */
export const projectListAllComponents = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());

    return project.components.reduce((acc, componentId) => {
      acc.push(dispatch(blockSelectors.blockGet(componentId)));
      const constructChildren = dispatch(blockSelectors.blockGetComponentsRecursive(componentId));
      acc.push(...constructChildren);
      return acc;
    }, []);
  };
};

/**
 * Get all list options of a project.
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {Array<Block>}
 */
export const projectListAllOptions = (projectId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    const optionIds = components.reduce((acc, comp) => acc.concat(Object.keys(comp.options)), []);
    return optionIds.map(id => dispatch(blockSelectors.blockGet(id)));
  };
};

/**
 * Get all contents of a project.
 * todo - move to object
 * @function
 * @param {UUID} projectId
 * @returns {Array<Block>}
 */
export const projectListAllBlocks = (projectId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    const options = dispatch(projectListAllOptions(projectId));
    return components.concat(options);
  };
};

/**
 * Check if a project contains a block
 * @function
 * @param {UUID} projectId
 * @param {UUID} blockId
 * @returns {boolean}
 */
export const projectHasComponent = (projectId, blockId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    return components.map(comp => comp.id).indexOf(blockId) >= 0;
  };
};

/**
 * Check if a project contains a list option
 * @function
 * @param {UUID} projectId
 * @param {UUID} blockId
 * @returns {boolean}
 */
export const projectHasOption = (projectId, blockId) => {
  return (dispatch, getState) => {
    const options = dispatch(projectListAllOptions(projectId));
    return options.map(option => option.id).indexOf(blockId) >= 0;
  };
};

/**
 * Find a list block option with a given source key and source ID.
 * check if a block with { source: { source: sourceKey, id: sourceId } } is present in the project (e.g. so dont clone it in more than once)
 * Only checks options, since if its a component we should clone it
 * @function
 * @param {UUID} projectId
 * @param {string} sourceKey
 * @param {string} sourceId
 * @returns {Block} Block if it exists, or null
 */
export const projectGetOptionWithSource = (projectId, sourceKey, sourceId) => {
  return (dispatch, getState) => {
    invariant(sourceKey && sourceId, 'source key and ID are required');
    const options = dispatch(projectListAllOptions(projectId));
    return options.find(option => option.source.source === sourceKey && option.source.id === sourceId) || null;
  };
};

/**
 * Create project rollup
 * @function
 * @param {UUID} projectId
 * @param {UUID} blockId
 * @returns {Object} { project: Project, blocks: Object.<blockId:Block> }
 */
export const projectCreateRollup = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    if (!project) {
      return null;
    }

    const blocks = dispatch(projectListAllBlocks(projectId))
      .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

    return new Rollup({
      project,
      blocks,
    });
  };
};

// PROJECT FILES

/**
 * Read a project file
 * @function
 * @param {UUID} projectId
 * @param {String} namespace Namespace
 * @param {String} fileName Name of File
 * @param {String} [format='text']
 * @param {String} [version] Default is return latest, or specify a specific version
 */
export const projectFileRead = (projectId, namespace, fileName, format, version) => {
  return (dispatch, getState) => {
    const oldProject = getState().projects[projectId];

    return oldProject.fileRead(namespace, fileName, format, version);
  };
};

/**
 * List files associated with a specific namespace
 * @function
 * @param {UUID} projectId
 * @param {String} namespace
 */
export const projectFileList = (projectId, namespace) => {
  return (dispatch, getState) => {
    return projectFilesApi.projectFileList(projectId, namespace);
  };
};
