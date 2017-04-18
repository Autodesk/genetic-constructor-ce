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
/**
 * Genetic Constructor exposes selectors for accessing application data + performing data queries
 *
 * **Choose a specific section from the TOC**
 *
 * @module Selectors
 */
import * as blocks from './blocks';
import * as inspector from './inspector';
import * as inventory from './inventory';
import * as projects from './projects';
import * as focus from './focus';
import * as orders from './orders';
import * as ui from './ui';
import * as clipboard from './clipboard';

const exposed = {
  blocks,
  inspector,
  focus,
  inventory,
  projects,
  ui,
  clipboard,
  orders,
};

export default exposed;
