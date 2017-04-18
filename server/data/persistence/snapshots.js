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
import { errorDoesNotExist } from '../../utils/errors';
import { dbGet, dbPost } from '../middleware/db';
import debug from 'debug';

const logger = debug('constructor:data:persistence:snapshots');

// Snapshotting is special information about a version.

const transformDbVersion = (result) => ({
  projectId: result.projectId,
  version: parseInt(result.projectVersion, 10),
  type: result.type,
  tags: result.tags,
  message: result.message,
  time: (new Date(result.createdAt)).valueOf(),
  owner: result.owner,
});

export const SNAPSHOT_TYPE_USER = 'SNAPSHOT_USER';
export const SNAPSHOT_TYPE_ORDER = 'SNAPSHOT_ORDER';
export const defaultMessage = 'Project Snapshot';

export const snapshotWrite = (projectId, userId, version, message = defaultMessage, tags = {}, type = SNAPSHOT_TYPE_USER) => {
  let projectVersion = version;

  if (!!version && typeof version === 'string') {
    projectVersion = parseInt(version, 10);
  }

  logger(`[snapshotWrite] writing @ V${Number.isInteger(projectVersion) ? projectVersion : '[latest]'} on ${projectId} - ${message}`);

  //signature is weird - no data to pass, just several body parameters
  return dbPost(`snapshots/`, userId, {}, {}, {
    projectId,
    projectVersion,
    type,
    message,
    tags,
  })
    .then(transformDbVersion);
};

export const snapshotList = (projectId, userId, tags = {}) => {
  if (Object.keys(tags).length) {
    return dbPost(`snapshots/tags?project=${projectId}`, null, null, {}, tags)
      .then(results => results.map(transformDbVersion));
  }

  return dbGet(`snapshots/${projectId}`)
    .then(results => results.map(transformDbVersion));
};

export const snapshotGet = (projectId, userId, version) => {
  logger(`[snapshotGet] ${projectId} @ ${version}`);

  return dbGet(`snapshots/${projectId}?version=${version}`)
    .then(results => (Array.isArray(results) && results.length > 0) ? results[0] : Promise.reject(errorDoesNotExist))
    .then(transformDbVersion);
};

//if want to support - need to do by uuid, so need to fetch via projectId + version and delete that way, or list and delete
//export const snapshotDelete = (projectId, userId, version) => {};
