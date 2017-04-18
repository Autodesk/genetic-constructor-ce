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
import { promisedExec, spawnAsync } from './lib/cp';
import checkPortFree from '../server/utils/checkPortFree';
import colors from 'colors/safe';

//note - DB holds on the to process, so this will resolve but process will never exit. So, can be used in promise chaining, but not in __ && __ bash syntax

const STORAGE_PORT = process.env.PGPORT || 5432;
const withJenkins = !!process.env.JENKINS;
const noDocker = !!process.env.NO_DOCKER;

const buildDb = 'docker build -t gctorstorage_db ./storage-ext/postgres/';
const runDb = `docker run -p ${STORAGE_PORT}:5432 -l "gctorstorage_db" --rm gctorstorage_db`;

async function startDb() {
  try {
    if (withJenkins || noDocker) {
      console.log(colors.yellow('Assuming Database managed externally...'));
      return Promise.resolve(null);
    }

    await promisedExec(buildDb, {}, { comment: 'Building DB Docker container...' });

    const dbProcess = await checkPortFree(STORAGE_PORT)
      .catch(err => {
        //ideally, see what is running at the port
        //should be windows friendly
        /*
         await promisedExec(`lsof -i :${STORAGE_PORT}`, {}, { comment: `Checking port ${STORAGE_PORT} for DB...` })
         .then(results => {
         if (!results) {
         //either errored and nothing returned, or we're ok and port is free
         return;
         }

         const [, ...processes] = results.split('\n');

         if (processes.every(process => !process || process.indexOf('postgresql') >= 0)) {
         console.log(`Postgres already running at ${STORAGE_PORT}`);
         return;
         }

         throw new Error(`Process running on port ${STORAGE_PORT} does not appear to be Postgres...`);
         });
         */
        return false;
      })
      .then(free => {
        if (free) {
          const [cmd, ...args] = runDb.split(' ');

          return spawnAsync(cmd, args, {}, {
            waitUntil: 'PostgreSQL init process complete; ready for start up',
            comment: 'Running DB Docker container...',
          });
        }

        //if not free
        console.log(colors.yellow('Port not free - assuming port is occupied by Postgres DB process....'));
        return null;
      });

    //you could run (on unix) lsof -i :STORAGE_PORT to verify
    console.log('DB running on port:', STORAGE_PORT);
    return dbProcess;
  } catch (err) {
    console.log(colors.red('Error starting Storage service...'));
    throw err;
  }
}

export default startDb;
