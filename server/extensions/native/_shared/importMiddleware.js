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
import formidable from 'formidable';
import md5 from 'md5';
import _ from 'lodash';

import { errorNoPermission, errorDoesNotExist } from '../../../utils/errors';
import { userOwnsProject } from '../../../data/persistence/projects';
import * as fileSystem from '../../../data/middleware/fileSystem';
import * as filePaths from '../../../data/middleware/filePaths';
import * as seqPersistence from '../../../../server/data/persistence/sequence';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as jobFiles from '../../../../server/data/files/jobs';
import Rollup from '../../../../src/models/Rollup';
import Project from '../../../../src/models/Project';
import { resetColorSeed } from '../../../../src/utils/color/index'; //necessary?
import debug from 'debug';

const logger = debug('constructor:import');

const extensionKey = 'import';

//projectId is optional, or may be convert
export default function importMiddleware(req, res, next) {
  const { projectId } = req.params;
  const noSave = req.query.hasOwnProperty('noSave') || projectId === 'convert'; //dont save sequences or project
  const returnRoll = projectId === 'convert'; //return roll at end instead of projectId

  const alreadyExists = projectId && projectId !== 'convert';

  //first check if user has access to projectId, unless it is just a conversion
  let promise = (!alreadyExists) ?
    Promise.resolve() :
    userOwnsProject(req.user.uuid, projectId);

  //mint a project ID if one doesn't exist, to save job File. See also merge middleware (for after conversion)
  const mintedProjectId = (!alreadyExists) ? Project.classless().id : projectId;
  Object.assign(req, { mintedProjectId });

  logger(`Importing ${mintedProjectId} (${alreadyExists ? 'exists' : 'new'}) - ${req.user.uuid}`);

  //depending on the type, set variables for file urls etc.

  //if we have an object, expect a string to have been passed
  if (typeof req.body === 'object' && req.body.string) {
    const { name, string, ...rest } = req.body;

    //calc md5 and write locally to /tmp, so available to extensions
    //future - tee to S3 and locally to extension

    const hash = md5(string);
    const localPath = filePaths.createStorageUrl(hash);

    promise = promise.then(() => Promise.all(
      [
        fileSystem.fileWrite(localPath, string, false),
        jobFiles.jobFileWrite(mintedProjectId, extensionKey, string, hash),
      ])
      .then(([local, job]) => {
        const files = [{
          name,
          string,
          fileName: job.name,
          filePath: localPath,
          fileUrl: job.url,
        }];
        logger('Received on post body');
        logger(JSON.stringify(files, null, 2));
        return files;
      })
    );
  } else {
    // otherwise, we are expecting a form

    // save incoming file then read back the string data.
    // If these files turn out to be large we could modify the import functions to take file names instead
    // but for now, in memory is fine.
    const form = new formidable.IncomingForm();

    promise = promise.then(() => new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          return reject(err);
        }

        return Promise.all(
          [files].map(file => {
            const localPath = (file && file.data) ? file.data.path : null;

            if (!localPath) {
              return Promise.reject('no file provided');
            }

            const name = file.data.name;

            //future - buffer
            return fileSystem.fileRead(localPath, false)
              .then((string) => {
                return jobFiles.jobFileWrite(mintedProjectId, extensionKey, string)
                  .then(info => ({
                    name,
                    string,
                    fileName: info.name,
                    filePath: localPath,
                    fileUrl: info.url,
                  }));
              })
              .catch(err => {
                console.log('[Import Middleware] error reading + writing job file ' + localPath);
                throw err;
              });
          })
        )
        //resolve with files
          .then(files => {
            logger('Received files');
            logger(JSON.stringify(files, null, 2));
            return resolve(files);
          })
          .catch(err => {
            logger('[Import Middleware] Error');
            logger(err);
            logger(err.stack);
            reject(err);
          });
      });
    }))
      .catch((err) => {
        res.status(404).send('error parsing import -- was expecting a file, or JSON object: { name, string }');
        return Promise.reject(err);
      });
  }

  //resolves the files in form { name, string, fileName, filePath, fileUrl }
  promise.then(files => {
    Object.assign(req, {
      files,
      projectId,
      returnRoll,
      noSave,
    });

    resetColorSeed();

    next();
  })
    .catch((err) => {
      if (err === errorDoesNotExist) {
        return res.status(404).send(errorDoesNotExist);
      }
      if (err === errorNoPermission) {
        return res.status(403).send(errorNoPermission);
      }

      logger('[Import Middleware] unhandled error');
      logger(err);
      logger(err.stack);
      next(err);
    });
}

/**
 * expects on req: roll, noSave, returnRoll, :projectId?
 *
 * roll can contain project { project } , blocks {blockId : block} , sequences and will be merged / written appropriately
 *
 * sequences can take two forms:
 *
 * todo - deprecate this first format. If anything, should pass in the form { blockId: sequence } and we'll set the md5 etc. extensions should not have to do this hashing
 * POTENTIALLY GOING TO BE DEPRECATED
 * object: assumes blocks already defined properly
 * { md5: sequence }
 *
 * PREFERRED:
 * array: will compute md5 and assign block.sequence.md5, accounting for range
 * [{
 *  sequence: '',
 *  blocks: {
 *    blockId: [start, end] OR true
 *  }
 * }]
 */
export function mergeRollupMiddleware(req, res, next) {
  const { projectId, mintedProjectId, roll, noSave, returnRoll } = req;
  const { project, blocks, sequences = {} } = roll;

  logger(`merging project (project=${projectId})`);

  //we write the sequences no matter what right now
  //future - param to not write sequences (e.g. when just want to look at in inspector, and dont care about sequence -- is this ever the case?)

  const writeSequencesPromise = Array.isArray(sequences)
    ?
    Promise.all(
      sequences
        .filter(seqObj => seqObj && seqObj.sequence && seqObj.sequence.length > 0)
        .map((seqObj) => seqPersistence.sequenceWriteChunks(seqObj.sequence, seqObj.blocks))
    )
      .then(blockMd5Maps => {
        //make simgle object with all blockId : md5 map
        const blockMd5s = Object.assign({}, ...blockMd5Maps);

        //todo - should also assign sequence length here etc.
        _.forEach(blockMd5s, (pseudoMd5, blockId) => {
          //const { hash, hasRange, start, end } = parsePseudoMd5(pseudoMd5);
          _.merge(blocks[blockId], {
            sequence: {
              md5: pseudoMd5,
              //length: hasRange ? end - start : (GET_FULL_LENGTH)
            },
          });
        });
      })
    :
    //assumes that since we are getting md5s, the blocks already know what their sequences are, and no need to update
    seqPersistence.sequenceWriteMany(sequences);

  return writeSequencesPromise
    .then(() => {
      logger(`sequences written (project=${projectId})`);

      if (!projectId || projectId === 'convert' || returnRoll) {
        //if we didnt recieve a projectId, we've assigned one already in importMiddleware above (for job file), so use here
        //even if we are running a conversion, we had a dummy project to be rollup-compliant, so make sure blocks are ok
        Object.assign(project, { id: mintedProjectId });
        _.forEach(blocks, (block) => Object.assign(block, { projectId: mintedProjectId }));

        return Promise.resolve(new Rollup({
          project,
          blocks,
        }));
      }

      return projectPersistence.projectGet(projectId)
        .then((existingRoll) => {
          existingRoll.project.components = existingRoll.project.components.concat(project.components);
          Object.assign(existingRoll.blocks, blocks);
          return existingRoll;
        });
    })
    .then(roll => {
      if (noSave) {
        return Promise.resolve(roll);
      }

      return projectPersistence.projectWrite(roll.project.id, roll, req.user.uuid)
        .then(() => roll);
    })
    .then((roll) => {
      logger(`project written, import complete (${projectId}`);

      if (returnRoll) {
        return res.status(200).json(roll);
      }

      return res.status(200).json({ projectId: roll.project.id });
    })
    .catch(err => {
      logger('Error merging project');
      logger(err);
      logger(err.stack);
      res.status(500).send(err);
    });
}
