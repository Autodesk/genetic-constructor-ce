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
import { mergeMetadataOntoProject } from './projects';
import { dbHead, dbGet, dbPruneResult } from '../middleware/db';

// note that versions are already generated on project writing, so use projectWrite() to create one

const transformDbVersion = (result) => ({
  version: parseInt(result.version, 10),
  time: (new Date(result.createdAt)).valueOf(),
  owner: result.owner,
});

export const projectVersionExists = (projectId, version) => {
  return dbHead(`projects/${projectId}?version=${version}`)
    .then(() => true);
};

//returns project at a particular point in time
export const projectVersionGet = (projectId, version) => {
  return dbGet(`projects/${projectId}?version=${version}`)
    .then(mergeMetadataOntoProject)
    .then(dbPruneResult);
};

//list all versions of a project
export const projectVersionList = (projectId) => {
  return dbGet(`projects/versions/${projectId}`)
    .then(results => results.map(transformDbVersion));
};
