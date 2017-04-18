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
import { testUserId } from '../../../constants';
import { errorInvalidModel, errorAlreadyExists, errorDoesNotExist } from '../../../../server/utils/errors';
import { createExampleRollup } from '../../../_utils/rollup';
import Rollup from '../../../../src/models/Rollup';

import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as projectVersions from '../../../../server/data/persistence/projectVersions';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', () => {
      describe('projectsVersions', () => {
        const roll = createExampleRollup();
        const updated = _.merge({}, roll, { project: { additional: 'field' } });
        const latest = _.merge({}, updated, { project: { another: 'value' } });

        it('projectWrite() should return version, roll, owner', () => {
          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(result => {
              expect(result.version).to.equal(0);
              expect(result.id).to.equal(roll.project.id);
              Rollup.compare(result.data, roll, true);
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('projectWrite() should create a version', () => {
          return projectPersistence.projectWrite(roll.project.id, updated, testUserId)
            .then(result => {
              expect(result.version).to.equal(1);
              return projectPersistence.projectWrite(roll.project.id, latest, testUserId)
            })
            .then(result => {
              expect(result.version).to.equal(2);
            });
        });

        it('projectVersionExists() should resolve when a version exists', () => {
          return projectVersions.projectVersionExists(roll.project.id, 1)
            .then(result => {
              expect(result).to.equal(true);
            });
        });

        it('projectGet() should get latest by default', () => {
          return projectPersistence.projectGet(roll.project.id)
            .then(result => {
              Rollup.compare(result, latest, true);
            });
        });

        it('projectVersionGet() should get a specific version', () => {
          return projectVersions.projectVersionGet(roll.project.id, 0)
            .then(result => {
              Rollup.compare(result, roll, true);
            });
        });

        it('projectVersionList() should reject when no project', (done) => {
          projectVersions.projectVersionList(uuid.v4(), 0)
            .then(result => done('shouldnt resolve'))
            .catch(err => {
              expect(err).to.equal(errorDoesNotExist);
              done();
            });
        });

        it('projectVersionList() should list versions', () => {
          return projectVersions.projectVersionList(roll.project.id)
            .then(result => {
              expect(result.length).to.equal(3);
              assert(result.every(res => Number.isInteger(res.version) && res.owner && res.time));
            });
        });

        it('projectDelete() deletes all versions', (done) => {
          projectPersistence.projectDelete(roll.project.id)
            .then(() => projectVersions.projectVersionList(roll.project.id))
            .then(() => done('shouldnt resolve'))
            .catch(err => {
              expect(err).to.equal(errorDoesNotExist);
              done();
            });
        });
      });
    });
  });
});
