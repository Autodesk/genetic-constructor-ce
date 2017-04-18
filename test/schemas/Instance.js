import { expect, assert } from 'chai';
import fields from '../../src/schemas/fields/index';
import InstanceSchema, { InstanceSchemaClass } from '../../src/schemas/Instance';

describe('Schema', () => {
  describe('Instance', () => {
    describe('Extended', () => {
      it('should be able to be extended as a class', () => {
        const newFields = {
          blah: [
            fields.string().required,
            'random string',
          ],
        };

        class ExtendedSchema extends InstanceSchemaClass {
          constructor() {
            super(newFields);
          }

          validate(instance) {
            assert(instance.anotherField === 'value', 'should have field anotherField');
            super.validate(instance, true);
          }
        }

        const ExtendedDefinition = new ExtendedSchema();

        const fieldsValid = Object.assign(InstanceSchema.scaffold(), {
          blah: 'value',
        });
        const AllValid = Object.assign({}, fieldsValid, {
          anotherField: 'value',
        });

        assert(typeof ExtendedDefinition.validate === 'function', 'should have validate function');
        assert(typeof ExtendedDefinition.validateFields === 'function', 'should have validateFields function');

        expect(ExtendedDefinition.validate.bind(ExtendedDefinition, AllValid)).to.not.throw();
        expect(ExtendedDefinition.validateFields.bind(ExtendedDefinition, fieldsValid)).to.not.throw();
        expect(ExtendedDefinition.validate.bind(ExtendedDefinition, fieldsValid)).to.throw();
      });
    });

  });
});
