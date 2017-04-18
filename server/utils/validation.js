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
import Block from '../../src/models/Block';
import Project from '../../src/models/Project';
import Order from '../../src/models/Order';
import * as validators from '../../src/schemas/fields/validators';
import { id as idRegex } from '../../src/utils/regex';

import { errorNoIdProvided, errorInvalidId } from './errors';

export const validateBlock = (instance) => {
  return Block.validate(instance, false);
};

export const validateProject = (instance) => {
  return Project.validate(instance, false);
};

export const validateOrder = instance => {
  return Order.validate(instance, false);
};

export const validateId = id => idRegex().test(id);

//throws on error
const idValidator = validators.id();

/**
 * @description validates an ID. callback called with error if has one, otherwise without any arguments
 * @param {uuid} id
 * @param {function} callback
 */
export const assertValidId = (id, callback = () => {}) => {
  if (!id || typeof id !== 'string') {
    callback(errorNoIdProvided);
  }
  try {
    idValidator(id);
    callback();
  } catch (err) {
    callback(errorInvalidId);
  }
};
