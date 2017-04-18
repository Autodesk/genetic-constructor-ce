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
import Instance from '../models/Instance';
import { cloneDeep } from 'lodash';
import OrderDefinition from '../schemas/Order';
import OrderParametersSchema from '../schemas/OrderParameters';
import * as validators from '../schemas/fields/validators';
import safeValidate from '../schemas/fields/safeValidate';
import { submitOrder, getQuote } from '../middleware/order';

const idValidator = (id) => safeValidate(validators.id(), true, id);

/**
 * A construct can be ordered, i.e. synthesized, and the process is saved using an Order. Orders are placed with a foundry.
 * Orders are only saved once they have been completed successfully
 * @name Order
 * @class
 * @extends Instance
 * @gc Model
 */
export default class Order extends Instance {
  /**
   * @constructor
   * @param {Object} [input={}] Must include projectId. projectVersion not necessary. constructIds must be array.
   * @returns {Order}
   */
  constructor(input = {}) {
    invariant(input.projectId, 'project Id is required to make an order');
    invariant(Array.isArray(input.constructIds), 'constructIDs are required on creation for generating number of constructs');
    invariant(input.constructIds.length > 0, 'constructIDs are required on creation for generating number of constructs');

    super(input, OrderDefinition.scaffold());
  }

  /************
   constructors etc.
   ************/

  //return an unfrozen JSON, no instance methods
  static classless(input) {
    return Object.assign({}, cloneDeep(new Order(input)));
  }

  /**
   * validate a complete order (after submitted)
   * @method validate
   * @memberOf Order
   * @static
   */
  static validate(input, throwOnError = false) {
    return OrderDefinition.validate(input, throwOnError);
  }

  /**
   * Validate the parameters of an order
   * @method validateParameters
   * @memberOf Order
   * @static
   * @param input Order.parameters
   * @param throwOnError
   * @throws if throwOnError ==== true
   * @returns {*}
   */
  static validateParameters(input, throwOnError = false) {
    return OrderParametersSchema.validate(input, throwOnError);
  }

  /**
   * validate order prior to submission (ready to hand off to server/foundry)
   * needed: parameters, constructIds, projectId
   * not needed: user, projectVersion, status
   * @method validateSetup
   * @memberOf Order
   * @param input
   * @param throwOnError
   * @throws if throwOnError === true
   * @returns {boolean}
   */
  static validateSetup(input, throwOnError = false) {
    try {
      invariant(idValidator(input.projectId), 'must pass valid projectId');
      invariant(
        Array.isArray(input.constructIds) &&
        input.constructIds.length > 0 &&
        input.constructIds.every(id => idValidator(id)),
        'must pass 1+ valid constructIds'
      );
      OrderParametersSchema.validate(input.parameters, true);
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  clone() {
    //todo - enable this, but remove order-specifics (e.g. status)
    invariant(false, 'cannot clone an order');
  }

  /**
   * Change a property of the Order
   * @method mutate
   * @memberOf Order
   * @param path
   * @param value
   * @throws if the order has been submitted
   * @returns {Instance}
   */
  mutate(path, value) {
    invariant(!this.isSubmitted(), 'cannot change a submitted order');
    return super.mutate(path, value);
  }

  /**
   * Merge an object onto the Order
   * @method merge
   * @memberOf Order
   * @param {Object} obj Object to merge with order
   * @throws if the order has been submitted
   * @returns {Instance}
   */
  merge(obj) {
    invariant(!this.isSubmitted(), 'cannot change a submitted order');
    return super.merge(obj);
  }

  /************
   metadata etc
   ************/

  /**
   * Get order name
   * @method getName
   * @memberOf Order
   * @returns {*|string}
   */
  getName() {
    return this.metadata.name || 'Untitled Order';
  }

  /**
   * Set name of the order
   * @method setName
   * @memberOf Order
   * @param newName
   * @returns {Order}
   */
  setName(newName) {
    return this.mutate('metadata.name', newName);
  }

  /**
   * Check whether the order has been submitted
   * @method isSubmitted
   * @memberOf Order
   * @returns {boolean}
   */
  isSubmitted() {
    return this.status.foundry && this.status.remoteId;
  }

  /**
   * If submitted, return time order placed
   * @method dateSubmitted
   * @memberOf Order
   * @returns {number|null} POSIX time
   */
  dateSubmitted() {
    return this.isSubmitted() ? this.status.timeSent : null;
  }

  /************
   parameters, user, other information
   ************/

  /**
   * Set order parameters
   * @method setParameters
   * @memberOf Order
   * @param parameters
   * @returns {Order}
   */
  setParameters(parameters = {}) {
    invariant(OrderParametersSchema.validate(parameters, false), 'parameters must pass validation');
    return this.mutate('parameters', parameters);
  }

  /**
   * Check whether only ordering a subset of possible combinations
   * @method onlySubset
   * @memberOf Order
   * @returns {boolean}
   */
  onlySubset() {
    const { parameters } = this;
    return (!parameters.onePot && parameters.permutations < this.numberCombinations);
  }

  /************
   quote + submit
   ************/

  /**
   * If supported by the foundry, get a quote for the order
   * @method quote
   * @memberOf Order
   * @param foundry
   */
  quote(foundry) {
    return getQuote(foundry, this);
  }

  //todo - should not need to pass combos to the server. should be able to generated deterministically. Set up better code shsraing between client + server
  //todo - this should update the order itself, not just on the server
  /**
   * Submit the order
   * @method submit
   * @memberOf Order
   * @param {string} foundry ID of the foundry. Currently, 'egf'
   * @param {Array.<Array.<UUID>>} positionalCombinations 2D of positional combinations, used on the server for generating all combinations
   */
  submit(foundry, positionalCombinations) {
    //may want to just set the foundry on the order directly?
    return submitOrder(this, foundry, positionalCombinations)
      .then(result => new Order(result));
  }
}
