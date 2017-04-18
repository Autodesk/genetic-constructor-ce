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
import invariant from 'invariant';
import { errorDoesNotExist } from '../utils/errors';
import registry from './registry';

//everything is statically avaialbe in the beginning, but other code expects this to be a promise, and may have dynamic extensions in the future
const loadExtension = (name) => {
  return new Promise((resolve, reject) => {
    const manifest = registry[name];
    if (!!manifest) {
      resolve(manifest);
    } else {
      reject(errorDoesNotExist);
    }
  });
};

export const getExtensionInternalPath = (name, fileName) => {
  const extensionPath = path.resolve(__dirname, `./node_modules/${name}`);

  //if no file name is sent, this is likely a malformed request (since multiple files may be present)
  invariant(fileName && typeof fileName === 'string', 'must pass a specific file name');

  return path.resolve(extensionPath, fileName);
};

export default loadExtension;
