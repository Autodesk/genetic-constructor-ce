import { expect } from 'chai';
import ProjectSchema from '../../src/schemas/Project';
import { Project as exampleProject } from './_examples';

describe('Schema', () => {
  describe('Project', () => {
    it('should validate the example', () => {
      expect(ProjectSchema.validate(exampleProject)).to.equal(true);
    });

    it('should create a valid scaffold', () => {
      const scaffold = ProjectSchema.scaffold();
      //console.log(scaffold);
      expect(scaffold).to.be.an.object;
      expect(ProjectSchema.validate(scaffold)).to.equal(true);
    });

    it('should prefix ID with project', () => {
      const scaffold = ProjectSchema.scaffold();
      const regex = /^project/;
      //console.log(scaffold);
      expect(regex.test(scaffold.id)).to.equal(true);
    });
  });
});
