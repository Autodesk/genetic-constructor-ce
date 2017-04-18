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
import run from './run';
import setup from './setup';
import { spawnAsync, promisedExec } from './lib/cp';

/** paths **/

const pathProjectRoot = path.resolve(__dirname, '../');
const pathBioNanoPlatform = process.env.PLATFORM_PATH || path.resolve(pathProjectRoot, '../bio-user-platform');
const PGPASSWORD = process.env.PGPASSWORD || 'storageGCTOR'; // TODO export this default from `gctor-storage`

console.log('bio-user-platform PLATFORM_PATH=' + pathBioNanoPlatform);

/** scripts **/

const setupBioNanoPlatform = (useGenomeDesignerBranch = false) => {
  const checkoutPromise = useGenomeDesignerBranch === true ?
    promisedExec(`git checkout genome-designer`,
      { cwd: pathBioNanoPlatform },
      { comment: 'Setting up User Module...' }
    ) :
    Promise.resolve();

  return checkoutPromise
    .then(() => promisedExec(`npm install`,
      { cwd: pathBioNanoPlatform },
      { comment: 'Installing User Module...' }
    ));
};

const startAuthServer = () => {
  return spawnAsync('npm', ['start'],
    {
      cwd: pathBioNanoPlatform,
      env: Object.assign({ PGPASSWORD }, process.env),
    },
    {
      comment: 'Starting User Module...',
      waitUntil: `{ address: { address: '::', family: 'IPv6', port: 8080 } } 'started'`,
    });
};

const startRunAuth = () => {
  console.log('\n\n');
  return spawnAsync('npm', ['run', 'auth'],
    { cwd: pathProjectRoot },
    {
      comment: 'Starting Constructor with Authentication...',
      waitUntil: 'Server listening at http://0.0.0.0:3000/',
      forceOutput: true,
      failOnStderr: false,
    }
  );
};

async function auth() {
  try {
    await run(setup);
    await setupBioNanoPlatform();
    await startAuthServer();
    await startRunAuth();
  } catch (err) {
    console.log('CAUGHT', err);
    throw err;
  }
}

export default auth;
