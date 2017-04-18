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
import fields from './fields/index';
import * as validators from './fields/validators';
import { InstanceSchemaClass } from './Instance';
import SequenceSchema from './Sequence';
import RulesSchema from './Rules';
import BlockSourceSchema from './BlockSource';

/**
 * A component of a construct, or construct itself.
 * Blocks are hierarchically composable elements which make up large constructs of DNA. Hierarchy is established with the `components` field, whereby a block references its children.
 * Blocks may have a `sequence`, which is a reference to a file and associated annotations, and if so should reference their source (e.g. foundry, NCBI) whence they came.
 * Blocks can define `rules`, to which direct descendent blocks must adhere. For example, bounds to GC content, whether locations are fixed, filters for allowed blocks. The type is the key, the rule is the value (heterogeneous formats). Currently, rules only apply to direct descendents in the design canvas.
 * List Blocks allow for combinatorial logic, where multiple blocks can be associated as combinatorial `options` for this block. A block cannot be both a list block and have components.
 * In addition to sequence annotations, a block may list `notes`, which are essentially annotations that do not specifically reference the sequence.
 * @name BlockSchema
 * @memberOf module:Schemas
 * @gc Schema
 */

const blockFields = {
  id: [
    fields.id({ prefix: 'block' }).required,
    'Block UUID',
  ],

  //todo - scaffold this to null to mark unassociated? and require the field?
  projectId: [
    fields.id({ prefix: 'project' }),
    'Project UUID',
    { avoidScaffold: true },
  ],

  sequence: [
    SequenceSchema,
    `Associated Sequence (link, not the sequence itself), and Annotations etc. associated`,
  ],

  source: [
    BlockSourceSchema,
    `Source (Inventory) ID of the Part`,
  ],

  rules: [
    RulesSchema,
    `Grammar/rules governing the whole Block and direct descendants`,
  ],

  components: [
    fields.arrayOf(validators.id()).required,
    `Array of Blocks of which this Block is comprised`,
  ],

  options: [
    fields.object().required,
    `Map of Blocks that form the List Block, if rules.isList === true, where keys are block IDs possible and key is boolean whether selected. Each block MUST be a spec.`,
  ],

  notes: [
    fields.object().required,
    `Notes about the whole Block`,
  ],
};

export class BlockSchemaClass extends InstanceSchemaClass {
  constructor(fieldDefinitions) {
    super(Object.assign({}, blockFields, fieldDefinitions));
  }

  validate(instance, shouldThrow) {
    try {
      super.validateFields(instance, true);
      invariant(Object.keys(instance.options).filter(opt => instance.options[opt]).length === 0 || instance.components.length === 0, 'Components and Options fields are mutually exclusive');
    } catch (err) {
      if (shouldThrow === true) {
        throw err;
      }
      return false;
    }

    return true;
  }
}

export default new BlockSchemaClass();

/*
 //SBOL has a field called role, particularly in defining modules. We may want to add this later. For now, this annotation can be a role per-component.
 export const enumRoles = [

 //SBOL
 'Promoter',
 'RBS',
 'CDS',
 'Terminator',
 'Gene',
 'Engineered Gene',
 'mRNA',

 //others
 'placeholder',
 ];
 */
