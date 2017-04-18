import { assert, expect } from 'chai';
import fs from 'fs';
import Block from '../../src/models/Block';
import * as api from '../../src/middleware/projects';
import {
  exportConstruct,
  convert,
  importString as importGenbankString,
} from '../../src/middleware/genbank';
import { createExampleProject } from '../_fixtures/rollup';
import * as fileSystem from '../../server/data/middleware/fileSystem';

describe('Extensions', () => {
  describe('Genbank', () => {
    describe('Middleware', () => {
      const genbankFilePath = './test/res/sampleGenbank.gb';
      const fileContents = fs.readFileSync(genbankFilePath, 'utf8');
      let sampleRoll;
      let projectId;

      before(() => {
        return createExampleProject()
          .then(roll => {
            sampleRoll = roll;
            projectId = roll.project.id;
          });
      });

      it('convert() converts genbank string to blocks directly', () => {
        return convert(fileContents, true)
          .then(json => {
            const { project, blocks } = json;
            expect(project).to.be.defined;
            expect(blocks).to.be.defined;
            expect(project.components.length).to.equal(1);
            assert(Object.keys(blocks).every(blockId => Block.validate(blocks[blockId])), 'all blocks should be valid');
          });
      });

      it('exportConstruct() should be able convert Block to Genbank', () => {
        //construct with components with sequence
        const constructId = sampleRoll.project.components[1];
        const construct = sampleRoll.blocks[constructId];
        const components = construct.components.map(blockId => sampleRoll.blocks[blockId]);

        assert(components.every(compoenent => !!compoenent.sequence.md5), 'should have direct children with sequence');

        return exportConstruct(projectId, constructId)
          .then(resp => {
            assert(resp.headers.get('content-disposition').indexOf('attachment') >= 0, 'expected an attachment)');
            assert(resp.headers.get('content-disposition').indexOf('zip') >= 0, 'expected a zip)');
          });
      });

      it('exportConstruct() should not error on list blocks', () => {
        //construct with lists
        const constructId = sampleRoll.project.components[2];
        const construct = sampleRoll.blocks[constructId];
        const components = construct.components.map(blockId => sampleRoll.blocks[blockId]);

        assert(components.every(compoenent => Object.keys(compoenent.options).length > 0), 'should have direct children that are lists');

        return exportConstruct(projectId, constructId);
      });

      it('importString() should be able convert a genbank file to a project and add a construct to it', async() => {
        try {
          const projectId = await importGenbankString(fileContents);

          expect(projectId).to.be.defined;

          const gotRoll = await api.loadProject(projectId);
          expect(gotRoll.project.metadata.name).to.equal('EU912544');
          expect(gotRoll.project.components.length).to.equal(1);
          expect(Object.keys(gotRoll.blocks).length).to.equal(8); // There are 8 blocks in that file

          // Now add another construct to it...
          const sampleStrConstruct = await fileSystem.fileRead(genbankFilePath, false);

          // This just tests that the api works as expected. The tests about the particular
          // Genbank conversions to and from blocks are in the genbank.spec.js file
          const data = await importGenbankString(sampleStrConstruct, projectId);

          const secondRoll = await api.loadProject(projectId);

          expect(secondRoll.project.metadata.name).to.equal('EU912544');
          expect(secondRoll.project.components.length).to.equal(2);
        } catch (err) {
          return err.text().then(text => { throw text });
        }
      });
    });
  });
});

