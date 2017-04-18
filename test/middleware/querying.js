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
import _ from 'lodash';
import { createExampleRollup } from '../_utils/rollup';
import * as projectPersistence from '../../server/data/persistence/projects';
import Block from '../../src/models/Block';
import { testUserId } from '../constants';
import { deleteUser } from '../../server/data/persistence/admin';
import * as api from '../../src/middleware/querying';

describe('Middleware', () => {
  describe('Querying', () => {
    const randomUser = uuid.v1();

    const roll = createExampleRollup();
    const otherRoll = createExampleRollup();

    const projectId = roll.project.id;

    //add 5 weird role type (5 of each) blocks to roll
    const numberCustom = 5;
    const myName = 'someBlockName';
    const altName = 'another block name';

    const esotericRole = 'asdfasdfasdf';
    const esotericRoleAlt = 'sadfasdffdsadf';

    const makeBlocks = (projectId) => {
      return _.range(numberCustom * 2)
        .map((num) => Block.classless({
          metadata: { name: (num % 2 === 0) ? myName : altName },
          projectId,
          rules: { role: (num % 2 === 0) ? esotericRoleAlt : esotericRole },
        }))
        .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
    };

    _.merge(roll.blocks, makeBlocks(roll.project.id));
    _.merge(otherRoll.blocks, makeBlocks(otherRoll.project.id));

    before(() => {
      return projectPersistence.projectWrite(projectId, roll, testUserId)
      //check across versions
        .then(() => projectPersistence.projectWrite(projectId, roll, testUserId))
        //check across users
        .then(() => projectPersistence.projectWrite(otherRoll.project.id, otherRoll, randomUser));
    });

    after(() => {
      return deleteUser(randomUser);
    });

    it('getBlockContents() should get components', () => {
      const parentId = Object.keys(roll.blocks).find(blockId => {
        const block = roll.blocks[blockId];
        return block.components.length > 2;
      });

      assert(parentId, 'should have block with some components');

      return api.getBlockContents(parentId, projectId)
        .then(({ components, options }) => {
          assert(components[parentId], 'block itself should be present');
          assert(roll.blocks[parentId].components.every(blockId => components[blockId]), 'all blocks should be presnet');
          //dont compare number, since parentId has depth
        });
      //.catch(resp => resp.text())
      //.then(console.log.bind(console))
    });

    it('getBlockContents() should get options');

    it('getBlockRoles() should get variety of block roles', () => {
      return api.getBlockRoles()
        .then(roles => {
          expect(typeof roles).to.equal('object');
          expect(roles[esotericRole]).to.equal(numberCustom);
        });
    });

    it('getBlocksWithRole() should get all blocks with a given role', () => {
      return api.getBlocksWithRole(esotericRoleAlt)
        .then(retrieved => {
          expect(Object.keys(retrieved).length).to.equal(numberCustom);
          expect(Object.keys(retrieved).every(id => roll.blocks[id]));
        });
    });

    it('getBlocksWithName() should get all blocks with name', () => {
      return api.getBlocksWithName(myName)
        .then(retrieved => {
          expect(Object.keys(retrieved).length).to.equal(numberCustom);
          expect(Object.keys(retrieved).every(id => roll.blocks[id]));
        })
        .catch(resp => resp.text().then(text => Promise.reject(text)));
    });

    it('getBlocksWithName() should get all blocks with spaces in name', () => {
      return api.getBlocksWithName(altName)
        .then(retrieved => {
          expect(Object.keys(retrieved).length).to.equal(numberCustom);
          expect(Object.keys(retrieved).every(id => roll.blocks[id]));
        })
        .catch(resp => resp.text().then(text => Promise.reject(text)));
    });
  });
});