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
import colors from 'colors/safe';
import { exec, spawn } from 'child_process';
import debug from 'debug';
import { merge } from 'lodash';

const logger = debug('constructor:tools');

if (!logger.enabled) {
  console.log('Enable build tool debugging with env var DEBUG=constructor:tools');
}

const defaultOpts = {
  silent: false,
  env: Object.assign({
    DEBUG_COLORS: true,
  }, process.env),
};

//wrap, so can force output
const log = (output = '', forceOutput = false) => {
  if (forceOutput === true || logger.enabled) {
    console.log(output.trim());
  }
};

export const promisedExec = (cmd, opts, {
  forceOutput = false,
  comment = null,
} = {}) => {
  console.log(colors.blue(comment || 'running ' + cmd));

  return new Promise((resolve, reject) => {
    exec(cmd, merge({}, defaultOpts, opts), (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      //`` to convert from buffers
      if (stdout) {
        log(`${stdout}`, forceOutput);
      }
      if (stderr) {
        log(`${stderr}`, forceOutput);
      }

      return resolve(`${stdout}`, `${stderr}`);
    });
  });
};

// two options
// pass IO to inherit, and resolve on close or reject on error (assumes task will close)
// don't pass IO, and pass waitUntil as string
// otherwise, could spawn in background
export const spawnAsync = (cmd, args = [], opts = {}, {
  waitUntil = `${Math.random()}`,
  forceOutput = false,
  failOnStderr = false,
  comment = null,
} = {}) => {
  const runText = `running: ${cmd} ${args.join(' ')}`;
  console.log(colors.blue(comment || runText)); //always log something
  if (logger.enabled) {
    console.log(runText); //log if debugging
  }

  return new Promise((resolve, reject) => {
    //const [ command, ...args ] = cmd.split(' ');

    const spawned = spawn(cmd, args, merge({}, defaultOpts, opts));

    //stdio only defined when piped, not if inherited / ignored
    if (spawned.stdout) {
      spawned.stdout.on('data', data => {
        log(`${data}`, forceOutput);
        if (`${data}`.indexOf(waitUntil) >= 0) {
          log('Resolved!');
          resolve(spawned);
        }
      });

      spawned.stderr.on('data', data => {
        log(`${data}`, true);
        if (`${data}`.indexOf(waitUntil) >= 0) {
          return resolve(spawned);
        }
        if (failOnStderr === true) {
          console.log('REJECTING');
          spawned.kill();
          reject(spawned);
        }
      });
    }

    spawned.on('error', (err) => {
      console.error('Error in process');
      console.error(err);
      reject(spawned);
    });

    spawned.on('close', (code) => {
      log(`child process exited with code ${code}`, forceOutput);
      if (code > 0) {
        return reject(spawned);
      }
      resolve(spawned);
    });
  });
};
