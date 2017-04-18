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
/**
 * @module Actions_Orders
 * @memberOf module:Actions
 */
import invariant from 'invariant';
import Order from '../models/Order';
import { getOrder, getOrders } from '../middleware/order';
import * as ActionTypes from '../constants/ActionTypes';
import * as projectActions from '../actions/projects';
import * as blockSelectors from '../selectors/blocks';
import { cloneDeep, merge, flatten, range, shuffle } from 'lodash';
import * as instanceMap from '../store/instanceMap';

//hack - so this is super weird - jsdoc will work when you have some statements here. This file needs 1!
const spaceFiller = 10; //eslint-disable-line no-unused-vars

/**
 * List a user's orders
 * @function
 * @param {UUID} projectId
 * @param {boolean} [avoidCache=false]
 * @returns {Array.<Order>} Manifests of user's Orders
 */
export const orderList = (projectId, avoidCache = false) => {
  return (dispatch, getState) => {
    const cached = instanceMap.projectOrdersLoaded(projectId);
    if (cached && avoidCache !== true) {
      return Promise.resolve(instanceMap.getProjectOrders(projectId));
    }

    return getOrders(projectId)
      .then(ordersData => {
        const orders = ordersData.map(order => new Order(order));

        instanceMap.saveProjectOrders(projectId, ...orders);

        dispatch({
          type: ActionTypes.ORDER_STASH,
          orders,
        });
        return orders;
      });
  };
};

/**
 * Retreive an order
 * @function
 * @param {UUID} projectId
 * @param {UUID} orderId
 * @param {boolean} [avoidCache=false]
 * @returns {Promise}
 * @resolve {Order}
 * @reject {Response}
 */
export const orderGet = (projectId, orderId, avoidCache = false) => {
  return (dispatch, getState) => {
    const cached = instanceMap.orderLoaded(orderId);

    if (cached && avoidCache !== true) {
      return Promise.resolve(instanceMap.getOrder(orderId));
    }

    return getOrder(projectId, orderId)
      .then(orderData => {
        const order = new Order(orderData);

        instanceMap.saveOrder(order);

        dispatch({
          type: ActionTypes.ORDER_STASH,
          order,
        });
        return order;
      });
  };
};

/**
 * Create an order with basic fields
 * @function
 * @param {UUID} projectId
 * @param {Array.<UUID>} constructIds Construct Ids involved in the order
 * @param {Object} parameters
 * @returns {Order}
 */
export const orderCreate = (projectId, constructIds = [], parameters = {}) => {
  return (dispatch, getState) => {
    invariant(projectId, 'must pass project ID');

    invariant(Array.isArray(constructIds) && constructIds.length, 'must pass array of construct IDs to use in order');
    //make sure we have specs
    invariant(constructIds.every(id => dispatch(blockSelectors.blockIsSpec(id))), 'all constructs must be specs (no empty option lists, and each leaf node must have a sequence)');

    invariant(typeof parameters === 'object', 'paramaters must be object');
    invariant(!Object.keys(parameters).length || Order.validateParameters(parameters), 'parameters must pass validation if you pass them in on creation');

    const numberCombinations = constructIds.reduce((acc, constructId) => acc + dispatch(blockSelectors.blockGetNumberCombinations(constructId, false)), 0);

    const order = new Order({
      projectId,
      constructIds,
      parameters,
      numberCombinations,
    });

    //add order to the store
    dispatch({
      type: ActionTypes.ORDER_CREATE,
      order,
    });

    return order;
  };
};

//todo - selector / put in order model directly
//todo - ensure this code (generating constructs from order + rollup) is shared between client and server
/**
 * Generate all combinations for the constructs of an order (i.e., expand list blocks etc.)
 *
 * Parameters must be valid. returns an array with the generated constructs, does not affect the order itself.
 * @function
 * @param {UUID} orderId
 * @param {boolean} [allPossibilities=false] Force all combinations if only a subset specified in order parameters
 * @throws If the constructs are not specs
 * @returns {function(*, *)}
 */
export const orderGenerateConstructs = (orderId, allPossibilities = false) => {
  return (dispatch, getState) => {
    const state = getState();
    const order = state.orders[orderId];
    const { constructIds, parameters } = order;
    invariant(Order.validateParameters(parameters), 'parameters must pass validation');

    //for each constructId, get construct combinations as blocks
    //flatten all combinations into a single list of combinations
    const combinations = flatten(constructIds.map(constructId => dispatch(blockSelectors.blockGetCombinations(constructId, true))));

    if (!order.onlySubset() || allPossibilities === true) {
      return combinations;
    }

    return combinations.filter((el, idx, arr) => parameters.activeIndices[idx] === true);
  };
};

//todo - this logic should go into order model, wrap in try catch
/**
 * Set the parameters of the order
 * @function
 * @param {UUID} orderId
 * @param {Object} inputParameters New parameters, or parameters to merge
 * @param {boolean} [shouldMerge=false]
 * @returns {Order}
 */
export const orderSetParameters = (orderId, inputParameters = {}, shouldMerge = false) => {
  return (dispatch, getState) => {
    const oldOrder = getState().orders[orderId];
    const parameters = shouldMerge ? merge(cloneDeep(oldOrder.parameters), inputParameters) : inputParameters;

    const { numberCombinations } = oldOrder;
    if (!parameters.onePot && parameters.permutations < numberCombinations) {
      const keepers = (parameters.combinatorialMethod === 'Maximum Unique Set')
        ?
        //may generate extras so slice at the end
        range(numberCombinations)
          .filter(idx => idx % Math.floor(numberCombinations / parameters.permutations) === 0)
        :
        shuffle(range(numberCombinations));

      const map = keepers.slice(0, parameters.permutations)
        .reduce((acc, idx) => Object.assign(acc, { [idx]: true }), {});

      parameters.activeIndices = map;
    }

    if (parameters.onePot) {
      parameters.sequenceAssemblies = false;
    }

    invariant(Order.validateParameters(parameters), 'parameters must pass validation');
    const order = oldOrder.setParameters(parameters);

    dispatch({
      type: ActionTypes.ORDER_SET_PARAMETERS,
      order,
    });

    return order;
  };
};

/**
 * Set the name of an order
 * @function
 * @param {UUID} orderId
 * @param {string} name
 * @returns {Order}
 */
export const orderSetName = (orderId, name) => {
  return (dispatch, getState) => {
    const oldOrder = getState().orders[orderId];
    const order = oldOrder.setName(name);

    dispatch({
      type: ActionTypes.ORDER_SET_NAME,
      order,
    });
    return order;
  };
};

/**
 * Submit an order. Attempt to submit it to the foundry specified
 *
 * If successful, this will freeze the order and save it on the server, adding it to the project's order history.
 * @function
 * @param {UUID} orderId
 * @param {string} foundry
 * @returns {Promise}
 * @resolve {order} The fully valid order, with status set
 * @reject {String|Object} reason for failure, dependent on the foundry
 */
export const orderSubmit = (orderId, foundry) => {
  return (dispatch, getState) => {
    const state = getState();
    const retrievedOrder = state.orders[orderId];
    invariant(retrievedOrder, 'order not in the store...');
    invariant(!retrievedOrder.isSubmitted(), 'Cant submit an order twice');

    const { projectId, projectVersion } = retrievedOrder;
    const project = state.projects[projectId];

    invariant(project, 'project must be loaded');

    //todo - should be generated on the server. no need to do that here.

    const positionalCombinations = retrievedOrder.constructIds.reduce((acc, constructId) => {
      return Object.assign(acc, { [constructId]: dispatch(blockSelectors.blockGetPositionalCombinations(constructId, true)) });
    }, {});

    //if want the latest state, so need to save first
    //can set projectVersion, or server will do it, so lets just be specific
    const savePromise = (!Number.isInteger(projectVersion))
      ?
      dispatch(projectActions.projectSave(projectId, true))
        .then(version => {
          return retrievedOrder.mutate('projectVersion', version);
        })
      :
      Promise.resolve(retrievedOrder);

    return savePromise
      .then(order => order.submit(foundry, positionalCombinations))
      .then(orderData => {
        const order = new Order(orderData);

        dispatch({
          type: ActionTypes.ORDER_SUBMIT,
          order,
        });

        return order;
      });
  };
};

/**
 * Remove an order from the store
 * @function
 * @param {UUID} orderId
 * @returns {UUID} Order ID
 */
export const orderDetach = (orderId) => {
  return (dispatch, getState) => {
    const order = getState().orders[orderId];

    invariant(!order.isSubmitted(), 'cannot delete a submitted order');

    dispatch({
      type: ActionTypes.ORDER_DETACH,
      orderId,
    });
    return orderId;
  };
};
