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
import _ from 'lodash';
import fields from './fields/index';
import * as validators from './fields/validators';
import SchemaClass from './SchemaClass';
import ProjectSchema from './Project';
import BlockSchema from './Block';
import { id as idRegex } from '../utils/regex';

const sequenceMd5Validator = validators.sequenceMd5({ real: true });
const sequenceValidator = validators.sequence();

const idValidator = (value) => {
  if (!idRegex().test(value)) {
    return new Error(`invalid id, got ${value}`);
  }
};

const seqObjectBlocksValidator = validators.objectOf((value, key) => {
  if (!(value === true || (Array.isArray(value) && value.length === 2 && value[1] > value[0]))) {
    return new Error(`invalid sequence range specified for ${key}: ${value}`);
  }
  return idValidator(key);
});

//help track data model to aid migrations
const currentDataModelVersion = 1;

const rollupFields = {
  //schema is validated on save, should always be at current version (should be upgraded on load)
  schema: [
    fields.number({ min: currentDataModelVersion }).required,
    'Data model schema version',
    { scaffold: () => currentDataModelVersion },
  ],

  project: [
    ProjectSchema,
    'Project Manifest',
  ],

  blocks: [
    fields.objectOf((value, key) => {
      BlockSchema.validate(value, true);
      return idValidator(key);
    }, { required: true }),
    'Blocks Manifest',
  ],

  sequences: [
    fields.oneOfType([
      validators.arrayOf((value) => {
        return sequenceValidator(value.sequence) || seqObjectBlocksValidator(value.blocks);
      }),
      //todo - deprecate this one in the future
      validators.objectOf((value, key) => {
        return sequenceMd5Validator(key) || sequenceValidator(value);
      }),
    ]),
    `Sequences, transiently part of the rollup, e.g. to batch write`,
    { avoidScaffold: true },
  ],
};

export class RollupSchemaClass extends SchemaClass {
  constructor(fieldDefinitions) {
    super(Object.assign({}, rollupFields, fieldDefinitions));
  }

  validate(instance, throwOnError, heavy) {
    try {
      invariant(typeof instance === 'object', 'must pass instance');
      invariant(typeof instance.project === 'object' && typeof instance.blocks === 'object', 'must pass blocks and project objects');
      invariant(idRegex().test(instance.project.id), 'must pass valid project ID');

      //checks to run in non-production or if specified
      if (heavy === true || (heavy !== false && process.env.NODE_ENV !== 'production')) {
        const acceptedKeys = ['schema', 'blocks', 'project', 'sequences'];
        const keys = Object.keys(instance);

        invariant(keys.length <= acceptedKeys.length, 'too many keys: ' + keys.join(', '));
        invariant(keys.every(key => acceptedKeys.indexOf(key) >= 0), 'unknown key: ' + keys.join(', '));

        const projectId = instance.project.id;

        invariant(_.every(instance.blocks, (value, key) => value.projectId === projectId), 'all blocks must have correct projectId');

        super.validateFields(instance, true);
      }
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }
}

export default new RollupSchemaClass();
