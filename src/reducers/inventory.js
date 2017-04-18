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
import * as ActionTypes from '../constants/ActionTypes';
import { getSources } from '../inventory/registry';
import { getLocal, setLocal } from '../utils/localstorage';

/*
 Search results take the form:

 {
 <key> : [results]
 }

 Where the results array has (may have) the following properties assigned:

 parameters - search() parameters, assigned by the search source (start, entries, etc.)
 (count) - total number of results, assigned by search source if provided
 (loading) - whether more results are loading, assigned by app
 */

const createEmptySearchResults = (sourceList) => sourceList.reduce((acc, source) => {
  const results = [];
  Object.assign(results, { parameters: {}, loading: true });
  return Object.assign(acc, { [source]: results });
}, {});

const createSourcesVisible = (valueFunction = () => false, sourceList = getSources('search')) => {
  return sourceList.reduce((acc, source) => Object.assign(acc, { [source]: valueFunction(source) }), {});
};

const searchSources = getSources('search');
const initialSearchSources = getLocal('searchSources') ? getLocal('searchSources').split(',') : searchSources;
const defaultSearchResults = createEmptySearchResults(searchSources);

export const initialState = {
  sourcesToggling: false,
  searchTerm: '',
  searching: false,
  sourceList: initialSearchSources,
  sourcesVisible: createSourcesVisible(() => false),
  searchResults: defaultSearchResults,
  lastSearch: {
    searchTerm: '',
    sourceList: [],
  },
};

export default function inventory(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.INVENTORY_SEARCH : {
    const { searchTerm, sourceList } = action;
    return Object.assign({}, state, {
      searchTerm,
      searchResults: createEmptySearchResults(sourceList),
      searching: searchTerm.length > 0,
    });
  }
  case ActionTypes.INVENTORY_SEARCH_RESOLVE_PARTIAL : {
    const { patch, searchTerm } = action;

    if (searchTerm !== state.searchTerm) {
      return state;
    }

    const searchResults = Object.assign({}, state.searchResults, patch);
    return Object.assign({}, state, {
      searchResults,
    });
  }
  case ActionTypes.INVENTORY_SEARCH_RESOLVE : {
    const { searchTerm, sourceList, searchResults } = action;

    if (searchTerm === state.searchTerm) {
      return Object.assign({}, state, {
        searching: false,
        searchResults,
        sourcesVisible: createSourcesVisible((source) => searchResults[source] && searchResults[source].length > 0),
        lastSearch: {
          searchTerm,
          sourceList,
        },
      });
    }
    return state;
  }
  case ActionTypes.INVENTORY_SEARCH_REJECT : {
    const { searchTerm } = action;

    if (searchTerm !== state.searchTerm) {
      return state;
    }

    return Object.assign({}, state, {
      searching: false,
      searchResults: defaultSearchResults,
    });
  }
  case ActionTypes.INVENTORY_SEARCH_PAGINATE : {
    const { source, parameters } = action;
    const results = state.searchResults[source];
    const nextResults = Object.assign([...results], { parameters, loading: true });
    const nextSearchResults = Object.assign({}, state.searchResults, { [source]: nextResults });

    return Object.assign({}, state, { searchResults: nextSearchResults });
  }
  case ActionTypes.INVENTORY_SEARCH_PAGINATE_RESOLVE : {
    const { searchTerm, source, patch } = action;

    if (searchTerm !== state.searchTerm) {
      return state;
    }

    const results = patch[source];
    const oldResults = state.searchResults[source];
    //if there are no results, still construct the final value the same way
    const nextResults = Object.assign([...results, ...oldResults], {
      parameters: results.parameters,
      count: results.count,
      loading: false,
    });

    if (!results.length) {
      //dont allow more searches - set length to current
      Object.assign(nextResults, { count: nextResults.length });
    }

    const nextSearchResults = Object.assign({}, state.searchResults, { [source]: nextResults });
    return Object.assign({}, state, { searchResults: nextSearchResults });
  }
  case ActionTypes.INVENTORY_SET_SOURCES : {
    const { sourceList } = action;
    setLocal('searchSources', sourceList.join(','));
    return Object.assign({}, state, {
      sourceList,
    });
  }
  case ActionTypes.INVENTORY_SOURCES_VISIBILITY : {
    const { nextState } = action;
    return Object.assign({}, state, { sourcesToggling: nextState });
  }
  case ActionTypes.INVENTORY_SOURCES_VISIBLE : {
    const { sourcesVisible } = action;
    return Object.assign({}, state, { sourcesVisible });
  }
  case ActionTypes.INVENTORY_SET_SEARCH_TERM : {
    const { searchTerm } = action;
    return Object.assign({}, state, {
      searchTerm,
    });
  }

  default :
    return state;
  }
}
