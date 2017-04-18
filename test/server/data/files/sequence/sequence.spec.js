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
import path from 'path';
import md5 from 'md5';
import uuid from 'node-uuid';
import {
  fileExists,
  fileRead,
  fileWrite,
  fileDelete,
} from '../../../../../server/data/middleware/fileSystem';
import { errorDoesNotExist } from '../../../../../server/utils/errors';
import { validPseudoMd5, generatePseudoMd5, parsePseudoMd5 } from '../../../../../src/utils/sequenceMd5';
import * as filePaths from '../../../../../server/data/middleware/filePaths';
import * as sequences from '../../../../../server/data/persistence/sequence';

describe('Server', () => {
  describe('Data', () => {
    describe('files', () => {
      describe('sequence', function persistenceTests() {
        const rangeStart = 20;
        const rangeEnd = 35;
        const sequence = 'ACTAGCTAGCTAGCTGACTAGCTAGCTGATCGTAGCGATCTACTGATCAGCTACTGTACGTACGTGACTG';
        const rangedSequence = sequence.substring(rangeStart, rangeEnd);

        const realMd5 = md5(sequence);
        const pseudoMd5 = generatePseudoMd5(realMd5, rangeStart, rangeEnd);

        const filePath = filePaths.createSequencePath(realMd5);

        it('generatePseudoMd5() should be in form md5[start:end]', () => {
          expect(pseudoMd5).to.equal(`${realMd5}[${rangeStart}:${rangeEnd}]`);
        });

        it('parsePseudoMd5() should parse properly', () => {
          const parsed = parsePseudoMd5(pseudoMd5);
          expect(parsed).to.eql({
            original: pseudoMd5,
            hash: realMd5,
            byteRange: `[${rangeStart}:${rangeEnd}]`,
            hasRange: true,
            start: rangeStart,
            end: rangeEnd,
          });
        });

        it('sequenceWrite() should not write a sequence specifying a range', () => {
          expect(() => sequences.sequenceWrite(pseudoMd5, sequence)).to.throw();
        });

        it('sequenceWrite() -> sequenceGet() works', () => {
          return sequences.sequenceWrite(realMd5, sequence)
            .then(() => sequences.sequenceGet(realMd5))
            .then(result => {
              assert(result === sequence, 'sequences should match');
            })
            .then(() => sequences.sequenceGet(pseudoMd5))
            .then(result => {
              assert(result === rangedSequence, 'range of sequences should match');
            });
        });

        it('sequenceWriteMany() should take map of md5 to sequence');

        it('sequenceWriteChunks() takes sequence and rangeMap, returns block to pseudoMd5, and works with true as range', () => {
          const sequence = 'actacgtacgtacgagcactgcgtagctgatcagctgctgactgactgatcgacgtagcagctacgtagctagc';
          const sequenceMd5 = md5(sequence);
          const range1 = [5, 15];
          const range2 = [10, 30];
          const range3 = true;

          const rangeMap = {
            id1: range1,
            id2: range2,
            id3: range3,
          };

          return sequences.sequenceWriteChunks(sequence, rangeMap)
            .then(result => {
              expect(result.id1).to.equal(generatePseudoMd5(sequenceMd5, range1[0], range1[1]));
              expect(result.id2).to.equal(generatePseudoMd5(sequenceMd5, range2[0], range2[1]));
              expect(result.id3).to.equal(sequenceMd5);

              return sequences.sequenceGet(result.id1)
                .then(seqResult => {
                  expect(seqResult).to.equal(sequence.substring(range1[0], range1[1]));
                })
                .then(() => sequences.sequenceGet(result.id3))
                .then(seqResult => {
                  expect(seqResult).to.equal(sequence);
                });
            });
        });

        it('should handle when sequence doesnt exist', () => {
          const dummy = md5(uuid.v4());
          return sequences.sequenceGet(dummy)
            .then(() => new Error('shoulnt resolve'))
            .catch(err => {
              expect(err).to.eql(errorDoesNotExist);
            });
        });

        it('should handle on delete when file doesnt exist', () => {
          const dummy = md5(uuid.v4());
          return sequences.sequenceDelete(dummy)
            .then(() => new Error('shoulnt resolve'))
            .catch(err => {
              expect(err).to.eql(errorDoesNotExist);
            });
        });

        //future
        it('should not allow overwriting an existing file');
      });
    });
  });
});
