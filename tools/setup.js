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

import run from './run';
import checks from './checks';
import clean from './clean';
import setupFiles from './setupFiles';
import copy from './copy';
import startDb from './startDb';

// returns an array of child processes which may be holding onto the process (e.g. if pass IO)
// you must kill yourself for the process to exit

async function setup() {
  const processes = [];

  //ensure necessary software + versions
  await run(checks);

  //clean old dirs + previous builds
  await run(clean);

  //create directories etc. we need, copy in necessary content for start
  await run(setupFiles);

  //copy over public assets etc
  await run(copy.bind(undefined, { watch: true }));

  //start database (note - this holds onto the process until killed)
  //will skip under certain conditions (see the script itself)
  const dbProcess = await run(startDb);

  //not defined if DB was already running
  if (dbProcess) {
    processes.push(dbProcess);
  }

  return processes;
}

export default setup;
