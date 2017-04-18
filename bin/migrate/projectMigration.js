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

//requires the server to be running so APIs accessible
//run this file from project root: `babel-node ./storage/projectMigration.js`

import path from 'path';
import fetch from 'isomorphic-fetch';
import fs from 'fs';
import _ from 'lodash';
import { defaultUser } from '../../server/auth/local';
import Project from '../../src/models/Project';
import Rollup from '../../src/models/Rollup';
import * as fileSystem from '../../server/data/middleware/fileSystem';
import paletteAnime from '../../src/utils/color/paletteAnime';
import makeEgfRollup from '../../data/egf_parts/index';
import * as projectPersistence from '../../server/data/persistence/projects';
import onboardNewUser from '../../server/onboarding/onboardNewUser';

import batchPromises from './batchPromises';
import { storagePath, projectPath, AUTH_API } from './config';

/* eslint-disable no-console */

/****** THINGS WE WANT TO TRACK ***************/

//keep a list of users who we just need to onboard again - they havent touched their initial project
//actual user objects, not just IDs
// [ user, user, ... ]
const usersToOnboardAgain = [];

// track the userIDs we are migrating, and their projects
// { userId: [ projectId, projectId ] }
const usersToMigrate = {};

/*************** DO THE THING ********************/

//track all the users, and their projects
const users = {};
const invalidUsers = [];
const testUsers = [];

console.log('checking all projects in ', projectPath);

//get all the project IDs
const projects = fs.readdirSync(projectPath)
//skip .DS_Store
  .filter(dir => dir[0] !== '.');

console.log('all projects: ', projects.length);
console.log(projects);

//go through projects, determine number for each user
_.forEach(projects, projectId => {
  const permissionsFile = path.resolve(projectPath, projectId, 'permissions.json');
  if (! fs.existsSync(permissionsFile)) {
    console.log(projectId, "has no permissions file; skipping.");
  } else {
    const owner = JSON.parse(fs.readFileSync(permissionsFile))[0];

    if (!users[owner]) {
      users[owner] = [];
    }

    users[owner].push(projectId);
  }
});

console.log('user map');
console.log(users);

// go through our users
// remove test users
// check number of projects per user, and add to migration list as appropriate
batchPromises(
  _.map(users, (projects, userId) => () => {
    console.log(`
Checking user ${userId} (${projects.length}):
${projects.join(', ')}`);

    //they were not onboarded properly so lets just dip out
    if (projects.length < 2) {
      // we are going to ignore these users
      return Promise.resolve();
    }

    return lookupUser(userId)
      .then(user => {
        console.log(user.email);

        //if the user is a test user, ignore them
        if ((user.email.indexOf('hotmail') >= 0) ||
          (user.email.indexOf('royalsociety.co.uk') >= 0) ||
          (user.email.indexOf('charlesdarwin') >= 0)) {
          console.log('User appears to be test user, skipping');
          testUsers.push(userId);
          return Promise.resolve();
        }

        // if only two, check the "empty project" - if one construct with no blocks, can ignore it
        if (projects.length === 2) {
          return getProjects(projects)
            .then(rolls => rolls.filter(roll => !isEGFProject(roll)))
            .then(rolls => {
              const proj = rolls[0];

              //if they've changed the project, lets migrate them
              if (proj.project.components.length > 1 || proj.blocks[proj.project.components[0]].components.length > 0) {
                console.log('Will migrate', userId);
                Object.assign(usersToMigrate, { [userId]: users[userId] });
              } else {
                console.log('Going to onboard again', userId);
                usersToOnboardAgain.push(user);
              }
            })
            .catch(err => {
              console.log('error getting projects and checking if should migrate');
              console.log(err);
              throw err;
            });
        }

        console.log('Will migrate', userId);
        //if they have more than two projects, then we need to migrate them
        Object.assign(usersToMigrate, { [userId]: users[userId] });
      })
      .catch(err => {
        if (err.message && (err.message == "Incorrect UUID.")) {
          invalidUsers.push(userId);
        } else {
          console.log('error looking up user', userId);
          console.log('error', err);
          throw err;
          //nothing necessary
        }
      });
  })
)
//for each user to migrate...
//delete the EGF project, and make it again.
//get all the project Rollups for users we need to migrate, update them, and save them
  .then(() => {
    console.log('migrating these users with these projects:');
    console.log(usersToMigrate);

    return batchPromises(
      _.map(usersToMigrate, (projectIds, userId) => () => {
        return getProjects(projectIds)
          .then(rolls => rolls.filter(roll => !isEGFProject(roll)))
          .then(updatedRolls => {
            return Promise.all(
              _.map(updatedRolls, roll => {
                return projectPersistence.projectWrite(roll.project.id, roll, userId)
                  .catch(err => {
                    console.log(`error writing project ${roll.project.id} for user ${userId}`);
                    console.log(err, err.stack);
                    //console.log(roll);
                    throw err; //could let this pass if some user is causing problems and dont know why
                  });
              })
            );
          })
          .catch(err => {
            console.log(`uncaught error migrating user ${userId} - projects: ${projectIds.join(', ')} ..... continuing...`);
            console.log(err, err.stack);
          });
      })
    )
      .catch(err => {
        console.log('error migrating all users...');
        console.log(err, err.stack);
        throw err;
      });
  })
  // after migrating all existing projects, re-add the EGF project for all users we have migrated
  // easier than migrating, and they should have never changed it
  .then(() => {
    console.log('creating egf projects for migrated users...');
    console.log(Object.keys(usersToMigrate).length, Object.keys(usersToMigrate));

    return batchPromises(
      _.map(usersToMigrate, (projects, userId) => () => {
        const egfRoll = makeEgfRollup();
        return projectPersistence.projectWrite(egfRoll.project.id, egfRoll, userId)
          .catch(err => {
            console.log(`error writing EGF project for user ${userId}`);
            console.log(err, err.stack);
            throw err;
          });
      })
    );
  })
  .then(() => {
    console.log('found', Object.keys(users).length, 'users.');
    console.log('found', testUsers.length, 'test users.');
    console.log('found', invalidUsers.length, 'invalid users.');
    console.log('migrated', Object.keys(usersToMigrate).length, 'valid users.');
  })
  .catch(err => {
    console.log('uncaught error migrating users');
    console.log(err, err.stack);
    throw err;
  })
  //now, onboard users to be onboarded again
  .then(() => {
    console.log('onboarding existing users who hadnt made changes');
    console.log(usersToMigrate);

    if (!usersToOnboardAgain.length) {
      console.log('no empty users to onboard');
      return;
    }

    return batchPromises(
      _.map(usersToOnboardAgain, user => () => onboardNewUser(user))
    );
  })
  .then(() => {
    console.log('onboarded existing users without changes again');
  })
  .catch(err => {
    console.log('uncaught error onboarding existing users');
    console.log(err, err.stack);
    throw err;
  });

//? clear orders (i.e. ignore)
//otherwise, need to update project version

/************* HELPERS ***************/

//returns promise
function lookupUser(userId) {
  //hack - test user ID changed, so stub it here
  if (userId === '11111111-1111-1111-9111-111111111111') {
    return Promise.resolve(Object.assign({}, defaultUser, { uuid: '11111111-1111-1111-9111-111111111111' }));
  }

  return fetch(`${AUTH_API}/auth/find`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      uuid: userId,
    }, null, 2),
  })
    .then(resp => resp.json())
    .then(result => {
      if (result.message) {
        console.log('error looking up ' + userId);
        console.log(result);
        return Promise.reject(result);
      }
      return result;
    });
}

//returns promise, slightly invalid rollup with field owner
function getProjectRoll(projectId) {
  const projectManifest = path.resolve(projectPath, projectId, 'data', 'manifest.json');
  const blockManifest = path.resolve(projectPath, projectId, 'data', 'blocks', 'manifest.json');

  return Promise.all([
    fileSystem.fileRead(projectManifest),
    fileSystem.fileRead(blockManifest),
  ])
    .then(([project, blocks]) => {
      return new Rollup({
        project: updateProjectManifest(project),
        blocks: updateBlocks(blocks, projectId),
      });
    });
}

function getProjects(projectIds) {
  if (!Array.isArray(projectIds)) {
    throw Error('must pass project ID array, got ', projectIds);
  }
  return Promise.all(projectIds.map(getProjectRoll));
}

function isEGFProject(roll) {
  return roll.project.isSample || roll.project.metadata.name.toLowerCase().indexOf('egf') >= 0;
}

function updateProjectManifest(project) {
  /* update project model */

  //extend with scaffodl to add fields like `files` and `rules`
  //project.version -> 0
  //project.lastSaved -> project.metadata.updated
  _.merge(project, {
    version: 0,
    metadata: {
      updated: project.lastSaved,
    },
    files: [],
    rules: {},
  });
  _.assign(project, { parents: [] });

  delete project.lastSaved;
  return project;
}

function updateBlocks(blocks, projectId) {
  /* update the blocks */

  //block.color #hex -> index (map properly)
  //clear block.parents
  //update block.source if genbank / csv -> import (assume same file name)
  _.forEach(blocks, block => {
    _.merge(block, {
      projectId,
      metadata: {
        color: mapColor(block.metadata.color),
      },
      sequence: {
        md5: (!!block.sequence.md5 ? block.sequence.md5 : null),
      },
    });

    _.assign(block, { parents: [] });

    //todo - verify this is correct (i.e. this is how we intend to support file downloading)
    //remap genbank / csv imports to just 'import'
    if (block.sequence.source) {
      if (block.sequence.source === 'genbank' || block.sequence.source === 'csv') {
        block.sequence.source = 'import';
      }
    }
  });

  return blocks;
}

//given a block hex value, convert to appropriate color index
function mapColor(color) {
  const found = _.findIndex(paletteAnime, (item) => item.hex === color);
  return Math.max(0, found);
}
