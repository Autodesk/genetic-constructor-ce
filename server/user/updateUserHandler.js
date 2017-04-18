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

import fetch from 'isomorphic-fetch';
import EmailValidator from 'email-validator';
import { INTERNAL_HOST, API_END_POINT } from '../urlConstants';
import userConfigDefaults from '../onboarding/userConfigDefaults';
import { pruneUserObject, validateConfig, updateUserAll, updateUserConfig, mergeConfigToUserData } from './utils';
import { headersPost } from '../../src/middleware/utils/headers';
import debug from 'debug';

const logger = debug('constructor:auth');

//todo - share fetch handling with config / register routes

//need error handling to handle them already registered
//note - expects JSON parser ahead of it
export function registrationHandler(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    logger('[User Register] invalid body for registration');
    next('must pass object to login handler, use json parser');
  }

  const { user, config } = req.body;
  const { email, password, firstName, lastName } = user;

  //basic checks before we hand off to auth/register
  if (!email || !EmailValidator.validate(email)) {
    logger(`[User Register] email invalid: ${email}`);
    return res.status(422).json({ message: 'invalid email' });
  }
  if (!password || password.length < 6) {
    logger(`[User Register] password invalid: ${password}`);
    return res.status(422).json({ message: 'invalid password' });
  }

  const mergedConfig = Object.assign({}, userConfigDefaults, config);

  try {
    validateConfig(mergedConfig);
  } catch (err) {
    logger('[User Register] Error in input config');
    logger(err);
    logger(err.stack);
    return res.status(422).send({ err });
  }

  const mappedUser = mergeConfigToUserData({
    email,
    password,
    firstName,
    lastName,
  }, mergedConfig);

  logger('[User Register] registering...');
  logger(mappedUser);

  //regardless whether local auth or real auth (it is mounted appropriately at /auth), we want to hit this route
  const url = INTERNAL_HOST + '/auth/register';

  return fetch(url, headersPost(JSON.stringify(mappedUser)))
    .then(resp => {
      //re-assign cookies from platform authentication
      const cookies = resp.headers.getAll('set-cookie');
      cookies.forEach(cookie => {
        res.set('set-cookie', cookie);
      });

      return resp.json();
    })
    .then(userPayload => {
      //console.log('userPayload');
      //console.log(userPayload);

      if (!!userPayload.message) {
        return Promise.reject(userPayload);
      }

      const pruned = pruneUserObject(userPayload);

      //console.log('sending pruned');
      //console.log(pruned);

      res.json(pruned);
    })
    .catch(err => {
      logger('[User Register] Error registering');
      logger(req.body);
      logger(err);
      logger(err.stack);
      res.status(500).json({ err });
    });
}

export function loginHandler(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    next('must pass object to login handler, use json parser');
  }

  const { email, password } = req.body;

  //basic checks before we hand off to auth/register
  if (!email || !EmailValidator.validate(email)) {
    logger(`[User Login] email invalid: ${email}`);
    return res.status(422).json({ message: 'invalid email' });
  }
  if (!password) {
    logger(`[User Login] password required, got: ${password}`);
    return res.status(422).json({ message: 'invalid password' });
  }

  //regardless whether local auth or real auth (it is mounted appropriately at /auth), we want to hit this route
  const url = INTERNAL_HOST + '/auth/login';

  logger('[User Login] Logging in:');
  logger(email, password, url);

  return fetch(url, headersPost(JSON.stringify(req.body)))
    .then(resp => {
      //re-assign cookies from platform authentication
      const cookies = resp.headers.getAll('set-cookie');
      cookies.forEach(cookie => {
        res.set('set-cookie', cookie);
      });

      return resp.json();
    })
    .then(userPayload => {
      logger('[User Login] received payload');
      logger(userPayload);

      if (!!userPayload.message) {
        return Promise.reject(userPayload);
      }

      const pruned = pruneUserObject(userPayload);

      logger('[User Login] sending pruned:');
      logger(pruned);

      res.json(pruned);
    })
    .catch(err => {
      logger('[User Login] Error logging in');
      logger(req.body);
      logger(err);
      logger(err.stack);
      res.status(500).json({ err });
    });
}

//parameterized route handler for setting user config
//expects req.user and req.config / req.userPatch to be set
export default function updateUserHandler({ updateWholeUser = false } = {}) {
  const wholeUser = updateWholeUser === true;

  return (req, res, next) => {
    const { user: userInput, config: configInput, userPatch } = req;

    logger('[User Config]');
    logger(userInput);
    logger(userPatch);
    logger(configInput);

    if (!userInput) next('req.user must be set');
    if (wholeUser && !userPatch) next('if updating user, set req.userPatch');
    if (!wholeUser && !configInput) next('if updating config, set req.config');

    let user = userInput;

    try {
      if (wholeUser) {
        user = updateUserAll(userInput, userPatch);
      } else {
        user = updateUserConfig(userInput, configInput);
      }
    } catch (err) {
      logger('[User Config] Error Updating config:');
      logger(err);
      logger(err.stack);
      return res.status(422).json({ err });
    }

    //console.log('USER CONFIG HANDLER');
    //console.log(user, userInput, configInput, userPatch);

    //to update user, issues with setting cookies as auth and making a new fetch, so call user update function
    //might want to abstract to same across local + real auth
    if (process.env.BIO_NANO_AUTH) {
      const userPromises = require('bio-user-platform').userPromises({
        apiEndPoint: API_END_POINT,
      });

      return userPromises.update(user)
        .then(updatedUser => {
          const pruned = pruneUserObject(updatedUser);
          const toSend = wholeUser ? pruned : pruned.config;
          res.json(toSend);
        })
        .catch(err => {
          logger('[User Config] error setting user config');
          logger(err);
          res.status(501).json({ err });
        });
    }

    // otherwise, delegate to auth routes
    // Real auth - dont need to worry about passing cookies on fetch, since registering (not authenticated)
    // local auth - just call our mock routes
    const url = INTERNAL_HOST + '/auth/update-all';
    return fetch(url, headersPost(JSON.stringify(user)))
      .then(resp => {
        //re-assign cookies from platform authentication
        const cookies = resp.headers.getAll('set-cookie');
        cookies.forEach(cookie => {
          res.set('set-cookie', cookie);
        });

        return resp.json();
      })
      .then(userPayload => {
        logger('[User Config] received payload');
        logger(userPayload);

        if (!!userPayload.message) {
          return Promise.reject(userPayload);
        }

        const pruned = pruneUserObject(userPayload);
        const toSend = wholeUser ? pruned : pruned.config;

        res.json(toSend);
      })
      .catch(err => {
        logger('[User Config] got error setting user config');
        logger(err);
        logger(err.stack);
        res.status(500).json({ err });
      });
  };
}
