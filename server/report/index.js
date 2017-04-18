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
/**
 * Simple router for arbitrary file saving / reading.
 *
 * Extensions may want to use this for persistence on the constructor server
 */
import express from 'express';
import bodyParser from 'body-parser';
import rejectingFetch from '../../src/middleware/utils/rejectingFetch';
import errorHandlingMiddleware from '../utils/errorHandlingMiddleware';

const githubIssuesApiUrl = 'https://api.github.com/repos/autodesk-bionano/genome-designer/issues';

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects,
  limit: 1024 * 1024,
});

router.use(errorHandlingMiddleware);

//dummy route, registered with Github
router.route('/githubOAuth')
  .all((req, res, next) => {
    //this doesnt need to do anything, unless we want to oauth with github
  });

router.route('/githubIssue/:id?')
  .all((req, res, next) => {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return next('must set GITHUB_ACCESS_TOKEN for GitHub API');
    }
    next();
  })
  //route for testing - only should test when env var is set
  .get((req, res, next) => {
    const githubUrl = `${githubIssuesApiUrl}/${req.params.id}`;

    rejectingFetch(githubUrl, {
      headers: {
        Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3.text+json',
      },
    })
      .catch(resp => {
        res.status(resp.status);
        return resp;
      })
      .then(resp => resp.json())
      .then(json => res.json(json));
  })
  .post(jsonParser, (req, res, next) => {
    const payload = JSON.stringify(req.body);
    const githubUrl = githubIssuesApiUrl;

    rejectingFetch(githubUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3.text+json',
      },
      body: payload,
    })
      .catch(resp => {
        res.status(resp.status);
        return resp;
      })
      .then(resp => resp.json())
      .then(json => res.json(json));
  });

export default router;
