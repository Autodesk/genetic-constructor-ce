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
import uuid from 'node-uuid';
import fetch from 'isomorphic-fetch';
import Project from '../../src/models/Project';
import * as api from '../../src/middleware/projectFiles';
import * as s3 from '../../server/data/middleware/s3';

const { assert, expect } = chai;

//tests for project files across S3 and local file system - these should return consistently

describe('Middleware', () => {
  describe('Project Files', () => {
    const projectId = Project.classless().id;
    const namespace = 'someNamespace';

    const fileNameRoundtrip = uuid.v4();
    const fileNameAtomic = uuid.v4();
    const fileContents = 'some initial contents';

    it('projectFileWrite() requires projectId, namespace, filename, and contents string', () => {
      expect(() => api.projectFileWrite()).to.throw();
      expect(() => api.projectFileWrite(projectId)).to.throw();
      expect(() => api.projectFileWrite(projectId, namespace)).to.throw();
      expect(() => api.projectFileWrite(projectId, namespace, fileNameRoundtrip)).to.throw();

      //check string
      expect(() => api.projectFileWrite(projectId, namespace, fileNameRoundtrip, {})).to.throw();
    });

    it('projectFileWrite() should write a file, projectFileRead() should get it', () => {
      return api.projectFileWrite(projectId, namespace, fileNameRoundtrip, fileContents)
        .then(() => api.projectFileRead(projectId, namespace, fileNameRoundtrip))
        .then(resp => resp.text())
        .then(contents => {
          expect(contents).to.equal(fileContents);
        });
    });

    it('projectFileWrite() should return the latest version, or "-1" in local, and a url', () => {
      return api.projectFileWrite(projectId, namespace, fileNameRoundtrip, fileContents)
        .then(response => {
          assert(!!response.VersionId, 'expected some VersionId');
          assert(!!response.url, 'expected a URL');

          if (s3.useRemote) {
            expect(typeof response.VersionId).to.equal('string');
          } else {
            //pending real versioning...
            expect(response.VersionId).to.equal('-1');
          }
        });
    });

    it('projectFileWrite() should write a file', () => {
      return api.projectFileWrite(projectId, namespace, fileNameAtomic, fileContents)
        .then(resp => fetch(resp.url))
        .then(resp => resp.text())
        .then(result => {
          expect(result).to.equal(fileContents);
        });
    });

    it('readProjectFile() should read a file which exists', () => {
      return api.projectFileRead(projectId, namespace, fileNameAtomic)
        .then(resp => resp.text())
        .then(result => {
          expect(result).to.equal(fileContents);
        });
    });

    it('readProjectFile() should 404 when file doesnt exist', (done) => {
      api.projectFileRead(projectId, namespace, uuid.v4())
        .then(() => done(new Error('shouldnt resolve when doesnt exist')))
        .catch(resp => {
          expect(resp.status).to.equal(404);
          done();
        });
    });

    it('projectFileWrite() with null contents should delete', (done) => {
      api.projectFileWrite(projectId, namespace, fileNameAtomic, null)
        .catch(err => {
          console.log('shouldnt have error when null to delete');
          throw Error(err);
        })
        .then(() => api.projectFileRead(projectId, namespace, fileNameAtomic))
        .then(result => done(result))
        .catch(resp => {
          expect(resp.status).to.equal(404);
          done();
        })
        .catch(done);
    });

    it('listProjectFiles() should give list of files made', () => {
      return api.projectFileList(projectId, namespace)
        .then(listing => {
          assert(Array.isArray(listing), 'expected listing to be an array');
          assert(listing.every(item => {
            return typeof item === 'object' && typeof item.name === 'string' && typeof item.url === 'string';
          }), 'expect objects { name, url }');
        });
    });
  });
});
