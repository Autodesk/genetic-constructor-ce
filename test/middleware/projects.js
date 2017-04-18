import chai from 'chai';
import * as api from '../../src/middleware/projects';
import { merge, range } from 'lodash';
import { testUserId } from '../constants';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';

import * as projectPersistence from '../../server/data/persistence/projects';
import { createSequencedRollup, createListRollup, createExampleRollup } from '../_utils/rollup';

const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Projects', () => {
    //create a test project to load
    const userId = testUserId;
    const roll = createExampleRollup();
    const project = roll.project;
    const projectId = project.id;

    before(() => projectPersistence.projectWrite(projectId, roll, userId));

    it('listProjects() lists available projects', () => {
      return api.listProjects()
        .then(projects => {
          const found = projects.find(proj => proj.id === projectId);
          expect(found).to.be.defined;
          Project.compare(found, project, true);
        });
    });

    it('loadProject() loads a project rollup', () => {
      return api.loadProject(projectId)
        .then(gotRoll => {
          assert(Project.compare(project, gotRoll.project), 'projects should be the same');
          assert(Object.keys(gotRoll.blocks).every(blockId => {
            return !!roll.blocks[blockId];
          }));
        });
    });

    it('saveProject() saves a project and blocks, can be loaded by persistence, adds version, updated, authors', () => {
      const roll = createExampleRollup();
      const project = roll.project;
      const projectId = project.id;
      const blockKeys = Object.keys(roll.blocks);
      const block1 = roll.blocks[blockKeys[0]];
      const block2 = roll.blocks[blockKeys[3]];

      return api.saveProject(projectId, roll)
        .then((versionInfo) => Promise
          .all([
            projectPersistence.projectGetManifest(projectId),
            projectPersistence.blocksGet(projectId, block1.id).then(map => map[block1.id]),
            projectPersistence.blocksGet(projectId, block2.id).then(map => map[block2.id]),
          ])
          .then(([gotProject, got1, got2]) => {
            assert(Project.compare(project, gotProject), 'projects should be the same');
            expect(got1).to.eql(block1);
            expect(got2).to.eql(block2);
          }));
    });

    it('saveProject() creates a version', () => {
      const one = createExampleRollup();

      const two = merge({}, one);
      two.project.metadata.name = 'new name';

      let info1;
      let info2;

      return api.saveProject(one.project.id, one)
        .then(info => { info1 = info; })
        .then(() => api.saveProject(one.project.id, one))
        .then(info => { info2 = info; })
        .then(() => {
          expect(info1.version).to.equal(0);
          expect(info2.version).to.equal(1);
        });
    });

    it('can save a huge project (10mb or so)', () => {
      const roll = createExampleRollup();
      const project = roll.project;

      const newBlocks = range(1000).map(() => new Block())
        .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

      merge(roll.blocks, newBlocks);

      return api.saveProject(project.id, roll);
    });

    it('loadBlock() gets the components and options of a block', () => {
      const numberListBlocks = 3;
      const numberListOptions = 4;
      const numberSequenceBlocks = 5;

      const roll = createListRollup(numberListBlocks, numberListOptions);
      const sequenced = createSequencedRollup(numberSequenceBlocks);

      roll.project.components.push(...sequenced.project.components);
      Object.assign(roll.blocks, sequenced.blocks);

      const listBlockConstructId = roll.project.components[0];
      const listBlockId = roll.blocks[listBlockConstructId].components[0];
      const constructBlockId = roll.project.components[1];

      return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
        .then(() => api.loadBlock(listBlockId, roll.project.id))
        .then(({ components, options }) => {
          expect(Object.keys(options).length).to.equal(numberListOptions);
          expect(Object.keys(components).length).to.equal(1);
          expect(components[Object.keys(components)[0]]).to.eql(roll.blocks[listBlockId])
        })
        .then(() => api.loadBlock(constructBlockId, roll.project.id))
        .then(({ components, options }) => {
          expect(Object.keys(components).length).to.equal(1 + numberSequenceBlocks);
          expect(Object.keys(options).length).to.equal(0);
        });
    });
  });
});
