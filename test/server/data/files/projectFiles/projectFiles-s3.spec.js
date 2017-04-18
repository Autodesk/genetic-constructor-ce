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
import * as s3 from '../../../../../server/data/middleware/s3';

describe('Server', () => {
  describe('Data', () => {
    describe('files', () => {
      describe('Project Files', () => {
        describe('S3', function projectFilesS3Tests() {
          let s3bucket;

          //skip test suite if not using s3
          before(function () {
            if (!s3.useRemote) {
              this.skip();
            }
            s3bucket = s3.getBucket(projectFiles.bucketName);
          });

          const projectId = Project.classless().id;
          const namespace = 'tester';

          it('projectFilesWrite() should write a file', () => {
            const fileName = uuid.v4();
            const fileContents = 'h e r e a r e s o m e c o n t e n t s';

            return projectFiles.projectFileWrite(projectId, namespace, fileName, fileContents)
              .then(info => {
                return s3.stringGet(s3bucket, `${projectId}/${namespace}/${fileName}`);
              })
              .then(result => {
                expect(result).to.equal(fileContents);
              });
          });

          it('projectFilesRead() should read a file', () => {
            const fileName = uuid.v4();
            const fileContents = 'h e r e a r e s o m e c o n t e n t s';

            return s3.stringPut(s3bucket, `${projectId}/${namespace}/${fileName}`, fileContents)
              .then(() => {
                return projectFiles.projectFileRead(projectId, namespace, fileName);
              })
              .then(result => {
                expect(result).to.equal(fileContents);
              });
          });

          it('listProjectFiles() should list files', () => {
            const namespace = uuid.v4();
            const files = [1, 2, 3, 4].map(() => uuid.v4());
            const contents = [1, 2, 3, 4].map(() => uuid.v4());

            return Promise.all(
              files.map((file, index) => s3.stringPut(s3bucket, `${projectId}/${namespace}/${file}`, contents[index]))
            )
              .then(() => projectFiles.projectFilesList(projectId, namespace))
              .then(list => {
                expect(list.length).to.equal(files.length);
                expect(list.sort()).to.eql(files.sort());
              });
          });
        });
      });
    });
  });
});
