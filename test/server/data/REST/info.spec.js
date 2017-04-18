import { assert, expect } from 'chai';
import request from 'supertest';
import uuid from 'node-uuid';
import { testUserId } from '../../../constants';
import Block from '../../../../src/models/Block';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import devServer from '../../../../server/server';
import { numberBlocksInRollup, createExampleRollup } from '../../../_utils/rollup';
import { range, merge } from 'lodash';
import { deleteUser } from '../../../../server/data/persistence/admin';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Info', () => {
        let server;
        const randomUser = uuid.v1();

        const roll = createExampleRollup();
        const otherRoll = createExampleRollup();

        const project = roll.project;
        const projectId = project.id;
        const blockKeys = Object.keys(roll.blocks);
        const parentId = blockKeys.find(blockId => {
          const block = roll.blocks[blockId];
          return block.components.length === 3;
        });

        //add 5 weird role type (5 of each) blocks to roll
        const numberEsotericRole = 5;
        const esotericRole = 'sdlfkjasdlfkjasdf';
        const esotericRoleAlt = 'dflhjasvoasv';

        const makeBlocks = (projectId) => {
          return range(numberEsotericRole * 2)
            .map((num) => Block.classless({
              projectId,
              rules: { role: (num % 2 === 0) ? esotericRoleAlt : esotericRole },
            }))
            //add # numberNoRole blocks without any role, to ensure they are there, with an extra flag
            .concat([Block.classless({
              metadata: { extra: '1' },
            }), Block.classless({
              metadata: { extra: '1' },
              rules: { role: null },
            })])
            .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
        };

        merge(roll.blocks, makeBlocks(roll.project.id));
        merge(otherRoll.blocks, makeBlocks(otherRoll.project.id));

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

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('/info/FAKE returns 404', (done) => {
          const url = `/data/info/notReal`;
          request(server)
            .get(url)
            .expect(404, done);
        });

        it('/info/role returns map of role types present', (done) => {
          const url = `/data/info/role`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              const { body } = result;
              expect(typeof body).to.equal('object');
              expect(typeof body[esotericRole]).to.equal('number');
              expect(body[esotericRole]).to.equal(numberEsotericRole);

              expect(typeof body['none']).to.equal('number');
            })
            .end(done);
        });

        it('/info/role/type returns matching blocks', (done) => {
          const url = `/data/info/role/${esotericRole}`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              expect(Object.keys(result.body).length).to.equal(numberEsotericRole);
              assert(Object.keys(result.body).every(id => roll.blocks[id]), 'should only be expected blocks');
            })
            .end(done);
        });

        it('/info/role/none returns blocks without role', (done) => {
          const url = `/data/info/role/none`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              const noRoleBlockIds = Object.keys(roll.blocks).filter(blockId => roll.blocks[blockId].metadata.extra === '1');
              assert(noRoleBlockIds.every(blockId => result.body[blockId]), 'no role blocks should be presetn');
            })
            .end(done);
        });

        it('/info/components/id returns map of components', (done) => {
          const url = `/data/info/components/${parentId}/${projectId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              const { body } = result;
              const keys = Object.keys(body);
              expect(keys.length).to.equal(numberBlocksInRollup);
              assert(keys.every(key => Object.keys(roll.blocks).indexOf(key) >= 0), 'got wrong key, outside roll');
            })
            .end(done);
        });

      });
    });
  });
});
