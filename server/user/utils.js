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
import invariant from 'invariant';
import { merge } from 'lodash';

import userConfigDefaults from '../onboarding/userConfigDefaults';
import { userConfigKey } from './userConstants';

//these are the fields we expect on the client user object
//note that the field UUID is here, whereas on the client it is userid
//todo - reconcile uuid here and userid on client
const fields = ['password', 'newPassword', 'config', 'uuid', 'firstName', 'lastName', 'email'];

export const mergeConfigToUserData = (user, config = userConfigDefaults) => {
  return merge({}, user, {
    data: {
      constructor: true,
      [userConfigKey]: config,
    },
  });
};

//validate config on user.data
//todo - should validate that the projects and extensions exist, here
export const validateConfig = (config) => {
  const { projects, extensions } = config;

  if (projects !== undefined) {
    invariant(typeof projects === 'object' && !Array.isArray(projects), 'config.projects must be an object');
    invariant(Object.keys(projects).length > 0, 'must have some starting projects');
  }

  if (extensions !== undefined) {
    invariant(typeof extensions === 'object' && !Array.isArray(extensions), 'config.extensions must be an object');
  }

  return true;
};

export const getConfigFromUser = (user = {}, def = userConfigDefaults) => {
  const { data } = user;
  if (!data) {
    return def;
  }

  const config = data[userConfigKey];
  if (!config || !Object.keys(config).length) {
    return def;
  }
  return config;
};

//validate + create a merged config
//throws if invalid, so should try-catch appropriately
export const updateUserConfig = (user, newConfig) => {
  const oldConfig = getConfigFromUser(user);

  //question!!!! - merge deeply, or shallow assign? For now, shallow assign so have to explicitly include default projects + extensions for them to show up
  const config = Object.assign({}, oldConfig, newConfig);

  validateConfig(config);

  return mergeConfigToUserData(user, config);
};

//update user, from client form { ...user, config }
export const updateUserAll = (user, patch) => {
  invariant(Object.keys(patch).every(key => fields.indexOf(key) >= 0), 'got unexpected key user patch: ' + Object.keys(patch));

  const { config, ...rest } = patch;
  return merge({}, updateUserConfig(user, config), rest);
};

export const pruneUserObject = (user) => {
  if (!user) {
    return {};
  }

  const config = getConfigFromUser(user);
  const fields = ['uuid', 'firstName', 'lastName', 'email'];
  const fieldsObject = fields.reduce((acc, field) => Object.assign(acc, { [field]: user[field] }), {});

  return Object.assign(fieldsObject, { config });
};

export const pruneUserObjectMiddleware = (req, res, next) => {
  Object.assign(req, { user: pruneUserObject(req.user) });
  next();
};

export const ensureReqUserMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send('no user found on request. ensure header set - credentials: same-origin');
  }
  next();
};
