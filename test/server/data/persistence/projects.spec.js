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
import ProjectSchema from '../../../../src/schemas/Project';
import { testUserId } from '../../../constants';
import { createExampleRollup } from '../../../_utils/rollup';
import {
  errorNoPermission,
  errorInvalidModel,
  errorAlreadyExists,
  errorDoesNotExist,
} from '../../../../server/utils/errors';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import Rollup from '../../../../src/models/Rollup';
import { deleteUser } from '../../../../server/data/persistence/admin';
import * as projectPersistence from '../../../../server/data/persistence/projects';

describe('Server', () => {
  describe('Data', () => {
    describe('persistence', function persistenceTests() {
      describe('projects', () => {
        it('projectWrite() -> projectGet() works', () => {
          const roll = createExampleRollup();

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => {
              Rollup.compare(result, roll, true);
            });
        });

        it('projectExists() rejects if doesnt exist', () => {
          return projectPersistence.projectExists(Project.classless().id)
            .then(() => new Error('shouldnt resolve'))
            .catch((err) => {
              expect(err).to.equal(errorDoesNotExist);
            });
        });

        it('projectWrite() receives version + roll on create', () => {
          const roll = createExampleRollup();

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(result => {
              expect(result.version).to.equal(0);
              expect(result.id).to.equal(roll.project.id);
              Rollup.compare(result.data, roll, true);
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('projectWrite() receives version + roll on update', () => {
          const roll = createExampleRollup();

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectWrite(roll.project.id, roll, testUserId))
            .then(result => {
              expect(result.version).to.equal(1);
              expect(result.id).to.equal(roll.project.id);
              Rollup.compare(result.data, roll, true);
              expect(result.owner).to.equal(testUserId);
            });
        });

        it('projectWrite() throws if you dont provide project + blocks', () => {
          return expect(() => projectPersistence.projectWrite(Project.classless().id, { project: 'data' }, testUserId))
            .to.throw();
        });

        it('projectWrite() validates the project', () => {
          return projectPersistence.projectWrite(Project.classless().id, { project: {}, blocks: {} }, testUserId)
            .then(() => assert(false, 'shouldnt happen'))
            .catch(err => expect(err).to.equal(errorInvalidModel));
        });

        //should this throw? the router does.
        it('projectMerge() forces the ID', () => {
          const roll = createExampleRollup();
          const overwrite = { project: { id: uuid.v4(), some: 'field ' } };
          const merged = _.merge({}, roll, overwrite, { project: { id: roll.project.id } });

          return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => Rollup.compare(result, roll, true))
            .then(() => projectPersistence.projectMerge(roll.project.id, overwrite, testUserId))
            .then(() => projectPersistence.projectGet(roll.project.id))
            .then(result => Rollup.compare(result, merged, true));
        });

        it('projectDelete() only marks the project deleted in the database');

        describe('ownership', () => {

          const randomUserId = uuid.v1();

          after(() => deleteUser(randomUserId));

          it('userOwnsProject() resolves if user owns the project', () => {
            const roll = createExampleRollup();

            return projectPersistence.projectWrite(roll.project.id, roll, testUserId)
              .then(() => projectPersistence.userOwnsProject(testUserId, roll.project.id))
              .then(result => {
                expect(result).to.equal(true);
              });
          });

          it('userOwnsProject() rejects with errorNoPermission if someone else owns it', (done) => {
            const roll = createExampleRollup();

            projectPersistence.projectWrite(roll.project.id, roll, randomUserId)
              .then(() => projectPersistence.userOwnsProject(testUserId, roll.project.id))
              .then(result => done('shouldnt resolve'))
              .catch(err => {
                expect(err).to.equal(errorNoPermission);
                done();
              });
          });

          it('userOwnsProject() rejects if no project', (done) => {
            projectPersistence.userOwnsProject(testUserId, Project.classless().id, true)
              .then(result => done('shouldnt resolve'))
              .catch(err => {
                expect(err).to.equal(errorDoesNotExist);
                done();
              });
          });
        });

        describe('[series]', () => {
          const roll = createExampleRollup();
          const projectId = roll.project.id;

          before(() => {
            return projectPersistence.projectWrite(projectId, roll, testUserId);
          });

          it('projectExists() resolves with latest version if it does exist', () => {
            return projectPersistence.projectExists(projectId)
              .then(res => {
                expect(res).to.equal(0);
              });
          });

          it('projectGet() retrieves the project', () => {
            return projectPersistence.projectGet(projectId)
              .then(result => {
                Rollup.compare(result, roll, true);
              });
          });

          it('projectWrite() updates a project', () => {
            return projectPersistence.projectWrite(projectId, roll, testUserId)
              .then(info => {
                expect(info.version).to.equal(1);
              });
          });

          it('projectExists() resolves with latest version if it does exist', () => {
            return projectPersistence.projectExists(projectId)
              .then(res => {
                expect(res).to.equal(1);
              });
          });

          it('projectDelete() deletes a project', () => {
            return projectPersistence.projectDelete(projectId, testUserId)
              .then(() => projectPersistence.projectGet(projectId))
              .then(() => new Error('should not exist'))
              .catch(err => expect(err).to.equal(errorDoesNotExist));
          });
        });

        describe('list', () => {
          const myUserId = uuid.v1();
          const myRolls = [1, 2, 3, 4].map(createExampleRollup);
          const myRollIds = myRolls.map(roll => roll.project.id);

          const otherUserId = uuid.v1();
          const otherRolls = [1, 2, 3].map(createExampleRollup);
          const otherRollIds = otherRolls.map(roll => roll.project.id);

          const randomUserId = uuid.v1();
          const randomUserId2 = uuid.v1();

          before(() => {
            return Promise.all([
              ...myRollIds.map((projectId, index) => {
                return projectPersistence.projectWrite(projectId, myRolls[index], myUserId);
              }),
              ...otherRollIds.map((projectId, index) => {
                return projectPersistence.projectWrite(projectId, otherRolls[index], otherUserId);
              }),
            ]);
          });

          after(() => {
            return Promise.all([
              deleteUser(myUserId),
              deleteUser(otherUserId),
              deleteUser(randomUserId),
              deleteUser(randomUserId2),
            ]);
          });

          it('before() should have written properly', () => {
            return Promise.all(
              [...myRollIds, ...otherRollIds].map(id => projectPersistence.projectExists(id))
            )
              .then(results => {
                assert(results.every(result => Number.isInteger(result)), 'should have all been written');
              });
          });

          it('getUserProjectIds() limits by user ID', () => {
            return projectPersistence.getUserProjectIds(myUserId)
              .then(projects => {
                expect(projects.length).to.equal(myRollIds.length);
                assert(projects.every(projectId => myRollIds.indexOf(projectId) >= 0), 'wrong project was returned..');
              });
          });

          it('getUserProjectIds() doesnt fail when user has no projects', () => {
            return projectPersistence.getUserProjectIds(randomUserId)
              .then(projects => {
                expect(projects.length).to.equal(0);
              });
          });

          it('getUserProjectIds() returns project manifests user can access', () => {
            return projectPersistence.getUserProjectIds(myUserId)
              .then(accessibleProjects => {
                return projectPersistence.getUserProjects(myUserId)
                  .then(rolls => rolls.map(roll => roll.project))
                  .then(manifests => {
                    expect(manifests.length).to.equal(accessibleProjects.length);
                    assert(manifests.every(manifest => ProjectSchema.validate(manifest, true)), 'manifests not in valid format');
                  });
              });
          });

          it('getUserProjects() returns rollups of each', () => {
            return projectPersistence.getUserProjects(myUserId, true)
              .then(rolls => {
                assert(rolls.every(roll => {
                  return typeof roll.blocks === 'object' && typeof roll.project === 'object';
                }));
                expect(rolls.map(roll => roll.project.id).sort()).to.eql(myRollIds.sort());
              });
          });

          it('getUserProjects() returns empty array for new user', () => {
            return projectPersistence.getUserProjects(randomUserId2)
              .then(result => {
                expect(result).to.eql([]);
              });
          });

          it('getUserLastProjectId() gets the last saved project', (done) => {
            const roll = createExampleRollup();

            projectPersistence.getUserLastProjectId(randomUserId)
              .then(() => done('shouldnt resolve'))
              .catch(err => {
                expect(err).to.equal(errorDoesNotExist);

                return projectPersistence.projectWrite(roll.project.id, roll, randomUserId);
              })
              .then(() => projectPersistence.getUserLastProjectId(randomUserId))
              .then(projectId => {
                expect(projectId).to.equal(roll.project.id);
                done();
              });
          });
        });

        describe('manifest', () => {
          const roll = createExampleRollup();
          const projectId = roll.project.id;

          const nextManifest = _.merge({}, roll.project, { some: 'addition' });

          before(() => {
            return projectPersistence.projectWrite(projectId, roll, testUserId);
          });

          it('projectWriteManifest() rejects if the project doesnt exist');

          it('projectGetManifest() gets manifest', () => {
            return projectPersistence.projectGetManifest(projectId)
              .then(manifest => Project.compare(manifest, roll.project, true));
          });

          it('projectWriteManifest() writes manifest', () => {
            return projectPersistence.projectWriteManifest(projectId, nextManifest, testUserId)
              .then(() => projectPersistence.projectGetManifest(projectId))
              .then(manifest => Project.compare(manifest, nextManifest, true));
          });

          it('projectMergeManifest() merges manifest with a patch', () => {
            const patch = { another: 'change' };
            const merged = _.merge({}, nextManifest, patch);

            return projectPersistence.projectMergeManifest(projectId, patch, testUserId)
              .then(() => projectPersistence.projectGetManifest(projectId))
              .then(manifest => Project.compare(manifest, merged, true));
          });
        });

        describe('blocks', () => {
          const roll = createExampleRollup();
          const projectId = roll.project.id;

          const newBlock = Block.classless({
            projectId,
          });
          const mergedMap = Object.assign({ [newBlock.id]: newBlock }, roll.blocks);

          before(() => {
            return projectPersistence.projectWrite(projectId, roll, testUserId);
          });

          it('blocksGet() gets the blocks', () => {
            return projectPersistence.blocksGet(projectId)
              .then(blocks => {
                assert(typeof blocks === 'object', 'expect an object');
                expect(blocks).to.eql(roll.blocks);
              });
          });

          it('blocksGet() returns map without key if value undefined', () => {
            const fakeId = 'notRealId';
            return projectPersistence.blocksGet(projectId, fakeId)
              .then(blockMap => {
                assert(typeof blockMap === 'object', 'should return a map');
                assert(!blockMap[fakeId], 'value should not be defined, or null');
              });
          });

          it('blocksGet() can get specific blocks', () => {
            const keys = Object.keys(roll.blocks).slice(1, 3);
            return projectPersistence.blocksGet(projectId, ...keys)
              .then(blocks => {
                expect(Object.keys(blocks).length).to.equal(keys.length);
                expect(blocks[keys[0]]).to.eql(roll.blocks[keys[0]]);
              });
          });

          it('blocksWrite() validates the block', (done) => {
            projectPersistence.blocksWrite(projectId, testUserId, { some: 'invlalid' })
              .then(() => done(new Error('shouldnt pass')))
              .catch(err => { done(); });
          });

          it('blocksWrite() forces projectId', () => {
            return projectPersistence.blocksWrite(projectId, testUserId, mergedMap)
              .then(roll => {
                assert(_.every(roll.blocks, (block) => block.projectId === projectId), 'should force projectId');
              });
          });

          it('blocksWrite() overwrites blocks', () => {
            return projectPersistence.blocksGet(projectId)
              .then(blocks => {
                const newMap = Object.assign({}, blocks);
                const toKill = Object.keys(newMap)[0];

                delete newMap[toKill];

                return projectPersistence.blocksWrite(projectId, testUserId, newMap)
                  .then(roll => {
                    expect(roll.blocks[toKill]).to.be.undefined;
                    expect(Object.keys(newMap).sort()).to.eql(Object.keys(roll.blocks).sort());
                  });
              });
          });

          it('blocksMerge() merges blocks', () => {
            return projectPersistence.blocksGet(projectId)
              .then(blocks => {
                const newBlock = Block.classless({
                  projectId,
                });
                const nextMap = Object.assign({}, blocks, { [newBlock.id]: newBlock });

                return projectPersistence.blocksMerge(projectId, testUserId, { [newBlock.id]: newBlock })
                  .then(roll => {
                    expect(roll.blocks).to.eql(nextMap);
                  });
              });
          });

          it('blocksPatch() overwrites the blocks passed, but not the whole map', () => {
            let blockId;
            let blockOriginal;

            return projectPersistence.blocksGet(projectId)
              .then(blocks => {
                blockId = Object.keys(blocks)[0];
                blockOriginal = blocks[blockId];
                //add a primitive field so can easily check patch happened
                const patch = Object.assign({}, blockOriginal, { some: 'field' });
                return projectPersistence.blocksMerge(projectId, testUserId, { [patch.id]: patch });
              })
              .then(({ blocks }) => {
                expect(blocks[blockId].some).to.equal('field');
                const patch = Object.assign({}, blockOriginal, { newField: 'field' });
                return projectPersistence.blocksPatch(projectId, testUserId, { [patch.id]: patch });
              })
              .then(({ blocks }) => {
                assert(Object.keys(blocks).length > 1, 'should not replace all the other blocks');
                expect(blocks[blockId].newField).to.equal('field');
                expect(blocks[blockId].some).to.be.undefined;
              });
          });

          it('blockDelete() deletes a block', () => {
            let toKill;
            return projectPersistence.blocksGet(projectId)
              .then(blocks => {
                toKill = Object.keys(blocks)[0];

                return projectPersistence.blocksDelete(projectId, testUserId, toKill)
                  .then(() => projectPersistence.projectGet(projectId))
                  .then(result => {
                    expect(result.blocks[toKill]).to.not.be.defined;

                    const duplicated = Object.assign({}, blocks);
                    delete duplicated[toKill];

                    expect(result.blocks).to.eql(duplicated);
                  });
              });
          });
        });
      });
    });
  });
});
