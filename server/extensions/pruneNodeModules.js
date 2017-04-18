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

//run this script with node to clear our extensions which are not listed in server/extensions/package.json
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

//pass this CLI flag to only delete extensions not in extensions package.json -- e.g. if you are symlinked or have a hefty install
const onlyDeleteOutersection = process.env.EXTENSIONS_PRUNE === 'true';

export default function pruneNodeModules(inputPath) {
  //expects to be run from root, or explicit path so path doesnt exist if called from elsewhere
  const nodeModulePath = inputPath || path.resolve(__dirname, 'server', 'extensions', 'node_modules');

  if (onlyDeleteOutersection) {
    console.log('pruning extensions not in package.json...');
  } else {
    console.log('(set env var EXTENSIONS_PRUNE=true to prune extensions not in package.json, not delete them all)');
  }

  return new Promise((resolve) => {
    fs.stat(nodeModulePath, function checkDirExists(err, stat) {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log(`Directory ${nodeModulePath} does not exist, creating...`);
          mkdirp.sync(nodeModulePath);
        } else {
          console.error(`error checking for directory ${nodeModulePath}`);
          throw err;
        }
      }

      const pkg = require(path.resolve(__dirname, 'package.json'));
      const deps = pkg.dependencies;
      const dirContents = fs.readdirSync(nodeModulePath);

      return Promise.all(dirContents.map(function checkDir(dir) {
        if (!onlyDeleteOutersection || !deps[dir]) {
          //todo - should check version and see if newer available as well

          return new Promise((resolve, reject) => {
            rimraf(path.resolve(nodeModulePath, dir), function callback(err) {
              if (err) {
                return reject(err);
              }
              console.log('deleted extension ' + dir);
              resolve(dir);
            });
          });
        }

        return Promise.resolve();
      }))
        .then(resolve);
    });
  });
}
