import { assert, expect } from 'chai';
import * as validators from '../../src/schemas/fields/validators';

describe('Schema', () => {
  describe('Validators', () => {
    it('should be a parameterizable function', () => {
      Object.keys(validators).forEach(validatorName => {
        const validator = validators[validatorName];
        expect(typeof validator).to.equal('function');
        expect(typeof validator()).to.equal('function');
      });
    });

    const stringValidator = validators.string();
    const checkNoError = (returnValue) => {
      return returnValue === undefined || returnValue === null;
    };

    it('should return errors when invalid', () => {
      const returnValue = stringValidator(123);
      expect(returnValue).to.be.an.Error;
    });

    it('should return undefined or null when valid', () => {
      const returnValue = stringValidator('123');
      expect(returnValue === undefined || returnValue === null);
    });

    it('objectOf should work as expected', () => {
      const keyError = 'wrong key';
      const valueError = 'wrong val';

      const validationFn = (value, key) => {
        //handle returns
        if (key !== 'test') {
          return new Error(keyError);
        }
        //handle throws
        if (!Number.isInteger(value)) {
          throw new Error(valueError);
        }
      };

      //expects value and key
      const validator = validators.objectOf(validationFn);
      const validatorReq = validators.objectOf(validationFn, { required: true });

      assert(checkNoError(validator({})), 'POJO should pass');
      assert(checkNoError(validator({ test: 123 })), 'should meet conditions');

      assert(validatorReq({}), 'should be required');
      expect(validator({ invalid: 'invalid' })).to.be.an.Error;
      expect(validator({ test: 'invalid' })).to.be.an.Error;
      expect(validator({ invalid: 123 })).to.be.an.Error;
    });
  });
});
