import AnnotationSchema from '../../src/schemas/Annotation';
import { Annotation as exampleAnnotation } from './_examples';
import chai from 'chai';

const { assert } = chai;

describe('AnnotationSchema', () => {
  it('should be loggable', () => {
    //console.log(AnnotationSchema);

    assert(true);
  });

  it('should describe', () => {
    const description = AnnotationSchema.describe();
    //console.log(description);

    assert(typeof description === 'object');
  });


  it('should validate the example', () => {
    assert(AnnotationSchema.validate(exampleAnnotation));
  });
});
