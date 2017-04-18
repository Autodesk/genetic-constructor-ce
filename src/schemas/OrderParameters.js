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
import fields from './fields/index';
import Schema from './SchemaClass';

/**
 * Parameters for Order
 * @name OrderParametersSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const fieldDefs = {
  method: [
    fields.string(),
    `Assembly method to be used`,
  ],
  onePot: [
    fields.bool().required,
    'Reaction is combinatorial and all parts will be combined in one tube, resulting in many combinatorial assemblies mixed together.',
    { scaffold: () => true },
  ],
  sequenceAssemblies: [
    fields.bool(),
    'Whether to sequence all assemblies after production',
    { scaffold: () => false },
  ],
  permutations: [
    fields.number(),
    'For multi pot combinatorial this is number of random constructs to assemble',
    { avoidScaffold: true },
  ],
  combinatorialMethod: [
    fields.oneOf(['Random Subset', 'Maximum Unique Set']),
    'Combinatorial Method',
  ],
  //todo- should be keyed by constructId
  activeIndices: [
    fields.object(),
    'If # permutations desired is less than number combinations possible, indices of constructs to keep',
  ],
};

export class OrderParametersSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }

  validate(instance, throwOnError = false) {
    try {
      super.validateFields(instance, true);
      invariant(instance.onePot === true || (instance.combinatorialMethod && instance.permutations && Object.keys(instance.activeIndices).length > 0), 'Combinatorial method and # permutations required if not one pot, and activeInstances must be present and its length match # permutations');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }
}

export default new OrderParametersSchemaClass();
