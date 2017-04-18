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
import path from 'path';
import { expect, assert } from 'chai';
import makeEgfRollup from '../../data/egf_parts/index';
import Rollup from '../../src/models/Rollup';
import _ from 'lodash';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as sequencePersistence from '../../server/data/persistence/sequence';

const withJenkins = !!process.env.JENKINS;

describe('Templates', () => {
  describe('EGF', () => {
    it('sequences should have been written for test suite to run properly', () => {
      const pathSequences = path.resolve(__dirname, '../../data/egf_parts/sequences');

      return fileSystem.directoryExists(pathSequences)
        .catch(err => {
          throw Error('sequence path is wrong');
        })
        .then(() => fileSystem.directoryContents(pathSequences))
        .then(sequenceFiles => {
          const samples = _.sampleSize(sequenceFiles, 10);

          return Promise.all(
            samples.map(seqMd5 => {
              return sequencePersistence.sequenceExists(seqMd5)
                .catch(err => {
                  console.log('couldnt find sequence ' + seqMd5);
                  console.log(err);
                  throw err;
                });
            })
          )
            .catch(err => {
              console.log('could not find:');
              console.log(samples);
              throw err;
            });
        });
    });

    it('should create a valid rollup, blocks with correct projectId', () => {
      const roll = makeEgfRollup();
      Rollup.validate(roll, true);
    });

    it('should be different project each time', () => {
      const one = makeEgfRollup();
      const two = makeEgfRollup();

      assert(one.project.id !== two.project.id, 'shouldnt have same projectId');
    });

    it('should have same blocks for same position in different constructs', () => {
      const roll = makeEgfRollup();
      //maps of construct name -> expected
      const expectedConnectors = {};
      const expectedOptions = {};

      _.forEach(roll.blocks, (block) => {
        //if has components, its a template
        _.forEach(block.components, componentId => {
          const component = roll.blocks[componentId];

          //skip if a list
          if (component.rules.list === true) {
            return;
          }

          //if a connector, make sure no repeats

          if (!expectedConnectors[block.metadata.name]) {
            expectedConnectors[block.metadata.name] = block.id;
          } else {
            expect(expectedConnectors[block.metadata.name]).to.eql(block.id);
          }
        });

        //if has options, its a list block
        _.forEach(block.options, (active, optionId) => {
          if (!expectedOptions[block.metadata.name]) {
            expectedOptions[block.metadata.name] = block.options;
          } else {
            expect(expectedOptions[block.metadata.name]).to.eql(block.options);
          }
        });
      });
    });

    it('should make it quickly', function speedTest(done) {
      const number = 10;
      const perSecond = 2;

      if (withJenkins) {
        this.timeout(15000);
      } else {
        this.timeout(number * 1000 / perSecond);
      }

      const rolls = _.range(number).map((ind) => {
        makeEgfRollup();
      });

      done();
    });
  });
});
