import { assert, expect } from 'chai';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import JSZip from 'jszip';
import { importProject, exportProject, exportConstruct } from '../../server/extensions/native/genbank/convert';
import BlockSchema from '../../src/schemas/Block';
import ProjectSchema from '../../src/schemas/Project';
import { sequenceWriteChunks } from '../../server/data/persistence/sequence';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import { createExampleProject } from '../_fixtures/rollup';

const getBlock = (allBlocks, blockId) => {
  return allBlocks[blockId];
};

describe('Extensions', () => {
  describe('Genbank', () => {
    it('should import Genbank file with contiguous entries as a project', function importGB(done) {
      importProject(path.resolve(__dirname, '../res/sampleGenbankContiguous.gb'))
        .then(output => {
          expect(output.project).not.to.equal(undefined);
          expect(ProjectSchema.validate(output.project)).to.equal(true);
          expect(output.project.metadata.name).to.equal('EU912544');
          expect(output.project.metadata.description).to.equal('Cloning vector pDM313, complete sequence.');
          expect(output.project.components.length).to.equal(1);
          const parentBlock = getBlock(output.blocks, output.project.components[0]);
          expect(parentBlock.components.length).to.equal(4);
          expect(parentBlock.metadata.name).to.equal('EU912544');
          expect(parentBlock.metadata.description).to.equal('Cloning vector pDM313, complete sequence.');
          expect(parentBlock.metadata.genbank.feature_annotations.mol_type).to.equal('other DNA');
          expect(parentBlock.metadata.start).to.equal(undefined);
          expect(parentBlock.metadata.end).to.equal(undefined);
          expect(parentBlock.metadata.genbank.annotations.gi).to.equal('198078160');

          // We have to drop the note that comes in the file because that's where we put our stuff!
          //expect(parentBlock.metadata.genbank.feature_annotations.note).to.equal('GFP-tag for C-terminal fusion');

          expect(parentBlock.metadata.genbank.annotations.data_file_division).to.equal('SYN');
          expect(parentBlock.metadata.genbank.annotations.date).to.equal('06-FEB-2009');
          expect(parentBlock.source.source).to.equal('genbank');
          //expect(parentBlock.source.id).to.equal('sampleGenbankContiguous.gb');
          expect(parentBlock.source.url).to.be.defined;
          expect(getBlock(output.blocks, parentBlock.components[0]).rules.role).to.equal('promoter');
          expect(getBlock(output.blocks, parentBlock.components[1]).rules.role).to.equal('cds');
          expect(getBlock(output.blocks, parentBlock.components[2]).rules.role).to.equal('terminator');
          expect(getBlock(output.blocks, parentBlock.components[3]).rules.role).to.equal('originReplication');
          for (let key in output.blocks) {
            expect(BlockSchema.validate(output.blocks[key])).to.equal(true);
          }
          done();
        })
        .catch(done);
    });

    it('should import Genbank file with holes as a project', function importGB(done) {
      importProject(path.resolve(__dirname, '../res/sampleGenbankContiguousWithHoles.gb'))
        .then(output => {
          expect(output.project).not.to.equal(undefined);
          expect(output.project.components.length === 1).to.equal(true);
          const parentBlock = getBlock(output.blocks, output.project.components[0]);
          expect(parentBlock.components.length).to.equal(7);
          expect(getBlock(output.blocks, parentBlock.components[0]).rules.role).to.equal(undefined);
          expect(getBlock(output.blocks, parentBlock.components[1]).rules.role).to.equal('promoter');
          expect(getBlock(output.blocks, parentBlock.components[2]).rules.role).to.equal(undefined);
          expect(getBlock(output.blocks, parentBlock.components[3]).rules.role).to.equal('cds');
          expect(getBlock(output.blocks, parentBlock.components[4]).rules.role).to.equal(undefined);
          expect(getBlock(output.blocks, parentBlock.components[5]).rules.role).to.equal('terminator');
          expect(getBlock(output.blocks, parentBlock.components[6]).rules.role).to.equal('originReplication');
          for (let key in output.blocks) {
            expect(BlockSchema.validate(output.blocks[key])).to.equal(true);
          }
          done();
        })
        .catch(done);
    });

    it('should import Genbank file with holes in features as a project', function importGB(done) {
      importProject(path.resolve(__dirname, '../res/sampleGenbankSimpleNested.gb'))
        .then(output => {
          expect(output.project).not.to.equal(undefined);
          expect(output.project.components.length === 1).to.equal(true);
          const parentBlock = getBlock(output.blocks, output.project.components[0]);
          expect(parentBlock.components.length).to.equal(2);
          let firstBlock = getBlock(output.blocks, parentBlock.components[0]);
          expect(firstBlock.components.length).to.be.equal(3);
          expect(getBlock(output.blocks, firstBlock.components[0]).rules.role).to.equal('promoter');
          expect(getBlock(output.blocks, firstBlock.components[1]).rules.role).to.equal('cds');
          expect(getBlock(output.blocks, firstBlock.components[2]).rules.role).to.equal(undefined);
          let secondBlock = getBlock(output.blocks, parentBlock.components[1]);
          expect(secondBlock.components.length).to.be.equal(4);
          expect(getBlock(output.blocks, secondBlock.components[0]).rules.role).to.equal('cds');
          expect(getBlock(output.blocks, secondBlock.components[1]).rules.role).to.equal(undefined);
          expect(getBlock(output.blocks, secondBlock.components[2]).rules.role).to.equal('terminator');
          expect(getBlock(output.blocks, secondBlock.components[3]).rules.role).to.equal('originReplication');
          for (let key in output.blocks) {
            expect(BlockSchema.validate(output.blocks[key])).to.equal(true);
          }
          done();
        })
        .catch(done);
    });

    it('should import Genbank file with multiple entries as a project', function importGB(done) {
      importProject(path.resolve(__dirname, '../res/sampleMultiGenbank.gb'))
        .then(output => {
          expect(output.project).not.to.equal(undefined);
          expect(ProjectSchema.validate(output.project)).to.equal(true);
          expect(output.project.metadata.name).to.equal('EU912543');
          expect(output.project.metadata.description).to.equal('Cloning vector pDM313, complete sequence.')
          expect(output.project.components.length).to.equal(3);
          expect(getBlock(output.blocks, output.project.components[0]).metadata.name).to.equal('EU912541');
          expect(getBlock(output.blocks, output.project.components[1]).metadata.name).to.equal('EU912542');
          expect(getBlock(output.blocks, output.project.components[2]).metadata.name).to.equal('EU912543');
          done();
        })
        .catch(done);
    });

    it('should fail on bad Genbank format', function importGB(done) {
      importProject(path.resolve(__dirname, '../res/badFormatGenbank.gb'))
        .then(output => {
          expect(output).to.equal('Invalid Genbank format.');
          done();
        })
        .catch(done);
    });

    it('should roundtrip a Genbank construct through our app', function exportGB() {
      return importProject(path.resolve(__dirname, '../res/sampleGenbankContiguous.gb'))
        .then(output => {
          expect(output.project).not.to.equal(undefined);
          expect(ProjectSchema.validate(output.project)).to.equal(true);
          expect(output.project.metadata.name).to.equal('EU912544');
          expect(output.project.metadata.description).to.equal('Cloning vector pDM313, complete sequence.');

          //usually middleware writes the sequences, so we need to do this ourselves
          return Promise.all(
            output.sequences.map(({ sequence, blocks }) => {
              return sequenceWriteChunks(sequence, blocks)
                .then((blocksToMd5s) => {
                  _.forEach(blocksToMd5s, (pseudoMd5, blockId) => {
                    _.merge(output.blocks[blockId], { sequence: { md5: pseudoMd5 } });
                  });
                });
            })
          )
            .then(() => exportConstruct({ roll: output, constructId: output.project.components[0] }));
        })
        .then(resultFileName => {
          return fileSystem.fileRead(resultFileName, false);
        })
        .then(result => {
          expect(result).to.contain('LOCUS       EU912544                 120 bp    DNA');
          expect(result).to.contain('SYN 06-FEB-2009');
          expect(result).to.contain('DEFINITION  Cloning vector pDM313, complete sequence.');
          expect(result).to.contain('ACCESSION   EU912544');
          expect(result).to.contain('VERSION     EU912544.1  GI:198078160');
          expect(result).to.contain('SOURCE      Cloning vector pDM313');
          expect(result).to.contain('ORGANISM  Cloning vector pDM313');
          expect(result).to.contain('other sequences; artificial sequences; vectors.');
          expect(result).to.contain('REFERENCE   1');
          expect(result).to.contain('AUTHORS   Veltman,D.M., Akar,G., Bosgraaf,L. and Van Haastert,P.J.');
          expect(result).to.contain('TITLE     A new set of small, extrachromosomal expression vectors for');
          expect(result).to.contain('Dictyostelium discoideum');
          expect(result).to.contain('JOURNAL   Plasmid 61 (2), 110-118 (2009)');
          expect(result).to.contain('PUBMED   19063918');
          expect(result).to.contain('');
          //return fileSystem.fileDelete(resultFileName);
        });
    });

    it('should export project with list block', function exportListBlock(done) {
      createExampleProject()
        .then(roll => exportProject(roll))
        .then(resultFileName => {
          fs.readFile(resultFileName, function (err, data) {
            if (err) {
              return done(err);
            }

            JSZip.loadAsync(data)
              .then((zip) => {
                expect(zip.file(/\.gb/).length).to.equal(625 + 1 + 1);
                zip.file('Untitled Project -  - 10.gb')
                  .async('string')
                  .then((content) => {
                    expect(content).to.contain('LOCUS');
                    done();
                  })
                  .catch(done);
              })
              .catch(done);
          });
        })
        .catch(done);
    });

    it.skip('should export project to multi-record Genbank', function exportGB(done) {
      fs.readFile(path.resolve(__dirname, '../res/sampleProject.json'), 'utf8', (err, sampleProjJson) => {
        if (err) throw err;

        const sampleProj = JSON.parse(sampleProjJson);
        exportProject(sampleProj)
          .then(result => {
            //LOCUS 1, LOCUS 2, LOCUS 3, and LOCUS 4
            expect((result.match(/\/\//g) || []).length).to.equal(4);
            expect((result.match(/LOCUS\s+\d/g) || []).length).to.equal(4);
            done();
          })
          .catch(done);
      });
    });

    it('should handle large files', () => {
      const start = process.hrtime();

      return importProject(path.resolve(__dirname, '../res/chromosome.gb'))
        .then(output => {
          const end = process.hrtime();
          assert(end[0] - 20 < start[0], 'should take less than 20 seconds (this is very long)');
        });
    });
  });
});
