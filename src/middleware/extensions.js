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
import rejectingFetch, { fetch } from './utils/rejectingFetch';
import { headersGet } from './utils/headers';
import { extensionsPath, extensionApiPath } from './utils/paths';
import invariant from 'invariant';

export const getExtensionsInfo = (listAll = false) => {
  const url = listAll === true ? 'listAll' : 'list';
  return rejectingFetch(extensionsPath(url), headersGet())
    .then(resp => resp.json());
};

/**
 * Call The API of an extension. This is just a simple wrapper around REST requests using fetch()
 * @name api
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {string} extensionKey Key of extension
 * @param {string} route Route exposed by the extension router
 * @param {Request} fetchBody fetch options. see https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
 * @returns {Response} Fetch response. Your responsiblity for parsing + handling
 * @example
 *
 * //sends POST to extensions/api/myExtension/myRoute
 * callExtensionApi('myExtension', 'myRoute', {method: 'POST', body: 'hello'})
 *   .then(response => response.text())
 *   .then(text => { ... });
 */
export const callExtensionApi = (extensionKey, route, fetchBody = {}) => {
  invariant(typeof extensionKey === 'string' && !!extensionKey, 'must pass extensionKey');
  invariant(typeof route === 'string', 'must pass a route');
  const url = extensionApiPath(extensionKey, route);

  const fetchOpts = Object.assign({ credentials: 'same-origin' }, fetchBody);
  return fetch(url, fetchOpts);
};
