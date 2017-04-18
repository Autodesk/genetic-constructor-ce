import { assert, expect } from 'chai';

import request from 'supertest';
import { validateManifest } from '../../server/extensions/manifestUtils';
import devServer from '../../server/server';

describe('Extensions', () => {
  describe('REST', () => {
    //keys of test extensions
    const testClient = 'testClient';
    const testServer = 'testServer';
    const filePath = 'index.js';

    it('should list the client extensions, manifests keyed by name', (done) => {
      const url = '/extensions/list';
      request(devServer)
        .get(url)
        .expect(200)
        .end((err, result) => {
          if (err) {
            return done(err);
          }

          expect(result.body).to.be.an.object;
          assert(Object.keys(result.body).length > 0, 'there should be extensions registered');
          assert(Object.keys(result.body).every(key => {
            const manifest = result.body[key];
            try {
              validateManifest(manifest);
              return true;
            } catch (err) {
              console.log(key, err);
              return false;
            }
          }), 'expected all manifests to be in valid format');

          done();
        });
    });

    it('/manifest/ to get manifest', (done) => {
      const url = `/extensions/manifest/${testClient}`;
      request(devServer)
        .get(url)
        .expect(200)
        .end((err, result) => {
          if (err) {
            return done(err);
          }

          expect(result.body).to.be.an.object;
          assert(result.body.name === testClient, 'wrong name');
          assert(result.body.geneticConstructor.client[0].region === 'projectDetail', 'wrong region');
          done();
        });
    });

    it('/load/ to get the index.js script', (done) => {
      const url = `/extensions/load/${testClient}/${filePath}`;
      request(devServer)
        .get(url)
        .expect(200)
        .end((err, result) => {
          if (err) {
            return done(err);
          }

          assert(result.text.indexOf('window.constructor'), 'should call something on the window.constructor object');

          done();
        });
    });

    it('/api/ route to call server extensions exposed router');
  });
});
