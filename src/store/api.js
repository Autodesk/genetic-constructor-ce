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
import { dispatch } from './index.js';
import { mapValues } from 'lodash';

const dispatchWrapper = (action) => (...args) => dispatch(action(...args));

const sections = ['blocks', 'clipboard', 'projects', 'ui', 'focus', 'inventory', 'inspector', 'orders'];

/**
 * `window.constructor.api`
 *
 * Constructor provides a client API for third parties to interact with its data.
 *
 * This object merges all the {@link module:Actions Actions} and {@link module:Selectors Selectors} into a single object, keyed by type of data (e.g. `blocks`, `projects`, `ui`).
 *
 * See {@link module:Actions Actions} and {@link module:Selectors Selectors} for functions available on this object.
 *
 * Internally, all actions and selectors are automatically bound so they automatically dispatch, without requiring the Redux wrapper syntax `store.dispatch(<action>)`. See {@link module:constructor.module:store Store} for more information on Redux.
 *
 * @module api
 * @memberOf module:constructor
 * @example
 * //create a project with a single block in it, and rename the block
 *
 * const block = constructor.api.blocks.blockCreate({metadata: {name: 'First Name'}});
 *
 * const project = constructor.api.projects.projectCreate({components: [block.id]});
 *
 * constructor.api.blocks.blockRename(block.id, 'My New Name');
 */
export default sections.reduce((acc, section) => {
  //dont need to use static imports so long as we're using babel...
  const rawActions = require(`../actions/${section}.js`);
  const rawSelectors = require(`../selectors/${section}.js`);

  const actions = mapValues(rawActions, dispatchWrapper);
  const selectors = mapValues(rawSelectors, dispatchWrapper);

  return Object.assign(acc, {
    [section]: {
      ...actions,
      ...selectors,
    },
  });
}, {});
