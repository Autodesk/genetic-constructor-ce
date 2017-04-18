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
 * BlockSource denotes where a block came from. It is generally set on import / addition to the project
 * @name BlockSourceSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const blockSourceFields = {
  source: [
    fields.string(),
    `Source key for where the block came from`,
  ],

  id: [
    fields.string(),
    `ID of remote resource`,
  ],

  url: [
    fields.string(),
    `URL to resource, relative paths are relative to genetic construct root URL`,
    { scaffold: false },
  ],
};

export class BlockSourceSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, blockSourceFields, fieldDefinitions));
  }
}

export default new BlockSourceSchemaClass();
