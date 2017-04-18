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
import safeValidate from './safeValidate';

/**
 * Takes a basic field definition, returns a function which takes parameters, which subsequently returns a fully defined field.
 *
 * @private
 * @param baseFieldDefinition {Object} Object which minimally contains the following keys:
 *
 * baseValidator {Function} validation function which accepts a set of parameters (see validators.js), and returns a function which accepts an input, and subsequently returns:
 *   1) returns nothing if valid
 *   2) returns an error for invalid with relevant message
 *
 * and likely should include a typeDescription
 *
 * @param type {String} the field type (e.g. 'id')
 *
 * @return {Function} returns a function expecting an input value of parameters to the baseValidator, and which has the additional field .require if the field is required. The return of this function is a fully defined field:
 *
 * ```javascript
 * {
 *   type: {String} Field type
 *   validate: {Function}
 *   fieldRequired: {Boolean} is the field required
 *   description: {String} description of specific field
 *   typeDescription: {String} description of field type
 *   baseValidator:  {Function} base validation function, pre-parameterized
 * }
 * ```
 */
export default function createFieldType(baseFieldDefinition, type) {
  const fieldDef = Object.assign({
    type,
  }, baseFieldDefinition);

  return function validatorAwaitingParams(validationParams) {
    const { baseValidator } = fieldDef;

    const opt = createFieldFromValidator(fieldDef, baseValidator, validationParams, false);
    opt.required = createFieldFromValidator(fieldDef, baseValidator, validationParams, true);

    //catch these in case you declare a schema improperly, hard to catch otherwise (this is like React PropTypes)
    if (process.env.NODE_ENV !== 'production') {
      opt.isRequired = {
        validate: () => { throw new Error('use .required, not .isRequired, or check if required with .fieldRequired'); },
      };
    }

    return opt;
  };
}

function createFieldFromValidator(fieldDefinition, baseValidator, params, required) {
  const definedValidator = baseValidator(params);
  return Object.assign({},
    fieldDefinition,
    {
      params,
      validate: safeValidate.bind(null, definedValidator, required),
      fieldRequired: required,
    }
  );
}
