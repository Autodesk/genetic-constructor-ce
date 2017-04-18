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
import express from 'express';
import {
  errorDoesNotExist,
  errorInvalidModel,
} from './../utils/errors';
import { merge } from 'lodash';
import * as projectPersistence from './../data/persistence/projects';
import * as projectVersions from './../data/persistence/projectVersions';
import * as orderPersistence from './../data/persistence/orders';
import * as snapshots from './../data/persistence/snapshots';
import { pruneUserObject } from '../user/utils';
import { projectPermissionMiddleware } from './../data/permissions';

import Order from '../../src/models/Order';
import { submit as testSubmit, validate as testValidate } from './test';
import { submit, validate } from './egf';
import saveCombinations from '../../src/utils/generators/orderConstructs';
import debug from 'debug';

const router = express.Router(); //eslint-disable-line new-cap
const logger = debug('constructor:order');

//in theory, we could get rid of this part of the route, and just assign the projectID basic on the project that is posted
router.param('projectId', (req, res, next, id) => {
  Object.assign(req, { projectId: id });
  next();
});

const validateOrderMiddleware = (req, res, next) => {
  const { user } = req;

  const { foundry, order, positionalCombinations } = req.body;
  if (order.status.foundry && order.status.remoteId) {
    logger(`[Middleware] order already submitted: ${order.id} `);
    return res.status(422).send('cannot submit an already submitted order');
  }

  if (!Order.validateSetup(order)) {
    logger(`[Middleware] setup invalid: ${order.id}`);
    return res.status(422).send('error validating order setup');
  }

  //future - this should be dynamic, based on the foundry, pulling from a registry
  if (!(foundry === 'egf' || (process.env.NODE_ENV === 'test' && foundry === 'test') )) {
    return res.status(501).send('foundry must be EGF');
  }

  const prunedUser = pruneUserObject(user);

  //implicitly check that project @ version exists
  //implicitly ensures that all blocks are valid, since written projects are validated
  const getPromise = Number.isInteger(order.projectVersion) ?
    projectVersions.projectVersionGet(order.projectId, order.projectVersion) :
    projectPersistence.projectGet(order.projectId);

  getPromise
    .then(rollup => {
      //block on sample project
      if (rollup.project.rules.frozen) {
        res.status(422);
        return next('Cannot order sample project');
      }

      const projectVersion = rollup.project.version;

      const constructNames = order.constructIds.map(constructId => rollup.blocks[constructId].metadata.name || 'Untitled Construct');

      merge(order, {
        user: user.uuid,
        projectVersion,
        metadata: {
          constructNames,
        },
      });

      logger('[Middleware] Generating combinations...');

      //note - this code is not very memory efficient and should be optimized more

      //todo - compute positionalCombinations here, not as part of POST
      //should make sure that all positional combinations are defined

      //generate combinations, given positonalCombinations
      let allConstructs = [];
      order.constructIds.forEach(constructId => {
        const constructPositionalCombinations = positionalCombinations[constructId];
        allConstructs = allConstructs.concat(saveCombinations(constructPositionalCombinations));
      });

      //prune the list based on the parameters
      const constructListStrings = (!order.parameters.onePot && order.parameters.permutations < order.numberCombinations) ?
        Object.keys(order.parameters.activeIndices).map(index => allConstructs[index]) :
        allConstructs;

      //convert to normal object now that we have the smaller size (hopefully)
      //const constructList = _.map(constructListStrings, JSON.parse);

      Object.assign(req, {
        order,
        rollup,
        foundry,
        projectVersion,
        prunedUser,
        numberPermutations: allConstructs.length, //assigning allConstructs directly to req eats memory
        constructList: constructListStrings,
      });

      next();
    })
    .catch(err => {
      console.log('[Order Middleware]', err, err.stack);
      res.status(500).send(err);
    });
};

router.post('/validate', validateOrderMiddleware, (req, res, next) => {
  const { order, rollup, prunedUser, foundry, constructList } = req;

  //future - submit should be dynamic, based on the foundry, pulling from a registry

  const validatePromise = (process.env.NODE_ENV === 'test' && foundry === 'test') ?
    testValidate(order, prunedUser, constructList, rollup) :
    validate(order, prunedUser, constructList, rollup);

  validatePromise
    .then(() => {
      res.status(200).send(true);
    })
    .catch(err => {
      logger(`[Validate] error validating order ${order.id} at ${foundry}`);
      logger(err);
      res.status(422).send(err);
    });
});

router.route('/:projectId/:orderId?')
  .all(projectPermissionMiddleware)
  .get((req, res, next) => {
    const { user, projectId } = req; //eslint-disable-line no-unused-vars
    const { orderId } = req.params;

    if (!!orderId) {
      return orderPersistence.orderGet(orderId)
        .then(order => res.status(200).json(order))
        .catch(err => next(err));
    }

    return orderPersistence.orderList(projectId)
      .then(orders => res.status(200).json(orders))
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(200).json([]);
        }
        next(err);
      });
  })
  .post(validateOrderMiddleware, (req, res, next) => {
    /* order flow:
     - validation
     - get project @ version (latest if no version specified)
     - generate combinatorials
     - submit the order to the foundry
     - create snapshot with type order
     - return order to client
     */

    const { order, rollup, projectVersion, user, prunedUser, projectId, foundry, numberPermutations, constructList } = req;

    if (projectId !== order.projectId) {
      return res.status(422).send('project ID and order.projectId must match');
    }

    logger(`
Order request:
Order ID ${order.id}
Project ID ${order.projectId}
Project Version ${order.projectVersion}
Constructs ${order.constructIds.join(', ')}
User ${user.uuid}
`);

    //future - submit should be dynamic, based on the foundry, pulling from a registry

    const submissionPromise = (process.env.NODE_ENV === 'test' && foundry === 'test') ?
      testSubmit(order, prunedUser, constructList, rollup) :
      submit(order, prunedUser, constructList, rollup);

    return submissionPromise
      .catch(err => {
        //probably want more consistent error handling across foundries, once we add more + decide how they are integrated

        logger(`[Submit] error submitting order ${order.id} to ${foundry}`);
        logger(err);
        return Promise.reject(errorInvalidModel);
      })
      .then(orderResponse => {
        //check if we have a snapshot, create if we dont / merge if do
        return snapshots.snapshotGet(projectId, user.uuid, projectVersion)
          .catch(err => {
            //assume the snapshot doesnt exist, and we want to create a new one
            return null;
          })
          .then(snapshot => {
            //use shallow, easy to merge keys...
            //possible that multiple orders happen at the same snapshot
            const snapshotTags = order.constructIds.reduce((acc, id) => Object.assign(acc, { [id]: true }),
              {
                [order.id]: true,
                [foundry]: true,
                [orderResponse.jobId]: true,
              });
            let message = `Order ${order.id} @ ${foundry}: ${order.metadata.constructNames.join(' ')}`;

            //merge tags if snapshot existed
            if (snapshot) {
              merge(snapshotTags, snapshot.tags);
              message = snapshot.message + ' |  ' + message;
            }

            //write or update the snapshot
            return snapshots.snapshotWrite(projectId, user.uuid, projectVersion, message, snapshotTags, snapshots.SNAPSHOT_TYPE_ORDER)
              .then((snapshot) => {
                merge(order, {
                  status: {
                    foundry,
                    numberPermutations: numberPermutations,
                    numberOrdered: constructList.length,
                    orderResponse,
                    remoteId: orderResponse.jobId,
                    price: orderResponse.cost,
                    timeSent: Date.now(),
                  },
                });

                //final validation before writing - if hit an error here, our fault
                if (!Order.validate(order)) {
                  logger('[Submit] submitted order did not validate');
                  logger(order);

                  return Promise.reject(errorInvalidModel);
                }

                return orderPersistence.orderWrite(order.id, order, user.uuid)
                  .then(info => info.data);
              });
          });
      })
      .then(order => {
        res.status(200).send(order);
      })
      .catch(err => {
        logger('[Submit] Order failed:');
        logger(err);
        logger(err.stack);

        if (err === errorInvalidModel) {
          res.status(422).send(errorInvalidModel);
        }

        if (err === errorDoesNotExist) {
          res.status(404).send(errorDoesNotExist);
        }

        res.status(500).send('There was an error handling the order...');
      });
  });

export default router;
