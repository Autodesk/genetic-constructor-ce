import { expect } from 'chai';
import safeValidate from '../../src/schemas/fields/safeValidate';

describe('Schema', () => {
  describe('safeValidate()', () => {
    const stringValidator = (input) => {
      if (typeof input !== 'string') {
        return new Error('not a string!');
      }
    };

    it('should return false when errors', () => {
      expect(safeValidate(stringValidator, true)).to.equal(false);
    });

    it('allows specifying whether required', () => {
      expect(safeValidate(stringValidator, false)).to.equal(true);
      expect(safeValidate(stringValidator, false, 'blah')).to.equal(true);
      expect(safeValidate(stringValidator, true)).to.equal(false);
      expect(safeValidate(stringValidator, true, 'blah')).to.equal(true);
    });
  });
});
