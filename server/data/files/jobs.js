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
import invariant from 'invariant';
import md5 from 'md5';
import * as s3 from '../middleware/s3';
import * as filePaths from '../middleware/filePaths';
import * as agnosticFs from './agnosticFs';
import { HOST_URL } from '../../urlConstants';
import debug from 'debug';

const logger = debug('constructor:data:files:projectFiles');

//note - this module is incredibly similar to project files...
//notable, filename not required to write - will be generated and returned

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-jobs';

// when using S3, write to the bucket
// when using local, prefix with appropriate path

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
  logger(`Bucket: ${bucketName}`);
} else {
  s3bucket = filePaths.createJobFilePath();
  logger(`File Path: ${s3bucket}`);
}

// IO platform dependent paths

const getFilePath = (...paths) => {
  invariant(paths.length > 1, 'need to pass a path with namespaces');
  return paths.join('/');
};

// API

//ensure that this matches the router
export const makeJobFileLink = (...paths) => {
  invariant(paths.length > 0, 'must pass some namespace');
  return `${HOST_URL}/data/jobs/${paths.join('/')}`;
};

export const jobFileName = (contents) => md5(contents);

export const jobFileRead = (projectId, namespace, path) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'need to pass a namespace');
  invariant(path, 'need to pass a namespace + path');

  const filePath = getFilePath(projectId, namespace, path);
  logger(`[jobFileRead] ${filePath}`);

  return agnosticFs.fileRead(s3bucket, filePath);
};

//note signature - filename is optional, will generate md5 if not provided
export const jobFileWrite = (projectId, namespace, contents, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(typeof contents === 'string' || Buffer.isBuffer(contents), 'must pass contents as string or buffer');
  invariant(namespace, 'need to pass a namespace');

  const name = fileName || jobFileName(contents);
  const filePath = getFilePath(projectId, namespace, name);
  logger(`[jobFileWrite] ${filePath}`);

  return agnosticFs.fileWrite(s3bucket, filePath, contents)
    .then(result => Object.assign(result, {
      url: makeJobFileLink(result.Key),
    }));
};

export const jobFileDelete = (projectId, namespace, path) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'need to pass a namespace');
  invariant(path, 'need to pass a namespace + path');

  const filePath = getFilePath(projectId, namespace, path);
  logger(`[jobFileDelete] ${filePath}`);

  return agnosticFs.fileDelete(s3bucket, filePath);
};

export const jobFileList = (projectId, namespace) => {
  invariant(projectId, 'projectId is required');

  //todo - suport skipping namespace. need to change format or results (will have slashes)
  //will have to update project file router to account for no namespace
  invariant(namespace, 'must pass a namespace');

  const dirPath = getFilePath(projectId, namespace);
  logger(`[jobFileList] ${dirPath}`);

  return agnosticFs.fileList(s3bucket, dirPath);
};
