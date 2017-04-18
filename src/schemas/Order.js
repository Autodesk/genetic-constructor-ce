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
import * as validators from './fields/validators';
import Schema from './SchemaClass';
import MetadataSchema from './Metadata';
import OrderParametersSchema from './OrderParameters';
import OrderStatusSchema from './OrderStatus';

/**
 * Orders are intended / placed orders of DNA with a remote foundry.
 * @name OrderSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const orderFields = {
  id: [
    fields.id({ prefix: 'order' }).required,
    'Order UUID',
  ],

  metadata: [
    MetadataSchema,
    'Metadata for the order',
  ],

  projectId: [
    fields.id({ prefix: 'project' }).required,
    'Associated Project UUID',
    { avoidScaffold: true },
  ],

  projectVersion: [
    fields.number().required,
    'Version of project when order is submitted',
    { avoidScaffold: true },
  ],

  constructIds: [
    fields.arrayOf(validators.id(), { required: true }).required,
    `IDs of constructs in project involved in order`,
  ],

  //todo - deprecate
  numberCombinations: [
    fields.number().required,
    `Number of possible combinations, determined when making the order`,
  ],

  parameters: [
    OrderParametersSchema,
    `Parameters associated with this order`,
  ],

  user: [
    fields.string().required,
    'User ID',
    { avoidScaffold: true },
  ],

  status: [
    OrderStatusSchema,
    'Information about foundry + remote order ID',
  ],

  notes: [
    fields.object().required,
    `Notes about the Order`,
  ],
};

export class OrderSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, orderFields, fieldDefinitions));
  }
}

export default new OrderSchemaClass();
