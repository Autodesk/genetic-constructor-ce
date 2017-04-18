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

import { expect } from 'chai';
import rejectingFetch from '../../src/middleware/utils/rejectingFetch';
import { headersGet } from '../../src/middleware/utils/headers';
import { reportApiPath } from '../../src/middleware/utils/paths';

describe('Middleware', () => {
  describe('Reporting', () => {
    const issueId = 10;
    //only run this test in CI, where env var is set
    if (!!process.env.GITHUB_ACCESS_TOKEN || (process.env.CI && process.env.TRAVIS_SECURE_ENV_VARS === 'true')) {
      it('should be able to talk to github', () => {
        return rejectingFetch(reportApiPath('githubIssue/' + issueId), headersGet())
          .then(resp => resp.json())
          .then(issue => {
            expect(issue.url).to.be.defined;
            expect(issue.number).to.equal(issueId);
          });
      });
    }
  });
});
