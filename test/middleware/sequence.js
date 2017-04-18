import chai from 'chai';
import * as api from '../../src/middleware/sequence';
import md5 from 'md5';
const { assert, expect } = chai;
import { generatePseudoMd5 } from '../../src/utils/sequenceMd5';

describe('Middleware', () => {
  describe('Sequence', () => {
    const seq = 'ACTCGACTGACTAGCTACGTACGTACTGACTACTACGCATACGTACTACTGACGTCA';
    const hash = md5(seq);
    const range = [10, 20];
    const pseudoMd5 = generatePseudoMd5(hash, range);

    it('writeSequence() works + returns md5', () => {
      return api.writeSequence(seq)
        .then(seqMd5 => {
          expect(seqMd5).to.equal(hash);
        });
    });

    it('getSequence() accepts an md5', () => {
      return api.getSequence(hash)
        .then(result => {
          expect(result).to.equal(seq);
        });
    });

    it('getSequence() accepts a pseudoMd5', () => {
      return api.getSequence(pseudoMd5)
        .then(result => {
          expect(result).to.equal(seq.substring(range[0], range[1]));
        });
    });

    it('getSequences() dedupes a bunch of sequences');
  });
});
