import express from 'express';
import bodyParser from 'body-parser';
import invariant from 'invariant';

//GC specific
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import * as fileSystem from '../../../data/middleware/fileSystem';
import * as filePaths from '../../../data/middleware/filePaths';
import { errorDoesNotExist } from '../../../../server/utils/errors';
import _ from 'lodash';
import { projectPermissionMiddleware } from '../../../data/permissions';
import * as projectPesistence from '../../../data/persistence/projects';
import * as sequencePersistence from '../../../data/persistence/sequence';
import debug from 'debug';

const logger = debug('constructor:extension:genbank');

import importMiddleware, { mergeRollupMiddleware } from '../_shared/importMiddleware';

//genbank specific
import { convert, importProject, exportProject, exportConstruct } from './convert';

const extensionKey = 'genbank'; //eslint-disable-line no-unused-vars

// Download a temporary file and delete it afterwards
const downloadAndDelete = (res, tempFileName, downloadFileName) => {
  return new Promise((resolve, reject) => {
    res.download(tempFileName, downloadFileName, (err) => {
      if (err) {
        return reject(err);
      }
      fileSystem.fileDelete(tempFileName);
      resolve(downloadFileName);
    });
  });
};

//create the router
const router = express.Router(); //eslint-disable-line new-cap

const formParser = bodyParser.urlencoded({ extended: true });

router.param('projectId', (req, res, next, id) => {
  Object.assign(req, { projectId: id });
  next();
});

/***** FILES ******/

//todo - DEPRECATE
//route to download genbank files
router.get('/file/:fileId', (req, res, next) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(404).send('file id required');
  }

  const path = filePaths.createStorageUrl('import', fileId);

  fileSystem.fileExists(path)
    .then(() => res.download(path))
    .catch(err => {
      if (err === errorDoesNotExist) {
        return res.status(404).send();
      }
      next(err);
    });
});

/***** EXPORT ******/

router.get('/export/blocks/:projectId/:blockIdList', projectPermissionMiddleware, (req, res, next) => {
  const { projectId, blockIdList } = req.params;
  const blockIds = blockIdList.split(',');

  logger(`exporting blocks ${blockIdList} from ${projectId} (${req.user.uuid})`);

  projectPesistence.projectGet(projectId)
    .then(roll => sequencePersistence.assignSequencesToRollup(roll))
    .then(roll => {
      const blocks = blockIds.map(blockId => roll.blocks[blockId]);
      invariant(blocks.every(block => block.sequence.md5), 'some blocks dont have md5');

      const name = (roll.project.metadata.name || roll.project.id) + '.gb';

      const construct = Block.classless({
        metadata: {
          name,
        },
        components: blocks.map(block => block.id),
      });
      const project = Project.classless(Object.assign(roll.project, {
        components: [construct.id],
      }));

      //todo - need to merge with flo's stuff to pass in sequence properly
      const partialRoll = {
        project,
        blocks: blocks.reduce((acc, block) => {
          return Object.assign(acc, {
            [block.id]: block,
          });
        }, {
          [construct.id]: construct,
        }),
      };

      return exportConstruct({ roll: partialRoll, constructId: construct.id })
        .then(resultFileName => {
          logger('wrote file to ' + resultFileName);
          return downloadAndDelete(res, resultFileName, roll.project.id + '.fasta');
        });
    })
    .catch(err => {
      logger('Error exporting blocks');
      logger(err);
      logger(err.stack);
      res.status(500).send(err);
    });
});

router.all('/export/:projectId/:constructId?',
  projectPermissionMiddleware,
  formParser,
  (req, res, next) => {
    const { projectId, constructId } = req.params;

    //todo - use this for genbank, to export specific blocks
    const options = req.body;

    logger(`exporting construct ${constructId} from ${projectId} (${req.user.uuid})`);
    if (options) {
      logger('option map:');
      logger(options);
    }

    projectPesistence.projectGet(projectId)
      .then(roll => sequencePersistence.assignSequencesToRollup(roll))
      .then(roll => {
        const name = (roll.project.metadata.name ? roll.project.metadata.name : roll.project.id);

        const promise = !!constructId ?
          exportConstruct({ roll, constructId }) :
          exportProject(roll);

        return promise
          .then((resultFileName) => {
            logger('wrote file to ' + resultFileName);
            return fileSystem.fileRead(resultFileName, false)
              .then(fileOutput => {
                // We have to disambiguate between zip files and gb files!
                const fileExtension = (fileOutput.substring(0, 5) !== 'LOCUS') ? '.zip' : '.gb';
                return downloadAndDelete(res, resultFileName, name + fileExtension);
              });
          });
      })
      .catch(err => {
        logger('Error exporting');
        logger(err);
        logger(err.stack);
        res.status(500).send(err);
      });
  });

/***** IMPORT ******/

//todo - ensure got genbank
router.post('/import/:projectId?',
  importMiddleware,
  (req, res, next) => {
    const { noSave, returnRoll, projectId, files } = req; //eslint-disable-line no-unused-vars
    const { constructsOnly } = req.body;

    logger(`importing genbank (${req.user.uuid}) @ ${files.map(file => file.filePath).join(', ')}`);

    //future - handle multiple files. expect only one right now. need to reduce into single object before proceeding\
    const { name, string, filePath, fileUrl } = files[0]; //eslint-disable-line no-unused-vars

    //could probably unify this better...
    //on conversions, project is irrelevant, sometimes we only want the construct blocks, never wrap
    if (projectId === 'convert') {
      return convert(filePath, fileUrl)
        .then(converted => {
          logger('converted');

          const roots = converted.roots;
          const rootBlocks = _.pickBy(converted.blocks, (block, blockId) => roots.indexOf(blockId) >= 0);
          const roll = {
            project: Project.classless({
              components: roots,
            }),
            blocks: constructsOnly ? rootBlocks : converted.blocks,
            sequences: converted.sequences,
          };

          Object.assign(req, { roll });

          next();
        })
        .catch(err => next(err));
    }

    return importProject(filePath, fileUrl)
    //wrap all the childless blocks in a construct (so they dont appear as top-level constructs), update rollup with construct Ids
      .then(roll => {
        logger('imported');

        if (!roll || typeof roll !== 'object') {
          logger('error retrieving roll ' + filePath);
          return Promise.reject('error retrieving roll');
        }

        const blockIds = Object.keys(roll.blocks);

        if (!blockIds.length) {
          return Promise.reject('no valid blocks');
        }

        const childlessBlockIds = roll.project.components.filter(blockId => roll.blocks[blockId].components.length === 0);

        const wrapperConstructs = childlessBlockIds.reduce((acc, blockId, index) => {
          const constructName = name + (index > 0 ? ' - Construct ' + (index + 1) : '');
          const construct = Block.classless({
            components: [blockId],
            metadata: {
              constructName,
            },
          });
          return Object.assign(acc, { [construct.id]: construct });
        }, {});

        //add constructs to rollup of blocks
        Object.assign(roll.blocks, wrapperConstructs);

        //update project components to use wrapped constructs and replace childless blocks
        roll.project.components = [
          ...roll.project.components.filter(blockId => childlessBlockIds.indexOf(blockId) < 0),
          ...Object.keys(wrapperConstructs),
        ];

        return roll;
      })
      .then(roll => {
        //dont care about timing
        fileSystem.fileWrite(filePath + '-converted', roll);

        logger('remapped');

        Object.assign(req, { roll });
        next();
      })
      .catch((err) => {
        logger('error in Genbank conversion');
        logger(err);
        logger(err.stack);
        next(err);
      });
  },
  mergeRollupMiddleware
);

router.all('*', (req, res) => res.status(404).send('route not found'));

export default router;
