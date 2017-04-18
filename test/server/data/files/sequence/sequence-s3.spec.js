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
import md5 from 'md5';
import { errorDoesNotExist } from '../../../../../server/utils/errors';
import rejectingFetch from '../../../../../src/middleware/utils/rejectingFetch';
import { validPseudoMd5, generatePseudoMd5, parsePseudoMd5 } from '../../../../../src/utils/sequenceMd5';

import * as s3 from '../../../../../server/data/middleware/s3';
import * as sequences from '../../../../../server/data/persistence/sequence';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('files', () => {
        describe('S3', () => {
          let s3bucket;

          //skip test suite if not using s3
          before(function runCheck() {
            if (!s3.useRemote) {
              this.skip();
            }

            s3bucket = s3.getBucket(sequences.bucketName);
          });

          const seq = 'actagctagctacatctagctgctagcatcgtgctgactgacggctatcgatcgactgatcgatcgatcgatc';
          const hash = md5(seq);

          const seq2 = 'CAGTCAGTCGACTAGCTAGCTGCTACGTACTACTGACTACGACTGACTAGCTAGCTAGCTAGCTAGCATCTATGCTAGC';
          const hash2 = md5(seq2);

          // SEQUENCE
          it('sequenceGet() should throw on invalid md5', () => {
            expect(() => sequences.sequenceGet(uuid.v4())).to.throw();
          });

          it('sequenceGet() should fail on sequences that dont exist', () => {
            return sequences.sequenceGet(md5(uuid.v4()))
              .then(huhwhat => Promise.reject('nah uh. shuoldnt have worked'))
              .catch((err) => {
                expect(err).to.equal(errorDoesNotExist);
              });
          });

          it('sequenceWrite() should read a sequence from S3', () => {
            return sequences.sequenceWrite(hash, seq)
              .then(() => {
                const url = sequences.sequenceGetRemoteUrl(hash);
                return rejectingFetch(url)
                  .then(resp => resp.text());
              })
              .then(result => {
                expect(result).to.be.defined;
                expect(result).to.equal(seq);
              });
          });

          it('sequenceGet() should get a sequence from S3', () => {
            return sequences.sequenceGet(hash)
              .then(result => {
                expect(result).to.equal(seq);
              });
          });

          it('sequenceRead() can get a byte range', () => {
            const start = 10;
            const end = 30;
            return sequences.sequenceGet(`${hash}[${start}:${end}]`)
              .then(result => {
                expect(result).to.equal(seq.substring(start, end));
              });
          });

          it('sequenceGet() works with basic s3 api', () => {
            return s3.stringPut(s3bucket, hash2, seq2)
              .then(() => sequences.sequenceGet(hash2))
              .then(result => {
                expect(result).to.equal(seq2);
              });
          });

          it('should delete a file that exists');
        });
      });
    });
  });
});
