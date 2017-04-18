import { assert, expect } from 'chai';
import request from 'supertest';
import { merge } from 'lodash';
import userConfigDefaults from '../../server/onboarding/userConfigDefaults';
import devServer from '../../server/server';

describe('Server', () => {
  describe('Auth', () => {
    const dummyUser = {
      email: 'bio.nano.dev@autodesk.com',
      password: 'HelpMe#1',
    };

    let server;
    beforeEach('server setup', () => {
      server = devServer.listen();
    });
    afterEach(() => {
      server.close();
    });

    it('/auth/login route should return a 200', (done) => {
      request(server)
        .post('/auth/login')
        .send(dummyUser)
        .expect(200, done);
    });

    it('/auth/login should set a cookie on the client', (done) => {
      request(server)
        .post('/auth/login')
        .send(dummyUser)
        .expect((res) => {
          const cookie = res.headers['set-cookie'].join(';');
          assert(cookie.length, 'no cookie on response for login...');
        })
        .end(done);
    });

    // THIS IS A TEST ROUTE ONLY - it only works in local auth
    it('/auth/cookies should return cookies sent on request', (done) => {
      const agent = request.agent(server);

      agent
        .post('/auth/login')
        .send(dummyUser)
        .end((err, res) => {
          const cookie = res.headers['set-cookie'].join(';');
          assert(cookie, 'no cookie on response for login...');

          agent
            .get('/auth/cookies')
            .expect((res) => {
              expect(res.text).to.not.equal(':(');
              expect(res.text).to.equal('mock-auth');
            })
            .end(done);
        });
    });
  });
});
