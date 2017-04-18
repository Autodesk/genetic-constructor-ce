import { expect } from 'chai';
import BlockSchema from '../../src/schemas/Block';
import uuid from 'node-uuid';
import { Block as exampleBlock } from './_examples';

describe('Schema', () => {
  describe('Block', () => {
    it('should validate the example', () => {
      expect(BlockSchema.validate(exampleBlock)).to.equal(true);
    });

    it('should create a valid scaffold', () => {
      const scaffold = BlockSchema.scaffold();
      //console.log(scaffold);
      expect(scaffold).to.be.an.object;
      expect(BlockSchema.validate(scaffold)).to.equal(true);
    });

    it('should prefix ID with block', () => {
      const scaffold = BlockSchema.scaffold();
      const regex = /^block/;
      //console.log(scaffold);
      expect(regex.test(scaffold.id)).to.equal(true);
    });

    it('components and options are mutually exclusive', () => {
      const scaffold = BlockSchema.scaffold();

      scaffold.components.push(uuid.v4());
      scaffold.components.push(uuid.v4());
      scaffold.options[uuid.v4()] = true;
      scaffold.options[uuid.v4()] = true;

      expect(BlockSchema.validate(scaffold)).to.equal(false);
    });
  });
});
