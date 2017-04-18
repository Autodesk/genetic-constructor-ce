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
import express from 'express';
import bodyParser from 'body-parser';
import {
  errorInvalidModel,
  errorInvalidRoute,
  errorDoesNotExist,
} from '../utils/errors';
import { ensureReqUserMiddleware } from '../user/utils';
import { projectPermissionMiddleware } from './permissions';
import * as projectPersistence from './persistence/projects';
import * as projectVersions from './persistence/projectVersions';
import * as blockPersistence from './persistence/blocks';

import projectFileRouter from './routerProjectFiles';
import jobFileRouter from './routerJobs';
import sequenceRouter from './routerSequences';
import snapshotRouter from './routerSnapshots';

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects,
  limit: 20 * 1024 * 1024,
});

/******** MIDDLEWARE ***********/

router.use(jsonParser);

//ensure req.user is set, send 401 otherwise
router.use(ensureReqUserMiddleware);

/******** PARAMS ***********/

router.param('projectId', (req, res, next, id) => {
  Object.assign(req, { projectId: id });
  next();
});

router.param('blockId', (req, res, next, id) => {
  Object.assign(req, { blockId: id });
  next();
});

/********** ROUTES ***********/

/* job files */
router.use('/jobs/:projectId', projectPermissionMiddleware, jobFileRouter);

/* project files */
router.use('/file/:projectId', projectPermissionMiddleware, projectFileRouter);

/* sequence */
//todo - throttle? enforce user present on req?
router.use('/sequence', sequenceRouter);

/* versioning */

router.route('/versions/:projectId/:version?')
  .all(projectPermissionMiddleware)
  .get((req, res, next) => {
    //pass the version you want, otherwise send version history
    const { projectId } = req;
    const { version } = req.params;

    if (version) {
      projectVersions.projectVersionGet(projectId, version)
        .then(project => res.status(200).json(project))
        .catch(err => next(err));
    } else {
      projectVersions.projectVersionList(projectId)
        .then(log => res.status(200).json(log))
        .catch(err => next(err));
    }
  });

router.use('/snapshots/:projectId', projectPermissionMiddleware, snapshotRouter);

/* info queries */

router.route('/info/:type/:detail?/:additional?')
  .get((req, res, next) => {
    const { user } = req;
    const { type, detail, additional } = req.params;

    switch (type) {
    case 'role' :
      if (detail) {
        blockPersistence.getAllPartsWithRole(user.uuid, detail)
          .then(info => res.status(200).json(info))
          .catch(err => next(err));
      } else {
        blockPersistence.getAllBlockRoles(user.uuid)
          .then(info => res.status(200).json(info))
          .catch(err => next(err));
      }
      break;
    case 'name' :
      blockPersistence.getAllBlocksWithName(user.uuid, detail)
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      break;
    case 'contents' :
      projectPersistence.userOwnsProject(user.uuid, additional)
        .then(() => projectPersistence.projectGet(additional))
        .then(rollup => rollup.getContents(detail))
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      break;
    case 'components' :
      projectPersistence.userOwnsProject(user.uuid, additional)
        .then(() => projectPersistence.projectGet(additional))
        .then(rollup => rollup.getComponents(detail))
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      break;
    case 'options' :
      projectPersistence.userOwnsProject(user.uuid, additional)
        .then(() => projectPersistence.projectGet(additional))
        .then(rollup => rollup.getOptions(detail))
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      break;
    default :
      res.status(404).send(`must specify a valid info type in url, got ${type} (param: ${detail})`);
    }
  });

/* rollups */

// routes for non-atomic operations
// response/request with data in rollup format {project: {}, blocks: {}, ...}
// e.g. used in autosave, loading / saving whole project

router.route('/projects/:projectId')
  .all(projectPermissionMiddleware)
  .get((req, res, next) => {
    const { projectId } = req;

    projectPersistence.projectGet(projectId)
      .then(roll => res.status(200).json(roll))
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send(err);
        }
        return next(err);
      });
  })
  .post((req, res, next) => {
    const { projectId, user } = req;
    const roll = req.body;

    projectPersistence.projectWrite(projectId, roll, user.uuid)
      .then(info => res.status(200).json({
        version: info.version,
        updated: info.updated,
        id: info.id,
      }))
      .catch(err => {
        if (err === errorInvalidModel) {
          return res.status(422).send(errorInvalidModel);
        }
        next(err);
      });
  })
  .delete((req, res, next) => {
    const { projectId, user } = req;
    const forceDelete = !!req.query.force;

    projectPersistence.projectDelete(projectId, user.uuid, forceDelete)
      .then(() => res.status(200).json({ projectId }))
      .catch(err => {
        if (err === errorDoesNotExist) {
          //unclear why this would ever happen with project access middleware...
          return res.status(404).send(errorDoesNotExist);
        }
        return next(err);
      });
  });

//separate route because dont use project permission middleware
router.route('/projects')
  .get((req, res, next) => {
    const { user } = req;

    return projectPersistence.getUserProjects(user.uuid, false)
      .then(rolls => rolls.map(roll => roll.project))
      .then(manifests => res.status(200).json(manifests))
      .catch(err => next(err));
  });

/*
 In general:

 PUT - replace
 POST - merge
 */

router.route('/:projectId/:blockId')
  .all(projectPermissionMiddleware)
  .get((req, res, next) => {
    const { projectId, blockId } = req;

    projectPersistence.blockGet(projectId, blockId)
      .then(result => {
        if (!result) {
          return res.status(204).json(null);
        }
        res.json(result);
      })
      .catch(err => next(err));
  })
  .put((req, res, next) => {
    const { user, projectId, blockId } = req;
    const block = req.body;

    if (!!block.id && block.id !== blockId) {
      return res.status(422).send(errorInvalidModel);
    }

    projectPersistence.blocksPatch(projectId, user.uuid, { [blockId]: block })
      .then(result => {
        res.json(result.blocks[blockId]);
      })
      .catch(err => {
        if (err === errorInvalidModel) {
          return res.status(422).send(errorInvalidModel);
        }
        next(err);
      });
  })
  .post((req, res, next) => {
    const { user, projectId, blockId } = req;
    const block = req.body;

    //will be forced downstream, but worth alerting requester
    if (!!block.id && block.id !== blockId) {
      return res.status(400).send('IDs do not match');
    }

    projectPersistence.blocksMerge(projectId, user.uuid, { [blockId]: block })
      .then(result => {
        res.json(result.blocks[blockId]);
      })
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send('project does not exist');
        }
        if (err === errorInvalidModel) {
          return res.status(422).send(errorInvalidModel);
        }
        next(err);
      });
  })
  .delete((req, res, next) => {
    return res.status(405).send();
  });

router.route('/:projectId')
  .all(projectPermissionMiddleware)
  .get((req, res, next) => {
    const { projectId } = req;
    //const { depth } = req.query; //future

    projectPersistence.projectGetManifest(projectId)
      .then(result => {
        res.json(result);
      })
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send('project does not exist');
        }
        next(err);
      });
  })
  .put((req, res, next) => {
    res.status(405).send('cannot PUT project manifest, only post to update existing');
  })
  .post((req, res, next) => {
    const { projectId, user } = req;
    const project = req.body;

    if (!!project.id && project.id !== projectId) {
      return res.status(400).send('IDs do not match');
    }

    projectPersistence.projectWriteManifest(projectId, project, user.uuid)
      .then(merged => res.status(200).send(merged))
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send(errorDoesNotExist);
        }
        if (err === errorInvalidModel) {
          return res.status(422).send(errorInvalidModel);
        }
        next(err);
      });
  })
  .delete((req, res, next) => {
    return res.status(405).send('use DELETE /projects/:id');
  });

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;
