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

import invariant from 'invariant';
import Order from '../../src/models/Order';
import Rollup from '../../src/models/Rollup';
import debug from 'debug';

//test ordering module, which resolves when the order, user, constructList, blockMap are valid

const log = debug('constructor:order');

const runChecks = (order, user, constructList, rollup) => {
  Order.validateSetup(order, true);

  invariant(user.uuid, 'must pass user with uuid');
  invariant(!user.data, 'must pass pruned user. user.data should not be defined');
  invariant(Array.isArray(constructList), 'construct list must be array');
  invariant(constructList.every(list => Array.isArray(list)), 'construct list items must be array');

  invariant(typeof rollup === 'object', 'rollup must be defined object');
  Rollup.validate(rollup, true, true);

  invariant(constructList.every(list => list.every(item => rollup.blocks[item])), 'construct list items must appear in blockMap');
};

export const submit = (order, user, constructList, rollup) => {
  try {
    runChecks(order, user, constructList, rollup);
  } catch (err) {
    log('[test.submit()] Error submitting order:');
    log(err);
    return Promise.reject(err);
  }

  return Promise.resolve({
    jobId: '' + Math.random(),
    cost: `$1,000,000`,
  });
};

export const validate = (order, user, constructList, rollup) => {
  try {
    runChecks(order, user, constructList, rollup);
  } catch (err) {
    log('[test.validate()] Error validating order:');
    log(err);
    return Promise.reject(err);
  }

  return Promise.resolve(true);
};
