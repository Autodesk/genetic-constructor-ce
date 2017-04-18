import { assert, expect } from 'chai';
import uuid from 'node-uuid';
import Block from '../../../../src/models/Block';
import BlockSchema from '../../../../src/schemas/Block';
import ProjectSchema from '../../../../src/schemas/Project';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as blockPersistence from '../../../../server/data/persistence/blocks';
import { deleteUser } from '../../../../server/data/persistence/admin';
import { merge, values } from 'lodash';

import { createExampleRollup } from '../../../_utils/rollup';

describe('Server', () => {
  describe('Data', () => {
    describe('Persistence', () => {
      describe('Blocks', () => {
        const promoterBlockName = 'my_promoter';
        const terminatorBlockName = 'el terminado';

        const createCustomRollup = () => {
          const roll = createExampleRollup();
          const projectId = roll.project.id;
          const promoter = Block.classless({
            projectId,
            metadata: { name: promoterBlockName },
            rules: { role: 'promoter' },
          });
          const terminator = Block.classless({
            projectId,
            metadata: { name: terminatorBlockName },
            rules: { role: 'terminator' },
          });
          merge(roll.blocks, { [promoter.id]: promoter, [terminator.id]: terminator });
          roll.project.components.push(promoter.id, terminator.id);
          return roll;
        };
        const numberBlocksInCustomRollup = Object.keys(createCustomRollup().blocks).length;

        const myUserId = uuid.v1();
        const myRolls = [1, 2, 3, 4].map(createCustomRollup);
        const myRollIds = myRolls.map(roll => roll.project.id);

        const otherUserId = uuid.v1();
        const otherRolls = [1, 2, 3].map(createCustomRollup);
        const otherRollIds = otherRolls.map(roll => roll.project.id);

        before(() => {
          return Promise.all([
            ...myRollIds.map((projectId, index) => {
              return projectPersistence.projectWrite(projectId, myRolls[index], myUserId);
            }),
            ...otherRollIds.map((projectId, index) => {
              return projectPersistence.projectWrite(projectId, otherRolls[index], otherUserId);
            }),
          ]);
        });

        after(() => {
          return Promise.all([
            deleteUser(myUserId),
            deleteUser(otherUserId),
          ]);
        });

        it('before() should have written properly', () => {
          return Promise.all(
            [...myRollIds, ...otherRollIds].map(id => projectPersistence.projectExists(id))
          )
            .then(results => {
              assert(results.every(result => Number.isInteger(result)), 'should have all been written');
            });
        });

        it('getAllBlocks() get all blocks for a user ID', () => {
          return blockPersistence.getAllBlocks(myUserId)
            .then(blockMap => {
              const blocks = values(blockMap);
              expect(blocks.length).to.equal(myRolls.length * numberBlocksInCustomRollup);
              assert(blocks.every(block => BlockSchema.validate(block, true)), 'blocks not in valid format');
            });
        });

        it('getAllPartsWithRole() can get all blocks of type', () => {
          return blockPersistence.getAllPartsWithRole(myUserId, 'promoter')
            .then(blockMap => {
              const blocks = values(blockMap);
              expect(blocks.length).to.equal(myRolls.length);
              assert(blocks.every(block => block.rules.role === 'promoter'), 'got block with wrong role type');
            });
        });

        it('getAllBlockRoles() returns counts', () => {
          return blockPersistence.getAllBlockRoles(myUserId)
            .then(counts => {
              assert(typeof counts === 'object' && !Array.isArray(counts), 'expect map');
              expect(counts.promoter).to.be.defined;
              expect(counts.terminator).to.be.defined;
              expect(typeof counts.promoter).to.equal('number');
              assert(counts.promoter === myRolls.length, 'should have correct number promoters');
            });
        });

        it('getAllBlocksByName() gets blocks by name', () => {
          return blockPersistence.getAllBlocksWithName(myUserId, promoterBlockName)
            .then(blockMap => {
              const blocks = values(blockMap);
              expect(blocks.length).to.equal(myRolls.length);
              assert(blocks.every(block => block.metadata.name === promoterBlockName), 'got block with wrong name');
            });
        });

        it('getAllBlocksByName() works with spaces', () => {
          return blockPersistence.getAllBlocksWithName(myUserId, terminatorBlockName)
            .then(blockMap => {
              const blocks = values(blockMap);
              expect(blocks.length).to.equal(myRolls.length);
              assert(blocks.every(block => block.metadata.name === terminatorBlockName), 'got block with wrong name');
            });
        });

        it('getAllBlocksByName() works with partial strings', () => {
          return blockPersistence.getAllBlocksWithName(myUserId, promoterBlockName.substring(0, 6))
            .then(blockMap => {
              const blocks = values(blockMap);
              expect(blocks.length).to.equal(myRolls.length);
              assert(blocks.every(block => block.metadata.name === promoterBlockName), 'got block with wrong name');
            });
        });
      });
    });
  });
});
