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
import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';
import { expect, assert } from 'chai';
import Rollup from '../../src/models/Rollup';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import * as projectPersistence from '../../server/data/persistence/projects'
import _ from 'lodash';

describe('Model', () => {
  describe('Rollup', () => {
    it('validate can throw on errors', () => {
      expect(() => Rollup.validate({ project: {}, blocks: {} }, true)).to.throw();
    });

    it('validate() works on examples', () => {
      Rollup.validate(createExampleRollup(), true);
    });

    it('validate() works on simple one', () => {
      const pr = Project.classless();
      const bl = Block.classless({ projectId: pr.id });
      const rl = {
        schema: 1,
        project: pr,
        blocks: {
          [bl.id]: bl,
        },
      };

      expect(Rollup.validate(rl)).to.equal(true);
      Rollup.validate(rl, true);
    });

    it('validate() cheap validation just checks basic shape, e.g. ignores block projectId', () => {
      const pr = Project.classless();
      const bl = Block.classless();
      const rl = {
        schema: 1,
        project: pr,
        blocks: {
          [bl.id]: bl,
        },
      };

      expect(Rollup.validate(rl, false, false)).to.equal(true);
    });

    it('validate() catches wrong projectId, in non-light validation', () => {
      const pr = Project.classless();
      const bl = Block.classless({
        projectId: Project.classless().id,
      });
      const rl = {
        schema: 1,
        project: pr,
        blocks: {
          [bl.id]: bl,
        },
      };

      expect(Rollup.validate(rl, false)).to.equal(false);

      rl.blocks[bl.id].projectId = pr.id;

      expect(Rollup.validate(rl, false)).to.equal(true);
    });

    it('validate() checks for weird keys', () => {
      const pr = Project.classless();
      const bl = Block.classless({
        projectId: Project.classless().id,
      });
      const rl = {
        schema: 1,
        project: pr,
        blocks: {
          [bl.id]: bl,
        },
        random: 'value',
      };

      expect(Rollup.validate(rl, false)).to.equal(false);
    });

    it('validate checks if each block is valid', () => {
      const proj = Project.classless();
      const invalidBlock = Object.assign(Block.classless({projectId: proj.id}), { metadata: 'invalid' });

      const rl = {
        schema: 1,
        project: proj,
        blocks: {
          [invalidBlock.id]: invalidBlock,
        },
      };

      expect(() => Rollup.validate(rl, true)).to.throw();
    });

    it('compare() can throw', () => {
      expect(() => Rollup.compare(createExampleRollup(), createExampleRollup(), true)).to.throw();
    });

    it('compare() picks up project difference, throws on error', () => {
      const one = createExampleRollup();
      const two = _.merge({}, one, { project: { blah: 'field' } });
      expect(Project.compare(one.project, two.project)).to.equal(false);
      expect(() => Rollup.compare(one, two, true)).to.throw();
    });

    it('compare() ignores project version stuff', () => {
      const roll = createExampleRollup();

      return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(info => {
          Rollup.compare(info.data, roll, true);
        });
    });
  });
});
