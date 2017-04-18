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
import { headersGet } from './utils/headers';
import { dataApiPath } from './utils/paths';

//info query - low level API call
export const infoQuery = (type, detail, additional) => {
  const url = dataApiPath(`info/${type}${detail ? `/${detail}` : ''}${additional ? `/${additional}` : ''}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};

/****** specific queries **********/

export const getBlockContents = (blockId, projectId) => {
  invariant(blockId && projectId, 'block and project ID required');
  return infoQuery('contents', blockId, projectId);
};

export const getBlockRoles = () => {
  return infoQuery('role');
};

export const getBlocksWithRole = (role = null) => {
  invariant(role, 'must provide roll');
  return infoQuery('role', role);
};

export const getBlocksWithName = (name) => {
  if (!name) {
    return Promise.resolve([]);
  }
  return infoQuery('name', name);
};
