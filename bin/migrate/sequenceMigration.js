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
import path from 'path';
import fs from 'fs';
import batchPromises from './batchPromises';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as s3 from '../../server/data/middleware/s3';
import * as seqPersistence from '../../server/data/persistence/sequence';

if (!s3.useRemote) {
  throw new Error('must use S3 - pass s3 credentials to propcess');
}

const storagePath = process.env.STORAGE || path.resolve(__dirname, '../../storage');
const seqPath = path.resolve(storagePath, 'sequence');

// move sequences
// (directly copy)

console.log('migrating sequences...');

//get all the sequence files
const seqMd5s = fs.readdirSync(seqPath)
//skip .DS_Store
  .filter(dir => dir[0] !== '.');

console.log('all seqs: ' + seqMd5s.length);
console.log(seqMd5s);

batchPromises(seqMd5s.map(seqMd5 => () => {
  const filePath = path.resolve(seqPath, seqMd5);

  return fileSystem.fileRead(filePath, false)
    .then(sequence => seqPersistence.sequenceWrite(seqMd5, sequence));
}), 10)
  .then(() => {
    console.log('sequences all migrated');
  })
  .catch(err => {
    console.log(err, err.stack);
    throw err;
  });
