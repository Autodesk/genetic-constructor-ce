import express from 'express';
import invariant from 'invariant';

//GC specific
import * as fileSystem from '../../../data/middleware/fileSystem';
import * as filePaths from '../../../data/middleware/filePaths';
import * as sequences from '../../../../server/data/persistence/sequence';
import { projectPermissionMiddleware } from '../../../../server/data/permissions';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import { errorDoesNotExist } from '../../../../server/utils/errors';

const extensionKey = 'fasta';

//make storage directory just in case...
fileSystem.directoryMake(filePaths.createStorageUrl(extensionKey));

const createFilePath = (fileName) => {
  invariant(fileName, 'need a file name');
  return filePaths.createStorageUrl(extensionKey, fileName);
};

//create the router
const router = express.Router(); //eslint-disable-line new-cap

//route to download files
router.get('/file/:fileId', (req, res, next) => {
  const { fileId } = req.params;

  const path = createFilePath(fileId);

  fileSystem.fileExists(path)
    .then(() => res.sendFile(path))
    .catch(err => {
      if (err === errorDoesNotExist) {
        return res.status(404).send();
      }

      next(err);
    });
});

//EXPORT - project, each construct as a FASTA
router.get('/export/project/:projectId',
  projectPermissionMiddleware,
  (req, res, next) => {
    //this is tricky because need to handle list blocks + hierarchy...
    //probably want to share this code with selectors (and genbank extension)

    res.status(501).send('not implemented');
  });

//EXPORT - specific blocks from a project (expects blocks with sequence only). comma-separated
router.get('/export/blocks/:projectId/:blockIdList',
  projectPermissionMiddleware,
  (req, res, next) => {
    const { projectId, blockIdList } = req.params;
    const blockIds = blockIdList.split(',');

    projectPersistence.projectGet(projectId)
      .then(roll => {
        const blocks = blockIds.map(blockId => roll.blocks[blockId]);
        if (!blocks.every(block => block.sequence.md5)) {
          console.warn('[FASTA] some blocks dont have md5: ' + projectId, blockIds);
          throw Error('all blocks must have an md5');
        }

        return Promise.all(
          blocks.map(block => sequences.sequenceGet(block.sequence.md5))
        )
          .then(sequences => {
            const fullSeq = sequences.reduce((acc, seq) => acc + seq, '');
            const name = roll.project.metadata.name || 'Constructor Export';
            const fileContents = `>${name} | ${projectId} | ${blockIdList}
${fullSeq}`;

            res.set({
              'Content-Disposition': `attachment; filename="sequence.fasta"`,
            });
            res.send(fileContents);
          });
      })
      .catch(err => res.status(500).send(err));
  });

export default router;
