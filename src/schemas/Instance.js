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

import ParentSchema from './Parent';
import MetadataSchema from './Metadata';

/**
 * Instance is a parent class. These are IDed and versioned objects with an ancestry, with a dedicated metadata field.
 * @name InstanceSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const instanceFields = {
  id: [
    fields.id().required,
    'ID of the instance',
  ],
  parents: [
    fields.arrayOf(ParentSchema.validate.bind(ParentSchema)).required,
    'Ancestral parents from which object is derived, with newest first',
  ],
  metadata: [
    MetadataSchema,
    'Metadata for the object',
  ],
};

export class InstanceSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, instanceFields, fieldDefinitions));
  }
}

export default new InstanceSchemaClass();
