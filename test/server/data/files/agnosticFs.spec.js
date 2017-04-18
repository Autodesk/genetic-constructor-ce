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
import * as s3 from '../../../../server/data/middleware/s3';
import * as filePaths from '../../../../server/data/middleware/filePaths';
import uuid from 'node-uuid';
import * as agnosticFs from '../../../../server/data/files/agnosticFs';

const bucketName = 'bionano-gctor-files';

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
}

const getFilePath = (...paths) => {
  return s3.useRemote ?
    paths.join('/') :
    filePaths.createStorageUrl(...paths);
};

describe('Server', () => {
  describe('Data', () => {
    describe('files', () => {
      describe('agnosticFs', () => {
        const contents = `Here
Are
Some
Contents`;
        const contentBuffer = new Buffer('some contents!', 'utf8');
        const namespace = uuid.v4();
        const fileName = 'myFile';
        const filePath = getFilePath(namespace, fileName);

        it('fileWrite takes path + content, returns VersionId and Key', () => {
          return agnosticFs.fileWrite(s3bucket, filePath, contents)
            .then(result => {
              assert(typeof result === 'object');
              assert(result.VersionId, 'should make a version (or filler for local fs)');
              assert(result.Key, 'should have a key');
              assert(result.Key.indexOf(fileName));
            });
        });

        it('fileWrite() can take empty string', () => {
          return agnosticFs.fileWrite(s3bucket, getFilePath(uuid.v4(), uuid.v4()), '');
        });

        it('fileRead reads a file', () => {
          return agnosticFs.fileRead(s3bucket, filePath)
            .then(fileContent => {
              expect(fileContent).to.equal(contents);
            });
        });

        it('fileWrite can write a buffer', () => {
          const filePath = getFilePath(namespace, 'otherFile');
          return agnosticFs.fileWrite(s3bucket, filePath, contentBuffer)
            .then(result => {
              assert(result.Key, 'should have a key');
            });
        });

        it('fileList returns files in a namespace', () => {
          return agnosticFs.fileList(s3bucket, getFilePath(namespace))
            .then(list => {
              expect(list.length).to.equal(2);
              assert(list.every(item => {
                return typeof item === 'string';
              }), 'should all be strings');

              assert(list.some(item => item.indexOf(fileName) >= 0), 'expected file with fileName to show up');
            });
        });
      });
    });
  });
});