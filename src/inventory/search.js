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
import { registry, getSources } from './registry';

/**
 * Searching across inventories loaded in Constructor.
 *
 * Sources must conform to a prescribed structure to work with Constructor. They must support the following functions:
 *
 * ##### `search(query, options)`
 *
 * Search the source for a given query.
 *
 * sources must support the following `options`
 *
 * ```
 * start - index of search results at which to start
 * entries - number of entries to fetch
 * ```
 *
 * Results returned from each source are an array of Block models, with the property `parameters` assigned to the array, reflecting the parameters actually used in the search (determined by the search extension, defaults are not attached)
 *
 * These models can and likely should be minimal, as they are only shown in the inventory. `get()` will be called before showing in the inspector or adding to the project. get() must include:
 *
 * `block.source = { source: <key>, id: <source_id> }`
 *
 * ##### `get(id, options, searchResult)`
 *
 * Given an ID, get complete Block from the source. Passed the searchResult e.g. to map over the ID (note that Blocks should be cloned when added to the project e.g. by drag and drop).
 *
 * Returns an array of Block models, where the first block is the construct, and subsequent blocks are its contents.
 *
 * Should support the following `options`:
 *
 * `onlyConstruct` - only return one block, the construct (e.g. to show in the inspector, without adding to project)
 *
 * ##### `sourceUrl(blockSource)`
 *
 * Given a block's source (`block.source`), generate a URL for where more information about the block can be found
 *
 * @module search
 */

/**
 * Run a search over a inventory source.
 * @memberOf module:search
 * @function
 * @param {string} term Search term
 * @param {Object} parameters Parameters, defined in {@link module:search}
 * @param {string} sourceKey Key of search in search registry
 * @returns {Promise}
 * @resolve {Object} searchResults In form { <key> : <results array> }
 * @reject {Error} Error If the search fails or hits > 400 status code
 */
export const search = (term, parameters = {}, sourceKey) => {
  const sources = getSources('search');

  invariant(typeof term === 'string', 'Term must be a string');
  invariant(sources.indexOf(sourceKey) >= 0, `source ${sourceKey} not found in list of sources: ${sources.join(', ')}`);

  const searchPromise = !term.length ?
    Promise.resolve([]) :
    registry[sourceKey].search(term, parameters);

  return searchPromise.then(results => {
    invariant(typeof results.parameters === 'object', 'must attach parameters object to results array');
    return { [sourceKey]: results };
  });
};

/**
 * Search multiple sources at once
 * @memberOf module:search
 * @function
 * @param {string} term search
 * @param {Object} options See search
 * @param {Array} sourceList
 * @returns {Promise}
 * @resolve {Object} results, keyed by search source
 * @reject {Error} Error while searching, e.g. if one rejected
 */
export const searchMultiple = (term, options, sourceList = []) => {
  const sources = getSources('search');
  const searchSources = (sourceList.length === 0) ? sources : sourceList;

  invariant(Array.isArray(sourceList), 'must pass array of sources');
  invariant(sourceList.every(source => sources.indexOf(source) >= 0), `sourceList contains source not in the list of supported sources: ${sourceList} // ${sources}`);

  return Promise.all(searchSources.map(source => search(term, options, source)))
    .then(results => Object.assign({}, ...results));
};

export const blast = () => {
  invariant(false, 'not implemented');
};
