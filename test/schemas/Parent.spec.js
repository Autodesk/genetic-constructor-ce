import { expect } from 'chai';
import BlockSchema from '../../src/schemas/Block';
import ParentDefintion from '../../src/schemas/Parent';
import { makeParent, blockWithParents } from './_examples';

describe('Schema', () => {
  describe('Parent', () => {
    it('should validate the example', () => {
      const parent = makeParent();
      expect(ParentDefintion.validate(parent)).to.equal(true);
    });

    it('should validate example block with parents', () => {
      expect(BlockSchema.validate(blockWithParents)).to.equal(true);
    });
  });
});
