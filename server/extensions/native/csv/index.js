import express from 'express';

import { convertCsv } from './convert';
import importMiddleware, { mergeRollupMiddleware } from '../_shared/importMiddleware';

//GC specific
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import * as fileSystem from '../../../data/middleware/fileSystem';
import * as filePaths from '../../../data/middleware/filePaths';
import { errorDoesNotExist } from '../../../../server/utils/errors';
import { projectPermissionMiddleware } from '../../../data/permissions';

const extensionKey = 'csv'; //eslint-disable-line no-unused-vars

//create the router
const router = express.Router(); //eslint-disable-line new-cap

/* special parameters */

router.param('projectId', (req, res, next, id) => {
  Object.assign(req, { projectId: id });
  next();
});

/* file route */

//route to download files
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

/* import */
//todo - ensure valid CSV
router.post('/import/:projectId?',
  importMiddleware,
  (req, res, next) => {
    const { noSave, returnRoll, projectId, files } = req; //eslint-disable-line no-unused-vars

    //future - handle multiple files. expect only one right now. need to reduce into single object before proceeding\
    const { name, string, fileName, filePath, fileUrl } = files[0]; //eslint-disable-line no-unused-vars

    return convertCsv(string, fileName, fileUrl)
      .then(converted => {
        return fileSystem.fileWrite(filePath + '-converted', converted)
          .then(() => converted);
      })
      //get maps of sequence hash and blocks, write sequences first
      .then(({ blocks, sequences }) => {
        const blockIds = Object.keys(blocks);

        if (!blockIds.length) {
          return Promise.reject('no valid blocks');
        }

        const roll = { sequences };

        //todo - reconcile automatic wrapping in constructs with Genbank conversions
        //if we are doing a convert, then dont wrap with constructs
        if (projectId === 'convert') {
          Object.assign(roll, {
            project: Project.classless({ components: blockIds }),
            blocks,
          });
        } else {
          //wrap all the blocks in a construct (so they dont appear as top-level constructs), add constructs to the blocks Object

          const allBlocks = blockIds.reduce((acc, blockId) => {
            const row = blocks[blockId].metadata.csv_row;
            const fileName = blocks[blockId].metadata.csv_file;
            const name = fileName + (row > 0 ? ' - row ' + row : '');
            const construct = Block.classless({
              components: [blockId],
              metadata: {
                name,
              },
            });
            return Object.assign(acc, { [construct.id]: construct });
          }, blocks);

          const constructIds = Object.keys(allBlocks).filter(blockId => allBlocks[blockId].components.length > 0);

          const project = Project.classless({ components: constructIds });
          Object.assign(roll, {
            project,
            blocks: allBlocks,
          });
        }

        Object.assign(req, { roll });
        next();
      })
      .catch((err) => {
        console.log('error in CSV conversion', err);
        console.log(err.stack);
        next(err);
      });
  },
  mergeRollupMiddleware
);

router.get('export/:projectId',
  projectPermissionMiddleware,
  (req, res, next) => {
    res.status(501).send();
  });

export default router;
