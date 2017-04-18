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
import Order from '../../src/models/Order';
import { makeOrderRoll, makeOrderPositionals, makeOnePotOrder, makeSelectionOrder } from '../orders/utils';

//todo - dont require sending positional combinations to server. share code better.

//in the future, pull from registry
const foundries = ['test', 'egf'];

describe('Ordering', () => {
  describe('General', () => {
    const numLists = 4;
    const numOpts = 5;
    const roll = makeOrderRoll(numLists, numOpts);
    const updated = _.merge({}, roll, { project: { another: 'field' } });

    const onePotOrder = makeOnePotOrder(roll);

    const activeIndices = [1, 4, 8, 12, 16];

    const selectionOrder = makeSelectionOrder(roll, 0, activeIndices);

    before(() => {
      return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(() => projectPersistence.projectWrite(roll.project.id, updated, testUserId));
    });

    describe('Validate', () => {
      foundries.forEach(foundry => {
        it(`submit() does not throw unexpectedly to foundry: ${foundry}`, () => {
          return api.validateOrder(onePotOrder, foundry, makeOrderPositionals(roll, 0))
            .catch(resp => {
              //ok if we get a 422, means wasnt valid, but handled properly
              if (resp.status === 422) {
                return true;
              }
              throw Error('unexpected error');
            });
        });

        //note - EGF will fail, since not all parts from EGF
        it(`validate() valid order works at foundry: ${foundry}`);
      });
    });

    describe('Submit', () => {
      foundries.forEach(foundry => {
        it(`submit() does not throw unexpectedly to foundry: ${foundry}`, () => {
          return api.submitOrder(onePotOrder, foundry, makeOrderPositionals(roll, 0))
            .catch(resp => {
              //ok if we get a 422, means wasnt valid, but handled properly
              if (resp.status === 422) {
                return true;
              }
              throw Error('unexpected error');
            });
        });

        //note - EGF will fail, since not all parts from EGF
        it(`submit() valid order works at foundry: ${foundry}`);
      });
    });
  });
});