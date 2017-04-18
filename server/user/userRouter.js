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
import express from 'express';
import bodyParser from 'body-parser';
import { ensureReqUserMiddleware, getConfigFromUser, pruneUserObject } from './utils';
import updateUserHandler, { loginHandler } from './updateUserHandler';

export const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json();

router.route('/config')
  .all(ensureReqUserMiddleware)
  .get((req, res, next) => {
    const config = getConfigFromUser(req.user);
    res.json(config);
  })
  .post(jsonParser,
    (req, res, next) => {
      const config = req.body;
      Object.assign(req, { config });
      next();
    },
    updateUserHandler({})
  );

router.route('/info')
  .all(ensureReqUserMiddleware)
  .get((req, res, next) => {
    res.json(pruneUserObject(req.user));
  })
  .post(jsonParser,
    (req, res, next) => {
      const userPatch = req.body;
      const config = userPatch.config;
      Object.assign(req, { config, userPatch });
      next();
    },
    updateUserHandler({ updateWholeUser: true })
  );

router.route('/login')
  .post(jsonParser, loginHandler);

//catch-all
router.all('*', (req, res, next) => {
  res.status(404).send();
});

export default router;
