import { expect, assert } from 'chai';
import Project from '../../src/models/Project';
import { merge, isEqual } from 'lodash';

describe('Model', () => {
  describe('Project', () => {
    it('doesnt have version by default', () => {
      const proj = new Project();
      assert(!proj.version, 'shouldnt scaffold version');
    });

    it('accepts initial model', () => {
      const existing = {
        metadata: {
          name: 'blah',
        },
      };
      const inst = new Project(existing);

      expect(inst.metadata.name).to.equal('blah');
    });

    it('validate can throw, or not', () => {
      const good = Project.classless();
      const bad = merge({}, good, { version: 'adsfasdfasdfasdf' });

      expect(Project.validate(good)).to.equal(true);
      expect(Project.validate(bad)).to.equal(false);

      expect(() => Project.validate(good, true)).to.not.throw();
      expect(() => Project.validate(bad, true)).to.throw();
    });

    it('compare() can throw, or not', () => {
      const orig = new Project();
      const copy = orig.clone(null);
      const diff = orig.mutate('metadata.name', 'new name');

      expect(Project.compare(orig, orig)).to.equal(true);

      expect(Project.compare(orig, copy)).to.equal(true);
      expect(() => Project.compare(orig, copy, true)).to.not.throw();

      expect(Project.compare(orig, diff)).to.equal(false);
      expect(() => Project.compare(orig, diff, true)).to.throw();
    });

    it('compare() compares model and POJO correctly', () => {
      const orig = new Project();
      const clone = orig.clone(null);
      const copy = Object.assign({}, orig);

      //both project instances
      Project.compare(orig, clone, true);

      //both same data, one Project one POJO
      Project.compare(orig, copy, true);
    });

    it('Project.classless(input) creates unfrozen JSON object, no instance methods', () => {
      const instance = Project.classless({
        rules: { someRule: 'yep' },
      });

      expect(instance.id).to.be.defined;
      expect(instance.rules.someRule === 'yep');
      expect(instance.merge).to.be.undefined;
      expect(instance.addComponents).to.be.undefined;
      expect(() => Object.assign(instance, { id: 'newId' })).to.not.throw();
      expect(instance.id).to.equal('newId');
    });

    it('updateVersion() updates version', () => {
      const proj = new Project();
      assert(!proj.version, 'shouldnt scaffold version');
      const version = 19;
      const updated = proj.updateVersion(version);
      assert(updated.version === version);
    });

    it('Project.compare() does equality check, ignoring version + updated', () => {
      const v1 = 124;
      const v2 = 241;

      const one = new Project({ version: v1 });
      const two = one.updateVersion(v2);

      assert(one !== two);
      assert(!isEqual(one, two));
      assert(Project.compare(one, two), 'compare should ignore version');
    });
  });
});
