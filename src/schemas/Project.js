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
import ProjectFileSchema from './ProjectFile';
import RulesSchema from './Rules';
import { InstanceSchemaClass } from './Instance';

/**
 * Project is the container for a body of work. It consists primarily of constructs, but also orders, settings, etc.
 * @name ProjectSchema
 * @memberOf module:Schemas
 * @gc Schema
 */

const projectFields = {
  id: [
    fields.id({ prefix: 'project' }).required,
    'Project UUID',
  ],

  version: [
    fields.number(),
    'numeric version of project',
  ],

  components: [
    fields.arrayOf(validators.id()).required,
    `Constructs associated with this project`,
  ],

  settings: [
    fields.object().required,
    `Settings associated with this project`,
  ],

  rules: [
    RulesSchema,
    `Rules governing the whole Project`,
  ],

  files: [
    fields.arrayOf(ProjectFileSchema.validate.bind(ProjectFileSchema)).required,
    `Files associated with the project`,
  ],
};

export class ProjectSchemaClass extends InstanceSchemaClass {
  constructor(fieldDefinitions) {
    super(Object.assign({}, projectFields, fieldDefinitions));
  }
}

export default new ProjectSchemaClass();
