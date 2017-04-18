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

/**
 * A user account
 * @name UserSchema
 * @memberOf module:Schemas
 * @gc Schema
*/
const fieldDefs = {
  id: [
    fields.id({prefix: 'user'}).required,
    `ID of the User`,
  ],
  email: [
    fields.email().required,
    `User's Email Address`,
  ],
  firstName: [
    fields.string(),
    `First name of user`,
  ],
  lastName: [
    fields.string(),
    `Last name of user`,
  ],
  description: [
    fields.string(),
    `Short biography of the user`,
  ],
  homepage: [
    fields.url(),
    `URL of personal page`,
  ],
  social: [
    fields.arrayOf(validators.shape({
      provider: validators.string(),
      username: validators.string(),
    })),
    `List of social media accounts`,
  ],
};

export class UserSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new UserSchemaClass();

