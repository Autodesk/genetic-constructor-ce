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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import { headersGet, headersPost } from './utils/headers';
import { serverPath, authPath, registerPath } from './utils/paths';

const authFetch = (...args) => {
  return rejectingFetch(...args)
    .then(resp => resp.json())
    .catch(resp => {
      if (!resp.status) {
        return Promise.reject(resp);
      }
      if (resp.headers.get('Content-Type').indexOf('json') >= 0) {
        return Promise.reject(resp.json());
      }
      return Promise.reject(resp.text());
    });
};

// login with email and password and set the sessionKey (cookie) for later use
export const login = (user, password) => {
  const body = {
    email: user,
    password: password,
  };
  const stringified = JSON.stringify(body);

  return authFetch(serverPath('user/login'), headersPost(stringified));
};

export const register = (user, config = {}) => {
  invariant(user.email && user.password && user.firstName && user.lastName, 'wrong format user');

  //allow passing config directly in the middleware
  const payload = { user, config };
  const stringified = JSON.stringify(payload);

  //send them to our custom registration route
  return authFetch(registerPath(), headersPost(stringified));
};

export const forgot = (email) => {
  const body = { email };
  const stringified = JSON.stringify(body);

  return authFetch(authPath('forgot-password'), headersPost(stringified));
};

export const reset = (email, forgotPasswordHash, newPassword) => {
  const body = { email, forgotPasswordHash, newPassword };
  const stringified = JSON.stringify(body);

  return authFetch(authPath('reset-password'), headersPost(stringified));
};

export const logout = () => {
  return rejectingFetch(authPath('logout'), headersGet());
};

// use established sessionKey to get the user object
export const getUser = () => {
  return authFetch(serverPath('user/info'), headersGet());
};

// hack - this hits auth directly, rather than our user routes
// remove the data object from the request so it is not accidently consumed with the wrong shape
// update account
export const updateAccount = (payload) => {
  const body = payload;
  const stringified = JSON.stringify(body);

  return authFetch(authPath('update-all'), headersPost(stringified))
    .then(json => {
      delete json.data;
      return json;
    });
};

export const getUserConfig = () => {
  return rejectingFetch(serverPath('user/config'), headersGet())
    .then(resp => resp.json());
};

export const setUserConfig = (newConfig) => {
  invariant(newConfig && typeof newConfig === 'object', 'must pass a new configuration object');

  return rejectingFetch(serverPath('user/config'), headersPost(JSON.stringify(newConfig)))
    .then(resp => resp.json());
};
