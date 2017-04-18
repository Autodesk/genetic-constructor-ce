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
import { expect } from 'chai';
import RollupSchema from '../../src/schemas/Rollup';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import { createExampleRollup, createSequencedRollup } from '../_utils/rollup';

describe('Schema', () => {
  describe('Rollup', () => {
    it('should validate the test created rollup', () => {
      expect(RollupSchema.validate(createExampleRollup())).to.equal(true);
    });

    it('should validate scaffold', () => {
      expect(RollupSchema.validate(RollupSchema.scaffold())).to.equal(true);
    });

    it('should validate a simply created rollup, requiring version', () => {
      const project = new Project();
      const block = new Block({
        projectId: project.id,
      });

      const roll = {
        project,
        blocks: {
          [block.id]: block,
        },
      };

      expect(RollupSchema.validate(roll)).to.equal(false);

      Object.assign(roll, { schema: 1 });

      expect(RollupSchema.validate(roll)).to.equal(true);
    });

    it('should throw on error if specified', () => {
      const good = createExampleRollup();
      const bad = Object.assign({}, good, { project: { metadata: {} } });

      expect(RollupSchema.validate(good)).to.equal(true);
      expect(() => RollupSchema.validate(good, true)).to.not.throw();

      expect(RollupSchema.validate(bad)).to.equal(false);
      expect(() => RollupSchema.validate(bad, true)).to.throw();
    });

    it('should validate a rollup with sequences', () => {
      // { md5: sequence } format
      RollupSchema.validate(createSequencedRollup(), true);

      const project = new Project();
      const seq = 'CAGTCGATCGATCGTCAGTACGTGCTAGCTGACTGACATCTAGCAGCTAGC';
      const block = new Block({
        projectId: project.id,
      });
      const block2 = new Block({
        projectId: project.id,
      });

      const roll = {
        schema: 1,
        project,
        blocks: {
          [block.id]: block,
          [block2.id]: block2,
        },
        sequences: [{
          sequence: seq,
          blocks: {
            [block.id]: true,
            [block2.id]: [5, 10],
          },
        }],
      };

      RollupSchema.validate(roll, true);
    });

    it('should only allow certain fields (blocks, project, sequences, schema)', () => {
      const bad = Object.assign(createSequencedRollup(), { extra: 'bad' });
      expect(() => RollupSchema.validate(bad, true)).to.throw();
    });

    it('should make sure projectIds in blocks match the rollup project Id', () => {
      const project = new Project();
      const block = new Block({
        projectId: Project.classless().id,
      });

      const roll = {
        schema: 1,
        project,
        blocks: {
          [block.id]: block,
        },
      };

      expect(RollupSchema.validate(roll)).to.equal(false);
    });

    it('should allow for a cheap check');
  });
});
