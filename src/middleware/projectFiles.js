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
import { projectFilePath } from './utils/paths';

const contentTypeTextHeader = { headers: { 'Content-Type': 'text/plain' } };

/**
 * `constructor.extensions.files.read()`
 *
 * Get the contents of a project file
 *
 * @name files_read
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} namespace Namespace Key
 * @param {string} fileName Name of file
 * @param {string} [version] Specific version of the file (not relevant for local development)
 * @returns {Promise} Fetch Response promise
 * @resolve {Response} Fetch Request. left for you to parse. (you may wish to parse as a buffer, or text, or json)
 * @reject {Error} rejects if > 400 or error
 *
 * @example

 files.read(projectId, namespace, fileName)
 .then(resp => resp.text())
 .then(stringContents => { ... })

 */
export const projectFileRead = (projectId, namespace, fileName, version) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');
  invariant(!!fileName && typeof fileName === 'string', 'file name is required');
  invariant(!version || typeof version === 'string', 'version must be string if specified');

  return rejectingFetch(projectFilePath(projectId, namespace, fileName, version), headersGet(contentTypeTextHeader));
};

/**
 * `constructor.extensions.files.write()`
 *
 * Set the contents of a project file, or delete a file
 *
 * @name files_write
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} namespace Namespace Key
 * @param {string} fileName Name of file
 * @param {string|null} contents String of contents for file. if contents === null, then the file is deleted
 * @returns {Promise} Fetch Response promise
 * @resolve {object} {name, url} Name + URL if successful, or empty string if successfully deleted
 * @reject {Error} rejects if > 400 or error
 *
 * @example

 files.write(projectId, namespace, fileName, contents)
 .then(result
 */
export const projectFileWrite = (projectId, namespace, fileName, contents) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');
  invariant(!!fileName && typeof fileName === 'string', 'file name is required');
  invariant(contents === null || typeof contents === 'string', 'must pass contents as string, or null to delete');

  const filePath = projectFilePath(projectId, namespace, fileName);

  if (contents === null) {
    return rejectingFetch(filePath, headersDelete())
      .then(resp => filePath);
  }

  return rejectingFetch(filePath, headersPost(contents, contentTypeTextHeader))
    .then(resp => resp.json());
};

/**
 * `constructor.extensions.files.list()`
 *
 * List the files for an namespace.
 *
 * @name files_list
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} namespace Namespace Key
 * @returns {Promise} Fetch Response promise
 * @resolve {string} URL if successful, or empty string if successfully deleted
 * @reject {Error} rejects if > 400 or error
 */
export const projectFileList = (projectId, namespace) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');

  //todo = don't require namespace. will need to update router
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');

  return rejectingFetch(projectFilePath(projectId, namespace, ''), headersGet())
    .then(resp => resp.json());
};

//not yet exposed / well tested
export const projectFileVersions = (projectId, namespace, fileName) => {
  invariant(!!projectId && typeof projectId === 'string', 'projectId is required');
  invariant(!!namespace && typeof namespace === 'string', 'namespace key is required');
  invariant(!!fileName && typeof fileName === 'string', 'file name is required');

  invariant(false, 'not yet implemented');

  return rejectingFetch(projectFilePath(projectId, namespace, fileName, 'versions'), headersGet())
    .then(resp => resp.json());
};
