import { assert, expect } from 'chai';
import { merge } from 'lodash';
import { login, getUser, getUserConfig, setUserConfig } from '../../src/middleware/auth';
import userConfigDefaults from '../../server/onboarding/userConfigDefaults';

//noinspection JSUnusedLocalSymbols
const devServer = require('../../server/server'); // starts the server which will be accessed by methods below

describe('middleware', () => {
  describe('auth', () => {
    const dummyUser = {
      email: 'bio.nano.dev@autodesk.com',
      password: 'HelpMe#1',
    };

    it('login() receive the user object', () => {
      return login(dummyUser.email, dummyUser.password)
        .then(userInfo => {
          expect(userInfo).to.be.defined;
          expect(userInfo.uuid).to.be.defined;
          expect(userInfo.email).to.be.defined;
        });
    });

    //not sure how to test this... jsdom doesn't set cookies apparently
    it('login() should set a cookie');

    it('getUser() should fetch a user object if you are logged in', () => {
      return getUser()
        .then(user => {
          expect(user).to.be.defined;
          expect(user.uuid).to.be.defined;
          expect(typeof user.uuid).to.be.equal('string');
        });
    });

    //not sure how to test this...
    //local logout should clear cookie (set empty / expired - same way as platform) -- test headers
    it('logout() should clear cookie');

    it('getUserConfig() should get user config', () => {
      return getUserConfig()
        .then(config => {
          assert(typeof config === 'object', 'expected a config');
          assert(typeof config.projects === 'object', 'expected projects config');
          assert(typeof config.extensions === 'object', 'expected an extensions config');
        });
    });

    it('setUserConfig() should set user config', () => {
      const allInactive = Object.keys(userConfigDefaults.extensions).reduce((acc, key) => Object.assign(acc, { [key]: { active: false } }), {});
      const nextConfig = merge({}, userConfigDefaults, { extensions: allInactive });

      return getUserConfig()
        .then(oldConfig => {
          return setUserConfig(nextConfig)
            .then(newConfig => {
              expect(oldConfig.projects).to.eql(newConfig.projects);
              expect(oldConfig.extensions).not.to.eql(newConfig.extensions);
              expect(newConfig.extensions).to.eql(nextConfig.extensions);
              return getUserConfig();
            })
            .then(confirmConfig => {
              expect(oldConfig.projects).to.eql(confirmConfig.projects);
              expect(nextConfig.extensions).to.eql(confirmConfig.extensions);
            });
        });
    });
  });
});