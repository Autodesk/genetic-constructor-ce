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

//

import path from 'path';
import fetch from 'isomorphic-fetch';
import fs from 'fs';
import _ from 'lodash';
import { defaultUser } from '../../server/auth/local';

import { errorDoesNotExist } from '../../server/utils/errors';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as s3 from '../../server/data/middleware/s3';
import * as projectFiles from '../../server/data/files/projectFiles';
import * as projectPersistence from '../../server/data/persistence/projects';

import batchPromises from './batchPromises';
import { storagePath, projectPath, AUTH_API } from './config';

if (!s3.useRemote) {
  throw new Error('must use S3 - pass s3 credentials to propcess');
}

const extensionName = 'GC-GSL-Editor';
const gslFileName = 'project.gsl'; //upload to s3 and update project
const gslFileNameAlt = 'project.run.gsl'; //just upload to s3

const files = [];

console.log('checking all projects in ', projectPath);

//get all the project IDs
const projects = fs.readdirSync(projectPath)
//skip .DS_Store
  .filter(dir => dir[0] !== '.');

console.log('checking projects with files...');

//go through projects, determine if / list files
_.forEach(projects, projectId => {
  const projectFilesPath = path.resolve(projectPath, projectId, 'data', 'files');
  let extensions;

  //get the files in the extension (expect there to only be one extension)
  //get the extensions in the project
  try {
    extensions = fs.readdirSync(projectFilesPath);
  } catch (err) {
    console.log('no files in project ' + projectId);
    return;
  }

  _.forEach(extensions, extension => {
    const projectFilesExtensionPath = path.resolve(projectFilesPath, extension);

    let fileList;
    try {
      fileList = fs.readdirSync(projectFilesExtensionPath);
    } catch (err) {
      console.log('no files in for extension ' + extension);
      return;
    }

    if (fileList.indexOf(gslFileName) >= 0) {
      //check project.gsl
      const gslFilePath = path.resolve(projectFilesExtensionPath, gslFileName);
      if (files.findIndex(item => item.projectId === projectId && item.fileName === gslFileName) >= 0) {
        console.log('skipping file for projectId', gslFilePath);
        return;
      }

      files.push({
        projectId,
        fileName: gslFileName,
        extension, //the old extension name (should be namespaced into new extension name)
        gslPath: gslFilePath,
      });
    } else if (fileList.indexOf(gslFileNameAlt) >= 0) {
      //check project.run.gsl
      const gslFilePath = path.resolve(projectFilesExtensionPath, gslFileNameAlt);
      if (files.findIndex(item => item.projectId === projectId && item.fileName === gslFileNameAlt) >= 0) {
        console.log('skipping file for projectId', gslFilePath);
        return;
      }

      files.push({
        projectId,
        fileName: gslFileNameAlt,
        extension, //the old extension name (should be namespaced into new extension name)
        gslPath: gslFilePath,
      });
    } else {
      //expected project.gsl not found
      console.log('couldnt find expected file for project', projectId, extension, fileList);
    }
  });
});

console.log(files);

// move project files into s3

batchPromises(_.map(files, (fileObject) => () => {
  const { gslPath, extension, projectId } = fileObject;

  return fileSystem.fileRead(gslPath, false)
    .catch(err => {
      console.log('error reading file', gslPath);
      throw err;
    })
    .then(fileContents => {
      if (!fileContents) {
        console.log('no file contents, skipping', projectId, gslPath);
        fileObject.skip = true;
        return;
      }

      return projectFiles.projectFileWrite(projectId, extensionName, gslFileName, fileContents)
        .then((fileInfo) => {
          console.log('wrote project file for project', extension, fileInfo);
          Object.assign(fileObject, fileInfo);
        })
        .catch(err => {
          console.log('error writing file, but continuing', projectId);
          console.log(fileContents);
        });
    });
}))
  .then(() => {
    console.log('project files added to s3');
  })
  .catch(err => {
    console.log(err, err.stack);
    throw err;
  })
  //now update all the projects so they know about their files
  .then(() => {
    //only want to update project manifests with project.gsl... let the extension handle update project.run.gsl itself
    const filtered = _.filter(files, (fileObj) => fileObj.fileName === gslFileName && fileObj.skip !== true);

    console.log(filtered);

    return batchPromises(_.map(filtered, (fileObj) => () => {
      const { projectId, VersionId } = fileObj;

      return projectPersistence.projectGetManifest(projectId)
        .then(manifest => {
          //note - this will overwrite the files section, but that should be fine since only have GSL at this point

          const patch = {
            files: [{
              name: gslFileName,
              namespace: extensionName,
              version: VersionId,
            }],
          };

          const userId = manifest.metadata.authors[0];

          return projectPersistence.projectWriteManifest(projectId, patch, userId, false)
            .catch(err => {
              console.log('error writing manifest: ' + projectId);
              console.log(err);
              throw err;
            });
        })
        .catch(err => {
          //if project doesnt exist, then whatever who cares
          if (err === errorDoesNotExist) {
            console.log('project did not exist, ignoring ' + projectId);
            return;
          }

          console.log('error updating manifest with fils');
          console.log(err.stack);
          throw err;
        });
    }));
  });
