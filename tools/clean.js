import del from 'del';
import { makeDir } from './lib/fs';
import * as s3 from '../server/data/middleware/s3';
import * as filePaths from '../server/data/middleware/filePaths';

/**
 * Cleans up the output (build) directory.
 */
async function clean() {
  console.log('clearing temp files + previous builds');
  await del(['.tmp', 'build/*', '!build/.git'], { dot: true });

  // delete old test data
  // must be before setup() makes its directories
  console.log('clearing local files in ' + filePaths.createStorageUrl());
  await del([filePaths.createStorageUrl()], { force: true, dot: true });

  if (s3.useRemote) {
    console.log('clearing s3 buckets...'); //eslint-disable-line no-console
    await Promise.all(s3.buckets.map(bucketName => {
      const bucket = s3.getBucket(bucketName);
      return s3.emptyBucketTests(bucket);
    }));
  }

  await makeDir('build/public');
}

export default clean;
