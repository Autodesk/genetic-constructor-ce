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
import _ from 'lodash';
import { assert, expect } from 'chai';
import * as projectPersistence from '../../server/data/persistence/projects';
import { testUserId } from '../constants';
import * as api from '../../src/middleware/order';
import Project from '../../src/models/Project';
import Order from '../../src/models/Order';
import { makeOrderRoll, makeOrderPositionals, makeOnePotOrder, makeSelectionOrder } from '../orders/utils';

//todo - dont require sending positional combinations to server. share code better.
//hack - should not be required to send this to the server

describe('Middleware', () => {
  describe('Orders', () => {
    const numLists = 4;
    const numOpts = 5;
    const roll = makeOrderRoll(numLists, numOpts);
    const updated = _.merge({}, roll, { project: { another: 'field' } });

    const onePotOrder = makeOnePotOrder(roll, 0);
    let onePotSubmitted;

    const activeIndices = [1, 4, 8, 12, 16];

    const selectionOrder = makeSelectionOrder(roll, 0, activeIndices);

    before(() => {
      return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(() => projectPersistence.projectWrite(roll.project.id, updated, testUserId));
    });

    describe('Basics', () => {
      const foundry = 'test';

      it('validate() onePot order passes', () => {
        return api.validateOrder(onePotOrder, foundry, makeOrderPositionals(roll, 0));
      });

      it('validate() selection order passes', () => {
        return api.validateOrder(selectionOrder, foundry, makeOrderPositionals(roll, 0));
      });

      it('submit(order, foundry, combinations) sends the order, defaults to latest version', () => {
        return api.submitOrder(onePotOrder, foundry, makeOrderPositionals(roll, 0))
          .then(result => {
            onePotSubmitted = result;

            assert(result.id, 'shold have an id');
            assert(Order.validate(result), 'returned order must be valid');
            assert(result.status.foundry === foundry, 'should have foundry in status');

            assert(result.projectVersion === 1, 'project version should default to latest');

            const overridden = _.merge({}, result, onePotOrder);

            //shouldnt change any values
            expect(overridden).to.eql(result);
          });
      });

      it('submit() with random subset only orders that subset', () => {
        return api.submitOrder(selectionOrder, foundry, makeOrderPositionals(roll, 0))
          .then(result => {
            assert(Order.validate(result), 'returned order must be valid');
            assert(result.status.foundry === foundry, 'should have foundry in status');
            assert(result.status.numberOrdered === activeIndices.length, 'should note number of constructs made');

            const overridden = _.merge({}, result, selectionOrder);

            //shouldnt change any values
            expect(overridden).to.eql(result);
          });
      });

      it('submit() can specify project version', () => {
        const versioned = Object.assign(makeOnePotOrder(roll), { projectVersion: 0 });

        return api.submitOrder(versioned, foundry, makeOrderPositionals(roll, 0))
          .then(result => {
            assert(result.projectVersion === 0, 'project version should default to latest');

            assert(result.id, 'shold have an id');
            const overridden = _.merge({}, result, versioned);

            //shouldnt change any values
            expect(overridden).to.eql(result);
          });
      });

      it('getOrder() can retrieve a specific order (if submitted)', () => {
        return api.getOrder(roll.project.id, onePotSubmitted.id)
          .then(result => {
            expect(result).to.eql(onePotSubmitted);
          });
      });

      it('getOrders() returns empty array if no orders for project', () => {
        return api.getOrders(Project.classless().id)
          .then(results => {
            expect(results).to.eql([]);
          });
      });

      it('getOrders() can retrieve list of orders (if submitted)', () => {
        return api.getOrders(roll.project.id)
          .then(results => {
            assert(Array.isArray(results), 'should get array');
            assert(results.length === 3, 'should have three orders');

            const found = results.find(result => result.id === onePotSubmitted.id);
            expect(found).to.eql(onePotSubmitted);
          });
      });

      it('cannot re-order a submitted order - blocked by server', (done) => {
        api.submitOrder(onePotSubmitted, foundry, makeOrderPositionals(roll, 0))
          .then(() => done('shouldnt be able to submit'))
          .catch(resp => {
            expect(resp.status).to.equal(422);
            done();
          });
      });
    });

    //future - once want to support
    describe('...Future tests...', () => {
      it('ordering works with multiple constructs specified');

      it('can re-order an order by cloning');

      it('should handle construct with list blocks in hierarchy');

      it('ordering works with previous versions of the project');
    });
  });
});
