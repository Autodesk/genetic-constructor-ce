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
import uuid from 'node-uuid';
import Project from '../../../../../src/models/Project';
import { errorDoesNotExist } from '../../../../../server/utils/errors';
import * as projectFiles from '../../../../../server/data/files/projectFiles';

describe('Server', () => {
  describe('Data', () => {
    describe('files', () => {
      describe('Project Files', function projectFilesTests() {
        const projectId = Project.classless().id;
        const namespace = 'someNamespace';
        const fileName = 'myFile';
        const fileContents = 'some initial contents';

        it('projectFilesWrite() requires projectId, namespace, fileName, contents string', () => {
          expect(() => projectFiles.projectFileWrite()).to.throw();
          expect(() => projectFiles.projectFileWrite(projectId)).to.throw();
          expect(() => projectFiles.projectFileWrite(projectId, namespace)).to.throw();
          expect(() => projectFiles.projectFileWrite(projectId, namespace, fileName)).to.throw();

          //check string
          expect(() => projectFiles.projectFileWrite(projectId, namespace, fileName, {})).to.throw();
        });

        it('projectFilesWrite() should work', () => {
          return projectFiles.projectFileWrite(projectId, namespace, fileName, fileContents);
        });

        it('projectFilesRead() should work', () => {
          return projectFiles.projectFileRead(projectId, namespace, fileName);
        });

        it('projectFilesRead() should fail on sequences that dont exist', () => {
          return projectFiles.projectFileRead(projectId, namespace, uuid.v4())
            .then(huhwhat => Promise.reject('nah uh. shuoldnt have worked'))
            .catch((err) => {
              expect(err).to.equal(errorDoesNotExist);
            });
        });

        it('projectFilesRead() should read existing file', () => {
          return projectFiles.projectFileRead(projectId, namespace, fileName)
            .then(result => {
              expect(result).to.equal(fileContents);
            });
        });

        it('projectFilesList() lists files which exist', () => {
          const newNamespace = 'anotherNamespace';
          const fileNames = ['fileOne', 'fileTwo.txt', 'fileThree.json'];
          const contents = ['contents one', 'contents two', 'contents three'];

          return Promise.all(
            fileNames.map((name, index) => projectFiles.projectFileWrite(projectId, newNamespace, name, contents[index]))
          )
            .then(() => projectFiles.projectFilesList(projectId, newNamespace))
            .then(results => {
              expect(results.length).to.equal(3);
              expect(results.sort()).to.eql(fileNames.sort());
            });
        });

        it('should read a written file', () => {
          const fileName = 'myFile';
          const fileContents = 'some initial contents';

          return projectFiles.projectFileWrite(projectId, namespace, fileName, fileContents)
            .then(() => projectFiles.projectFileRead(projectId, namespace, fileName))
            .then(result => {
              expect(result).to.equal(fileContents);
            });
        });

        it('should update the contents for second fetch', () => {
          const fileName = 'myFile';
          const originalContents = 'some initial contents';
          const nextContents = 'the next contents';

          return projectFiles.projectFileWrite(projectId, namespace, fileName, originalContents)
            .then(() => projectFiles.projectFileRead(projectId, namespace, fileName))
            .then(result => {
              expect(result).to.equal(originalContents);

              return projectFiles.projectFileWrite(projectId, namespace, fileName, nextContents);
            })
            .then(() => projectFiles.projectFileRead(projectId, namespace, fileName))
            .then(result => {
              expect(result).to.equal(nextContents);
            });
        });
      });
    });
  });
});
