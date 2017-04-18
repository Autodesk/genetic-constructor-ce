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
import { cloneDeep, assign, merge } from 'lodash';
import invariant from 'invariant';
import Immutable from './Immutable';
import InstanceSchema from '../schemas/Instance';
import safeValidate from '../schemas/fields/safeValidate';
import { number } from '../schemas/fields/validators';

const versionValidator = (ver, required = false) => safeValidate(number(), required, ver);

/**
 * Instances are immutable objects, which conform to a schema, and provide an explicit API for modifying their data.
 * Instances have an ID, metadata, and are versioned (explicitly or implicitly by the Instance which owns them)
 * @name Instance
 * @class
 * @extends Immutable
 * @gc Model
 */
export default class Instance extends Immutable {
  /**
   * Create an instance
   * @constructor
   * @param {Object} input Input object
   * @param {Object} [subclassBase] If extending the class, additional fields to use in the scaffold
   * @param {Object} [frozen=true] Additional fields, beyond the scaffold
   * @returns {Instance} An instance, frozen if not in production
   */
  constructor(input = {}, subclassBase, frozen) {
    invariant(typeof input === 'object', 'must pass an object (or leave undefined) to model constructor');

    return super(merge(
      assign(InstanceSchema.scaffold(), subclassBase), //perf. NB - this is only valid so long as no overlapping fields
      input,
    ), frozen);
  }

  /**
   * See {@link Immutable.mutate}
   * @method mutate
   * @memberOf Instance
   */
  mutate(path, value) {
    return super.mutate(path, value);
  }

  /**
   * See {@link Immutable.merge}
   * @method merge
   * @memberOf Instance
   */
  merge(obj) {
    return super.merge(obj);
  }

  /**
   * Clone an instance, adding the parent to the ancestry of the child Instance.
   * @method clone
   * @memberOf Instance
   * @param {object|null|string} [parentInfo={}] Parent info for denoting ancestry. If pass null to parentInfo, the instance is simply cloned, and nothing is added to the history. If pass a string, it will be used as the version.
   * @param {Object} [overwrites={}] object to merge into the cloned Instance
   * @throws if version is invalid (not provided and no field version on the instance)
   * @returns {Instance}
   */
  clone(parentInfo = {}, overwrites = {}) {
    const cloned = cloneDeep(this);
    let clone;

    if (parentInfo === null) {
      clone = merge(cloned, overwrites);
    } else {
      const inputObject = (typeof parentInfo === 'string') ?
      { version: parentInfo } :
        parentInfo;

      const parentObject = Object.assign({
        id: cloned.id,
        version: cloned.version,
      }, inputObject);

      invariant(versionValidator(parentObject.version), 'must pass a valid version (SHA), got ' + parentObject.version);

      const parents = [parentObject, ...cloned.parents];

      //unclear why, but merging parents was not overwriting the clone, so shallow assign parents specifically
      clone = Object.assign(merge(cloned, overwrites), { parents });
      delete clone.id;
    }

    return new this.constructor(clone);
  }
}
