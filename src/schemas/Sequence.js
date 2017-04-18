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
import * as validators from './fields/validators';
import Schema from './SchemaClass';
import AnnotationSchema from './Annotation';

/**
 * Definition of a schema, including metadata about the schema and references to how to retrieve it.
 *
 * A sequence, typically of a part and a large string. Sequences are references because they are not usually loaded in the application, and may be very large, so can be loaded with their own API for defining desired regions.
 * @name SequenceSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const fieldDefs = {
  md5: [
    fields.sequenceMd5(),
    `md5 hash of the sequence, used for lookup. May just be md5, or include byte range in format md5[start:end]`,
    { avoidScaffold: true },
  ],

  url: [
    fields.url(),
    `URL of Sequence, md5 gets priority`,
    { scaffold: false },
  ],

  length: [
    fields.number(),
    `Length of the sequence (calculated on set)`,
  ],

  annotations: [
    fields.arrayOf(AnnotationSchema.validate.bind(AnnotationSchema)),
    `List of Annotations associated with the sequence`,
  ],

  initialBases: [
    fields.sequence({ loose: true }),
    `Initial 5 bases of the block, which can be displayed e.g. if a filler block`,
    { avoidScaffold: true },
  ],

  download: [
    fields.func(),
    `Function which returns the sequence, taking precedence over md5 download. Note this is not persisted, and only exists in the scope of the user's session, so might be used e.g. for a inspecting a detached block not yet in a project`,
    { avoidScaffold: true },
  ],

  trim: [
    fields.arrayOf(validators.number()),
    `Specify number of bases to skip at start and end of the sequence: [start, end]`,
    { avoidScaffold: true },
  ],
};

export class SequenceSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new SequenceSchemaClass();
