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
import _ from 'lodash';
import * as api from '../../src/middleware/snapshots';
import * as projectPersistence from '../../server/data/persistence/projects';
import { testUserId } from '../constants';
import { createExampleRollup } from '../_utils/rollup';

describe('Middleware', () => {
  describe('Snapshots', () => {
    const roll = createExampleRollup();
    const updated = _.merge({}, roll, { project: { blah: 'blah' } });
    const latest = _.merge({}, updated, { project: { another: 'field' } });

    const project = roll.project;
    const projectId = project.id;

    before(() => projectPersistence.projectWrite(projectId, roll, testUserId)
      .then(() => projectPersistence.projectWrite(projectId, updated, testUserId))
      .then(() => projectPersistence.projectWrite(projectId, latest, testUserId))
    );

    it('snapshotList() before projects exists gets 404', (done) => {
      api.snapshotList(createExampleRollup().project.id)
        .then(result => {
          done('shouldnt resolve');
        })
        .catch(resp => {
          expect(resp.status).to.equal(404);
          done();
        })
        .catch(done);
    });

    it('snapshotList() on project with no snapshots gets 200', () => {
      return api.snapshotList(roll.project.id)
        .then(versions => {
          expect(versions.length).to.equal(0);
        });
    });

    const version = 1;

    it('shapshot() a specific version', () => {
      return api.snapshot(projectId, version)
        .then(() => api.snapshotList(projectId))
        .then(snapshots => {
          const found = snapshots.find(snapshot => snapshot.version === version);
          assert(found, 'expected a snapshot with version specified');
        });
    });

    it('snapshot() overwrites a snapshot at specific version', () => {
      const newMessage = 'some new message';
      return api.snapshot(projectId, version, newMessage)
        .then(() => api.snapshotGet(projectId, version))
        .then(snapshot => {
          expect(snapshot.message).to.equal(newMessage);
        });
    });

    const commitMessage = 'my fancy message';

    it('snapshotWrite() creates a snapshot, returns version, time, message, defaults to latest', () => {
      return api.snapshot(projectId, null, commitMessage)
        .then(info => {
          assert(info.version === 2, 'should be version 2 (latest)');
          assert(info.message === commitMessage, 'should have commit message');
          assert(Number.isInteger(info.time), 'time should be number');
        });
    });

    it('snapshotGet() gets a snapshot', () => {
      return api.snapshotGet(projectId, 2)
        .then(snapshot => {
          expect(snapshot.version).to.equal(2);
          expect(snapshot.message).to.equal(commitMessage);
        });
    });

    it('snapshotWrite() given rollup bumps verion and creates a snapshot', () => {
      const newest = _.merge({}, roll, { project: { some: 'final' } });

      return api.snapshot(projectId, null, undefined, null, newest)
        .then(info => {
          assert(info.version === 3, 'should be version 3 (new latest)');
        });
    });

    it('snapshotList() gets the projects snapshots', () => {
      return api.snapshotList(projectId)
        .then(snapshots => {
          assert(Array.isArray(snapshots), 'should be array');
          expect(snapshots.length).to.equal(3);
        });
    });

    it('cant snapshot a version which doesnt exist', (done) => {
      api.snapshot(projectId, 99)
        .then(info => {
          done('shouldnt resolve');
        })
        .catch(err => {
          done();
        });
    });

    //future
    it('snapshot() accepts tags, snapshotList() can filter on tags');
  });
});
