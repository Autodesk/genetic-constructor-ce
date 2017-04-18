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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import { orderApiPath } from './utils/paths';
import { headersGet, headersPost } from './utils/headers';
import Order from '../models/Order';

// future - dont limit foundries statically
// likely want a registry like for inventory and hit their respective functions for each foundry
//hack - passing combinations for now because easy to generate on client, but should just generate on the server
export const submitOrder = (order, foundry = 'egf', positionalCombinations, validate = false) => {
  invariant(foundry === 'egf' || (foundry === 'test' && process.env.NODE_ENV === 'test'), 'must submit a foundry (right now, only egf works');
  invariant(Order.validateSetup(order), 'order be valid partial order (prior to ID + foundry data)');
  invariant(positionalCombinations, 'must pass positional combinations - object with key constructId, value is array returned from block selector blockGetPositionalCombinations. This is a bit hacky, but the way it is for now...');
  invariant(order.constructIds.length, 'must have construct IDs');
  invariant(typeof positionalCombinations === 'object' && order.constructIds.every(constructId => Array.isArray(positionalCombinations[constructId])), 'must pass positional combinations for each constructID, { [constructId]: [ [...], ... ]');

  const url = validate === true ?
    orderApiPath('validate') :
    orderApiPath(`${order.projectId}`);

  const stringified = JSON.stringify({
    foundry,
    order,
    positionalCombinations,
  });

  return rejectingFetch(url, headersPost(stringified))
    .then(resp => resp.json());
};

export const validateOrder = (order, foundry, positionalCombinations) => {
  return submitOrder(order, foundry, positionalCombinations, true);
};

/*
 //future - implement once supported
 const getQuote = (order, foundry) => {
 invariant(false, 'not implemented');
 };
 */

export const getOrder = (projectId, orderId, avoidCache = false) => {
  const url = orderApiPath(`${projectId}/${orderId}`);
  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};

export const getOrders = (projectId, avoidCache = false) => {
  const url = orderApiPath(`${projectId}`);
  return rejectingFetch(url, headersGet())
    .then(resp => resp.json());
};
