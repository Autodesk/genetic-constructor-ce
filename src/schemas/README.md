Genetic Constructor uses its own format of Schema for ensuring data validatity and consistency. Schemas back scaffolding and validation of [Models](../models/README.md).

Schemas are objects which take a field, description, and options.

Schemas are described in [main documentation](http://geneticconstructor.com/help/docs/module-Schemas.html)

Fields are These are currently best documented in the code in the folder `/fields/`.

### Example

Create a schema class and export a instance of it

```javascript
import fields from './fields/index';
import Schema from './SchemaClass';

const fieldDefinitions = {
  name: [
    fields.string().required,
    'Name of annotation',
  ],
  description: [
    fields.string(),
    'Description of annotation',
    { scaffold: false }
  ],
}

export class MySchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new MySchemaClass();
```