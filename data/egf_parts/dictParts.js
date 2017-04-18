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

import _ from 'lodash';
import connectorList from './connectorList.json';
import partList from './partList.json';

const parts = _.groupBy(partList, 'metadata.egfPosition');

_.forEach(partList, (part) => {
  Object.assign(parts, { [part.metadata.name.toLowerCase()]: part });
  Object.assign(parts, { [part.metadata.shortName.toLowerCase()]: part });
});

const connectors = _.reduce(connectorList, (acc, conn) => {
  return Object.assign(acc, {
    [conn.metadata.egfPosition]: conn,
    [conn.metadata.name.toUpperCase()]: conn,
  });
}, {});

export { connectors, parts };
