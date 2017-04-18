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

import _, { every, isEqual } from 'lodash';
import invariant from 'invariant';
import RollupSchema from '../schemas/Rollup';
import Project from '../models/Project';

//note - not immutable, this is just a helper, primarily on the server

/**
 * Rollups contain a 'complete' project, and are what are sent between client and server
 *
 * Rollups take the form { project: {}, blocks: {} } and may include a field 'sequence' (see the schema
 *
 * @name Rollup
 * @class
 * @gc Model
 */
export default class Rollup {
  constructor(input = {}) {
    invariant(typeof input === 'object', 'input must be an object');

    //assign since merging twice would be hellllla slow
    const scaffolded = _.assign(RollupSchema.scaffold(), input);

    if (Object.keys(input).length) {
      Rollup.validate(scaffolded, true);
    }

    //assign is fine, since should be empty
    return _.assign(this, scaffolded);
  }

  /**
   * Validate a Rollup object
   * @method validate
   * @memberOf Rollup
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @param {boolean} [heavy] deeply check project + blocks, true by default in NODE_ENV=test. If false, basic structure and IDs are valid. If true, validate everything.
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Rollup.validate(new Block()); //false
   * Rollup.validate(new Rollup()); //true
   */
  static validate(input, throwOnError, heavy) {
    return RollupSchema.validate(input, throwOnError, heavy);
  }

  /**
   * Compare two rollups' project and blocks
   * ignoring versioning information, e.g. see Project.compare()
   *
   * Note that this is expensive, especially for large rollups
   * @method compare
   * @memberOf Rollup
   * @static
   * @param {Rollup} one
   * @param {Rollup} two
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when not equal
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * const roll = new Rollup();
   * const other = Object.assign({}, roll);
   *
   * Rollup.compare(roll, other); //true
   * Rollup.compare(roll, new Rollup()); //false
   */
  static compare(one, two, throwOnError = false) {
    if ((typeof one === 'object') && (typeof two === 'object') && (one === two)) {
      return true;
    }

    try {
      invariant(one && two, 'must pass two rollups');

      //compare projects, throwing if error
      Project.compare(one.project, two.project, true);

      //compare blocks
      invariant(Object.keys(one.blocks).length === Object.keys(two.blocks).length, 'blocks are different number');
      invariant(every(one.blocks, (value, key) => {
        return value === two.blocks[key] || isEqual(value, two.blocks[key]);
      }), 'blocks do not match');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  // create rollup from project (as POJO) and N blocks (as POJO)
  // assigns projectId to all blocks
  static fromArray(project, ...blocks) {
    invariant(Project.validate(project), 'must pass valid project');

    return new Rollup({
      project,
      blocks: _.reduce(blocks, (acc, block) => Object.assign(acc, {
        [block.id]: Object.assign(block, { projectId: project.id }),
      }), {}),
    });
  }

  getManifest() {
    return this.project;
  }

  getBlock(blockId) {
    return this.blocks[blockId] || null;
  }

  getBlocks(...blockIds) {
    if (!blockIds.length) {
      return this.blocks;
    }
    return _.pick(this.blocks, blockIds);
  }

  /**
   * If ID is provided, recursively get all options of a block and its components. Does not include block itself
   * If no ID provided, gets all list options in the project
   * @param {UUID} [blockId] root to get components of
   * @returns {object} with keys of blocks
   */
  getOptions(blockId) {
    if (blockId) {
      const block = this.getBlock(blockId);

      if (!block) {
        throw new Error(`Block ${blockId} not in rollup: ${this.project.id}`);
      }

      const { options } = block;

      return Object.keys(options)
        .map(optionId => this.getBlock(optionId))
        .reduce((acc, option) => Object.assign(acc, { [option.id]: option }), {});
    }

    //if no id provided, get all blocks which are options
    const optionDict = _.merge(_.map(this.blocks, block => block.options));
    return _.pickBy(this.blocks, (block, blockId) => optionDict[blockId]);
  }

  /**
   * If ID is provided, recursively get all components of a block. Includes block itself
   * If no ID provided, gets all components in the project
   * @param {UUID} [blockId] root to get components of
   * @param [acc={}] accumulator
   * @returns {object} with keys of blocks
   */
  getComponents(blockId, acc = {}) {
    if (blockId) {
      const block = this.getBlock(blockId);

      if (!block) {
        throw new Error(`Block ${blockId} not in rollup: ${this.project.id}`);
      }

      acc[blockId] = block;

      //recurse
      _.forEach(block.components, compId => this.getComponents(compId, acc));

      return acc;
    }

    //if no blockId, get all blocks which are not options
    //if no id provided, get all blocks which are options
    const optionDict = _.merge(_.map(this.blocks, block => block.options));
    return _.omitBy(this.blocks, (block, blockId) => optionDict[blockId]);
  }

  /**
   * @description Recursively get contents (components + children) of a block (and returns block itself, in components)
   * @param {UUID} blockId root to get components of
   * @returns {object} { components: {}, options: {} }
   */
  getContents(blockId) {
    invariant(blockId, 'block ID is required');

    const components = this.getComponents(blockId);

    const options = Object.keys(components)
      .map(compId => components[compId])
      .filter(comp => comp.rules.list === true)
      .reduce((optionsAcc, component) => {
        const componentOptions = this.getOptions(component.id);
        return Object.assign(optionsAcc, componentOptions);
      }, {});

    return {
      components,
      options,
    };
  }
}
