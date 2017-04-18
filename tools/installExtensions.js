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
import colors from 'colors';
import { promisedExec } from './lib/cp';
import pruneNodeModules from '../server/extensions/pruneNodeModules';

async function installExtensions() {
  try {
    const extensionsPath = path.resolve(__dirname, '../server/extensions/node_modules');
    const extensionsNpmPath = path.resolve(extensionsPath, 'node_modules');

    console.log(colors.blue(`clearing extensions in ${extensionsNpmPath} ...`));
    await pruneNodeModules(extensionsNpmPath);

    await promisedExec('npm install --global-style --no-optional',
      { cwd: extensionsPath },
      { comment: 'Running npm install() for extensions' }
    );
  } catch (err) {
    throw err;
  }
}

export default installExtensions;
