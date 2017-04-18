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
import fs from 'fs';
import * as filePaths from '../../../server/data/middleware/filePaths';
import * as fileSystem from '../../../server/data/middleware/fileSystem';

const { expect, assert } = chai;

describe('Server', () => {
  describe('Utils', () => {
    describe('FileSystem', () => {
      const fileName = uuid.v4();
      const filePath = filePaths.createJobFilePath(fileName);
      const fileContents = `These are some file contents
There is more than one line
woah!`;

      before((done) => {
        fs.writeFile(filePath, fileContents, 'utf8', done);
      });

      it('fileRead() gets same result as using fs', () => {
        return fileSystem.fileRead(filePath, false)
          .then(result => {
            fs.readFile(filePath, 'utf8', (err, contents) => {
              if (err) {
                throw err;
              }
              expect(contents).to.equal(result);
              expect(contents).to.equal(fileContents);
            });
          });
      });

      it('fileRead() can accept a byte range', () => {
        const start = 10;
        const end = 20;
        const opts = { start, end };

        return fileSystem.fileRead(filePath, false, opts)
          .then(result => {
            expect(result).to.equal(fileContents.substring(start, end));
          });
      });
    });
  });
});