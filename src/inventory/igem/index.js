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
import fetch from 'isomorphic-fetch';
import { parseResults, parseFullResult } from './parseResults';
import queryString from 'query-string';

export const url = 'https://gc-inventory.dev.bionano.autodesk.com/collections';

export const name = 'iGEM Registry';
const collection = 'igem';

export const search = (term, options = {}) => {
  const parameters = Object.assign(
    {
      start: 0,
      entries: 50,
    },
    options,
    {
      collection,
    }
  );

  return fetch(`${url}/search/?query_text=${term}&${queryString.stringify(parameters)}`)
    .then(resp => resp.json())
    .then(results => parseResults(results))
    .then(results => Object.assign(results, { parameters }))
    .catch(err => {
      console.error(err); //eslint-disable-line no-console
      return [];
    });
};

export const get = (id, parameters = {}, searchResult) => {
  return fetch(`${url}/${collection}/parts/${id}`)
    .then(resp => resp.json())
    .then(result => parseFullResult(result, searchResult));
};

export const sourceUrl = ({url, id}) => {
  if (!id && !url) {
    return null;
  }
  return url || `http://parts.igem.org/Part:${id}`;
};
