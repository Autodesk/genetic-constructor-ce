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
import fields from './fields/index';
// import * as validators from './fields/validators';
import Schema from './SchemaClass';

/**
 * An annotation on a sequence.
 * Should either have a sequence or start+end location
 * Later, we may want to make a field that notes how optimizable the sequence is. E.g. none, codon-optimize, or random sequence. It may be represented as a degenerate sequence?
 *
 * @name AnnotationSchema
 * @memberOf module:Schemas
 * @gc Schema
 */

const fieldDefs = {
  tags: [
    fields.object(),
    'Dictionary of tags defining annotation',
  ],
  name: [
    fields.string().required,
    'Name of annotation',
  ],
  description: [
    fields.string(),
    'Description of annotation',
  ],
  color: [
    fields.string(),
    `Color of the Annotation`,
  ],
  role: [
    fields.string(),
    `Role of the Annotation`,
  ],
  sequence: [
    fields.sequence({loose: true}),
    'IUPAC sequence of the annotation',
  ],
  start: [
    fields.number({min: 0}),
    'Location of start of annotation',
  ],
  end: [
    fields.number({min: 0}),
    'Location of end of annotation',
  ],
  isForward: [
    fields.bool(),
    `true if forward (5'-3'), false if reverse`,
  ],
  notes: [
    fields.object().required,
    `Notes about the annotation`,
  ],
};

export class AnnotationSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new AnnotationSchemaClass();
