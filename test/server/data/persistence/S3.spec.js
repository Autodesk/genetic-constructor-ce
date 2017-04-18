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
import { assert, expect } from 'chai';
import uuid from 'node-uuid';
import * as s3 from '../../../../server/data/middleware/s3';
import AWS from 'aws-sdk';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('S3', function S3Persistence() {
        const bucketName = 'bionano-gctor-files';
        let bucket;

        //skip test suite if not using s3
        before(function () {
          if (!s3.useRemote) {
            this.skip();
          }
          bucket = s3.getBucket(bucketName);
        });

        const stringName = uuid.v4();
        const stringContents = 'something';

        const objectName = uuid.v4();
        const objectContents = { hey: 'there' };

        it('bucketVersioned() checks if bucket is versioned', () => {
          return s3.bucketVersioned(bucket)
            .then(result => {
              assert(result === true, 'Versioning should be enabled. NOTE MANY TESTS WILL FAIL IN THIS SUITE IF VERSIONING NOT ENABLED');
            })
            .catch(err => {
              console.error('NOTE MANY TESTS WILL FAIL IN THIS SUITE IF VERSINOING NOT ENABLED');
              throw new Error(err);
            });
        });

        it('getBucket() returns AWS bucket', () => {
          expect(bucket).to.be.defined;
          expect(typeof bucket.getObject).to.equal('function');
          expect(typeof bucket.getSignedUrl).to.equal('function');
        });

        it('getSignedUrl() returns url', () => {
          const url = s3.getSignedUrl(bucket, 'myFile');
          expect(url).to.be.defined;
          assert(/https/.test(url), 'expected https');
        });

        it('getSignedUrl() can get url for putting object', () => {
          const url = s3.getSignedUrl(bucket, 'myFile', 'putObject');
          expect(url).to.be.defined;
          assert(/https/.test(url), 'expected https');
        });

        it('stringPut() puts string, returns a version', () => {
          return s3.stringPut(bucket, stringName, stringContents)
            .then(result => {
              assert(!!result.VersionId, 'expected VersionId');
            });
        });

        it('stringGet() gets string', () => {
          return s3.stringGet(bucket, stringName)
            .then(result => {
              expect(result).to.equal(stringContents);
            });
        });

        it('objectPut() puts object, gets a version', () => {
          return s3.objectPut(bucket, objectName, objectContents)
            .then(result => {
              assert(!!result.VersionId, 'expected VersionId');
            });
        });

        it('objectPut() expects an object', () => {
          expect(() => s3.objectPut(bucket, objectName, stringContents)).to.throw();
        });

        it('objectGet() gets object, parses', () => {
          return s3.objectGet(bucket, objectName)
            .then(result => {
              expect(result).to.eql(objectContents);
            });
        });

        it('objectGet() catches when not an object, rejects', (done) => {
          s3.objectGet(bucket, stringName)
            .then(done)
            .catch(err => {
              done();
            });
        });

        it('itemExists() checks if exists', () => {
          return Promise.all([
            s3.itemExists(bucket, stringName)
              .then(result => {
                assert(result === true, 'expected to exist');
              }),
            s3.itemExists(bucket, uuid.v4())
              .then(result => { throw Error('shouldnt resolve to false') })
              .catch(result => {
                assert(result === false, 'expected to not exist');
              }),
          ]);
        });

        it('itemDelete() deletes object', () => {
          return s3.itemDelete(bucket, stringName)
            .then(() => s3.itemExists(bucket, stringName))
            .then((result) => { throw Error('shouldnt exist'); })
            .catch((exists) => {
              expect(exists).to.equal(false);
            });
        });

        it('itemVersions() gets versions of an object', () => {
          const name = uuid.v4();

          return s3.objectPut(bucket, name, { value: 1 })
            .then(() => s3.objectPut(bucket, name, { value: 2 }))
            .then(() => s3.objectPut(bucket, name, { value: 3 }))
            .then(() => s3.objectPut(bucket, name, { value: 4 }))
            .then(() => s3.itemVersions(bucket, name))
            .then(versions => {
              expect(versions.length).to.equal(4);
              assert(versions.every(ver => !!ver.Key && !!ver.VersionId && ver.LastModified), 'expected fields Key, VersionId, LastModified');
            });
        });

        it('itemPutBuffer() uploads a buffer');
        it('itemGetBuffer() downloads a buffer');
      });
    });
  });
});
