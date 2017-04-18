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
import testPrivate from '../../extensions/testPrivate/package.json';
import { updateAccount } from '../../src/middleware/auth';
import { getExtensionsInfo } from '../../src/middleware/extensions';
import extensionManifest from '../../server/extensions/package.json';

describe('Extensions', () => {
  describe('Access', () => {
    before(() => {
      expect(extensionManifest.dependencies[testPrivate.name]).to.be.defined;
    });

    it('should not allow access to private extensions', () => {
      return getExtensionsInfo()
        .then(manifests => {
          expect(manifests[testPrivate.name]).to.be.undefined;
        });
    });

    it('should allow access to private extensions with the right email', () => {
      assert(testPrivate.geneticConstructor.access.email, 'email access should be defined');
      const properEmail = 'user' + testPrivate.geneticConstructor.access.email;

      return getExtensionsInfo(true)
        .then(manifests => {
          expect(manifests[testPrivate.name]).to.be.undefined;
        })
        .then(() => {
          return updateAccount({email: properEmail});
        })
        .then((user) => {
          return getExtensionsInfo(true);
        })
        .then(manifests => {
          assert(!!manifests[testPrivate.name], 'private extension should be sent');
          expect(manifests[testPrivate.name].name).to.equal(testPrivate.name);
        })
        .catch((err) => {
          console.log('got error');
          console.log(err);
          console.log(err.stack);
          throw err;
        });
    });
  });
});