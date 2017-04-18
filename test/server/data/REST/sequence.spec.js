import { assert, expect } from 'chai';
import { testUserId } from '../../../constants';
import request from 'supertest';
import md5 from 'md5';
import uuid from 'node-uuid';
import Rollup from '../../../../src/models/Rollup';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import * as sequences from '../../../../server/data/persistence/sequence';
import devServer from '../../../../server/server';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Sequence', () => {
        let server;
        const userId = testUserId;
        const projectData = new Project();
        const projectId = projectData.id;

        const sequence = 'aaaaacccccccgggggggtttttt';
        const sequenceMd5 = md5(sequence);

        const blockData = Block.classless({
          projectId,
          sequence: {
            md5: sequenceMd5,
            length: sequence.length,
          },
        });

        const roll = Rollup.fromArray(projectData, blockData);

        before(() => {
          return projectPersistence.projectWrite(projectId, roll, userId)
            .then(() => sequences.sequenceWrite(sequenceMd5, sequence));
        });

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('GET errors with 422 for invalid md5', (done) => {
          const url = `/data/sequence/notReal`;
          request(server)
            .get(url)
            .expect(422, done);
        });

        it('GET errors with 404 when sequence doesnt exist', (done) => {
          const url = `/data/sequence/${md5(uuid.v4())}`;
          request(server)
            .get(url)
            .expect(404, done);
        });

        it('GET an existing sequence returns the sequence', (done) => {
          const url = `/data/sequence/${sequenceMd5}`;
          request(server)
            .get(url)
            .expect(200)
            .expect('Content-Type', /text/)
            .expect(result => {
              expect(result.text).to.eql(sequence);
            })
            .end(done);
        });

        it('POST writes the sequence', (done) => {
          const newSequence = 'acgtacgtacgtacgtacgt';
          const newMd5 = md5(newSequence);
          const url = `/data/sequence/${newMd5}`;

          request(server)
            .post(url)
            .send({ sequence: newSequence })
            .expect(200)
            .end((err, result) => {
              if (err) {
                done(err);
                return;
              }

              sequences.sequenceGet(newMd5)
                .then(seq => {
                  expect(seq).to.equal(newSequence);
                  done();
                })
                .catch(done);
            });
        });

        it('POST does not require md5', (done) => {
          const newSequence = 'ACGTACTACTGACTGATCGAC';
          const newMd5 = md5(newSequence);
          const url = `/data/sequence/`;

          request(server)
            .post(url)
            .send({ sequence: newSequence })
            .expect(200)
            .end((err, result) => {
              if (err) {
                done(err);
                return;
              }

              expect(result.text).to.equal(newMd5);

              sequences.sequenceGet(newMd5)
                .then(seq => {
                  expect(seq).to.equal(newSequence);
                  done();
                })
                .catch(done);
            });
        });

        it('POST validates the sequence', (done) => {
          const fakeSeq = 'QWERTY';

          const url = `/data/sequence/`;
          request(server)
            .post(url)
            .send({ sequence: fakeSeq })
            .expect(400, done);
        });

        it('POST validates the md5 if provided', (done) => {
          const fakeSeq = 'BBBBBBB';
          const fakeMd5 = md5(fakeSeq + 'asdf');

          const url = `/data/sequence/${fakeMd5}`;
          request(server)
            .post(url)
            .send({ sequence: fakeSeq })
            .expect(409, done);
        });

        it('DELETE does not allow deletion', (done) => {
          const url = `/data/sequence/${sequenceMd5}`;
          request(server)
            .del(url)
            .expect(405)
            .end((err, result) => {
              if (err) {
                done(err);
                return;
              }

              sequences.sequenceGet(sequenceMd5)
                .then((seq) => {
                  assert(seq === sequence, 'should be the same...');
                  done();
                })
                .catch(done);
            });
        });
      });
    });
  });
});
