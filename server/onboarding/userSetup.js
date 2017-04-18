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

import * as projectPersistence from '../data/persistence/projects';
import onboardNewUser from './onboardNewUser';
import debug from 'debug';

const logger = debug('constructor:auth:onboarding');

//if user has been setup, then return true
const checkUserSetup = (user) => {
  /*
   //re-enable if we want to assume that once a user has used constructor, they can't get into a bad state and never need to check them again
   if (user && user.data && user.data.constructor === true) {
   return Promise.resolve(true);
   }
   */

  logger('checkUserSetup ' + user.uuid);

  return projectPersistence.getUserLastProjectId(user.uuid)
    .then(projectId => {
      logger('checkUserSetup() query complete, already onboarded');
      return projectId;
    })
    .catch(err => {
      logger('checkUserSetup() query complete, onboarding...');
      return onboardNewUser(user)
        .then(rolls => {
          logger(`checkUserSetup() onboarded ${user.uuid} (${user.email}) - ${rolls.length} projects`);
          logger(rolls.map(roll => `${roll.project.metadata.name || 'Unnamed'} @ ${roll.project.id}`));
          return rolls[0].project.id;
        })
        .catch(err => {
          logger('checkUserSetup() error onboarding');
          logger(user);
          logger(err);
          logger(err.stack);
          return Promise.reject(err);
        });
    });
};

export default checkUserSetup;
