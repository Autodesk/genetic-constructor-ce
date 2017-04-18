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
import * as egf from './egf/index';
import * as igem from './igem/index';
import * as ncbi from './ncbi/index';
import * as genbank from './genbank/index';

export const registry = {
  egf,
  igem,
  ncbi,
  genbank,
};

//todo - ability to register inventory search + retrieval lazily -- need to expose this

export const register = (source) => {
  invariant(false, 'not supported yet');

  //todo - checks
  invariant(typeof source.name === 'string', 'name is required');
  invariant(!source.search || typeof source.search === 'function');
  invariant(!source.get || typeof source.get === 'function'); //get is necessary if it is searchable
  invariant(!source.sourceUrl || typeof source.sourceUrl === 'function');

  //todo - add to registry
};

//can pass string of function each registry should have, to serve as filter
export const getSources = (withFunction = false) => Object.keys(registry).filter(key => !withFunction || typeof registry[key][withFunction] === 'function');
