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
import { expect, assert } from 'chai';
import { writeFile } from '../../../src/middleware/projects';
import Block from '../../../src/models/Block';
import md5 from 'md5';

import * as sequences from '../../../server/data/persistence/sequence';

describe('Model', () => {
  describe('Block', () => {
    describe('Sequence', () => {
      const withoutSequence = new Block();
      const oneSequence = 'acgacgatcgtacgatcgtacgactacgt';
      const twoSequence = 'aacccgggggttttt';
      const invalidSequence = 'qwertyuiop';

      const oneMd5 = md5(oneSequence);
      const twoMd5 = md5(twoSequence);

      const withSequence = withoutSequence.merge({
        sequence: {
          md5: oneMd5,
          length: oneSequence.length,
          initialBases: oneSequence.substr(0, 6),
        },
      });

      before(() => {
        return sequences.sequenceWrite(oneMd5, oneSequence);
      });

      it('getSequence() returns promise -> null when there is no sequence', () => {
        return withoutSequence.getSequence()
          .then((result) => {
            expect(result).to.eql(null);
          });
      });

      it('getSequence() retrieves the sequence as promise', () => {
        return withSequence.getSequence()
          .then(result => {
            expect(result).to.eql(oneSequence);
          });
      });

      it('setSequence() will reject on invalid sequence', () => {
        return withSequence.setSequence(invalidSequence)
          .then(() => assert(false, 'sequence was invalid...'))
          .catch(err => assert(err.indexOf('invalid') >= 0, 'got wrong error...'));
      });

      it('setSequence() returns the updated block, with md5 and length', () => {
        return withSequence.setSequence(twoSequence)
          .then(block => {
            expect(block.sequence.md5).to.equal(twoMd5);
            expect(block.sequence.length).to.equal(twoSequence.length);
          });
      });

      it('setSequence() -> getSequence() gets the same sequence', () => {
        const newSequence = 'acgtacgtcagtcatcgac';
        return withSequence.setSequence(newSequence)
          .then(block => block.getSequence())
          .then(sequence => {
            expect(sequence).to.equal(newSequence);
          });
      });

      it('getSequence() respects trim', () => {
        const trim = 3;
        const withSequenceAndTrim = withSequence.mutate('sequence.trim', [trim, trim]);
        const withSequenceAndTrim2 = withSequence.setSequenceTrim(trim, trim);

        expect(withSequenceAndTrim).to.eql(withSequenceAndTrim2);

        return withSequenceAndTrim.getSequence().then(result => {
          expect(result.length).to.equal(oneSequence.length - (trim * 2));
          expect(result).to.equal(oneSequence.substring(trim, oneSequence.length - trim));
        });
      });
    });
  });
});
