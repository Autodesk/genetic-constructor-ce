import chai from 'chai';
import uuid from 'node-uuid';
import { assertValidId } from '../../../server/utils/validation';

const { assert } = chai;

describe('Server', () => {
  describe('ID validation', () => {
    it('assertValidId accepts a callback, arguments mean errors', () => {
      assertValidId(235, err => assert(!!err));

      const id = uuid.v4();
      assertValidId(id, err => assert(!err));
    });

    it('allows prefixed IDs with a hyphen', () => {
      const id = 'prefix-' + uuid.v4();
      assertValidId(id, isValid => assert(isValid));
    });
  });
});
