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
import Instance from './Instance';
import invariant from 'invariant';
import { assign, merge, cloneDeep } from 'lodash';
import BlockSchema from '../schemas/Block';
import { getSequence, writeSequence } from '../middleware/sequence';
import AnnotationSchema from '../schemas/Annotation';
import { isHex, palettes, getPalette, nextColor, colorFiller } from '../utils/color/index';
import { dnaStrictRegexp, dnaLooseRegexp } from '../utils/dna';
import * as validators from '../schemas/fields/validators';
import safeValidate from '../schemas/fields/safeValidate';
import { symbolMap } from '../inventory/roles';

const idValidator = (id) => safeValidate(validators.id(), true, id);

const fieldsClearToplevel = {
  metadata: {
    palette: null,
  },
};

const fieldsClearLeaf = {
  rules: {
    role: null,
  },
};

/**
 * Blocks are the foundational data type for representing DNA constructs in Genetic Constructor. Blocks can be thought of as parts, except they may not specify a sequence, and accommodate many more types of data than just base pairs and annotations.
 *
 * Notes
 *
 * - when blocks are frozen, they are just copied between projects. When a block becomes unfrozen, it needs to be cloned. This is in part because blocks that are frozen are shared between projects, and when two projects share a block with the same ID, it is assumed (and should be guaranteed) that they are completely identical.
 *
 * @name Block
 * @class
 * @extends Instance
 *
 * @gc Model
 */
export default class Block extends Instance {
  /**
   * Create a block given some input object
   * @constructor
   * @param {Object} [input]
   * @param {Boolean} [frozen=true] Whether the model is frozen (false => POJO)
   * @returns {Block}
   */
  constructor(input, frozen = true) {
    const scaff = BlockSchema.scaffold();
    scaff.metadata.color = nextColor();
    super(input, scaff, frozen);
  }

  /************
   constructors etc.
   ************/

  /**
   * Create an unfrozen block, extending input with schema
   * If you just want an unfrozen block with instance methods, call new Block(input, false)
   * @method classless
   * @memberOf Block
   * @static
   * @param {Object} [input]
   * @returns {Object} an unfrozen JSON, no instance methods
   */
  static classless(input) {
    return assign({}, new Block(input, false));
  }

  /**
   * Validate a Block data object
   * @method validate
   * @memberOf Block
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Block.validate({lorem: 'ipsum'}); //false
   * Block.validate(new Block()); //true
   */
  static validate(input, throwOnError = false) {
    return BlockSchema.validate(input, throwOnError);
  }

  /**
   * Clone a block, adding parent to the ancestry.
   * Calls {@link Instance.clone} internally, but structure of block history is different than that of the Instance class.
   * Cloning a block will disable the frozen rule.
   * note that if you are cloning multiple blocks / blocks with components, you likely need to clone the components as well. You will need to re-map the IDs outside of this function. See {@link blockClone} action for an example.
   * @method clone
   * @memberOf Block
   * @param {object|null} parentInfo Parent info for denoting ancestry. If pass null to parentInfo, the Block is cloned without adding anything to the history, and it is unfrozen (and keeps the same ID).
   * @param overwrites
   * @returns {Block} Cloned block
   */
  clone(parentInfo = {}, overwrites = {}) {
    const [ firstParent ] = this.parents;

    const mergeWith = merge({ projectId: null }, overwrites);

    //unfreeze a clone by default if it is frozen, but allow overwriting if really want to
    //don't want to add the field if unnecessary
    if (this.rules.frozen === true && (!mergeWith.rules || mergeWith.rules.frozen !== true)) {
      merge(mergeWith, { rules: { frozen: false } });
    }

    if (parentInfo === null) {
      return super.clone(parentInfo, mergeWith);
    }

    const parentObject = Object.assign({
      id: this.id,
      projectId: this.projectId,
      version: (firstParent && firstParent.projectId === this.projectId) ? firstParent.version : null,
    }, parentInfo);

    return super.clone(parentObject, mergeWith);
  }

  /**
   * Mutate a property of a Block to a new value. calls {@link Instance.mutate}.
   * @method mutate
   * @memberOf Block
   * @param {string} path Path of property to change
   * @param {*} value New value
   * @throws if the block is frozen
   * @returns {Block} The mutated block
   * @example
   * const initial = new Block({myArray: [0,0]});
   * const next = initial.mutate('myArray[1]', 10);
   * initial.myArray[1]; //0
   * next.myArray[1]; //10
   */
  mutate(path, value) {
    invariant(!this.isFrozen(), 'cannot mutate a frozen block');
    return super.mutate(path, value);
  }

  /**
   * Return a new Block with input object merged into it. Calls {@link Instance.merge}
   * @method merge
   * @memberOf Block
   * @param {Object} obj Object to merge into instance
   * @throws if the block is frozen
   * @returns {Block} A new Block, with `obj` merged in
   * @example
   * const initial = new Block({myArray: [0,0]});
   * const next = initial.merge({some: 'value', myArray: false});
   * initial.myArray; //[0,1]
   * next.myArray; //false
   * initial.some; //undefined
   * next.some; //'value'
   */
  merge(obj) {
    invariant(!this.isFrozen(), 'cannot mutate a frozen block');
    return super.merge(obj);
  }

  /************
   type checks
   ************/

  /**
   * Check whether Block has components or list options
   * @method hasContents
   * @memberOf Block
   * @returns {boolean}
   */
  hasContents() {
    return this.components.length || Object.keys(this.options).length;
  }

  //isSpec() can't exist here, since dependent on children. use selector blockIsSpec instead.

  /**
   * Check if Block is a construct (it has components)
   * @method isConstruct
   * @memberOf Block
   * @returns {boolean}
   */
  isConstruct() {
    return this.components.length > 0;
  }

  /**
   * Check whether Block is fixed
   * @method isFixed
   * @memberOf Block
   * @returns {boolean}
   */
  isFixed() {
    return this.rules.fixed === true;
  }

  /**
   * Check whether Block is a template
   * @method isTemplate
   * @memberOf Block
   * @returns {boolean}
   */
  isTemplate() {
    return this.isFixed();
  }

  /**
   * Check whether Block is a filler block
   * @method isFiller
   * @memberOf Block
   * @returns {boolean}
   */
  isFiller() {
    return !this.metadata.name && this.hasSequence() && !this.metadata.color;
  }

  /**
   * Check whether Block is a list Block
   * @method isList
   * @memberOf Block
   * @returns {boolean}
   */
  isList() {
    return this.rules.list === true;
  }

  /**
   * Check whether Block is hidden
   * @method isHidden
   * @memberOf Block
   * @returns {boolean}
   */
  isHidden() {
    return this.rules.hidden === true;
  }

  /**
   * Check whether Block is frozen
   * @method isFrozen
   * @memberOf Block
   * @returns {boolean}
   */
  isFrozen() {
    return this.rules.frozen === true;
  }

  /**
   * Check whether a template is being authored
   * @method isAuthoring
   * @memberOf Block
   * @returns {boolean}
   */
  isAuthoring() {
    return this.rules.authoring === true;
  }

  /************
   rules
   ************/

  /**
   * Set a rule on a Block
   * @method setRule
   * @memberOf Block
   * @param rule
   * @param value
   * @returns {Block}
   */
  setRule(rule, value) {
    return this.mutate(`rules.${rule}`, value);
  }

  /**
   * Get the Block's role. Roles are defined in {@link module:roles}
   * @method getRole
   * @memberOf Block
   * @param {boolean} [userFriendly=true] Format string to human readable version
   * @returns {string} Block rule
   */
  getRole(userFriendly = true) {
    const role = this.rules.role || this.metadata.role;
    const friendly = symbolMap[role];

    return (userFriendly === true && friendly) ?
      friendly :
      role;
  }

  /**
   * Freeze a Block. Returns the instance if attempt to freeze a frozen Block.
   * @method setFrozen
   * @memberOf Block
   * @param {boolean} [isFrozen=true] Frozen state
   * @throws if `!isFrozen` and block is frozen (must clone block to unfreeze it)
   * @returns {Block}
   */
  setFrozen(isFrozen = true) {
    if (this.rules.frozen === true) {
      invariant(!!isFrozen, 'attempting to unfreeze a frozen block. You must clone it!');
      return this;
    }
    return this.setRule('frozen', isFrozen);
  }

  /**
   * Set the role of the Block
   * @method setRole
   * @memberOf Block
   * @param {string} role Role, should be from {@link module:roles}
   * @returns {Block}
   */
  setRole(role) {
    return this.setRule('role', role);
  }

  //todo - should this delete the options entirely?
  /**
   * Specify whether Block is a list block. Clears components when setting to true, and clears options when setting to false.
   * @method setListBlock
   * @memberOf Block
   * @param {boolean} isList
   * @returns {Block}
   */
  setListBlock(isList = true) {
    if (!!isList) {
      //clear components
      const cleared = this.mutate('components', []);
      return cleared.setRule('list', true);
    }

    const cleared = this.mutate('options', {});
    return cleared.setRule('list', false);
  }

  /**
   * Set a construct as a template
   * @method setTemplate
   * @memberOf Block
   * @param {boolean} [isTemplate=true]
   */
  setTemplate(isTemplate = true) {
    return this.setRule('fixed', Boolean(isTemplate));
  }

  /**
   * Enable Authoring for a template.
   * @method setProjectId
   * @memberOf Block
   * @param {boolean} [isAuthoring=true]
   * @returns {Block}
   */
  setAuthoring(isAuthoring = true) {
    invariant(this.isTemplate(), 'can only author a template');
    return this.setRule('authoring', Boolean(isAuthoring));
  }

  /**
   * Mark a block as hidden
   * @method setHidden
   * @memberOf Block
   * @param {boolean} [isHidden=true]
   * @returns {Block}
   */
  setHidden(isHidden = true) {
    invariant(!this.isTemplate(), 'cannnot hide a template');
    return this.setRule('hidden', Boolean(isHidden));
  }

  /************
   metadata
   ************/

  //todo - avoid setting project ID once already associated? force clone? or allow moving block from one project to another?
  /**
   * Set Project ID for block.
   * @method setProjectId
   * @memberOf Block
   * @param {UUID|null} projectId
   * @returns {Block}
   */
  setProjectId(projectId) {
    invariant(idValidator(projectId) || projectId === null, 'project Id is required, or null to mark unassociated');
    invariant(!this.projectId || (this.projectId && projectId === null), 'if project ID is set, must unset first');

    if (this.projectId === projectId) {
      return this;
    }

    //hack to accommodate adding frozen block to construct / list
    //need to determine how to handle adding frozen blocks
    if (this.isFrozen()) {
      return this.clone(undefined, {
        projectId,
        rules: { frozen: false },
      });
    }
    return this.mutate('projectId', projectId);
  }

  /**
   * Get Block's name
   * @method getName
   * @memberOf Block
   * @param {string} [defaultName] Prefer this string to the default e.g. `New Block`
   * @param {boolean} [defaultToBases] If no name, use initial bases as default
   * @returns {string}
   */
  getName(defaultName, defaultToBases) {
    // called many K per second, no es6 fluffy stuff in here.
    if (this.metadata.name) return this.metadata.name;
    if (this.rules.role) return this.getRole();
    if ((!!defaultToBases || this.isFiller()) && this.metadata.initialBases) return this.metadata.initialBases.substring(0, 3) + '...';
    return defaultName || 'New ' + this.getType();
  }

  /**
   * Set Block's name
   * @method setName
   * @memberOf Block
   * @param {string} newName
   * @throws if not a string
   * @returns {Block}
   */
  setName(newName) {
    invariant(typeof newName === 'string', 'must pass name string');
    const renamed = this.mutate('metadata.name', newName);

    if (this.isFiller()) {
      return renamed.setColor();
    }
    return renamed;
  }

  /**
   * Get the type of Block
   * @method getType
   * @memberOf Block
   * @param {string} [defaultType='Block']
   * @returns {string}
   */
  getType(defaultType = 'Block') {
    if (this.isTemplate()) return 'Template';
    //if (this.isConstruct()) return 'Construct';
    if (this.isList()) return 'List Block';
    if (this.isFiller()) return 'Filler';
    return defaultType;
  }

  /**
   * Set Block's description
   * @method setDescription
   * @memberOf Block
   * @param {string} desc New Description
   * @returns {Block}
   */
  setDescription(desc) {
    return this.mutate('metadata.description', desc);
  }

  /**
   * Set a construct's color palette.
   * Should only apply to top-level constructs
   * @method setPalette
   * @memberOf Block
   * @param {string} [palette] Palette name
   * @returns {Block}
   * @example
   * new Block().setPalette('bright');
   */
  setPalette(palette) {
    invariant(palettes.indexOf(palette) >= 0, 'palette must exist');
    return this.mutate('metadata.palette', palette);
  }

  /**
   * Set Block's color
   * @method setColor
   * @memberOf Block
   * @param {string} [newColor] Hex string to use as color. Include leading `#`. Defaults to random color.
   * @returns {Block}
   * @example
   * new Block().setColor('#99aaaa');
   */
  setColor(newColor = nextColor()) {
    invariant(Number.isInteger(newColor), 'color must be an index');
    return this.mutate('metadata.color', newColor);
  }

  /**
   * Get Block's color
   * @method getColor
   * @memberOf Block
   * @returns {string} Hex Color value
   */
  getColor(paletteName, byRole = false) {
    if (this.isFiller()) {
      return colorFiller;
    }

    //backwards compatible / if someone sets hex for some reason  (e.g. a weird import / strong preference)
    //note that this will not change with the palette
    //todo - should we try to convert it?
    if (isHex(this.metadata.color)) {
      console.warn('todo - migrate and avoid hex as color'); //eslint-disable-line
      return this.metadata.color;
    }

    //color should always be defined... may happen if defined wrong / is null
    if (!Number.isInteger(this.metadata.color)) {
      return 'lightgray';
    }

    const palette = getPalette(paletteName || this.metadata.palette);

    //todo - handle coloring by role
    if (byRole === true) {
      console.warn('todo - handle color by role'); //eslint-disable-line
      const role = this.getRole(false);
      return role ? palette[0].hex : colorFiller;
    }

    return palette[this.metadata.color].hex;
  }

  /************
   components
   ************/

  //future - account for block.rules.filter

  /**
   * Adds a component by ID
   * @method addComponent
   * @memberOf Block
   * @param {UUID} componentId ID of child block
   * @param {number} [index=this.components.length]
   * @throws if fixed or list block, or if component ID invalid
   * @returns {Block}
   */
  addComponent(componentId, index) {
    invariant(!this.isFixed() || this.isAuthoring(), 'Block is fixed - cannot add/remove/move components');
    invariant(!this.isList(), 'cannot add components to a list block');
    invariant(idValidator(componentId), 'must pass valid component ID');
    const spliceIndex = (Number.isInteger(index) && index >= 0) ? index : this.components.length;
    const newComponents = this.components.slice();
    newComponents.splice(spliceIndex, 0, componentId);

    return this
      .mutate('components', newComponents)
      .clearBlockLevelFields();
  }

  /**
   * Remove a component by ID
   * @method removeComponent
   * @memberOf Block
   * @param componentId
   * @throws If fixed
   * @returns {Block} Returns same instance if componentId not found
   */
  removeComponent(componentId) {
    invariant(!this.isFixed() || this.isAuthoring(), 'Block is fixed - cannot add/remove/move components');
    const spliceIndex = this.components.findIndex(compId => compId === componentId);

    if (spliceIndex < 0) {
      console.warn('component not found'); // eslint-disable-line
      return this;
    }

    const newComponents = this.components.slice();
    newComponents.splice(spliceIndex, 1);
    return this.mutate('components', newComponents);
  }

  /**
   * Move a component to a new index
   * @method moveComponent
   * @memberOf Block
   * @param {UUID} componentId Component ID
   * @param {number} newIndex index for block, after spliced out
   * @throws if fixed or list
   * @returns {Block}
   */
  //
  moveComponent(componentId, newIndex) {
    invariant(!this.isFixed() || this.isAuthoring(), 'Block is fixed - cannot add/remove/move components');
    invariant(!this.isList(), 'cannot add components to a list block');
    const spliceFromIndex = this.components.findIndex(compId => compId === componentId);

    if (spliceFromIndex < 0) {
      console.warn('component not found: ', componentId); // eslint-disable-line
      return this;
    }

    const newComponents = this.components.slice();
    newComponents.splice(spliceFromIndex, 1);
    const spliceIntoIndex = (Number.isInteger(newIndex) && newIndex <= newComponents.length) ?
      newIndex :
      newComponents.length;
    newComponents.splice(spliceIntoIndex, 0, componentId);
    return this.mutate('components', newComponents);
  }

  /************
   list block
   ************/

  //future  - account for block.rules.filter

  /**
   * Toggle whether a list option is active.
   * For Template usage.
   * @method toggleOptions
   * @memberOf Block
   * @param {...UUID} optionIds
   * @throws if not a list block, or any optionId is not already a list option
   * @returns {Block}
   */
  toggleOptions(...optionIds) {
    invariant(this.isList(), 'must be a list block to toggle list options');
    invariant(optionIds.every(optionId => Object.prototype.hasOwnProperty.call(this.options, optionId)), 'Option ID must be present to toggle it');

    const options = cloneDeep(this.options);
    optionIds.forEach(optionId => {
      Object.assign(options, { [optionId]: !this.options[optionId] });
    });

    //disallow removing all the options
    if (Object.keys(options).filter(id => options[id]).length === 0) {
      return this;
    }

    return this.mutate('options', options);
  }

  /**
   * Add list options as possibilities (they will be inactive).
   * For template authoring.
   * @method addOptions
   * @memberOf Block
   *
   * @private
   *
   * @param {...UUID} optionIds Block IDs to set as options
   * @throws if not list block, or any option ID is invalid
   * @returns {Block}
   */
  addOptions(...optionIds) {
    invariant(this.isList(), 'must be a list block to add list options');
    invariant(optionIds.every(option => idValidator(option)), 'must pass component IDs');
    const toAdd = optionIds.reduce((acc, id) => Object.assign(acc, { [id]: true }), {});
    const newOptions = Object.assign(cloneDeep(this.options), toAdd);

    if (Object.keys(newOptions).length === Object.keys(this.options).length) {
      return this;
    }

    return this.mutate('options', newOptions);
  }

  /**
   * Remove list options from possibilities.
   * For template authoring.
   * @method removeOptions
   * @memberOf Block
   *
   * @private
   *
   * @param {...UUID} optionIds Block IDs to set as options
   * @returns {Block}
   */
  removeOptions(...optionIds) {
    const cloned = cloneDeep(this.options);
    optionIds.forEach(id => {
      delete cloned[id];
    });

    if (Object.keys(cloned).length === Object.keys(this.options).length) {
      return this;
    }

    return this.mutate('options', cloned);
  }

  /**
   * Returns array of list options, by default only active ones
   * @method getOptions
   * @memberOf Block
   * @param {boolean} [includeUnselected=false] Include inactive list options
   * @returns {Array.<UUID>}
   */
  getOptions(includeUnselected = false) {
    return Object.keys(this.options).filter(id => this.options[id] || (includeUnselected === true));
  }

  /************
   sequence
   ************/

  /**
   * Check whether block has a sequence saved on the server, or an associated URL
   * @method hasSequence
   * @memberOf Block
   * @returns {boolean}
   */
  hasSequence() {
    return !!this.sequence.md5 || !!this.sequence.url;
  }

  /**
   * Get the blocks sequence length, respecting trim
   * @method getSequenceLength
   * @memberOf Block
   * @param {boolean} [ignoreTrim=false]
   */
  getSequenceLength(ignoreTrim = false) {
    const { length, trim } = this.sequence;
    if (!Array.isArray(trim) || ignoreTrim) {
      return length;
    }
    return length - trim[0] - trim[1];
  }

  /**
   * Retrieve the sequence of the block. Retrieves the sequence from the server, since it is stored in a separate file.
   * @method getSequence
   * @memberOf Block
   * @returns {Promise} Promise which resolves with the sequence value, or (resolves) with null if no sequence is associated.
   */
  getSequence(ignoreTrim = false) {
    const { md5, download, url, trim } = this.sequence;
    let promise;

    if (typeof download === 'function') {
      promise = Promise.resolve(download());
    } else if (md5) {
      promise = getSequence(md5);
    } else if (url) {
      promise = fetch(url).then(resp => resp.text());
    } else {
      promise = Promise.resolve(null);
    }

    return promise.then(seq => {
      if (typeof seq === 'string' && Array.isArray(trim) && ignoreTrim !== true) {
        return seq.substring(trim[0], seq.length - trim[1]);
      }
      return seq;
    });
  }

  /**
   * Set sequence and write to server. Updates the length and initial bases. The block's source will be set to 'user'.
   * @method setSequence
   * @memberOf Block
   * @param {string} sequence New sequence
   * @param {boolean} [useStrict=false] strictness of sequence validation (IUPAC bases)
   * @param {boolean} [persistSource=false] Maintain the source of the block
   * @returns {Promise} Promise which resolves with the udpated block after the sequence is written to the server
   */
  setSequence(sequence, useStrict = false, persistSource = false) {
    const validator = useStrict ? dnaStrictRegexp() : dnaLooseRegexp();

    if (!validator.test(sequence)) {
      return Promise.reject('sequence has invalid characters');
    }

    const updatedSource = persistSource === true ?
      this.source :
    { source: 'user', id: null };

    return writeSequence(sequence)
      .then((md5) => {
        const sequenceLength = sequence.length;

        const updatedSequence = {
          md5,
          length: sequenceLength,
          initialBases: '' + sequence.substr(0, 6),
          download: null,
          trim: null,
        };

        return this.merge({
          sequence: updatedSequence,
          source: updatedSource,
        });
      });
  }

  /**
   * Set trim (number of bases to skip) on the sequence
   * @method setSequenceTrim
   * @memberOf Block
   * @param {number} start
   * @param {number} end
   */
  setSequenceTrim(start = 0, end = 0) {
    invariant(this.hasSequence(), 'must have a sequence to set trim');
    invariant(Number.isInteger(start) && start >= 0, 'must pass 0 or positive integer for start');
    invariant(Number.isInteger(end) && end >= 0, 'must pass 0 or positive integer for end');
    invariant((start <= (this.sequence.length - 1)) && (end <= (this.sequence.length - 1)), 'start and end must be less than length of sequence');

    return this.merge({
      sequence: {
        trim: [start, end],
      },
    });
  }

  //todo - annotations are essentially keyed using name, since we got rid of ID. is that ok?

  /**
   * Add an Annotation
   * @method annotate
   * @memberOf Block
   * @param {Annotation} annotation
   * @returns {Block}
   */
  annotate(annotation) {
    invariant(AnnotationSchema.validate(annotation), `annotation is not valid: ${annotation}`);
    return this.mutate('sequence.annotations', this.sequence.annotations.concat(annotation));
  }

  /**
   * Remove an annotation
   * @method removeAnnotation
   * @memberOf Block
   * @param {Annotation|string} annotation Annotation or annotation's name
   * @returns {Block}
   */
  removeAnnotation(annotation) {
    const annotationName = typeof annotation === 'object' ? annotation.name : annotation;
    invariant(typeof annotationName === 'string', `Must pass object with Name or annotation Name directly, got ${annotation}`);

    const annotations = this.sequence.annotations.slice();
    const toSplice = annotations.findIndex((ann) => ann.name === annotationName);

    if (toSplice < 0) {
      console.warn('annotation not found'); // eslint-disable-line
      return this;
    }

    annotations.splice(toSplice, 1);
    return this.mutate('sequence.annotations', annotations);
  }

  /*********
   Construct Things
   *********/

  clearBlockLevelFields() {
    return this.merge(fieldsClearLeaf);
  }

  //when something becomes a not-top level construct, do some cleanup
  clearToplevelFields() {
    return this.merge(fieldsClearToplevel);
  }
}
