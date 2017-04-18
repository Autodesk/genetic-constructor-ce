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
import Immutable from './Immutable';
import AnnotationSchema from '../schemas/Annotation';
import { merge, assign } from 'lodash';
import { nextColorHex } from '../utils/color/index';
import { symbolMap } from '../inventory/roles';

/**
 * Annotations mark regions of sequence with notes, colors, roles, etc.
 * Annotations are often used in imports due to the hierarchical nature of the Genetic Constructor data model. Blocks do not allow for overlaps, but many sequences have overlapping annotations. Annotations which do not overlap are used to create the Block hierarchy, while overlaps are converted into instances of the Annotation class.
 * @name Annotation
 * @class
 * @extends Immutable
 * @gc Model
 */
export default class Annotation extends Immutable {
  /**
   * Create an annotation
   * @constructor
   * @param {Object} input Input object for the annotation to merge onto the scaffold
   * @param {boolean} frozen
   */
  constructor(input, frozen = true) {
    const scaff = AnnotationSchema.scaffold();
    scaff.color = nextColorHex();
    return super(merge(scaff, input), frozen);
  }

  /**
   * Create an unfrozen annotation, extending input with schema
   * @method classless
   * @memberOf Annotation
   * @param {Object} [input]
   * @returns {Object} an unfrozen JSON, no instance methods
   */
  static classless(input) {
    return assign({}, new Annotation(input, false));
  }

  /**
   * Validate an annotation
   * @method validate
   * @memberOf Annotation
   * @static
   * @param {Object} input Object to validate
   * @param {boolean} [throwOnError=false] Validation should throw on errors
   * @throws if you specify throwOnError
   * @returns {boolean} Whether input valid
   */
  static validate(input, throwOnError) {
    return AnnotationSchema.validate(input, throwOnError);
  }

  /**
   * Get the length of the annotation
   * @property length
   * @memberOf Annotation
   * @returns {number}
   */
  get length() {
    //todo - this is super naive
    return this.end - this.start;
  }

  /**
   * Get the annotation role
   * @method getRole
   * @memberOf Annotation
   * @param {boolean} [userFriendly=true] Return readable text
   * @returns {string} Annotation role
   */
  getRole(userFriendly = true) {
    const friendly = symbolMap[this.role];

    return (userFriendly === true && friendly) ?
      friendly :
      this.role;
  }
}
