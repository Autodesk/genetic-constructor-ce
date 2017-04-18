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
import { mapValues } from 'lodash';
import debug from 'debug';

const logger = debug('constructor:schemas');

if (process.env.NODE_ENV !== 'production' && !logger.enabled) {
  console.log('To enable logging of schema validation errors, set env var DEBUG=constructor:schemas, or localStorage.debug = "constructor:schemas"'); //eslint-disable-line
}

/**
 * Schemas are used internally for ensure data is consistent and valid, and guarantee the presence of various fields.
 * Schemas provide functions for scaffolding, used internally by models, to ensure the presence and correctness of Instance fields.
 * Validation occurs compared to the schema, validating field types and object-wide validation.
 * Fields all have a description, and `describe()` will output the fields of the schema and a description of each.
 * @name Schema
 * @class
 * @param fieldDefinitions {Object} dictionary of field names to definitions. Definitions take the form:
 * [
 *   parameterizedFieldType {function} Parameterized field type (e.g. fields.id().required)
 *   description {string} description of the field in this schema
 *   additional {Object} object to assign to the field
 * ]
 * @returns {Schema} Schema instance, which can validate(), describe(), etc.
 * @example

 import fields from './fields';
 import Schema from './Schema';

 const simpleFields = {
   id : [
     fields.id().required,
     'the ID for the Simple Instance',
     {additionalField : 'yada'}
   ]
 };

 class SimpleSchemaClass extends Schema {
   constructor(fieldDefinitions) {
     super(merge({}, fieldDefinitions, simpleFields));
   }
 }

 const SimpleSchema = new SimpleSchemaClass();
 export default SimpleSchema;

 */
export default class Schema {
  /**
   * Create a Schema
   * @constructor
   * @param {Object} fieldDefinitions Object whose keys are field names, and values are arrays as defined in {@link Schema} class description
   */
  constructor(fieldDefinitions) {
    this.definitions = fieldDefinitions;
    this.fields = createFields(fieldDefinitions);
    this.type = this.constructor.name; //to mirror fields, in validation
  }

  //prefer ES6 extension
  extend(childDefinitions = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('it is recommedned you extend Schemas using ES6 classes, not the extend() method'); //eslint-disable-line no-console
    }

    return new Schema(Object.assign({},
      this.definitions,
      childDefinitions
    ));
  }

  /**
   * Clone the schema
   * @function
   * @name clone
   * @memberOf Schema
   * @returns {Schema}
   */
  clone() {
    return new this.constructor(this.definitions);
  }

  /**
   * Validate the fields of the schema, skipping object wide validation if the schema has defined any.
   * @name validateFields
   * @function
   * @memberOf Schema
   * @param {Object} instance Object to validate
   * @param {boolean} [shouldThrow=false]
   * @throws if `shouldThrow === true` and instance is invalid
   * @returns {boolean} True if valid
   */
  validateFields(instance, shouldThrow = false) {
    if (typeof instance !== 'object') {
      const errorMessage = `Instance provided to validate() is not an object, got ${instance}`;
      if (shouldThrow) {
        throw Error(errorMessage);
      }
      logger(errorMessage);
    }

    return Object.keys(this.fields).every(fieldName => {
      const instanceFieldValue = instance[fieldName];
      const field = this.fields[fieldName];

      //check for improperly bound fields and throw
      if (!field.validate) {
        console.log(JSON.stringify(field, null, 2)); //eslint-disable-line
        throw Error('field lacks validate()');
      }

      //need to bind field in case it's a schema
      const validator = field.validate.bind(field);

      //note - should not error using our validators. Might want to try-catch though, e.g. if we allow custom validator functions
      const isValid = validator(instanceFieldValue);

      if (!isValid) {
        const errorMessage = `Validation Failed:
Field "${field.name}" of type "${field.type}"
Got ${instanceFieldValue} (type: ${typeof instanceFieldValue}).
[${field.description || field.typeDescription}]`;

        if (shouldThrow) {
          throw Error(errorMessage);
        }

        logger(errorMessage);
        logger(instance);
      }

      return isValid;
    });
  }

  /**
   * Validate a schema.
   * This function can be extended in subclasses for instance-wide validation, not just of fields
   * @name validate
   * @function
   * @memberOf Schema
   * @param {Object} instance Object to validate
   * @param {boolean} [shouldThrow=false]
   * @throws if `shouldThrow === true` and instance is invalid
   * @returns {boolean} True if valid
   */
  validate(instance, shouldThrow = false) {
    return this.validateFields(instance, shouldThrow);
  }

  /**
   * Describe the Schema. Outputs an object whose keys are all the fields, and whose values are descriptions of each field.
   * @name describe
   * @function
   * @memberOf Schema
   * @returns {Object}
   */
  describe() {
    const defaultDesc = '<no description>';
    return mapValues(this.fields, field => `${field.description || field.typeDescription || defaultDesc} (required: ${isFieldRequired(field)}, default: ${scaffoldField(field)})`);
  }

  /**
   * Create a scaffold of a schema, which includes required fields (unless specified not to be scaffolded) and default values
   * @name describe
   * @function
   * @memberOf Schema
   * @param {boolean} [onlyRequiredFields=false]
   * @returns {Object} Object with keys of the schema and their default values
   */
  scaffold(onlyRequiredFields = false) {
    return Object.keys(this.fields).reduce((scaffold, fieldName) => {
      const field = this.fields[fieldName];
      const fieldRequired = isFieldRequired(field);

      if (onlyRequiredFields === true && !fieldRequired) {
        return scaffold;
      }

      //can opt out of scaffolding a field - note will not be valid if required
      if (field.avoidScaffold === true) {
        if (fieldRequired) {
          logger(`not scaffolding required field ${fieldName}`, field, scaffold);
        }

        return scaffold;
      }

      const fieldValue = scaffoldField(field);
      return Object.assign(scaffold, { [fieldName]: fieldValue });
    }, {});
  }
}

function createFields(fieldDefinitions) {
  return mapValues(fieldDefinitions,
    (fieldDefinition, fieldName) => {
      //note - assign to field to maintain prototype, i.e. validate() function if instanceof Schema
      return Object.assign(
        createSchemaField(...fieldDefinition),
        { name: fieldName }
      );
    }
  );
}

function createSchemaField(inputField, description = '', additional) {
  //todo - can probably handle this more intelligently...
  //because each field is a new FieldType instance (since it is parameterized), we can overwrite it
  //However, if its a Schema, we dont want to assign to it, so clone it
  let field;
  if (inputField instanceof Schema) {
    field = inputField.clone();
  } else {
    field = Object.assign({}, inputField);
  }

  //in case still here, created by createFieldType() and field is not required
  delete field.required;
  delete field.isRequired;

  return Object.assign(field,
    { description },
    additional
  );
}

function isFieldRequired(field) {
  return (field instanceof Schema) || field.fieldRequired;
}

const defaultScaffoldValue = null;

function scaffoldField(field) {
  return (typeof field.scaffold === 'function' && !field.avoidScaffold) ?
    field.scaffold(field.params) :
    defaultScaffoldValue;
}
