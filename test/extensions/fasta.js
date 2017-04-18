import { assert, expect } from 'chai';
import * as sequences from '../../server/data/persistence/sequence';
import { callExtensionApi } from '../../src/middleware/extensions';
import createExampleProject from '../_fixtures/rollup';

const extensionKey = 'fasta';

describe('Extensions', () => {
  describe('FASTA', () => {
    let roll;

    before(() => {
      return createExampleProject()
        .then(created => { roll = created; });
    });

    it('should be able to export specific blocks', () => {
      const construct = roll.blocks[roll.project.components[1]];
      const leafIds = construct.components.filter((id, index) => index % 2);
      const md5s = leafIds.map(id => roll.blocks[id].sequence.md5);

      assert(leafIds.length > 1, 'should be at least 2 blocks with sequence');

      return callExtensionApi(extensionKey, `export/blocks/${roll.project.id}/${leafIds.join(',')}`)
        .then(resp => {
          expect(resp.status).to.equal(200);
          return resp.text();
        })
        .then(fasta => {
          return Promise.all(md5s.map(md5 => sequences.sequenceGet(md5)))
            .then(sequences => {
              expect(fasta.substring(0, 1)).to.equal('>');
              assert(sequences.every(seq => fasta.indexOf(seq) > 0), 'sequence not present');
            });
        });
    });
  });
});
