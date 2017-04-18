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

//track information about saving e.g. time
const saveState = new Map();

export const noteSave = (projectId, version = null) => {
  invariant(projectId, 'must pass project ID');
  const lastState = saveState.get(projectId) || {};

  saveState.set(projectId, Object.assign(lastState, {
    updated: +Date.now(),
    version,
  }));
};

export const noteFailure = (projectId, err) => {
  invariant(projectId, 'must pass project ID');
  const lastState = saveState.get(projectId) || {};

  //this is the signature of error from fetch when it is offline, different than our rejectingFetch
  const offline = err && err.name === 'TypeError';

  saveState.set(projectId, Object.assign(lastState, {
    lastFailed: +Date.now(),
    lastErr: err,
    lastErrOffline: offline,
  }));
};

export const getProjectSaveState = (projectId) => {
  invariant(projectId, 'must pass project ID');
  const state = saveState.get(projectId) || {};
  const { updated = 0, lastFailed = 0, version = null, lastErr = null, lastErrOffline = false } = state;

  return {
    updated,
    version,
    lastFailed,
    lastErr,
    lastErrOffline,
    saveDelta: +Date.now() - updated,
    saveSuccessful: lastFailed <= updated,
  };
};
