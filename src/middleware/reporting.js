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
import { headersPost} from './utils/headers';
import { reportApiPath } from './utils/paths';

export const reportError = (title, description, url, user) => {
  invariant(title, 'title is required');
  invariant(description, 'description is required');
  invariant(url, 'current url is required');

  const postUrl = reportApiPath('githubIssue');
  const body = `### URL

${url}

### Description

${description}

### User

${user}`;

  const payload = JSON.stringify({
    title,
    body,
    labels: ['bug:user_reported'],
  });

  return rejectingFetch(postUrl, headersPost(payload))
    .then(resp => resp.json());
};
