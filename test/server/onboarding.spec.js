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

import { assert, expect } from 'chai';
import { range, merge } from 'lodash';
import uuid from 'node-uuid';
import { deleteUser } from '../../server/data/persistence/admin';
import onboardNewUser from '../../server/onboarding/onboardNewUser';

const withJenkins = !!process.env.JENKINS;

describe('Server', () => {
  describe('Onboarding', () => {
    const makeUser = (nameStub) => ({
      uuid: uuid.v1(),
      email: `test${nameStub}@tester.com`,
      firstName: 'Dev',
      lastName: 'Eloper',
    });

    const numUsers = 50;
    const users = range(numUsers)
      .map((num) => makeUser(num));

    after(() => {
      return Promise.all(
        users.map(user => deleteUser(user.uuid)),
      );
    });

    it('should onboard a user and create at least a project for them', () => {
      const user = makeUser();
      return onboardNewUser(user)
        .then(rolls => {
          assert(rolls.length > 0 && !!rolls[0].project.id, 'should have some projects');
        });
    });

    it('can take a config of starting projects');

    //note - this really isnt fast at all
    it('should onboard many users quickly', function speedTest(done) {
      //this will go away soon, once EGF project is global
      const perSecond = 1;

      if (withJenkins) {
        this.timeout(120000);
      } else {
        this.timeout(numUsers * 1000 / perSecond);
      }

      Promise.all(
        users.map((user) => onboardNewUser(user))
      )
        .then(projectIds => {
          done();
        });
    });
  });
});