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
import rejectingFetch from './utils/rejectingFetch';
import { headersGet, headersPost } from './utils/headers';
import { dataApiPath } from './utils/paths';
import { noteSave, noteFailure } from '../store/saveState';

//rollup is optional, will be saved if provided
//version recommended, otherwise defaults to latest
//explicit, makes a snapshot rather than just a version
//returns the snapshot wth version, message
export const snapshot = (projectId, version = null, msgInput, tags = {}, rollup = null) => {
  invariant(projectId, 'Project ID required to snapshot');
  const message = typeof msgInput === 'string' ? msgInput : 'Project Snapshot';

  const stringified = JSON.stringify({ message, tags, rollup });
  const url = dataApiPath(`snapshots/${projectId}${Number.isInteger(version) ? '/' + version : ''}`);

  return rejectingFetch(url, headersPost(stringified))
    .then(resp => resp.json())
    .then(snapshot => {
      const { version } = snapshot;
      noteSave(projectId, version);
      return snapshot;
    })
    .catch(err => {
      noteFailure(projectId, err);
      return Promise.reject(err);
    });
};

export const snapshotList = (projectId) => {
  invariant(projectId, 'Project ID required to snapshot');

  const url = dataApiPath(`snapshots/${projectId}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};

export const snapshotGet = (projectId, version) => {
  invariant(projectId, 'Project ID required to snapshot');
  invariant(version, 'version is necessary');

  const url = dataApiPath(`snapshots/${projectId}/${version}`);

  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};
