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
/**
 * Utilities for creating permission files for a project, and validating permissions. Also exports a routing middleware function for checking permissions.
 *
 * Permissions for projects are checked in `index.js` router... Other utilities assume that permissions are valid when they are called.
 *
 * @module permissions
 */
import { errorInvalidId, errorNoIdProvided, errorNoPermission, errorDoesNotExist } from '../utils/errors';
import { id as idRegex } from '../../src/utils/regex';
import { userOwnsProject } from './persistence/projects';
import debug from 'debug';

const logger = debug('constructor:permissions');

export const projectPermissionMiddleware = (req, res, next) => {
  const { user } = req;
  const { projectId } = req.params;

  logger(`[projectPermissionMiddleware] Checking ${projectId} for ${user ? user.uuid : 'null'}`);

  //in case havent already checked for user on request
  if (!user || !user.uuid) {
    res.status(401);
    logger('no user attached by auth middleware @', req.url);
    next('[projectPermissionMiddleware] user not attached to request by middleware');
    return;
  }

  if (!projectId) {
    logger('[projectPermissionMiddleware] no projectId provided @ ' + req.url);
    res.status(400).send(errorNoIdProvided);
    next('projectId not found on route request. This is probably an internal error.');
    return;
  }

  if (!idRegex().test(projectId)) {
    logger('[projectPermissionMiddleware] invalid projectId @ ' + req.url);
    res.status(400).send(errorInvalidId);
    next('projectId is not valid, got ' + projectId);
    return;
  }

  userOwnsProject(user.uuid, projectId)
    .then(() => {
      logger(`[projectPermissionMiddleware] user ${user.uuid} owns project ${projectId}`);
      next();
    })
    .catch((err) => {
      //if the project doesnt exist, mark the req and can handle downstream, but usually we want this to just fall through
      if (err === errorDoesNotExist) {
        logger(`[projectPermissionMiddleware] project does not exist (${projectId})`);
        Object.assign(req, { projectDoesNotExist: true });
        return next();
      }

      if (err === errorNoPermission) {
        logger(`[projectPermissionMiddleware] user ${user.uuid} cannot access ${projectId}`);
        return res.status(403).send(`User does not have access to project ${projectId}`);
      }

      logger('project permission check error');
      logger(err);
      logger(err.stack);
      res.status(500).send('error checking project access');
    });
};
