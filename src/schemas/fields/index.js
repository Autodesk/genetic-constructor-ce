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
import * as validatorFunctions from './validators';
import createFieldType from './createFieldType';
import { mapValues } from 'lodash';
import uuid from 'node-uuid';
import sha1 from 'sha1';

/**
 * Exports a dictionary of field types to unparameterized fieldType functions. These are called with parameters passed to the baseValidator, and return a fully defined fieldType object.
 *
 * Output fields take the following form:
 *
 * ```javascript
 * {
 *   type: {string} <name>
 *   validate: {Function} <Parameterized validation function>
 *   scaffold: {Function|*} If a function, returns default value. Otherwise, considered false and will not scaffold
 *   fieldRequired: {boolean} If fields is required by the schema
 *   typeDescription: {string} <description of type from fields.js>
 *   baseValidator:  {function} validatorFunctions.id
 * }
 * ```
 *
 * @module fields
 *
 * @private
 *
 * @example
 * import fields from './fields';
 * import * as validatorFunctions from './validators';
 *
 * let myField = fields.id().required;
 *
 returns:
 {
  type: 'id'
  validate: {Parameterized validation function}
  scaffold: {function returning default value, intelligence ranging dep. on type}
  fieldRequired: true
  typeDescription: <from fields.js>
  baseValidator:  validatorFunctions.id
}
 */
const fields = mapValues({

  //primitives

  any: {
    baseValidator: validatorFunctions.any,
    typeDescription: 'Any value acceptable',
    scaffold: () => null,
  },
  id: {
    baseValidator: validatorFunctions.id,
    typeDescription: 'A UUID',
    scaffold: (params) => {
      const prefix = '' + ((params && params.prefix) ? (params.prefix.toLowerCase() + '-') : '');
      return prefix + uuid.v4();
    },
  },
  string: {
    baseValidator: validatorFunctions.string,
    typeDescription: 'A string',
    scaffold: () => '',
  },
  number: {
    baseValidator: validatorFunctions.number,
    typeDescription: 'A number',
    scaffold: () => 0,
  },
  func: {
    baseValidator: validatorFunctions.func,
    typeDescription: 'A function',
    scaffold: () => { return () => {}; },
  },
  array: {
    baseValidator: validatorFunctions.array,
    typeDescription: 'An array, with any values',
    scaffold: () => [],
  },
  object: {
    baseValidator: validatorFunctions.object,
    typeDescription: 'An object, of any shape',
    scaffold: () => ({}),
  },
  bool: {
    baseValidator: validatorFunctions.bool,
    typeDescription: 'A boolean, strictly true or false',
    scaffold: () => false,
  },
  undef: {
    baseValidator: validatorFunctions.undef,
    typeDescription: 'the value undefined',
    scaffold: () => undefined,
  },

  //string subtypes

  sequence: {
    baseValidator: validatorFunctions.sequence,
    typeDescription: 'An IUPAC compliant sequence',
    scaffold: () => '',
  },
  sequenceMd5: {
    baseValidator: validatorFunctions.sequenceMd5,
    typeDescription: 'either an md5, or md5 with range: md5[start:end]',
    scaffold: () => null,
  },
  email: {
    baseValidator: validatorFunctions.email,
    typeDescription: 'A valid email address',
    scaffold: () => '',
  },
  version: {
    baseValidator: validatorFunctions.version,
    typeDescription: 'String representing a git SHA',
    scaffold: () => sha1('' + Math.floor((Math.random() * 10000000) + 1) + Date.now()),
  },
  url: {
    baseValidator: validatorFunctions.url,
    typeDescription: 'A valid URL',
    scaffold: () => '',
  },

  //complex - functions + classes

  arrayOf: {
    baseValidator: validatorFunctions.arrayOf,
    typeDescription: 'An array, where each item passes the passed validation function (value) => {}',
    scaffold: () => [],
  },
  objectOf: {
    baseValidator: validatorFunctions.objectOf,
    typeDescription: 'An object, where each value passes the passed validation function (value, key) => {}',
    scaffold: () => ({}),
  },
  shape: {
    baseValidator: validatorFunctions.shape,
    typeDescription: 'An object with a defined fields and types',
    scaffold: () => ({}), //todo - ideally would take an input
  },
  equal: {
    baseValidator: validatorFunctions.equal,
    typeDescription: 'Equality check using Object.is()',
    scaffold: () => null, //todo - ideally would take an input
  },
  instanceOf: {
    baseValidator: validatorFunctions.instanceOf,
    typeDescription: 'Instance of another class',
    scaffold: () => null, //todo - ideally would take an input
  },
  oneOf: {
    baseValidator: validatorFunctions.oneOf,
    typeDescription: 'Input matches item in possible values',
    scaffold: () => null, //todo - ideally would take an input
  },
  oneOfType: {
    baseValidator: validatorFunctions.oneOfType,
    typeDescription: 'Value matches at least one possibility, which may be (1) an object (instanceof), or (2) validation function',
    scaffold: () => null, //todo - ideally would take an input
  },
}, createFieldType);

export default fields;
