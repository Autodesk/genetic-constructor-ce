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
 * Parents are objects in an Instance's ancestry
 * @name ParentSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const fieldDefs = {
  id: [
    fields.id().required,
    'ID of parent instance',
  ],
  projectId: [
    fields.id({ prefix: 'project' }),
    'ID of project of parent (if not a project)',
  ],
  version: [
    fields.number({min: 0}),
    'Version of project, git SHA',
  ],
};

export class ParentSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new ParentSchemaClass();
