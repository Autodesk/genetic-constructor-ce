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
import * as s3 from '../middleware/s3';
import * as filePaths from '../middleware/filePaths';
import * as agnosticFs from './agnosticFs';
import { HOST_URL } from '../../urlConstants';
import debug from 'debug';

const logger = debug('constructor:data:files:projectFiles');

/* S3 Credentials, when in production */

export const bucketName = 'bionano-gctor-files';

// when using S3, write to the bucket
// when using local, prefix with appropriate path

let s3bucket;
if (s3.useRemote) {
  s3bucket = s3.getBucket(bucketName);
  logger(`Bucket: ${bucketName}`);
} else {
  s3bucket = filePaths.createProjectFilePath();
  logger(`File Path: ${s3bucket}`);
}

// IO platform dependent paths

const getFilePath = (...paths) => {
  invariant(paths.length > 1, 'need to pass a path with namespaces');
  return paths.join('/');
};

// API

//keep this in sync with project file router
export const makeProjectFileLink = (...paths) => {
  invariant(paths.length > 0, 'must pass some namespace');
  return `${HOST_URL}/data/file/${paths.join('/')}`;
};

export const projectFileRead = (projectId, namespace, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');
  invariant(fileName, 'file name is required');

  const filePath = getFilePath(projectId, namespace, fileName);
  logger(`[projectFileRead] ${filePath}`);

  return agnosticFs.fileRead(s3bucket, filePath);
};

export const projectFileWrite = (projectId, namespace, fileName, contents) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');

  const filePath = getFilePath(projectId, namespace, fileName);
  logger(`[projectFileWrite] ${filePath}`);

  return agnosticFs.fileWrite(s3bucket, filePath, contents)
    .then(result => Object.assign(result, {
      url: makeProjectFileLink(result.Key),
    }));
};

export const projectFileDelete = (projectId, namespace, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(namespace, 'namespace key is required');
  invariant(fileName, 'file name is required');

  const filePath = getFilePath(projectId, namespace, fileName);
  logger(`[projectFileDelete] ${filePath}`);

  return agnosticFs.fileDelete(s3bucket, filePath);
};

export const projectFilesList = (projectId, namespace) => {
  invariant(projectId, 'projectId is required');

  //todo - suport skipping namespace. need to change format or results (will have slashes)
  //will have to update project file router to account for no namespace
  invariant(namespace, 'must pass a namespace');

  const folderPath = getFilePath(projectId, namespace);
  logger(`[projectFileList] ${folderPath}`);

  return agnosticFs.fileList(s3bucket, folderPath);
};
