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
import { updateProjectWithTestAuthor } from '../../../_utils/userUtils';
import { testUserId } from '../../../constants';
import { createExampleRollup } from '../../../_utils/rollup';

import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as snapshots from '../../../../server/data/persistence/snapshots';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('snapshot', () => {
        const roll = createExampleRollup();
        const updated = _.merge({}, roll, { project: { another: 'field' } });
        const latest = _.merge({}, updated, { project: { different: 'value' } });

        const exampleTag = { some: ' tag' };

        before(() => {
          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectWrite(roll.project.id, updated, testUserId))
            .then(() => projectPersistence.projectWrite(roll.project.id, latest, testUserId));
        });

        it('snapshotList() returns 404 when no snapshots', () => {
          return snapshots.snapshotList(roll.project.id, testUserId)
            .catch(err => {
              expect(err).to.equal(errorDoesNotExist);
            });
        });

        it('snapshotWrite() works on version 0, returns type, message, tags, time, version', () => {
          return snapshots.snapshotWrite(roll.project.id, testUserId, 0)
            .then(result => {
              expect(result.version).to.equal(0);
              expect(result.projectId).to.equal(roll.project.id);
              expect(result.message).to.equal(snapshots.defaultMessage);
              expect(result.tags).to.eql({});
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('snapshotGet() should be able to get a specific snapshot', () => {
          return snapshots.snapshotGet(roll.project.id, testUserId, 0)
            .then(result => {
              expect(result.version).to.equal(0);
              expect(result.projectId).to.equal(roll.project.id);
              expect(result.message).to.equal(snapshots.defaultMessage);
              expect(result.tags).to.eql({});
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('snapshotWrite() can take any version, takes a message, tags, type', () => {
          const message = 'my snapshot message';
          const type = 'SOME TYPE';
          const version = 1;

          return snapshots.snapshotWrite(roll.project.id, testUserId, version, message, exampleTag, type)
            .then(result => {
              expect(result.version).to.equal(version);
              expect(result.projectId).to.equal(roll.project.id);
              expect(result.message).to.equal(message);
              expect(result.tags).to.eql(exampleTag);
              expect(result.owner).to.equal(testUserId);
              expect(result.type).to.equal(type);
            });
        });

        it('snapshotWrite() the current version by default', () => {
          return snapshots.snapshotWrite(roll.project.id, testUserId)
            .then(result => {
              expect(result.version).to.equal(2);
            });
        });

        it('snapshotList() returns all the snapshots', () => {
          return snapshots.snapshotList(roll.project.id, testUserId)
            .then(results => {
              assert(results.length === 3, 'should have 3 snapshots');
              assert(results.every(result => {
                return Number.isInteger(result.version) && Number.isInteger(result.time) && !!result.message;
              }));
            });
        });

        it('snapshotList() can limit to tags', () => {
          return snapshots.snapshotList(roll.project.id, testUserId, exampleTag)
            .then(results => {
              assert(results.length === 1, 'should have 1 snapshot with tag');
              expect(results[0].version).to.equal(1);
            });
        });

        it('snapshotDelete() with version removes a single snapshot');

        it('snapshotDelete() only removes user snapshots');

        it('projectDelete() deletes all snapshots', (done) => {
          projectPersistence.projectDelete(roll.project.id, testUserId)
            .then(() => snapshots.snapshotList(roll.project.id, testUserId))
            .then(results => {
              //console.log(results);
              done(new Error('project shouldnt exist'));
            })
            .catch(err => {
              //console.log(err);
              done();
            });
        });
      });
    });
  });
});
