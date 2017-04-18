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
import urlRegex from 'url-regex';
import _ from 'lodash';
import { dnaStrictRegexp, dnaLooseRegexp } from '../../utils/dna';
import { id as idRegex } from '../../utils/regex';
import { validRealMd5, validPseudoMd5 } from '../../utils/sequenceMd5';

//any additions to this file should be tested, and everything will be exported, so only export real validators

/**
 * Validators are parameterized functions used to validate the correctness of some input.
 *
 * Validators are consumed by fields, which are in turned used by Schemas.
 *
 * In general, when defining a Schema you should use fields instead of validators directly. However, you may want to use these when just running validation. Note that they expect parameters.
 *
 * @name validators
 * @memberOf module:Schemas
 *
 * @example
 * let validator = number({min:5});
 * validator(4); //false
 * validator(40); //true
 */

export const any = params => input => {};

export const id = params => input => {
  if (!idRegex().test(input)) {
    return new Error(`${input} is not a RFC4122-compliant UUID`);
  }
};

export const string = ({ regex, max, min } = {}) => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }
  if (isNumber(max) && input.length > max) {
    return new Error(`${input} is longer than max length ${max}`);
  }
  if (isNumber(min) && input.length < min) {
    return new Error(`${input} is shorter than min length ${min}`);
  }
};

export const number = ({ reals, min, max } = {}) => input => {
  if (!isNumber(input)) {
    return new Error(`input ${input} is not a number`);
  }

  if (reals && !isRealNumber(input)) {
    return new Error(`input ${input} is not a real number`);
  }

  if (isNumber(min) && input < min) {
    return new Error(`input ${input} is less than minimum ${min}`);
  }

  if (isNumber(max) && input > max) {
    return new Error(`input ${input} is greater than maximum ${max}`);
  }
};

export const func = params => input => {
  if (!isFunction(input)) {
    return new Error(`${input} is not a function`);
  }
};

export const array = params => input => {
  if (!Array.isArray(input)) {
    return new Error(`${input} is not an array`);
  }
};

export const object = params => input => {
  if (!isRealObject(input)) {
    return new Error(`${input} is not an object`);
  }
};

export const bool = params => input => {
  if (!(input === true || input === false)) {
    return new Error(`${input} is not a boolean`);
  }
};

export const undef = params => input => {
  if (input !== undefined) {
    return new Error(`${input} is not undefined`);
  }
};

/*******
 string subtypes
 *******/

export const sequence = (params = {}) => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }

  const sequenceRegex = params.loose === true ? dnaLooseRegexp() : dnaStrictRegexp();

  if (sequenceRegex.test(input) !== true) {
    console.log('got error validating sequence', input); //eslint-disable-line no-console
    return new Error(`${input} is not a valid sequence`);
  }
};

export const sequenceMd5 = ({ real = false } = {}) => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }

  if (!validPseudoMd5(input)) {
    return new Error(`${input} is not a valid pseudoMd5 (md5[start:end])`);
  }

  if (real === true && !validRealMd5(input)) {
    return new Error(`${input} is not a simple md5`);
  }
};

//todo - get a robust one, i just hacked this together
export const email = params => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  if (!emailRegex.test(input)) {
    return new Error(`${input} is not a valid email`);
  }
};

//remove package if you remove this test
export const version = params => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }

  const shaRegex = /^[0-9a-f]{40}$/;

  if (!shaRegex.test(input)) {
    return new Error(`${input} is not a valid SHA1 version`);
  }
};

//remove package if you remove this test
export const url = params => input => {
  if (!isString(input)) {
    return new Error(`${input} is not a string`);
  }

  if (!urlRegex({ exact: true }).test(input)) {
    return new Error(`${input} is not a valid url`);
  }
};

export const date = params => input => {
  if (!isDate(input)) {
    return new Error(`${input} is not a valid date`);
  }
};

/*******
 complex
 *******/

export const instanceOf = type => input => {
  if (!input instanceof type) {
    return new Error(`${input} is not an instance of ${type}`);
  }
};

//reference check only. Might want another one for deep equality check
export const equal = checker => input => {
  if (!Object.is(checker, input)) {
    return new Error(`${input} does not equal ${checker}`);
  }
};

export const shape = (fields, { required = false } = {}) => input => {
  if (!isRealObject(fields)) {
    return new Error(`shape ${fields} is not an object`);
  }

  const checker = (key) => {
    return safeValidate(fields[key], required, input[key]);
  };

  if (!Object.keys(fields).every(checker)) {
    return new Error(`input ${input} passed to shape did not pass validation`);
  }
};

export const oneOf = possible => input => {
  if (!Array.isArray(possible)) {
    return new Error(`possible values ${possible} for oneOf not an array`);
  }

  if (possible.indexOf(input) < 0) {
    return new Error(input + ' not found in ' + possible.join(', '));
  }
};

//can pass either function to validate, or an object to check instanceof
export const oneOfType = (types, { required = false } = {}) => input => {
  if (!Array.isArray(types)) {
    return new Error(`possible types ${types} for oneOfType not an array`);
  }

  const checker = type => {
    return isFunction(type) ?
      safeValidate(type, required, input) :
    input instanceof type;
  };

  if (!types.some(checker)) {
    return new Error(`input ${input} passed to oneOfType not found in ${types}`);
  }
};

export const arrayOf = (validator, { required = false } = {}) => input => {
  if (!isFunction(validator)) {
    return new Error(`validator ${validator} passed to arrayOf is not a function`);
  }

  if (!Array.isArray(input)) {
    return new Error(`input ${input} passed to arrayOf is not an array`);
  }

  if (required && !input.length) {
    return new Error(`this arrayOf requires values, but got an empty array: ${input}`);
  }

  if (_.some(input, (item) => !safeValidate(validator, required, item))) {
    return new Error(`input ${input} passed to arrayOf did not pass validation`);
  }
};

export const objectOf = (validator, { required = false } = {}) => input => {
  if (!isFunction(validator)) {
    return new Error(`validator ${validator} passed to arrayOf is not a function`);
  }

  if (!isRealObject(input)) {
    return new Error(`input ${input} passed to object is not a plain object, or is an array`);
  }

  if (required && !Object.keys(input).length) {
    return new Error(`this objectOf requires values, but got an empty object: ${input}`);
  }

  if (_.some(input, (value, key) => !safeValidate(validator, required, value, key))) {
    return new Error(`input ${input} passed to objectOf did not pass validation`);
  }
};

//utils

function isString(input) {
  return getPropType(input) === 'string' || input instanceof String;
}

function isRealObject(input) {
  return input !== null && getPropType(input) === 'object';
}

function isNumber(input) {
  return getPropType(input) === 'number';
}

function isRealNumber(input) {
  return getPropType(input) === 'number' && !isNaN(input) && isFinite(input);
}

function isFunction(input) {
  return getPropType(input) === 'function';
}

function isDate(input) {
  return getPreciseType(input) === 'date';
}

// Equivalent of `typeof` but with special handling for array and regexp.
function getPropType(propValue) {
  const propType = typeof propValue;
  if (Array.isArray(propValue)) {
    return 'array';
  }

  if (propValue instanceof RegExp) {
    // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp.
    return 'object';
  }

  return propType;
}

// This handles more types than `getPropType`, e.g. Date and regexp
function getPreciseType(propValue) {
  const propType = getPropType(propValue);
  if (propType === 'object') {
    if (propValue instanceof Date) {
      return 'date';
    } else if (propValue instanceof RegExp) {
      return 'regexp';
    }
  }

  return propType;
}
