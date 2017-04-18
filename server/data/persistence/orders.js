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
import { errorDoesNotExist, errorInvalidModel } from '../../utils/errors';
import { validateOrder } from '../../utils/validation';
import { dbHead, dbGet, dbPost, dbDelete, dbPruneResult } from '../middleware/db';
import * as projectVersions from './projectVersions';

//do we need consistent result transformation, like for projects?

export const orderList = (projectId, version) => {
  const versionQuery = Number.isInteger(version) ? `?version=${version}` : '';

  return dbGet(`orders/${projectId}${versionQuery}`)
    .then(results => results.map(dbPruneResult));
};

export const orderExists = (orderId, projectId) => {
  return dbHead(`orders/id/${orderId}`)
    .then(() => true);
};

export const orderGet = (orderId, projectId) => {
  return dbGet(`orders/id/${orderId}`)
    .then(dbPruneResult);
};

export const orderWrite = (orderId, order, userId) => {
  invariant(order.projectId, 'must have projectId defined');
  invariant(Number.isInteger(order.projectVersion), 'must have project version defined');
  invariant(!!order.status.foundry, 'foundry must be defined to write');

  const idedOrder = Object.assign({}, order, {
    id: orderId,
    user: userId,
  });

  if (!validateOrder(idedOrder)) {
    return Promise.reject(errorInvalidModel);
  }

  //make sure the given project @ version exists
  return projectVersions.projectVersionExists(idedOrder.projectId, idedOrder.projectVersion)
    .catch(err => {
      if (err === errorDoesNotExist) {
        return Promise.reject(errorInvalidModel);
      }
      return Promise.reject(err);
    })
    .then(() => {
      //actually write the order
      return dbPost(`orders/`, userId, idedOrder, {}, {
        id: idedOrder.id,
        projectId: order.projectId,
        projectVersion: order.projectVersion,
        type: order.status.foundry,
      });
    });
};

//not sure why you would do this...
export const orderDelete = (orderId, projectId) => {
  //do not allow... will not hit code below
  invariant(false, 'you cannot delete an order');

  return dbDelete(`orders/id/${orderId}`);
};
