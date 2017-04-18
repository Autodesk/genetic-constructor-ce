import { expect } from 'chai';
import fields from '../../src/schemas/fields/index';
import Schema from '../../src/schemas/SchemaClass';

describe('Schema', () => {
  //Fields themselves, in schemas/fields
  describe('Fields', () => {
    const stringField = fields.string();
    const requiredField = fields.string().required;

    it('should have validators', () => {
      expect(typeof stringField.validate).to.equal('function');
      expect(stringField.validate('23234')).to.equal(true);
    });

    it('should have descriptions', () => {
      //note the type
      expect(stringField.type).to.equal('string');
      //have a type description
      expect(typeof stringField.typeDescription).to.equal('string');
    });

    it('should have say if required', () => {
      expect(stringField.fieldRequired).to.equal(false);
      expect(requiredField.fieldRequired).to.equal(true);
    });
  });

  //fields which are part of schemas can do a bit more
  describe('Schema Fields', () => {
    const simpleFieldDescription = `String named field`;
    const additionalFields = {additionalField: 'blah'};
    const simpleDefinition = new Schema({
      custom: [
        fields.string(),
        simpleFieldDescription,
        additionalFields,
      ],
    });
    const customField = simpleDefinition.fields.custom;

    it('should support arbitrary field information', () => {
      expect(customField.additionalField).to.equal(additionalFields.additionalField);
    });

    it('have a field description and name, not just type and type description', () => {
      expect(customField.description).to.equal(simpleFieldDescription);
      expect(customField.name).to.equal('custom');
    });
  });
});
