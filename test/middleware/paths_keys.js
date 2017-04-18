import chai from 'chai';
import * as pathsApi from '../../src/middleware/utils/paths';
const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Paths + Keys', () => {
    //login() is tested in server/REST

    it('dataApiPath() returns an absolute URL to hit the server', () => {
      const fakepath = pathsApi.dataApiPath('somepath');
      assert(/http/.test(fakepath));
      assert(/somepath/.test(fakepath));
    });

    it('dataApiPath() paths are prefixed with /data/', () => {
      const fakepath = pathsApi.dataApiPath('somepath');
      assert(/data\/somepath/.test(fakepath));
    });

    it('getUserInfo() should get current user info, synchronously'); //future
  });
});
