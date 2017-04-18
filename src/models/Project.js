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
import { assign, merge, isEqual } from 'lodash';
import invariant from 'invariant';
import Instance from './Instance';
import ProjectSchema from '../schemas/Project';
import safeValidate from '../schemas/fields/safeValidate';
import { id } from '../schemas/fields/validators';
import { projectFileWrite, projectFileRead } from '../middleware/projectFiles';

const idValidator = (input, required = false) => safeValidate(id(), required, input);

/**
 * Projects are the containers for a body of work, including all their blocks, preferences, orders, and files.
 * Projects are versioned using git, and save their most recent SHA in project.version
 * @name Project
 * @class
 * @extends Instance
 * @gc Model
 */
export default class Project extends Instance {
  /**
   * Create a project given some input object
   * @memberOf Project
   * @param {Object} [input]
   * @param {Boolean} [frozen=true]
   * @returns {Project}
   */
  constructor(input, frozen = true) {
    super(input, ProjectSchema.scaffold(), frozen);
  }

  /**
   * Create an unfrozen project, extending input with schema
   * @method classless
   * @memberOf Project
   * @param {Object} [input]
   * @returns {Object} an unfrozen JSON, no instance methods
   */
  static classless(input) {
    return assign({}, new Project(input, false));
  }

  /**
   * Validate a Project data object
   * @method validate
   * @memberOf Project
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Project.validate(new Block()); //false
   * Project.validate(new Project()); //true
   */
  static validate(input, throwOnError) {
    return ProjectSchema.validate(input, throwOnError);
  }

  /**
   * compares two projects, checking if they are the same (ignoring project version + save time)
   * use newer one as second arg (in case first one doesnt have updated / version stamp)
   * @method compare
   * @memberOf Project
   * @static
   * @param {Object} one
   * @param {Object} two
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when not equal
   * @returns {boolean} whether equal
   */
  static compare(one, two, throwOnError = false) {
    if ((typeof one === 'object') && (typeof two === 'object') && (one === two)) {
      return true;
    }

    try {
      invariant(one && two, 'must pass two projects');
      invariant(one.id === two.id, 'projects IDs do not match');
      invariant(isEqual(one.components, two.components), 'project components do not match');

      //expensive check across whole project
      //want to ignore the version and updated, since may be set between saves, without changing the data
      //lodash doesnt give a nice way to omit certain properties when cloning...
      //also, need to onvert to POJO in case one is a model and one an object
      const cloned = (inst) => {
        //merge onto {} to remove prototype
        const clone = merge({}, inst);
        delete clone.version;
        delete clone.metadata.updated;
        return clone;
      };

      invariant(isEqual(cloned(one), cloned(two)), 'projects contain different data');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  /**
   * Set name of the project
   * @method setName
   * @memberOf Project
   * @param {string} name
   * @throws if not a string
   * @returns {Project}
   */
  setName(name) {
    invariant(typeof name === 'string', 'must pass name string');
    return this.mutate('metadata.name', name);
  }

  /**
   * Get name of Project
   * @method getName
   * @memberOf Project
   * @returns {string}
   */
  getName() {
    return this.metadata.name || 'Untitled Project';
  }

  //ideally, this would just return the same instance, would be much easier
  /**
   * Update the version of the project. Returns a new Instance, so use {@link Project.compare} to check if two projects are the same and ignore the version
   * @method updateVersion
   * @memberOf Project
   * @param {string} version Must be a valid SHA
   * @param {number} [updated=Date.now()] POSIX time
   * @returns {Project}
   */
  updateVersion(version, updated = Date.now()) {
    invariant(Number.isInteger(version), 'must pass valid version to update version');
    invariant(Number.isInteger(updated), 'must pass valid time to update version');
    return this.merge({ version, metadata: { updated } });
  }

  /**
   * Add constructs to the Project
   * @method addComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  addComponents(...components) {
    invariant(components.length && components.every(comp => idValidator(comp)), 'must pass component IDs');
    return this.mutate('components', components.concat(this.components));
  }

  /**
   * Remove constructs from the project
   * @method removeComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  removeComponents(...components) {
    return this.mutate('components', [...new Set(this.components.filter(comp => components.indexOf(comp) < 0))]);
  }

  /**
   * Add / update a Project File
   * @param {String} namespace
   * @param {String} name Name of file
   * @param {String} contents
   * @return {Promise}
   * @resolve {Project} Updated project
   * @reject {Error}
   */
  fileWrite(namespace, name, contents) {
    return projectFileWrite(this.id, namespace, name, contents)
      .then(result => {
        const version = result.VersionId;
        const fileIndex = this.files.findIndex(fileObj => fileObj.namespace === namespace && fileObj.name === name);

        const fileInfo = {
          name,
          namespace,
          version,
        };

        //update version
        if (fileIndex >= 0) {
          return this.mutate(`files[${fileIndex}]`, fileInfo);
        }
        return this.mutate('files', [...this.files, fileInfo]);
      });
  }

  /**
   * Retrieve a project file
   * @param {String} namespace
   * @param {String} name Name of file
   * @param {String} [format='text'] Options are 'text', 'buffer', 'json'... default is text, but all other values will simply return fetch response without any parsing
   * @param {String} [version] [not yet supported]
   * @returns {Promise}
   * @resolve {string} File contents, as string
   * @reject error
   */
  fileRead(namespace, name, format = 'text', version) {
    return projectFileRead(this.id, namespace, name)
      .then(resp => {
        if (format === 'text') {
          return resp.text();
        } else if (format === 'json') {
          return resp.json();
        }
        return resp;
      });
  }
}
