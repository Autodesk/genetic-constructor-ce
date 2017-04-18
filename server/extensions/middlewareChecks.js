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
import { errorNoPermission, errorExtensionNotFound } from '../utils/errors';
import { getConfigFromUser } from '../user/utils';
import extensionRegistry from './registry';
import { manifestIsServer, manifestIsClient, manifestClientFiles } from './manifestUtils';

export const manifestIsPrivate = (manifest) => {
  return manifest.geneticConstructor.private === true || typeof manifest.geneticConstructor.access === 'object';
};

//future - clearer checking / clearer defaults, checking beyond just email
export const checkUserExtensionAccess = (extensionManifest, user) => {
  //if not private, anyone can access
  if (!manifestIsPrivate(extensionManifest)) {
    return true;
  }

  //if it's private, check if user is valid
  const accessConfig = extensionManifest.geneticConstructor.access;

  //console.log('\n\nAccess Check - ' + extensionManifest.name, extensionManifest.geneticConstructor.access);

  if (accessConfig) {
    //console.log('[User Extension Access] got access config', accessConfig.email, user.email, user.email.indexOf(accessConfig.email) >= 0);
    if (accessConfig.email && user.email.indexOf(accessConfig.email) >= 0) {
      return true;
    }
  }
  return false;
};

//check visibility / not disabled -- by default, they are on
export const checkUserExtensionActive = (extensionManifest, user) => {
  //make sure they have access
  if (!checkUserExtensionAccess(extensionManifest, user)) {
    return false;
  }

  // curently, must be in your manifest, and not set to inactive
  // exception: when developing, if resolves to a file, we will show unless explicitly marked inactive
  const extensionKey = extensionManifest.name;
  const extensionIsLocal = (process.env.NODE_ENV !== 'production') && (extensionManifest._resolved && extensionManifest._resolved.substring(0, 4) === 'file');
  const config = getConfigFromUser(user);
  const extPrefs = config.extensions[extensionKey];

  return extPrefs && (extPrefs.active !== false || extensionIsLocal);
};

//check if the extension has been registered, assign req.extension and req.extensionManifest
//expects :extension in the route
export const checkExtensionExistsMiddleware = (req, res, next) => {
  const { extension } = req.params;
  const filePath = req.params[0]; //this might be present

  if (!extension) {
    return res.status(401).send('expected :extension in route params');
  }

  const extensionManifest = extensionRegistry[extension];

  if (!extensionManifest) {
    console.log(`could not find extension ${extension} in registry (${Object.keys(extensionRegistry).join(', ')})`);
    return res.status(404).send(errorExtensionNotFound);
  }

  Object.assign(req, {
    filePath,
    extension,
    extensionManifest,
  });

  //let the route continue
  next();
};

//expects req.extensionKey and req.user to be set, and user to have a config (or valid default)
//run checkExtensionExistsMiddleware first, which sets extensionKey
export const checkUserExtensionAccessMiddleware = (req, res, next) => {
  const { user, extension, extensionManifest } = req;
  const config = getConfigFromUser(user);

  //should only call these routes when authenticated
  invariant(user, '[auth extensions permissions] no user on req');

  //only should call this middleware when extensionKey exists
  invariant(extension, '[auth extensions permissions] no extension key on req');
  invariant(extensionManifest, '[auth extensions permissions] no extensionManifest on req');

  //config should always exist, at least returning a default
  invariant(config, '[auth extensions permissions] no user config found for user ' + user.uuid);

  if (checkUserExtensionAccess(extensionManifest, config)) {
    return next();
  }
  return res.status(403).send(errorNoPermission);
};

export const checkExtensionIsClientMiddleware = (req, res, next) => {
  const { extension, extensionManifest } = req;

  if (!manifestIsClient(extensionManifest)) {
    return res.status(404).send('non-client extension: ' + extension);
  }

  next();
};

export const checkClientExtensionFilePath = (req, res, next) => {
  //make the whole extension available when not in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const { filePath, extensionManifest } = req;

  if (!filePath) {
    return res.status(404).send('expected specific :filePath in route params');
  }

  const clientFiles = manifestClientFiles(extensionManifest);

  if (clientFiles.indexOf(filePath) < 0) {
    res.status(404).send('file requested not listed in extension client files');
  }

  next();
};

export const checkExtensionIsServerMiddleware = (req, res, next) => {
  const { extension, extensionManifest } = req;
  if (!manifestIsServer(extensionManifest)) {
    return res.status(404).send('non-server extension: ' + extension);
  }
  next();
};
