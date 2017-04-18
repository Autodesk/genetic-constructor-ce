import { expect } from 'chai';
import { merge } from 'lodash';
import { testUserClient } from '../constants';
import * as actions from '../../src/actions/user';
import userReducer from '../../src/reducers/user';
import { simpleStore } from '../store/mocks';

describe('Actions', () => {
  describe('User Actions', () => {
    const initialState = {
      userid: null,
      email: null,
      firstName: null,
      lastName: null,
      config: {},
    };

    //this actually comes from the default user in server/auth/local
    const dummyUser = testUserClient();

    const userStore = simpleStore(initialState, userReducer, 'user');

    it('should update user on userLogin', () => {
      const loginPromise = userStore.dispatch(actions.userLogin(dummyUser.email, '123456'));

      return loginPromise.then(user => {
        expect(user.email).to.eql(dummyUser.email);
        expect(userStore.getState().user).to.eql(user);
        expect(user.config).to.be.defined;
      });
    });

    it('should update user on userLogout', () => {
      const logoutPromise = userStore.dispatch(actions.userLogout());

      return logoutPromise.then(() => {
        expect(userStore.getState().user).to.eql(initialState);
      });
    });
  });
});
