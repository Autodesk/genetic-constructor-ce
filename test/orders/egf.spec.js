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
import { expect, assert } from 'chai';
import makeEgfRollup from '../../data/egf_parts/index';
import { testUserId } from '../constants';
import * as projectPersistence from '../../server/data/persistence/projects';
import * as api from '../../src/middleware/order';
import { makeOrderPositionals, makeOnePotOrder, makeSelectionOrder } from '../orders/utils';

const foundryKey = 'egf';

describe('Ordering', () => {
  describe('EGF', () => {
    const templatesProject = makeEgfRollup();

    //hack so dont need to clone the project to order from it
    delete templatesProject.project.rules.frozen;

    before(() => {
      return projectPersistence.projectWrite(templatesProject.project.id, templatesProject, testUserId, true);
    });

    describe('Validate', () => {
      const constructIds = templatesProject.project.components;
      const indices = [0, 2, 4, 6, 8];

      constructIds.forEach((constructId, index) => {
        it(`Construct # ${index} validates`, () => {
          const order = makeSelectionOrder(templatesProject, index, indices);
          const positionals = makeOrderPositionals(templatesProject, index);

          //hack - dont order anything too big for now
          const combinations = positionals[constructId].reduce((acc, list) => acc * list.length, 1);
          if (combinations > Math.pow(10, 6)) {
            console.log('skipping Construct ' + index + ' - too long');
            return true;
          }

          return api.validateOrder(order, foundryKey, positionals);
        });
      });
    });

    describe('Submit', () => {
      const constructIndex = 1;
      const positionals = makeOrderPositionals(templatesProject, constructIndex);

      const onePotOrder = makeOnePotOrder(templatesProject, constructIndex);

      const indices = [0, 2, 4, 6, 8];
      const selectionOrder = makeSelectionOrder(templatesProject, constructIndex);

      it('can order from EGF templates project', () => {
        return api.submitOrder(onePotOrder, foundryKey, positionals)
          .then(result => {
            expect(result.status.foundry).to.equal(foundryKey);
            assert(result.status.remoteId && result.status.remoteId.length, 'should have remote Id');
          });
      });

      it('can order specific positions', () => {
        return api.submitOrder(selectionOrder, foundryKey, positionals)
          .then(result => {
            assert(result.status.remoteId && result.status.remoteId.length, 'should have remote Id');
            expect(result.status.numberOrdered).to.equal(indices.length);
          });
      });
    });
  });
});
