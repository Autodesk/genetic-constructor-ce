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
import fields from './fields/index';
import Schema from './SchemaClass';

/**
 * Rules defining a block and its function. See the chart in Rules_notes.png
 * @name RulesSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const rulesFields = {
  list: [
    fields.bool(),
    'Block is a list block. It has options rather than components.',
    { avoidScaffold: true },
  ],
  //see inventory/roles.js for list
  role: [
    fields.string(),
    'Role of the Block (often corresponds to SBOL symbols)',
    { avoidScaffold: true },
  ],
  hidden: [
    fields.bool(),
    'The instance is not visible.',
    { avoidScaffold: true },
  ],
  frozen: [
    fields.bool(),
    'The instance is immutable - no changes are allowed',
    { avoidScaffold: true },
  ],
  fixed: [
    fields.bool(),
    'Block Ids of components are fixed - no movement, insertions, deletions, substitutions',
    { avoidScaffold: true },
  ],
  authoring: [
    fields.bool(),
    `A template is being authored`,
    { avoidScaffold: true },
  ],
};

export class RulesSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, rulesFields, fieldDefinitions));
  }
}

export default new RulesSchemaClass();
