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
import invariant from 'invariant';
import * as s3 from '../middleware/s3';
import * as fileSystem from '../middleware/fileSystem';

console.log(s3.useRemote ? '[Files] Using S3 for file persistence, not file system' : '[Files] Using file system for file persistence, not S3');

// when using S3, s3bucket is actually the S3 bucket
// when using local, s3bucket is prefix
// use this scheme so the filePath (e.g. on write) returned is the same across platforms

//todo - file exists, reject if not

export const fileRead = (s3bucket, filePath, params) => {
  invariant(filePath, 'file name is required');

  if (s3.useRemote) {
    return s3.stringGet(s3bucket, filePath, params);
  }

  const fullPath = path.resolve(s3bucket, filePath);
  return fileSystem.fileRead(fullPath, false);
};

//return { VersionId, Key, name }
export const fileWrite = (s3bucket, filePath, contents, params) => {
  invariant(filePath, 'file name is required');
  invariant(contents !== undefined, 'contents required');
  invariant(typeof contents === 'string' || Buffer.isBuffer(contents), 'contents must be a string or buffer');

  let promise;

  if (s3.useRemote) {
    promise = typeof contents === 'string' ?
      s3.stringPut(s3bucket, filePath, contents, params) :
      s3.itemPutBuffer(s3bucket, filePath, contents, params);
  } else {
    const fullPath = path.resolve(s3bucket, filePath);
    const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    invariant(folderPath, 'must have a prefix with / to get folder path');

    promise = fileSystem.directoryMake(folderPath)
      .then(() => fileSystem.fileWrite(fullPath, contents, false))
      .then(() => ({
        //hack - until we need to support versions for local development, this is not implemented
        VersionId: '-1',
      }));
  }

  return promise.then(result => {
    return Object.assign(result, {
      Key: filePath,
      name: filePath.substr(filePath.lastIndexOf('/') + 1),
    });
  });
};

export const fileDelete = (s3bucket, filePath, params) => {
  invariant(filePath, 'file path is required');

  if (s3.useRemote) {
    return s3.itemDelete(s3bucket, filePath, params);
  }

  const fullPath = path.resolve(s3bucket, filePath);
  return fileSystem.fileDelete(fullPath);
};

export const fileList = (s3bucket, namespace, params) => {
  if (s3.useRemote) {
    return s3.folderContents(s3bucket, namespace, params)
      .then(files => files.map(file => file.name));
  }

  const fullPath = path.resolve(s3bucket, namespace);
  return fileSystem.directoryContents(fullPath);
};
