import path from 'path';
import _ from 'lodash';
import * as fileSystem from '../server/data/middleware/fileSystem';
import {
  createStorageUrl,
  jobPath,
  sequencePath,
  projectFilesPath,
} from '../server/data/middleware/filePaths';

import * as s3 from '../server/data/middleware/s3';
import * as sequencePersistence from '../server/data/persistence/sequence';

async function setupFiles() {
  console.log('Creating storage directories');
  await fileSystem.directoryMake(createStorageUrl());
  await fileSystem.directoryMake(createStorageUrl(jobPath));
  await fileSystem.directoryMake(createStorageUrl(sequencePath));
  await fileSystem.directoryMake(createStorageUrl(projectFilesPath));

  if (s3.useRemote) {
    console.log('ensuring S3 buckets provisioned');
    await Promise.all(
      s3.buckets.map(bucket => s3.ensureBucketProvisioned(bucket))
    );
  }

  console.log('Copying EGF sequences to storage');
  const pathSequences = path.resolve(__dirname, '../data/egf_parts/sequences');
  console.log('Copying from', pathSequences);

  await fileSystem.directoryContents(pathSequences)
    .then(sequenceFiles => {
      //check if a few exist, and if they dont, then write them all
      //check because this step will be slow e.g. on travis
      const samples = _.sampleSize(sequenceFiles, 10);

      return Promise.all(
        samples.map(seqMd5 => sequencePersistence.sequenceExists(seqMd5))
      )
        //if all resolve, they exist
        .then(() => {
          console.log('EGF Sequences already copied');
        })
        //if fail, write them all
        .catch(() => {
          return Promise.all(
            sequenceFiles.map(fileName => {
              const filePath = path.resolve(pathSequences, fileName);
              return fileSystem.fileRead(filePath, false)
                .then(contents => sequencePersistence.sequenceWrite(fileName, contents));
            })
          )
            .then(sequences => {
              console.log('copied ' + sequenceFiles.length + ' sequences');
            });
        })
        .catch(err => {
          console.log('Error copying EGF sequences, continuing anyway...');
          console.log(err.stack);
        });
    });
}

export default setupFiles;
