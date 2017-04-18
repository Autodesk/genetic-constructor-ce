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
import chai from 'chai';
import Project from '../../src/models/Project';
import * as api from '../../src/middleware/jobs';

const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Jobs', () => {
    const projectId = Project.classless().id;
    const namespace = 'someNamespace';
    const contents = `here's
    Some
Thing!`;

    let fileName;
    let fileUrl;

    it('jobFileWrite() writes a file and returns name', () => {
      return api.jobFileWrite(projectId, namespace, contents)
        .then(resp => {
          expect(resp.url).to.be.defined;
          expect(resp.Key).to.be.defined;
          expect(resp.name).to.be.defined;
          fileUrl = resp.url;
          fileName = resp.name;
        });
    });

    it('jobFileRead() gets a written file', () => {
      return api.jobFileRead(projectId, namespace, fileName)
        .then(resp => resp.text())
        .then(text => {
          expect(text).to.equal(contents);
        });
    });
  });
});