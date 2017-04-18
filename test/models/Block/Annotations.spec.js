import { expect, assert } from 'chai';
import Block from '../../../src/models/Block';
import AnnotationSchema from '../../../src/schemas/Annotation';
import merge from 'lodash.merge';

describe('Model', () => {
  describe('Block', () => {
    describe('Annotations', () => {
      let block;
      beforeEach(() => {
        block = new Block();
      });

      const annotation = merge({}, AnnotationSchema.scaffold(), { name: 'annotationName' });

      it('annotate() should validate invalid annotations', () => {
        const clone = Object.assign({}, annotation);
        delete clone.name;
        expect(block.annotate.bind(block, clone)).to.throw();
      });

      it('annotate() should add the annotation', () => {
        const annotated = block.annotate(annotation);
        expect(annotated.sequence.annotations.length).to.equal(1);
      });

      it('removeAnnotation() should find by Name', () => {
        const annotated = block.annotate(annotation);
        const unannotated = annotated.removeAnnotation(annotation.name);
        expect(unannotated.sequence.annotations.length).to.equal(0);
      });
    });
  });
});
