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
import registry, { registerRender, validRegion } from './clientRegistry';
import invariant from 'invariant';

/**
 * Register a client-side extension with Genetic Constructor.
 * `register()` is actually called by extension's script.
 * This function registers a `render` function with the manifest of the extension, allowing the extension to render on the page.
 * @name register
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {string} key Name of the extension, must match package.json of the extension
 * @param {string} region Region for render function. Region must be listed in package.json
 * @param {function} render Function called when the extension is requested to render. Called with signature `render(container, options)`
 */
const register = (key, region, render) => {
  const manifest = registry[key];

  //we've already checked the manifest is valid when registering the manifest, so if its present, its valid.
  invariant(!!manifest, `Cannot register an extension which does not have a registered manifest, tried to register ${key}`);

  //make sure a region is passed and its valid. This is separate than what is in the manifest, but making sure the file's render() is legit
  invariant(validRegion(region), 'must pass a valid region when render');

  //check the render function is a function
  invariant(typeof render === 'function', 'Must provide a render function to register a plugin. Plugins can interact with the exposed API at window.constructor without registering themselves.');

  //wrap the render function in a closure and try-catch, and ensure it is downloaded
  const wrappedRender = function wrappedRender() {
    try {
      Object.assign(registry[key], { _activated: +Date.now() });
      return render.apply(null, arguments);
    } catch (err) {
      console.error(`there was an error rendering the extension ${key} in ${region}`);
      console.error(err);
      throw err;
    }
  };

  registerRender(key, region, wrappedRender);
};

export default register;
