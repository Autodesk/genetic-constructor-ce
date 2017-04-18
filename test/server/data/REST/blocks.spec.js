import { assert, expect } from 'chai';
import request from 'supertest';
import { testUserId } from '../../../constants';
import Rollup from '../../../../src/models/Rollup';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import devServer from '../../../../server/server';
import { merge } from 'lodash';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Blocks', () => {
        let server;
        const userId = testUserId; //for test environment
        const projectData = new Project();
        const projectId = projectData.id;

        const initialFields = { initial: 'value', projectId };
        const blockData = Block.classless(initialFields);
        const blockId = blockData.id;

        const invalidIdBlock = Object.assign({}, blockData, { id: 'invalid' });
        const invalidDataBlock = Object.assign({}, blockData, { metadata: 'invalid' });

        const blockPatch = { some: 'field' };
        const patchedBlock = merge({}, blockData, blockPatch);

        const roll = Rollup.fromArray(projectData, blockData);

        before(() => {
          return projectPersistence.projectWrite(projectId, roll, userId);
        });

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('GET a not real block returns null and a 204', (done) => {
          const url = `/data/${projectId}/fakeId`;
          request(server)
            .get(url)
            .expect(204)
            .expect(result => {
              expect(result.body).to.be.empty;
            })
            .end(done);
        });

        it('GET an existing block returns the block', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              expect(result.body).to.eql(blockData);
            })
            .end(done);
        });

        it('POST merges the block and returns it', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .post(url)
            .send(blockData)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(blockData);

              projectPersistence.blocksGet(projectId, blockId)
                .then(blockMap => {
                  const result = blockMap[blockId];
                  expect(result).to.eql(blockData);
                  done();
                })
                .catch(done);
            });
        });

        it('POST allows for delta merges', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .post(url)
            .send(blockPatch)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(patchedBlock);
              expect(result.body).to.not.eql(blockData);

              projectPersistence.blocksGet(projectId, blockId)
                .then((blockMap) => {
                  const result = blockMap[blockId];
                  expect(result).to.eql(patchedBlock);
                  done();
                })
                .catch(done);
            });
        });

        it('POST doesnt allow data with wrong ID', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .post(url)
            .send(invalidIdBlock)
            .expect(400, done);
        });

        it('PUT replaces the block', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          const newBlock = Block.classless({
            id: blockId,
            projectId,
            notes: { field: 'value' },
          });

          request(server)
            .put(url)
            .send(newBlock)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              expect(result.body).to.eql(newBlock);
              expect(result.body).to.not.eql(blockData);

              projectPersistence.blocksGet(projectId)
                .then((blockMap) => {
                  const result = blockMap[blockId];
                  expect(result).to.eql(newBlock);
                  done();
                })
                .catch(done);
            });
        });

        it('PUT ensures the block ID matches', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          const newBlock = Block.classless({
            id: 'randomId',
            projectId,
            notes: { field: 'value' },
          });

          request(server)
            .put(url)
            .send(newBlock)
            .expect(422, done);
        });

        it('PUT validates the block', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .put(url)
            .send(invalidDataBlock)
            .expect(422, done);
        });

        it('DELETE is 405', (done) => {
          const url = `/data/${projectId}/${blockId}`;
          request(server)
            .delete(url)
            .expect(405, done);
        });
      });
    });
  });
});
