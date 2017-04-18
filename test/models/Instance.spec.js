import Instance from '../../src/models/Instance';
import InstanceSchema from '../../src/schemas/Instance';
import chai from 'chai';
import sha1 from 'sha1';
import { merge } from 'lodash';

const { assert, expect } = chai;

describe('Model', () => {
  describe('Instance', () => {
    describe('Constructor', () => {
      it('should exist, be callable with new', () => {
        const inst = new Instance();

        expect(inst.constructor).to.be.a('function');
      });

      it('should include scaffold for default input', () => {
        const inst = new Instance();
        const scaffold = InstanceSchema.scaffold();
        const massaged = merge({}, scaffold, {
          id: inst.id,
          metadata: {
            created: inst.metadata.created,
          },
        });
        expect(inst).to.eql(massaged);
        assert(typeof inst.metadata === 'object', 'should have metadata field');
      });

      it('should accept existing input', () => {
        const existing = {
          metadata: {
            name: 'blah',
          },
        };
        const inst = new Instance(existing);

        expect(inst.metadata.name).to.equal('blah');
      });

      it('should accept further properties to use in the base', () => {
        class Extended extends Instance {
          constructor(...args) {
            super(...args, {
              customProp: [],
            });
          }

          addToArray(...stuff) {
            return this.mutate('customProp', this.customProp.concat(stuff));
          }
        }
        const ext = new Extended();

        expect(ext.customProp).to.be.an('array');
        expect(ext.addToArray).to.be.a('function');

        const added = ext.addToArray('some', 'stuff');
        expect(ext.customProp).to.have.length(0);
        expect(added.customProp).to.eql(['some', 'stuff']);
      });
    });

    it('should return a new object when mutated, not mutate the prior instance', () => {
      const inst = new Instance();
      const newInst = inst.mutate('meaning.oflife', 42);

      assert(inst !== newInst);
      expect(inst.meaning).to.be.undefined;
      expect(newInst.meaning.oflife).to.equal(42);
    });

    it('should be immutable', () => {
      const inst = new Instance({
        prior: 'field',
      });

      const mutator = () => {
        inst.prior = 'newvalue';
      };

      const adder = () => {
        inst.newfield = 'value';
      };

      expect(adder).to.throw;
      expect(mutator).to.throw;
    });

    it('can be cloned, and update the parents array, with newest first', () => {
      const parentVersion = 135;
      const inst = new Instance({
        version: parentVersion,
        prior: 'field',
      });
      expect(inst.parents.length).to.equal(0);

      const clone = inst.clone();
      expect(clone.parents.length).to.equal(1);
      expect(clone.parents[0]).to.eql({ id: inst.id, version: parentVersion });

      const second = clone.clone();
      expect(second.parents.length).to.equal(2);
      expect(second.parents).to.eql([
        { id: clone.id, version: parentVersion },
        { id: inst.id, version: parentVersion },
      ]);
    });

    it('clone() validates a version is passed in', () => {
      const badVersion = 'bad!';
      const goodVersion = 352;

      const inst = new Instance();

      expect(inst.clone.bind(inst, badVersion)).to.throw();
      expect(inst.clone.bind(inst, goodVersion)).to.not.throw();
    });

    it('clone(null) does not change ID or add to history', () => {
      const inst = new Instance();
      const clone = inst.clone(null);
      assert(clone !== inst, 'should not be the same instance');
      assert(clone.id === inst.id, 'should have same id after clone(null)');
      assert(clone.parents.length === inst.parents.length, 'should not add a parent');
    });
  });
});
