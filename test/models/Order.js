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
import { testUserId } from '../constants';
import { expect, assert } from 'chai';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import Order from '../../src/models/Order';
import _ from 'lodash';

describe('Model', () => {
  describe('Order', () => {
    const validOrderConstructorInput = (input = {}) => new Order(_.merge({
      projectId: Project.classless().id,
      constructIds: [Block.classless().id],
    }, input));

    const validOrderSetup = (input = {}) => validOrderConstructorInput(_.merge({
      user: testUserId,
      projectVersion: 10,
      parameters: {
        onePot: true,
      },
    }, input));

    const validOrder = (input = {}) => _.merge({
      user: testUserId,
      projectVersion: 0,
      status: {
        foundry: 'test',
        remoteId: 'sdfasdfasdf',
        price: '$1,000,000',
        timeSent: Date.now(),
      },
    }, validOrderSetup(input));

    it('validateSetup can throw, or not', () => {
      const good = validOrderSetup();
      const bad = _.merge({}, good, { projectId: 'adsfasdfasdfasdf' });

      expect(Order.validateSetup(good)).to.equal(true);
      expect(Order.validateSetup(bad)).to.equal(false);

      expect(() => Order.validateSetup(good, true)).to.not.throw();
      expect(() => Order.validateSetup(bad, true)).to.throw();
    });

    it('validate() can throw, or not', () => {
      const good = validOrder();
      const bad = _.merge({}, good, { projectVersion: 'adsfasdfasdfasdf' });

      expect(Order.validate(good)).to.equal(true);
      expect(Order.validate(bad)).to.equal(false);

      expect(() => Order.validate(good, true)).to.not.throw();
      expect(() => Order.validate(bad, true)).to.throw();
    });

    it('requires projectId and construct Ids', () => {
      expect(() => new Order({})).to.throw();
      expect(() => new Order({ projectId: Project.classless().id })).to.throw();
      expect(() => new Order({ constructIds: [] })).to.throw();
      expect(validOrderConstructorInput).to.not.throw();
    });

    it('validateParams checks parameters', () => {
      const ord = validOrderConstructorInput();

      assert(Order.validateParameters(ord.parameters), 'should be valid order params');

      const badParams = Object.assign({}, ord.parameters, {
        onePot: 100,
      });

      assert(Order.validateParameters(badParams) === false, ' should be invalid parameters');
    });

    it('validate() requires projectVersion and userId', () => {
      assert(Order.validate(validOrderConstructorInput()) === false, 'should require more than just parameters');
      assert(Order.validateSetup(validOrderSetup()), 'setup should not require status');
      assert(Order.validate(validOrderSetup()) === false, 'full validation should require more than just parameters');
      assert(Order.validate(validOrder()), 'valid order generator should be valid');
    });

    it('has submit() and quote()', () => {
      const ord = validOrderSetup();
      expect(typeof ord.submit).to.equal('function');
      expect(typeof ord.quote).to.equal('function');
    });

    it('submit() if all combinations allowed for');

    it('submit requires positional combinations', () => {
      const ord = validOrderSetup();
      expect(ord.submit).to.throw();
      expect(() => ord.submit('egf')).to.throw();
    });

    it('submit() with valid positional combinations');

    it('cannot change a submitted order', () => {
      const ord = validOrderSetup({
        status: {
          foundry: 'egf',
          remoteId: 'actgactgatsdgtasd',
          timeSent: Date.now(),
        },
      });

      expect(() => ord.mutate('metadata.name', 'new name')).to.throw();
    });
  });
});
