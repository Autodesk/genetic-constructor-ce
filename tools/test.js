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

//expects that SERVER_MANUAL=true env var is set, and the test suite starts the server

import invariant from 'invariant';
import run from './run';
import setup from './setup';
import { promisedExec, spawnAsync } from './lib/cp';

//optional behaviors
const withCoverage = process.env.COVERAGE === 'true';
const withReport = process.env.REPORT === 'true';
const withJenkins = !!process.env.JENKINS;

//e.g. jenkins wants to always pass, so dont break the build
const forceSuccess = withJenkins;

//default test options for mocha
const mochaOptions = `--recursive --compilers js:babel-register,css:test/css-null-compiler.js --require ./test/setup.js --timeout 25000`;

//jenkins specific mocha options
const jenkinsOptions = `-u bdd --reporter mocha-jenkins-reporter --no-colors`;

//test options to use
let testOptions = mochaOptions;

if (withJenkins) {
  testOptions += ' ' + jenkinsOptions;
}

const unitTestCommand = `./node_modules/mocha/bin/mocha ${testOptions}`;

//using babel-node and babel-istanbul is way slow
//only runs in travis though, not needed for unit tests alone
//todo - investigate how to speed this up? may need a different package
const coverageCommand = `node_modules/.bin/babel-node node_modules/.bin/babel-istanbul cover --dir ./coverage --report lcovonly node_modules/.bin/_mocha -- ${testOptions}`;

//report coverage to coveralls (available in travis)
const coverageReport = `cat ./coverage/lcov.info | coveralls`;

async function test() {
  let processes = [];
  let errored = 0;

  try {
    invariant(process.env.NODE_ENV === 'test', 'must set NODE_ENV=test');

    //setup directories etc (may not be needed after transition to S3 / DB)
    processes = await run(setup);

    //now, run the test suite

    const command = withCoverage ?
      coverageCommand :
      unitTestCommand;

    const [cmd, ...args] = command.split(' ');

    const testProcess = await spawnAsync(cmd, args, {
      env: Object.assign({
        SERVER_MANUAL: 'true',
        JUNIT_REPORT_PATH: `${process.env.TEST_OUTPUT_PATH || '.'}/report.xml`,
      }, process.env),
      stdio: 'inherit',
    }, {
      forceOutput: true,
      comment: 'Starting Test Suite...',
    });

    processes.push(testProcess);

    //if we made it here, all tests passed
  } catch (err) {
    errored = 1;
    console.error(err.stack);
  } finally {
    if (withReport) {
      //run coverage tests, even if tests failed
      try {
        await promisedExec(coverageReport, { stdio: 'inherit' }, { forceOutput: true });
      } catch (err) {
        errored = 1;
        console.error('couldnt generate coverage information');
      }
    }

    processes.forEach(proc => {
      if (proc && !Number.isInteger(proc.exitCode)) {
        proc.kill();
      }
    });

    if (forceSuccess) {
      process.exit(0);
    }

    process.exit(errored);
  }
}

export default test;
