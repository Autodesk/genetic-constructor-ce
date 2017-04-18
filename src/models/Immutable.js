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
import { set as pathSet, unset as pathUnset, cloneDeep, assign, merge } from 'lodash';
import invariant from 'invariant';
import deepFreeze from 'deep-freeze';

/**
 * The Immutable class creates Immutable objects, whose properties are immutable and cannot be modifed except through their defined API.
 * @name Immutable
 * @class
 *
 * @gc Model
 */
export default class Immutable {
  /**
   * @constructor
   * @param {Object} input
   * @param {Boolean} [frozen=true] Make it frozen (an immutable)
   * @returns {Immutable}
   */
  constructor(input = {}, frozen = true) {
    invariant(typeof input === 'object', 'must pass an object Immutable constructor');

    assign(this, input);

    if (frozen !== false && process.env.NODE_ENV !== 'production') {
      deepFreeze(this);
    }

    return this;
  }

  /**
   * Change the value of a property, returning a new Immutable
   * Uses {@link https://lodash.com/docs#set lodash _.set()} syntax for path, e.g. `a[0].b.c`
   * @method mutate
   * @memberOf Immutable
   * @param {string} path Path of property to change
   * @param {*} value New value
   * @returns {Immutable} A new instance
   * @example
   * const initial = new Immutable({some: {value: 9}});
   * initial.some.value; //9
   * const next = initial.mutate('some.value', 10);
   * next.some.value; //10
   * initial.some.value; //9
   */
  mutate(path, value) {
    //use cloneDeep and perform mutation prior to calling constructor because constructor may freeze object
    const base = cloneDeep(this);
    pathSet(base, path, value);
    return new this.constructor(base);
  }

  /**
   * Remove a property, returning a new Immutable
   * Uses {@link https://lodash.com/docs#unset lodash _.unset()} syntax for path, e.g. `a[0].b.c`
   * @method remove
   * @memberOf Immutable
   * @param {string} path Path of property to change
   * @returns {Immutable} A new instance
   * @example
   * const initial = new Immutable({some: {value: 9}});
   * initial.some.value; //9
   * const next = initial.remove('some.value');
   * next.some.value; //undefined
   * initial.some.value; //9
   */
  remove(path) {
    //use cloneDeep and perform mutation prior to calling constructor because constructor may freeze object
    const base = cloneDeep(this);
    pathUnset(base, path);
    return new this.constructor(base);
  }

  /**
   * Return a new Immutable with input object merged into it
   * Uses {@link https://lodash.com/docs#merge lodash _.merge()} for performing a deep merge
   * @method merge
   * @memberOf Immutable
   * @param {Object} obj Object to merge into instance
   * @returns {Immutable} A new instance, with `obj` merged in
   * @example
   * const initial = new Immutable();
   * const next = initial.merge({new: 'stuff'});
   */
  merge(obj) {
    //use merge and perform mutation prior to calling constructor because constructor may freeze object
    return new this.constructor(merge({}, this, obj));
  }
}
