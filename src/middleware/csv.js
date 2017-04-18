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
import { headersPost } from './utils/headers';
import { extensionApiPath } from './utils/paths';
import timeLimit from '../utils/timeLimit';
import uploadFiles from './utils/uploadFiles';

const extensionKey = 'csv';

/**
 * Imoprt CSV Files, into the given project or into a new project.
 * project ID is returned and should be reloaded if the current project or opened if a new project.
 * @private
 * @param {string} [projectId]
 * @param {...File} files
 * @returns {Promise}
 * @resolve with projectId on success and rejects with fetch response
 */
export function importFile(projectId = null, ...files) {
  const url = extensionApiPath(extensionKey, `import${!!projectId ? ('/' + projectId) : ''}`);

  return timeLimit(10000)(
    uploadFiles(url, {}, ...files)
      .then(resp => resp.json())
      .then(json => {
        if (projectId === 'convert') {
          return json;
        }
        invariant(json && json.projectId, 'expect a project ID');
        return json.projectId;
      })
  );
}

/**
 * Import a CSV string
 * @private
 * @param payload
 * @param projectId
 * @returns {*}
 */
function importStringBase(payload, projectId) {
  invariant(typeof payload === 'object', 'payload must be object');
  invariant(typeof payload.string === 'string', 'must pass string to import');

  const url = extensionApiPath(extensionKey, `import${projectId ? ('/' + projectId) : ''}`);

  return rejectingFetch(url, headersPost(JSON.stringify(payload)))
    .then(resp => resp.json());
}

export const convert = (csvString, options = {}) => {
  invariant(false, 'forthcoming');
  invariant(typeof csvString === 'string', 'must pass a csv file as text. to use a file, use importCsvFile.');

  const payload = Object.assign({}, options, { string: csvString });
  return importStringBase(payload, 'convert');
};

export const importString = (csvString, projectId, options = {}) => {
  invariant(typeof csvString === 'string', 'must pass a csv file as text. to use a file, use importFile.');

  const payload = Object.assign({}, options, { string: csvString });
  return importStringBase(payload, projectId)
    .then(json => {
      invariant(json && json.projectId, 'expect a project ID');
      return json.projectId;
    });
};
