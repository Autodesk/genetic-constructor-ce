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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import { headersGet, headersPost, headersDelete } from './utils/headers';
import { dataApiPath } from './utils/paths';
import { noteSave, noteFailure } from '../store/saveState';
import { getBlockContents } from './querying';

/******
 API requests
 ******/

//returns metadata of projects
export const listProjects = () => {
  const url = dataApiPath('projects');
  return rejectingFetch(url, headersGet())
    .then(resp => resp.json())
    //just in case some are empty (historical cruft) so rendering doesnt break
    .then(projects => projects.filter(project => !!project));
};

//returns a rollup
export const loadProject = (projectId) => {
  if (!projectId) {
    return Promise.reject(null);
  }

  const url = dataApiPath(`projects/${projectId}`);
  return rejectingFetch(url, headersGet())
    .then(resp => resp.json())
    .then(rollup => {
      noteSave(rollup.project.id, rollup.project.version);
      return rollup;
    });
};

//expects a rollup
//autosave
//returns the commit with version, message, or null if no need to save
//resolves to null if the project has not changed
export const saveProject = (projectId, rollup) => {
  invariant(projectId, 'Project ID required to snapshot');
  invariant(rollup, 'Rollup is required to save');
  invariant(rollup.project && typeof rollup.blocks === 'object', 'rollup in wrong form');

  const url = dataApiPath(`projects/${projectId}`);
  const stringified = JSON.stringify(rollup);

  return rejectingFetch(url, headersPost(stringified))
    .then(resp => resp.json())
    .then(versionInfo => {
      const { version } = versionInfo;
      noteSave(projectId, version);
      return versionInfo;
    })
    .catch(err => {
      noteFailure(projectId, err);
      return Promise.reject(err);
    });
};

export const deleteProject = (projectId) => {
  invariant(projectId, 'Project ID required to delete');

  const url = dataApiPath(`projects/${projectId}`);

  return rejectingFetch(url, headersDelete())
    .then(resp => resp.json());
};

//Promise
// returns object {
//   components : { <blockId> : <block> } //including the parent requested
//   options: { <blockId> : <block> }
// }
export const loadBlock = (blockId, projectId, withContents = true) => {
  invariant(projectId, 'Project ID is required');
  invariant(blockId, 'Block ID is required');

  if (withContents === true) {
    return getBlockContents(blockId, projectId);
  }

  const url = dataApiPath(`${projectId}/${blockId}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json())
    .then(block => ({
      components: { [block.id]: block },
      options: {},
    }));
};
