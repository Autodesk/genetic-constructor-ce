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
import loadScript from 'load-script';

//map extension key -> true downloaded already
const cached = {};

/**
 * given an extension key and file, actually load the script.
 * @name downloadExtension
 * @memberOf extensions
 * @param {string} key
 * @param {string} file
 * @returns {Promise}
 * @resolve {boolean} (false) - was cached, (true) - was downloaded
 * @reject {Response} (err) - error downloading
 */
export const downloadExtension = (key, file) => {
  return new Promise((resolve, reject) => {
    if (!key || !file) {
      return reject('key and file name both required')
    }

    let extCache = cached[key];

    if (typeof extCache === 'object') {
      if (typeof extCache[file] === 'object' && typeof extCache[file].then === 'function') {
        return resolve(extCache[file]);
      }
      //if we've downloaded this file, skip it
      if (extCache[file] === true) {
        return resolve(false);
      }
      //avoid trying to download again extensions which already errored
      if (extCache[file] === false) {
        console.warn(`there was an error loading ${key}, so not trying again`);
        return reject('already errored');
      }
    } else {
      Object.assign(cached, { [key]: {} });
      extCache = cached[key];
    }

    const url = `/extensions/load/${key}/${file}`;

    //we can try to catch some errors, but adding script dynamically to head of page doesn't allow us to catch this way
    //todo - patch window.onerror and catch
    try {
      //set cache to promise in case request multiple at same time.
      //download the script, resolve this promise, and resolve download promise in case other listeners waiting
      extCache[file] = new Promise((resolveDownload, rejectDownload) => {
        loadScript(url, (err, script) => {
          if (err) {
            extCache[file] = false;
            rejectDownload(err);
            return reject(err);
          }
          extCache[file] = true;
          resolveDownload(true);
          return resolve(true);
        });
      });
    } catch (err) {
      extCache[file] = false;
      reject(err);
    }
  });
};

export const isDownloaded = (key, file) => {
  return !!cached[key] && cached[key][file] === true;
};

export default downloadExtension;
