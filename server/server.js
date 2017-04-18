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
import path from 'path';
import fs from 'fs';
import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import colors from 'colors/safe';

import pkg from '../package.json';
import { registrationHandler } from './user/updateUserHandler';
import userRouter from './user/userRouter';
import dataRouter from './data/router';
import orderRouter from './order/index';
import extensionsRouter from './extensions/index';
import reportRouter from './report/index';
import bodyParser from 'body-parser';
import errorHandlingMiddleware from './utils/errorHandlingMiddleware';
import checkUserSetup from './onboarding/userSetup';
import { pruneUserObject } from './user/utils';

import checkPortFree from './utils/checkPortFree';
import { HOST_PORT, HOST_NAME, API_END_POINT } from './urlConstants';

//where the server will be listening
const hostPath = `http://${HOST_NAME}:${HOST_PORT}/`;

//file paths depending on if building or not
//note that currently, you basically need to use npm run start in order to serve the client bundle + webpack middleware
const createBuildPath = (isBuild, notBuild = isBuild) => {
  return path.join(__dirname, (process.env.BUILD ? isBuild : notBuild));
};
const pathContent = createBuildPath('content', '../src/content');
const pathDocs = createBuildPath('jsdoc', `../docs/jsdoc/genetic-constructor/${pkg.version}`);
const pathImages = createBuildPath('images', '../src/images');
const pathPublic = createBuildPath('public', '../src/public');
const pathClientBundle = createBuildPath('client.js', '../build/client.js');

//create server app
const app = express();

//enable deflate / gzip
app.use(compression());

//use large body limit at root so that 100kb default doesnt propagate / block downstream
app.use(bodyParser.json({
  limit: '50mb',
  strict: false,
}));

app.use(errorHandlingMiddleware);

//HTTP logging middleware
const logLevel = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logLevel, {
  skip: (req, res) => {
    if (req.path.indexOf('browser-sync') >= 0 || req.path.indexOf('__webpack') >= 0) {
      return true;
    }
    //skip logging in test environment, unless DEBUG is set
    if (process.env.NODE_ENV === 'test' && !process.env.DEBUG) {
      return true;
    }
    return false;
  },
}));

// view engine setup
app.set('views', pathContent);
app.set('view engine', 'pug');

// Register API middleware
// ----------------------------------------------------

// STORAGE

// routes / mini-app for interacting with postgres DB
// expose this route for local development, production will call `process.env.STORAGE_API` directly
// in deployed environment this API will be available on a different host, and not at this route endpoint
//note - should come before local auth setup, so that mockUser setup can call storage without middleware in place
if (!process.env.STORAGE_API) {
  console.log('[DB Storage] DB Storage API mounted locally at /api/');
  app.use(require('gctor-storage').mockReqLog); // the storage routes expect req.log to be defined
  app.use('/api', require('gctor-storage').routes);
}

// AUTH

// insert some form of user authentication
// the auth routes are currently called from the client and expect JSON responses
if (process.env.BIO_NANO_AUTH) {
  console.log('[Auth] Real user authentication enabled');
  const initAuthMiddleware = require('bio-user-platform').initAuthMiddleware;

  const authConfig = {
    logoutLanding: false,
    loginLanding: false,
    loginFailure: false,
    resetForm: '/homepage/reset',
    apiEndPoint: API_END_POINT,
    onLogin: (req, res, next) => {
      return checkUserSetup(req.user)
        .then((projectId) => {
          //note this expects an abnormal return of req and res to the next function
          return next(req, res);
        })
        .catch(err => {
          console.log(err);
          console.log(err.stack);
          res.status(500).end();
        });
    },
    //onLogin: (req, res, next) => next(req, res), //mock
    registerRedirect: false,
  };
  app.use(initAuthMiddleware(authConfig));
} else {
  console.log('[Auth] Local mocked authentication enabled');
  app.use(require('cookie-parser')());

  const localAuth = require('./auth/local');

  //force default user on all requests
  //NOTE - requires / enforces that users are always signed in to hit API, even for non-client originating requests. what about extensions?
  app.use(localAuth.mockUser);

  //mount the mock authentication routes
  app.use('/auth', localAuth.router);

  //do an initial setup of the user's projects on server start
  //do not run on every call, so if get into a bad state, restart server
  localAuth.prepareUserSetup();
}

//expose our own register route to handle custom onboarding
app.post('/register', registrationHandler);
app.use('/user', userRouter);

// PRIMARY ROUTES

app.use('/data', dataRouter);
app.use('/order', orderRouter);
app.use('/extensions', extensionsRouter);
app.use('/report', reportRouter);

// Register Client Requests, delegate routing to client
// ----------------------------------------------------

//Static Files
app.use(express.static(pathPublic));
app.use('/images', express.static(pathImages));
app.use('/help/docs', express.static(pathDocs));

app.get('/version', (req, res) => {
  try {
    //this is only relevant when the server builds, so can assume always at same path relative to __dirname
    const version = fs.readFileSync(path.join(__dirname, '../VERSION'));
    res.send(version);
  } catch (ignored) {
    res.send('Missing VERSION file');
  }
});

app.get('*', (req, res) => {
  if (req.url.indexOf('client.js') >= 0) {
    //should only hit this when proxy is not set up (i.e. not in development)
    res.sendFile(pathClientBundle);
  } else {
    // setup user properties and discourse base url to flash to client
    const discourse = {
      discourseDomain: process.env.BNR_ENV_URL_SUFFIX || `https://forum.bionano.autodesk.com`,
    };
    //so that any routing is delegated to the client
    const prunedUser = pruneUserObject(req.user);
    const config = prunedUser.config ? JSON.stringify(prunedUser.config) : '{}';
    const user = Object.assign({}, prunedUser, { config });
    res.render(path.join(pathContent + '/index.pug'), Object.assign({}, user, discourse, {
      productionEnvironment: process.env.NODE_ENV === 'production',
    }));
  }
});

/*** running ***/
/* eslint-disable no-console */

function handleError(err) {
  console.log(colors.bgRed('Error starting server. Terminating...'));
  console.log(colors.red(err));
  console.log(err.stack);
  //87 is totally arbitrary, but listen for it in runServer.js
  process.exit(87);
}

function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(HOST_PORT, HOST_NAME, (err) => {
      if (err) {
        handleError(err);
      }

      console.log(colors.bgGreen(`Server listening at ${hostPath}`));
      resolve(hostPath);
    });
  });
}

// initialize the DB connection if we're not using an external storage API
// note - requires running `npm run storage-db`
function initDb() {
  return new Promise((resolve, reject) => {
    const init = (!process.env.STORAGE_API) ?
      require('gctor-storage').init :
      (cb) => { return cb(); };

    init(resolve);
  });
}

//check if the port is taken, and init the db, and star the server
//returns a promise, so you can listen and wait until it resolves
export const listenSafely = () => {
  //first check if the port is in use -- e.g. tests are running, or some other reason
  return checkPortFree(HOST_PORT, HOST_NAME)
    .then(initDb)
    .then(startServer)
    .catch(handleError);
};

//attempt start the server by default
if (process.env.SERVER_MANUAL !== 'true') {
  listenSafely();
} else {
  console.log('Server ready, will start listening manually...');
}

export default app;
